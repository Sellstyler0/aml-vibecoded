import { useState } from 'react'

const API_URL = 'https://aml-api-eta.vercel.app'

const PROXIES = [
  (levelId) => `https://cors.eu.org/${API_URL}/level/${levelId}`,
  (levelId) =>
    `https://api.allorigins.win/get?url=${encodeURIComponent(
      `${API_URL}/level/${levelId}`,
    )}`,
  (levelId) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `${API_URL}/level/${levelId}`,
    )}`,
  (levelId) => `${API_URL}/level/${levelId}`,
]

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

function extractRecords(payload) {
  let root = payload
  if (payload?.contents != null) {
    try {
      root = JSON.parse(payload.contents)
    } catch {
      return []
    }
  }
  if (Array.isArray(root?.records)) return root.records
  if (Array.isArray(root?.data?.records)) return root.data.records
  return []
}

async function fetchRecords(levelId) {
  for (const toUrl of PROXIES) {
    const url = toUrl(levelId)
    try {
      const res = await withTimeout(fetch(url), 20000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data?.status?.http_code != null && data.status.http_code !== 200) {
        throw new Error(`API HTTP ${data.status.http_code}`)
      }
      return extractRecords(data)
    } catch (err) {
      console.warn('Failed to fetch records via', url, '-', err.message)
    }
  }
  throw new Error('All record sources failed')
}

export default function Records({ levelId }) {
  const [status, setStatus] = useState('idle')
  const [records, setRecords] = useState([])

  const load = () => {
    setStatus('loading')
    fetchRecords(levelId)
      .then((result) => {
        setRecords(result)
        setStatus('ready')
      })
      .catch((err) => {
        console.error('Failed to load records:', err)
        setStatus('error')
      })
  }

  return (
    <section className="records">
      <h2 className="detail-h2">Records</h2>
      {status === 'idle' && (
        <button className="load-btn" onClick={load}>
          Load records
        </button>
      )}
      {status === 'loading' && <p className="records-status">Loading…</p>}
      {status === 'error' && (
        <p className="records-status">
          Failed to load records. The API may be unavailable.
          <button className="load-btn" onClick={load}>
            Retry
          </button>
        </p>
      )}
      {status === 'ready' && records.length === 0 && (
        <p className="records-status">No records found.</p>
      )}
      {status === 'ready' && records.length > 0 && (
        <ul className="records-list">
          {records.map((record, i) => (
            <li key={`${record.userid}-${i}`} className="record">
              <span className="record-name">
                {record.players?.name ?? 'Unknown player'}
              </span>
              <a
                className="record-btn"
                href={record.videoLink}
                target="_blank"
                rel="noreferrer"
              >
                Watch video
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
