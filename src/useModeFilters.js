import { useMemo, useState } from 'react'

export function matchScore(entry, query) {
  const q = query.toLowerCase()
  if (entry.name.toLowerCase().includes(q)) return 2
  if (entry.game.toLowerCase().includes(q)) return 1
  return 0
}

export default function useModeFilters(entries) {
  const [topMin, setTopMin] = useState('')
  const [topMax, setTopMax] = useState('')
  const [modeType, setModeType] = useState('all')
  const [addedModes, setAddedModes] = useState([])
  const [addQuery, setAddQuery] = useState('')
  const [gameType, setGameType] = useState('all')
  const [addedGames, setAddedGames] = useState([])
  const [addGameQuery, setAddGameQuery] = useState('')

  const topBounds = useMemo(() => {
    const tops = entries.map((e) => e.top).filter((t) => Number.isFinite(t))
    return { min: Math.min(...tops), max: Math.max(...tops) }
  }, [entries])

  const pool = useMemo(() => {
    const minTop =
      topMin === '' ? topBounds.min : Math.max(1, Number(topMin) || 0)
    const maxTop = topMax === '' ? topBounds.max : Number(topMax)
    if (minTop > maxTop) return []
    let result = entries.filter((e) => {
      const t = e.top
      if (!Number.isFinite(t)) return topMin === '' && topMax === ''
      return t >= minTop && t <= maxTop
    })
    if (modeType !== 'all') {
      const ids = new Set(addedModes.map((m) => m.id))
      result =
        modeType === 'whitelist'
          ? result.filter((e) => ids.has(e.id))
          : result.filter((e) => !ids.has(e.id))
    }
    if (gameType !== 'all') {
      const games = new Set(addedGames)
      result =
        gameType === 'whitelist'
          ? result.filter((e) => games.has(e.game))
          : result.filter((e) => !games.has(e.game))
    }
    return result
  }, [
    entries,
    topMin,
    topMax,
    modeType,
    addedModes,
    gameType,
    addedGames,
    topBounds,
  ])

  const addMode = (entry) => {
    setAddedModes((modes) =>
      modes.some((m) => m.id === entry.id) ? modes : [...modes, entry],
    )
    setAddQuery('')
  }

  const removeMode = (id) =>
    setAddedModes((modes) => modes.filter((m) => m.id !== id))

  const addSuggestions = useMemo(() => {
    const q = addQuery.trim().toLowerCase()
    if (q.length === 0) return []
    return entries
      .filter((entry) => !addedModes.some((m) => m.id === entry.id))
      .map((entry) => ({ entry, score: matchScore(entry, q) }))
      .filter(({ score }) => score > 0)
      .sort(
        (a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name),
      )
      .slice(0, 8)
      .map(({ entry }) => entry)
  }, [entries, addQuery, addedModes])

  const gameCounts = useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      if (e.game) map.set(e.game, (map.get(e.game) ?? 0) + 1)
    }
    return map
  }, [entries])

  const addGame = (game) => {
    setAddedGames((games) => (games.includes(game) ? games : [...games, game]))
    setAddGameQuery('')
  }

  const removeGame = (game) =>
    setAddedGames((games) => games.filter((g) => g !== game))

  const gameSuggestions = useMemo(() => {
    const q = addGameQuery.trim().toLowerCase()
    if (q.length === 0) return []
    return [...new Set(entries.map((e) => e.game).filter((g) => g))]
      .filter((g) => g.toLowerCase().includes(q))
      .filter((g) => !addedGames.includes(g))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 8)
  }, [entries, addGameQuery, addedGames])

  return {
    topMin,
    setTopMin,
    topMax,
    setTopMax,
    topBounds,
    pool,
    modeType,
    setModeType,
    addedModes,
    clearModes: () => setAddedModes([]),
    addQuery,
    setAddQuery,
    addMode,
    removeMode,
    addSuggestions,
    gameType,
    setGameType,
    addedGames,
    clearGames: () => setAddedGames([]),
    addGameQuery,
    setAddGameQuery,
    addGame,
    removeGame,
    gameSuggestions,
    gameCounts,
  }
}
