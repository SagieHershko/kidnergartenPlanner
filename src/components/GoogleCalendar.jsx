import { useState, useEffect, useCallback, useRef } from 'react'
import { GOOGLE_CLIENT_ID } from '../googleConfig'
import { waitFor } from '../utils'

const SCOPES    = 'https://www.googleapis.com/auth/calendar.events'
const DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function GoogleCalendar({ onAddEventReady, selectedDate }) {
  const [status,    setStatus]    = useState('loading')
  const [calEvents, setCalEvents] = useState([])
  const [busy,      setBusy]      = useState(false)
  const tokenClientRef  = useRef(null)
  const signedInRef     = useRef(false)
  // Keep a ref so loadEvents always uses the latest date without being a dep
  const selectedDateRef = useRef(selectedDate)
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])

  const loadEvents = useCallback(async () => {
    if (!signedInRef.current) return
    setBusy(true)
    try {
      const date  = selectedDateRef.current
      const start = new Date(date + 'T00:00:00').toISOString()
      const end   = new Date(new Date(date + 'T00:00:00').getTime() + 86_400_000).toISOString()
      const res   = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: start,
        timeMax: end,
        singleEvents: true,
        orderBy: 'startTime',
      })
      setCalEvents(res.result.items || [])
    } catch (err) {
      console.error('GCal load error', err)
    } finally {
      setBusy(false)
    }
  }, []) // stable — reads date via ref

  // Reload when selected date changes while connected
  useEffect(() => {
    if (status === 'connected') loadEvents()
  }, [selectedDate, status, loadEvents])

  const addEvent = useCallback(async ({ title, time, description = '', date }) => {
    if (!signedInRef.current) return false
    const targetDate = new Date((date ?? selectedDateRef.current) + 'T00:00:00')
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    const pad  = n => String(n).padStart(2, '0')
    const ymd  = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    let resource
    if (time) {
      const [h, m] = time.split(':').map(Number)
      const start  = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h, m)
      const end    = new Date(start.getTime() + 3_600_000)
      resource = {
        summary: title, description,
        start: { dateTime: start.toISOString(), timeZone: tz },
        end:   { dateTime: end.toISOString(),   timeZone: tz },
      }
    } else {
      const nextDay = new Date(targetDate.getTime() + 86_400_000)
      resource = {
        summary: title, description,
        start: { date: ymd(targetDate) },
        end:   { date: ymd(nextDay) },
      }
    }

    try {
      await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource })
      await loadEvents()
      return true
    } catch (err) {
      console.error('GCal add error', err)
      return false
    }
  }, [loadEvents])

  const signIn = useCallback(() => {
    tokenClientRef.current?.requestAccessToken({ prompt: '' })
  }, [])

  const signOut = useCallback(() => {
    const token = window.gapi?.client?.getToken()
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token)
      window.gapi.client.setToken('')
    }
    signedInRef.current = false
    setStatus('disconnected')
    setCalEvents([])
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) { setStatus('setup'); return }
    let cancelled = false

    async function init() {
      try {
        await waitFor(() => !!window.gapi)
        await new Promise(res => window.gapi.load('client', res))
        await window.gapi.client.init({ discoveryDocs: [DISCOVERY] })
        await waitFor(() => !!window.google?.accounts?.oauth2)
        if (cancelled) return

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: async resp => {
            if (resp.error) { setStatus('disconnected'); return }
            signedInRef.current = true
            setStatus('connected')
            await loadEvents()
          },
        })
        setStatus('disconnected')
      } catch (err) {
        if (!cancelled) setStatus('error')
        console.error('GCal init error', err)
      }
    }

    init()
    return () => { cancelled = true }
  }, [loadEvents])

  useEffect(() => {
    onAddEventReady(status === 'connected' ? addEvent : null)
  }, [status, addEvent, onAddEventReady])

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="card gcal-card">
      <div className="card-header-row">
        <h2><GoogleIcon />Google Calendar</h2>
        {status === 'connected' && (
          <div className="gcal-header-actions">
            <button className="btn-icon-sm" onClick={loadEvents} disabled={busy} title="רענן">↻</button>
            <button className="btn-text-xs" onClick={signOut}>התנתק</button>
          </div>
        )}
      </div>

      {status === 'setup' && (
        <div className="gcal-setup-banner">
          להפעלת האינטגרציה, הוסף את ה-Client ID שלך ב-<code>src/googleConfig.js</code>
        </div>
      )}
      {status === 'loading'      && <p className="gcal-msg">טוען...</p>}
      {status === 'error'        && <p className="gcal-msg gcal-error">שגיאה בחיבור ל-Google Calendar</p>}
      {status === 'disconnected' && (
        <button className="gcal-connect-btn" onClick={signIn} disabled={!tokenClientRef.current}>
          <GoogleIcon />התחבר עם Google Calendar
        </button>
      )}

      {status === 'connected' && (
        <>
          {busy && <p className="gcal-msg">טוען אירועים...</p>}
          {!busy && calEvents.length === 0 && <p className="gcal-msg">אין אירועים ל-Google Calendar בתאריך זה</p>}
          {!busy && calEvents.length > 0 && (
            <ul className="gcal-list">
              {calEvents.map(ev => {
                const timeStr = ev.start.dateTime
                  ? new Date(ev.start.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                  : 'כל היום'
                return (
                  <li key={ev.id} className="gcal-item">
                    <span className="gcal-dot" />
                    <span className="gcal-item-time">{timeStr}</span>
                    <span className="gcal-item-title">{ev.summary}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
