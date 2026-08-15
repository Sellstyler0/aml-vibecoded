import Records from './Records.jsx'

const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`
const thumbUrl = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

export default function Detail({ entry }) {
  const stats = [
    ['Top', entry.top ?? '—'],
    ['Skill value', entry.skillValue],
    ['RNG value', entry.rngValue],
    ['Aim', entry.aim],
    ['Green run', entry.greenrun],
    ['Speed', entry.speed],
    ['Keyboard', entry.keyboard],
    ['Brain', entry.brain],
    ['Endurance', entry.endurance],
    ['Progress', entry.progress ?? '—'],
    ['Min progress', entry.minProgress ?? '—'],
    ['Length', entry.mmlength || '—'],
  ]

  const tags = [
    ['Self-imposed', entry.selfimposed],
    ['Pre-patch', entry.prepatch],
    ['Extra', entry.extra],
    ['MoMoTM', entry.mmotm],
  ]

  return (
    <div className="detail">
      <button className="back-btn" onClick={() => (window.location.hash = '#/')}>
        ← Back to list
      </button>

      <div className="detail-head">
        <a
          className="thumb thumb-lg"
          href={videoUrl(entry.videoID)}
          target="_blank"
          rel="noreferrer"
          title="Watch on YouTube"
        >
          <img
            src={thumbUrl(entry.videoID)}
            alt={`Thumbnail for ${entry.name}`}
          />
        </a>
        <div className="detail-info">
          <span className="rank rank-lg">{entry.top ?? '—'}</span>
          <h1>{entry.name}</h1>
          <p className="card-sub">
            {entry.game} · by {entry.creator}
          </p>
          <div className="card-links">
            <a href={videoUrl(entry.videoID)} target="_blank" rel="noreferrer">
              Watch on YouTube
            </a>
            {entry.link && (
              <a href={entry.link} target="_blank" rel="noreferrer">
                Download
              </a>
            )}
          </div>
        </div>
      </div>

      {entry.description && <p className="detail-desc">{entry.description}</p>}

      <h2 className="detail-h2">Stats</h2>
      <dl className="stats-grid">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="detail-h2">Tags</h2>
      <div className="flags">
        {tags.map(([label, value]) => (
          <span
            key={label}
            className={`badge ${value ? 'on' : 'off'}`}
            title={value ? 'Yes' : 'No'}
          >
            {label}: {value ? 'Yes' : 'No'}
          </span>
        ))}
      </div>

      <Records levelId={entry.id} />
    </div>
  )
}
