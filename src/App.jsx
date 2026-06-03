import { useState, useEffect, useCallback } from 'react'
import MoodCheck from './components/MoodCheck'
import EventsList from './components/EventsList'
import Reminders from './components/Reminders'
import GoogleCalendar from './components/GoogleCalendar'
import LoginScreen from './components/LoginScreen'
import './App.css'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadUser() {
  const raw = sessionStorage.getItem('app_user')
  if (!raw) return null
  try {
    const user = JSON.parse(raw)
    // Discard sessions whose Google ID token has expired (≈1 hour)
    if (user.exp && Date.now() / 1000 > user.exp) {
      sessionStorage.removeItem('app_user')
      return null
    }
    return user
  } catch {
    return null
  }
}

function App() {
  const [user, setUser] = useState(loadUser)

  const [mood, setMood] = useState(() => {
    return localStorage.getItem(`mood-${todayKey()}`) || null
  })
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem(`events-${todayKey()}`)
    try { return saved ? JSON.parse(saved) : [] } catch { return [] }
  })
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('reminders')
    try { return saved ? JSON.parse(saved) : [] } catch { return [] }
  })

  const [gcalAddEvent, setGcalAddEvent] = useState(null)
  const handleGcalReady = useCallback((fn) => setGcalAddEvent(() => fn), [])

  useEffect(() => {
    if (mood) localStorage.setItem(`mood-${todayKey()}`, mood)
    else localStorage.removeItem(`mood-${todayKey()}`)
  }, [mood])

  useEffect(() => {
    localStorage.setItem(`events-${todayKey()}`, JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
  }, [reminders])

  function handleSignOut() {
    window.google?.accounts?.id?.disableAutoSelect()
    sessionStorage.removeItem('app_user')
    setUser(null)
    setGcalAddEvent(null)
  }

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!user) {
    return <LoginScreen onSignIn={setUser} />
  }

  const today = new Date().toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="app">
      <header className="app-bar">
        <span className="app-bar-icon">📅</span>
        <h1 className="app-bar-title">מתכנן יומי</h1>
        <span className="app-bar-date">{today}</span>

        <div className="app-bar-spacer" />

        <div className="app-bar-user">
          <img
            src={user.picture}
            alt={user.name}
            className="user-avatar"
            referrerPolicy="no-referrer"
          />
          <span className="user-name-chip">{user.name.split(' ')[0]}</span>
          <button className="btn-signout" onClick={handleSignOut}>יציאה</button>
        </div>
      </header>

      <main className="app-main">
        <MoodCheck mood={mood} setMood={setMood} />

        <div className="main-grid">
          <div className="col">
            <EventsList
              events={events}
              setEvents={setEvents}
              addToCalendar={gcalAddEvent}
            />
            <GoogleCalendar onAddEventReady={handleGcalReady} />
          </div>
          <div className="col">
            <Reminders
              reminders={reminders}
              setReminders={setReminders}
              addToCalendar={gcalAddEvent}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
