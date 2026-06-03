const MOODS = [
  { emoji: '😄', label: 'מעולה!' },
  { emoji: '🙂', label: 'טוב' },
  { emoji: '😐', label: 'ככה ככה' },
  { emoji: '😔', label: 'קשה היום' },
  { emoji: '😤', label: 'עמוס מאוד' },
]

const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.label, m.emoji]))

export default function MoodCheck({ mood, setMood }) {
  return (
    <section className="card mood-card">
      <div className="card-header-row">
        <h2>🌞 איך את מרגישה היום?</h2>
        {mood && (
          <button className="btn-small" onClick={() => setMood(null)}>שנה</button>
        )}
      </div>

      {mood ? (
        <div className="mood-selected">
          <span className="mood-big">{MOOD_MAP[mood] ?? '🙂'}</span>
          <p>{mood}</p>
        </div>
      ) : (
        <div className="mood-grid">
          {MOODS.map(m => (
            <button
              key={m.label}
              className="mood-btn"
              onClick={() => setMood(m.label)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
