import { useState } from 'react'

const CATEGORIES = [
  { id: 'class',    label: 'שיעור',   icon: '📚' },
  { id: 'meeting',  label: 'פגישה',   icon: '🤝' },
  { id: 'activity', label: 'פעילות',  icon: '🎨' },
  { id: 'other',    label: 'אחר',     icon: '📌' },
]

const CAT_ICON = Object.fromEntries(CATEGORIES.map(c => [c.id, c.icon]))

function AddToCalendarBtn({ event, addToCalendar }) {
  const [state, setState] = useState('idle') // idle | busy | done | err

  async function handle() {
    setState('busy')
    const ok = await addToCalendar({ title: event.title, time: event.time })
    setState(ok ? 'done' : 'err')
    if (ok) setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button
      className={`cal-btn ${state === 'done' ? 'cal-done' : ''}`}
      onClick={handle}
      disabled={state === 'busy' || state === 'done'}
      title="הוסף ל-Google Calendar"
    >
      {state === 'busy' ? '...' : state === 'done' ? '✓' : '+ יומן'}
    </button>
  )
}

export default function EventsList({ events, setEvents, addToCalendar }) {
  const [title,    setTitle]    = useState('')
  const [time,     setTime]     = useState('')
  const [category, setCategory] = useState('class')

  function addEvent(e) {
    e.preventDefault()
    if (!title.trim()) return
    const newEvent = {
      id: Date.now(),
      title: title.trim(),
      time,
      category,
      done: false,
    }
    setEvents(prev =>
      [...prev, newEvent].sort((a, b) => {
        if (!a.time && !b.time) return 0
        if (!a.time) return 1
        if (!b.time) return -1
        return a.time.localeCompare(b.time)
      })
    )
    setTitle('')
    setTime('')
    setCategory('class')
  }

  function toggleDone(id) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, done: !ev.done } : ev))
  }

  function removeEvent(id) {
    setEvents(prev => prev.filter(ev => ev.id !== id))
  }

  return (
    <section className="card events-card">
      <div className="card-header-row">
        <h2>📅 אירועי היום</h2>
      </div>

      <form className="add-form" onSubmit={addEvent}>
        <input
          className="input-text"
          type="text"
          placeholder="מה יש היום?"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="input-time"
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
        <select
          className="input-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <button className="btn-add" type="submit">+ הוסף</button>
      </form>

      {events.length === 0 ? (
        <p className="empty-msg">אין אירועים — יום פנוי! 🎉</p>
      ) : (
        <ul className="event-list">
          {events.map(ev => (
            <li key={ev.id} className={`event-item ${ev.done ? 'done' : ''}`}>
              <button className="done-btn" onClick={() => toggleDone(ev.id)}>
                {ev.done ? '✅' : '⬜'}
              </button>
              <span className="event-icon">{CAT_ICON[ev.category] ?? '📌'}</span>
              <span className="event-time">{ev.time || '--:--'}</span>
              <span className="event-title">{ev.title}</span>
              {addToCalendar && (
                <AddToCalendarBtn event={ev} addToCalendar={addToCalendar} />
              )}
              <button className="remove-btn" onClick={() => removeEvent(ev.id)}>🗑</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
