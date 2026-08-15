import { useEffect, useState } from 'react'
import List from './List.jsx'
import Detail from './Detail.jsx'
import Game from './Game.jsx'
import './App.css'

function parseRoute() {
  if (window.location.hash.startsWith('#/game')) return { view: 'game' }
  const match = window.location.hash.match(/^#\/mode\/(\d+)/)
  if (match) return { view: 'detail', id: Number(match[1]) }
  return { view: 'list' }
}

export default function App() {
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('loading')
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setEntries(data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load data.json:', err)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (status === 'loading') return <div className="status">Loading challenges…</div>
  if (status === 'error')
    return (
      <div className="status">
        Failed to load data.json. Make sure it is served next to this page.
      </div>
    )

  if (route.view === 'game') return <Game entries={entries} />

  if (route.view === 'detail') {
    const entry = entries.find((e) => e.id === route.id)
    if (!entry) return <div className="status">Mode not found.</div>
    return <Detail entry={entry} />
  }

  return <List entries={entries} />
}
