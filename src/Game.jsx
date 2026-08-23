import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useModeFilters, { matchScore } from './useModeFilters.js'
import FilterPanel from './FilterPanel.jsx'

const ZOOM_LEVELS = [10, 30, 60, 100]
const MAX_ATTEMPTS = 4
const MAX_SUGGESTIONS = 10

const thumbUrl = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`

function pickRandom(entriesList) {
  return entriesList[Math.floor(Math.random() * entriesList.length)]
}

function newGame(entriesList) {
  return { target: pickRandom(entriesList), wrongCount: 0, phase: 'playing' }
}

export default function Game({ entries }) {
  const [game, setGame] = useState(() => newGame(entries))
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(-1)
  const inputRef = useRef(null)

  const filters = useModeFilters(entries)
  const { pool } = filters

  const target = game.target

  useEffect(() => {
    if (pool.length === 0) return
    setGame(newGame(pool))
    setQuery('')
    setSelected(-1)
  }, [pool])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []
    return pool
      .map((entry) => ({ entry, score: matchScore(entry, q) }))
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.entry.name.localeCompare(b.entry.name),
      )
      .slice(0, MAX_SUGGESTIONS)
      .map(({ entry }) => entry)
  }, [pool, query])

  useEffect(() => {
    setSelected(-1)
  }, [query])

  const guess = (candidate) => {
    if (!candidate) return
    if (candidate.id === target.id) {
      setGame((g) => ({ ...g, phase: 'won' }))
      return
    }
    setGame((g) => {
      const wrongCount = g.wrongCount + 1
      return {
        ...g,
        wrongCount,
        phase: wrongCount >= MAX_ATTEMPTS ? 'lost' : g.phase,
      }
    })
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => (s + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => (s <= 0 ? suggestions.length - 1 : s - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      guess(suggestions[selected >= 0 ? selected : 0])
    }
  }

  const visiblePct = ZOOM_LEVELS[game.wrongCount]
  const scale = Math.sqrt(100 / visiblePct)

  const playAgain = () => {
    if (pool.length === 0) return
    setGame(newGame(pool))
    setQuery('')
    setSelected(-1)
  }

  return (
    <div className="game">
      <button className="back-btn" onClick={() => (window.location.hash = '#/')}>
        ← Back to list
      </button>

      <FilterPanel
        filters={filters}
        actions={
          <button
            className="settings-newgame"
            onClick={playAgain}
            disabled={pool.length === 0}
          >
            New game
          </button>
        }
      />

      {game.phase === 'won' && (
        <div className="game-result">
          <h1>Correct!</h1>
          <div className="game-result-card">
            <img className="game-result-thumb" src={thumbUrl(target.videoID)} alt={`Thumbnail for ${target.name}`} />
            <div>
              <h2>{target.name}</h2>
              <p className="card-sub">{target.game} · by {target.creator}</p>
              <div className="card-links">
                <a href={videoUrl(target.videoID)} target="_blank" rel="noreferrer">
                  Watch on YouTube
                </a>
                <a href={`#/mode/${target.id}`}>View details</a>
              </div>
            </div>
          </div>
          <button className="load-btn" onClick={playAgain}>
            Play again
          </button>
        </div>
      )}

      {game.phase === 'lost' && (
        <div className="game-result">
          <h1>Game over</h1>
          <p className="game-loss">The mode was:</p>
          <div className="game-result-card">
            <img className="game-result-thumb" src={thumbUrl(target.videoID)} alt={`Thumbnail for ${target.name}`} />
            <div>
              <h2>{target.name}</h2>
              <p className="card-sub">{target.game} · by {target.creator}</p>
              <div className="card-links">
                <a href={videoUrl(target.videoID)} target="_blank" rel="noreferrer">
                  Watch on YouTube
                </a>
                <a href={`#/mode/${target.id}`}>View details</a>
              </div>
            </div>
          </div>
          <button className="load-btn" onClick={playAgain}>
            Play again
          </button>
        </div>
      )}

      {game.phase === 'playing' && pool.length === 0 && (
        <div className="game-empty">
          <h1 className="game-title">Guess the Maxmode!</h1>
          <p>No modes match your current settings. Adjust the filters above.</p>
        </div>
      )}

      {game.phase === 'playing' && pool.length > 0 && (
        <>
          <h1 className="game-title">Guess the Maxmode!</h1>
          <p className="game-attempts">
            Attempts left: {MAX_ATTEMPTS - game.wrongCount} · {visiblePct}% visible
          </p>

          <div className="game-zoom">
            <img
              src={thumbUrl(target.videoID)}
              alt={`Thumbnail zoomed to ${visiblePct}%`}
              style={{ transform: `scale(${scale})` }}
              draggable="false"
            />
          </div>

          {game.wrongCount >= 2 && (
            <p className="game-hint">
              Total points:{' '}
              {(target.rngValue ?? 0) + (target.skillValue ?? 0)}
            </p>
          )}
          {game.wrongCount >= 3 && (
            <p className="game-hint">Game: {target.game}</p>
          )}

          <div className="game-guess">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Guess the Maxmode…"
              autoComplete="off"
              spellCheck="false"
            />
            {suggestions.length > 0 && (
              <ul className="game-suggestions">
                {suggestions.map((entry, i) => (
                  <li
                    key={entry.id}
                    className={i === selected ? 'selected' : ''}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      guess(entry)
                    }}
                  >
                    <span className="suggestion-name">{entry.name}</span>
                    <span className="suggestion-game">{entry.game}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
