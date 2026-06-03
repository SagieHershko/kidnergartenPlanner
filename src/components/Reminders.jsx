import { useState } from 'react'

const PRIORITIES = [
  { id: 'high', label: 'דחוף',  color: '#ea4335', bg: '#fce8e6' },
  { id: 'med',  label: 'רגיל',  color: '#f9ab00', bg: '#fef9e7' },
  { id: 'low',  label: 'נמוך',  color: '#34a853', bg: '#e6f4ea' },
]

const PRI_MAP = Object.fromEntries(PRIORITIES.map(p => [p.id, p]))

function getPriority(id) {
  return PRI_MAP[id] ?? PRIORITIES[1]
}

function AddToCalendarBtn({ reminder, addToCalendar }) {
  const [state, setState] = useState('idle')

  async function handle() {
    setState('busy')
    const ok = await addToCalendar({ title: reminder.text, time: '' })
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

export default function Reminders({ reminders, setReminders, addToCalendar }) {
  const [text,     setText]     = useState('')
  const [priority, setPriority] = useState('med')

  function addReminder(e) {
    e.preventDefault()
    if (!text.trim()) return
    setReminders(prev => [
      { id: Date.now(), text: text.trim(), priority, done: false },
      ...prev,
    ])
    setText('')
    setPriority('med')
  }

  function toggleDone(id) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r))
  }

  function remove(id) {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  function clearDone() {
    setReminders(prev => prev.filter(r => !r.done))
  }

  const hasDone = reminders.some(r => r.done)

  return (
    <section className="card reminders-card">
      <div className="card-header-row">
        <h2>📝 לזכור</h2>
        {hasDone && (
          <button className="btn-small btn-clear" onClick={clearDone}>
            נקה שהושלמו
          </button>
        )}
      </div>

      <form className="add-form" onSubmit={addReminder}>
        <input
          className="input-text"
          type="text"
          placeholder="משהו לזכור..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <select
          className="input-select"
          value={priority}
          onChange={e => setPriority(e.target.value)}
        >
          {PRIORITIES.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <button className="btn-add" type="submit">+ הוסף</button>
      </form>

      {reminders.length === 0 ? (
        <p className="empty-msg">הכל מסודר! 🌟</p>
      ) : (
        <ul className="reminder-list">
          {reminders.map(r => {
            const pri = getPriority(r.priority)
            return (
              <li key={r.id} className={`reminder-item ${r.done ? 'done' : ''}`}>
                <button className="done-btn" onClick={() => toggleDone(r.id)}>
                  {r.done ? '✅' : '⬜'}
                </button>
                <span
                  className="priority-dot"
                  style={{ background: pri.color }}
                  title={pri.label}
                />
                <span className="reminder-text">{r.text}</span>
                <span
                  className="priority-chip"
                  style={{ color: pri.color, background: pri.bg }}
                >
                  {pri.label}
                </span>
                {addToCalendar && (
                  <AddToCalendarBtn reminder={r} addToCalendar={addToCalendar} />
                )}
                <button className="remove-btn" onClick={() => remove(r.id)}>🗑</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
