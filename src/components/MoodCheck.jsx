const MOODS = [
  { emoji: '😄', label: 'מעולה!' },
  { emoji: '🙂', label: 'טוב' },
  { emoji: '😐', label: 'ככה ככה' },
  { emoji: '😔', label: 'קשה היום' },
  { emoji: '😤', label: 'עמוס מאוד' },
]

const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.label, m.emoji]))

export default function MoodCheck({
  mood, setMood,
  moodNote, setMoodNote,
  moodTomorrow, setMoodTomorrow,
}) {
  return (
    <section className="card mood-card">
      <div className="card-header-row">
        <h2>🌞 איך את מרגישה היום?</h2>
        {mood && (
          <button className="btn-small" onClick={() => setMood(null)}>שנה</button>
        )}
      </div>

      {mood ? (
        <div className="mood-selected-wrap">
          <div className="mood-selected">
            <span className="mood-big">{MOOD_MAP[mood] ?? '🙂'}</span>
            <p className="mood-selected-label">{mood}</p>
          </div>

          <div className="mood-notes">
            <label className="mood-note-label">💭 ספרי לי על היום שלך</label>
            <textarea
              className="mood-textarea"
              placeholder="מה קרה? איך הרגשת?"
              value={moodNote}
              onChange={e => setMoodNote(e.target.value)}
              rows={3}
            />

            <label className="mood-note-label">🌅 מה תוכלי לשפר מחר?</label>
            <textarea
              className="mood-textarea"
              placeholder="תוכניות, מטרות, שיפורים..."
              value={moodTomorrow}
              onChange={e => setMoodTomorrow(e.target.value)}
              rows={3}
            />
          </div>
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
