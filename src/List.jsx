import { useCallback, useEffect, useMemo, useState } from 'react'

const PAGE_SIZES = [
  { count: 4, label: '4 (2×2)' },
  { count: 9, label: '9 (3×3)' },
  { count: 16, label: '16 (4×4)' },
  { count: 25, label: '25 (5×5)' },
]

const A_WORDS = [
  'Absolute', 'Astonishing', 'Audacious', 'Amateur', 'Awful',
  'Anomalous', 'Abysmal', 'Arcane', 'Aggressive',
]
const M_WORDS = [
  'Maniacal', 'Masterful', 'Marathon', 'Madness', 'Mutant',
  'Mystical', 'Menacing', 'Multiverse', 'Midnight',
]
const L_WORDS = [
  'Level', 'Ladder', 'Leaderboard', 'List', 'Legend',
  'Limitless', 'Lethal', 'Ludicrous', 'Labyrinth',
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function generateAcronym() {
  return `${pick(A_WORDS)} ${pick(M_WORDS)} ${pick(L_WORDS)} ${pick(L_WORDS)}`
}

function parsePageParam(value) {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export default function List({ entries }) {
  const [acronym] = useState(generateAcronym)
  const [page, setPage] = useState(() =>
    parsePageParam(new URLSearchParams(window.location.search).get('page')),
  )
  const [pageSize, setPageSize] = useState(16)
  const [weight, setWeight] = useState(0.5)
  const [rngMin, setRngMin] = useState('')
  const [rngMax, setRngMax] = useState('')
  const [skillMin, setSkillMin] = useState('')
  const [skillMax, setSkillMax] = useState('')
  const [query, setQuery] = useState('')
  const [highlightId, setHighlightId] = useState(null)
  const [jumpValue, setJumpValue] = useState('')

  const bounds = useMemo(() => {
    const rng = entries.map((e) => e.rngValue ?? 0)
    const skill = entries.map((e) => e.skillValue ?? 0)
    return {
      rngMin: Math.min(...rng),
      rngMax: Math.max(...rng),
      skillMin: Math.min(...skill),
      skillMax: Math.max(...skill),
    }
  }, [entries])

  const weighted = (entry) =>
    (entry.rngValue ?? 0) * weight + (entry.skillValue ?? 0) * (1 - weight)

  const filtered = useMemo(() => {
    const minR = rngMin === '' ? bounds.rngMin : Number(rngMin)
    const maxR = rngMax === '' ? bounds.rngMax : Number(rngMax)
    const minS = skillMin === '' ? bounds.skillMin : Number(skillMin)
    const maxS = skillMax === '' ? bounds.skillMax : Number(skillMax)
    return entries.filter((e) => {
      const r = e.rngValue ?? 0
      const s = e.skillValue ?? 0
      return r >= minR && r <= maxR && s >= minS && s <= maxS
    })
  }, [entries, rngMin, rngMax, skillMin, skillMax, bounds])

  const matchScore = (entry, q) => {
    if (q.length === 0) return 0
    const nameHit = entry.name.toLowerCase().includes(q)
    const gameHit = entry.game.toLowerCase().includes(q)
    if (nameHit && gameHit) return 3
    if (nameHit) return 2
    if (gameHit) return 1
    return 0
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = weighted(b) - weighted(a)
      if (diff !== 0) return diff
      return a.id - b.id
    })
  }, [filtered, weight])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []
    return filtered
      .map((e) => ({ e, score: matchScore(e, q) }))
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.e.name.localeCompare(b.e.name),
      )
      .slice(0, 10)
      .map(({ e }) => e)
  }, [filtered, query])

  const rankById = useMemo(() => {
    const map = new Map()
    sorted.forEach((entry, i) => map.set(entry.id, i + 1))
    return map
  }, [sorted])

  const cols = Math.round(Math.sqrt(pageSize))
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (currentPage === 1) {
      url.searchParams.delete('page')
    } else {
      url.searchParams.set('page', String(currentPage))
    }
    window.history.replaceState(null, '', url)
  }, [currentPage])

  const goTo = useCallback(
    (target) => {
      setPage(Math.min(Math.max(1, target), totalPages))
    },
    [totalPages],
  )

  const jumpTo = (entry) => {
    const index = sorted.findIndex((e) => e.id === entry.id)
    if (index === -1) return
    setPage(Math.floor(index / pageSize) + 1)
    setHighlightId(entry.id)
    setQuery('')
  }

  useEffect(() => {
    if (highlightId === null) return
    const el = document.getElementById(`mode-${highlightId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setHighlightId(null), 3000)
    return () => clearTimeout(t)
  }, [highlightId, pageSize, currentPage])

  return (
    <div className="app">
      <header className="header">
        <h1>{acronym}</h1>
        <p className="subtitle">AML but optimized and vibe coded</p>
        <p className="meta">
          Page {currentPage} of {totalPages} · {sorted.length} challenges
        </p>
        <div className="top-right">
          <a className="game-link" href="#/game">
            Play the game
          </a>
          <label className="page-size">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map(({ count, label }) => (
                <option key={count} value={count}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="weight-wrap">
          <p className="weight-pct">
            Skill {Math.round((1 - weight) * 100)}% · RNG{' '}
            {Math.round(weight * 100)}%
          </p>
          <div className="weight-control">
            <span className="weight-label">Skill</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              aria-label="Skill vs RNG weighting"
            />
            <span className="weight-label">RNG</span>
          </div>
        </div>
        <div className="filters">
          <label className="filter">
            <span className="filter-label">Skill</span>
            <input
              type="number"
              min="0"
              value={skillMin}
              onChange={(e) => setSkillMin(e.target.value)}
              placeholder={String(bounds.skillMin)}
            />
            <span className="filter-sep">–</span>
            <input
              type="number"
              min="0"
              value={skillMax}
              onChange={(e) => setSkillMax(e.target.value)}
              placeholder={String(bounds.skillMax)}
            />
          </label>
          <label className="filter">
            <span className="filter-label">RNG</span>
            <input
              type="number"
              min="0"
              value={rngMin}
              onChange={(e) => setRngMin(e.target.value)}
              placeholder={String(bounds.rngMin)}
            />
            <span className="filter-sep">–</span>
            <input
              type="number"
              min="0"
              value={rngMax}
              onChange={(e) => setRngMax(e.target.value)}
              placeholder={String(bounds.rngMax)}
            />
          </label>
        </div>
        <div className="search-wrap">
          <input
            className="search-bar"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) {
                jumpTo(suggestions[0])
              } else if (e.key === 'Escape') {
                setQuery('')
              }
            }}
            placeholder="Search by mode or game…"
            autoComplete="off"
            spellCheck="false"
          />
          {suggestions.length > 0 && (
            <ul className="game-suggestions search-suggestions">
              {suggestions.map((entry) => (
                <li
                  key={entry.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    jumpTo(entry)
                  }}
                >
                  <span className="suggestion-name">{entry.name}</span>
                  <span className="suggestion-game">{entry.game}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {pageEntries.map((entry) => {
          const points = (entry.rngValue ?? 0) + (entry.skillValue ?? 0)
          return (
            <li
              key={entry.id}
              id={`mode-${entry.id}`}
              className={`card${highlightId === entry.id ? ' highlighted' : ''}`}
            >
              <a
                className="thumb"
                href={`#/mode/${entry.id}`}
                title={`Details for ${entry.name}`}
              >
                <img
                  src={`https://img.youtube.com/vi/${entry.videoID}/hqdefault.jpg`}
                  alt={`Thumbnail for ${entry.name}`}
                  loading="lazy"
                  decoding="async"
                />
              </a>
              <div className="card-body">
                <span className="rank">{rankById.get(entry.id)}</span>
                <div className="card-info">
                  <h2 className="card-title">
                    <a href={`#/mode/${entry.id}`}>{entry.name}</a>
                  </h2>
                  <p className="card-sub">{points} total points</p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <nav className="pagination" aria-label="Pagination">
        <button
          onClick={() => goTo(1)}
          disabled={currentPage === 1}
          title="First page"
        >
          «
        </button>
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹ Prev
        </button>
        <span className="page-indicator">
          Page {currentPage} / {totalPages}
        </span>
        <label className="jump-to">
          <span>Go to</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const n = Number.parseInt(jumpValue, 10)
                if (Number.isFinite(n)) goTo(n)
                setJumpValue('')
              }
            }}
            placeholder={String(currentPage)}
          />
          <button
            onClick={() => {
              const n = Number.parseInt(jumpValue, 10)
              if (Number.isFinite(n)) goTo(n)
              setJumpValue('')
            }}
          >
            Go
          </button>
        </label>
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next ›
        </button>
        <button
          onClick={() => goTo(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
        >
          »
        </button>
        <label className="page-size bottom-right">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map(({ count, label }) => (
              <option key={count} value={count}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </nav>
    </div>
  )
}
