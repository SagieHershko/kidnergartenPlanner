import { useState, useEffect, useCallback, useRef } from 'react'
import MoodCheck from './components/MoodCheck'
import EventsList from './components/EventsList'
import Reminders from './components/Reminders'
import GoogleCalendar from './components/GoogleCalendar'
import LoginScreen from './components/LoginScreen'
import MiniCalendar from './components/MiniCalendar'
import './App.css'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ── Mood helpers (supports both legacy string format and new JSON format) ──
function loadMoodData(date) {
  const raw = localStorage.getItem(`mood-${date}`)
  if (!raw) return { label: null, note: '', tomorrow: '' }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return { label: parsed.label || null, note: parsed.note || '', tomorrow: parsed.tomorrow || '' }
    }
    return { label: parsed, note: '', tomorrow: '' } // legacy plain string
  } catch {
    return { label: raw, note: '', tomorrow: '' }    // legacy plain string
  }
}

function loadEventsData(date) {
  const raw = localStorage.getItem(`events-${date}`)
  try { return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function loadUser() {
  const raw = sessionStorage.getItem('app_user')
  if (!raw) return null
  try {
    const user = JSON.parse(raw)
    if (user.exp && Date.now() / 1000 > user.exp) {
      sessionStorage.removeItem('app_user')
      return null
    }
    return user
  } catch { return null }
}

export default function App() {
  const [user, setUser] = useState(loadUser)

  // ── Selected date ──────────────────────────────────────────────────────────
  const [selectedDate,  setSelectedDate]  = useState(todayKey)
  const [calendarOpen,  setCalendarOpen]  = useState(false)
  const calendarRef = useRef(null)

  // ── Mood (per day) ────────────────────────────────────────────────────────
  const initialMood = loadMoodData(selectedDate)
  const [mood,         setMood]         = useState(initialMood.label)
  const [moodNote,     setMoodNote]     = useState(initialMood.note)
  const [moodTomorrow, setMoodTomorrow] = useState(initialMood.tomorrow)

  // ── Events (per day) ──────────────────────────────────────────────────────
  const [events, setEvents] = useState(() => loadEventsData(selectedDate))

  // ── Reminders (global) ────────────────────────────────────────────────────
  const [reminders, setReminders] = useState(() => {
    const raw = localStorage.getItem('reminders')
    try { return raw ? JSON.parse(raw) : [] } catch { return [] }
  })

  // ── Google Calendar ───────────────────────────────────────────────────────
  const [gcalAddEvent, setGcalAddEvent] = useState(null)
  const handleGcalReady = useCallback(fn => setGcalAddEvent(() => fn), [])

  // ── Switch date: load data for new date in one batch ─────────────────────
  function handleDateChange(date) {
    const moodData = loadMoodData(date)
    setMood(moodData.label)
    setMoodNote(moodData.note)
    setMoodTomorrow(moodData.tomorrow)
    setEvents(loadEventsData(date))
    setSelectedDate(date)
    setCalendarOpen(false)
  }

  // ── Close calendar on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!calendarOpen) return
    function onMouseDown(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [calendarOpen])

  // ── Persist mood ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mood) {
      localStorage.setItem(`mood-${selectedDate}`, JSON.stringify({ label: mood, note: moodNote, tomorrow: moodTomorrow }))
    } else {
      localStorage.removeItem(`mood-${selectedDate}`)
    }
  }, [mood, moodNote, moodTomorrow, selectedDate])

  // ── Persist events ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(`events-${selectedDate}`, JSON.stringify(events))
  }, [events, selectedDate])

  // ── Persist reminders ─────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders))
  }, [reminders])

  // ── Sign out ──────────────────────────────────────────────────────────────
  function handleSignOut() {
    window.google?.accounts?.id?.disableAutoSelect()
    sessionStorage.removeItem('app_user')
    setUser(null)
    setGcalAddEvent(null)
  }

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!user) return <LoginScreen onSignIn={setUser} />

  const isToday = selectedDate === todayKey()

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('he-IL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="app">
      <header className="app-bar">
        {/* ── Date picker trigger ────────────────────────────────────────── */}
        <div className="date-picker-wrap" ref={calendarRef}>
          <button
            className="date-picker-trigger"
            onClick={() => setCalendarOpen(o => !o)}
            aria-expanded={calendarOpen}
          >
            <span className="app-bar-icon">📅</span>
            <div className="date-picker-info">
              <span className="app-bar-title">מתכנן יומי</span>
              <span className="app-bar-date">{formattedDate}</span>
            </div>
            <span className="cal-chevron">{calendarOpen ? '▲' : '▼'}</span>
          </button>

          {calendarOpen && (
            <MiniCalendar
              selectedDate={selectedDate}
              onChange={handleDateChange}
              onClose={() => setCalendarOpen(false)}
            />
          )}
        </div>

        <div className="app-bar-spacer" />

        {!isToday && (
          <button className="btn-today" onClick={() => handleDateChange(todayKey())}>
            ← חזרה להיום
          </button>
        )}

        {/* ── User profile ───────────────────────────────────────────────── */}
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
        {/* Google Calendar sits at the top, full-width */}
        <GoogleCalendar
          onAddEventReady={handleGcalReady}
          selectedDate={selectedDate}
        />

        <MoodCheck
          mood={mood}           setMood={setMood}
          moodNote={moodNote}   setMoodNote={setMoodNote}
          moodTomorrow={moodTomorrow} setMoodTomorrow={setMoodTomorrow}
        />

        <div className="main-grid">
          <div className="col">
            <EventsList
              events={events}
              setEvents={setEvents}
              addToCalendar={gcalAddEvent}
              selectedDate={selectedDate}
            />
          </div>
          <div className="col">
            <Reminders
              reminders={reminders}
              setReminders={setReminders}
              addToCalendar={gcalAddEvent}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
