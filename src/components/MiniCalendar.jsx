import { useState } from 'react'

// Short Hebrew day abbreviations, Sunday → Saturday (matches JS Date.getDay())
const DAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function hasData(year, month, day) {
  const key = dateKey(year, month, day)
  if (localStorage.getItem(`mood-${key}`)) return true
  const raw = localStorage.getItem(`events-${key}`)
  if (!raw) return false
  try { return JSON.parse(raw).length > 0 } catch { return false }
}

export default function MiniCalendar({ selectedDate, onChange, onClose }) {
  // Track which month is displayed (not necessarily the selected date's month)
  const [view, setView] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number)
    return { year: y, month: m - 1 }
  })

  const { year, month } = view
  const todayStr = todayKey()

  const firstDow    = new Date(year, month, 1).getDay()   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build flat cell array: nulls for leading empty cells, then day numbers
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = new Date(year, month).toLocaleDateString('he-IL', {
    month: 'long', year: 'numeric',
  })

  function prevMonth() {
    setView(v => {
      const d = new Date(v.year, v.month - 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function nextMonth() {
    setView(v => {
      const d = new Date(v.year, v.month + 1, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="mini-calendar" role="dialog" aria-label="בחרי תאריך">
      {/* Month navigation — direction:ltr so ‹/› arrows are intuitive */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="חודש קודם">‹</button>
        <span className="cal-month-label">{monthLabel}</span>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="חודש הבא">›</button>
      </div>

      <div className="cal-grid">
        {/* Day-of-week headers */}
        {DAY_LABELS.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((d, i) => {
          if (!d) return <div key={`_${i}`} className="cal-empty" />
          const key        = dateKey(year, month, d)
          const isToday    = key === todayStr
          const isSelected = key === selectedDate
          const dot        = hasData(year, month, d)
          return (
            <button
              key={key}
              className={[
                'cal-day-btn',
                isToday    ? 'cal-today'    : '',
                isSelected ? 'cal-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => { onChange(key); onClose() }}
            >
              {d}
              {dot && <span className="cal-has-data" />}
            </button>
          )
        })}
      </div>

      <div className="cal-footer">
        <button
          className="cal-today-btn"
          onClick={() => { onChange(todayStr); onClose() }}
        >
          היום
        </button>
      </div>
    </div>
  )
}
