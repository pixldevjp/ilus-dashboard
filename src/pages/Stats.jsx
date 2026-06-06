import { useState, useEffect } from 'react'

// Stats — a self-contained dashboard card showing derived statistics about the
// member's own activity for the org they are viewing. Fetches from
// /api/stats/mine. Read-only. Sits beside <Cred /> on the dashboard.
//
// Metrics reflect what the ledger can honestly express today (summarized
// vc_op rows): totals, biggest/average award, distinct ops, top op by name,
// and activity span. Participation duration waits on per-interval vc_sweep
// rows post-cutover; this card gains it then with no rework here.

function formatDay(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// One stat: a big tabular number with a small tracked label beneath it.
function Stat({ label, value, accent = false }) {
  return (
    <div>
      <div className={
        'text-2xl font-bold tabular-nums ' +
        (accent ? 'text-cyan-400' : 'text-gray-200')
      }>
        {value}
      </div>
      <div className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">{label}</div>
    </div>
  )
}

function Stats() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats/mine', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-cyan-400 text-sm tracking-widest animate-pulse">LOADING STATS...</div>
    </div>
  )

  if (error) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-red-400 text-sm">Could not load stats ({error}).</div>
    </div>
  )

  const n = (v) => (v ?? 0).toLocaleString()
  const hasActivity = data.entry_count > 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-gray-400 text-xs tracking-widest uppercase">Your stats</h3>
      </div>

      {!hasActivity ? (
        <div className="text-gray-600 text-sm">No activity yet.</div>
      ) : (
        <>
          {/* Primary stat grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Earned all-time" value={n(data.lifetime)} accent />
            <Stat label="Operations" value={n(data.distinct_ops)} />
            <Stat label="Biggest award" value={n(data.biggest_award)} />
            <Stat label="Average award" value={n(data.avg_award)} />
          </div>

          {/* Top op */}
          {data.top_op && (
            <div className="border-t border-gray-800 mt-5 pt-4">
              <div className="text-gray-500 text-xs tracking-widest uppercase mb-1">Top operation</div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-gray-200 text-sm truncate">{data.top_op.name}</span>
                <span className="text-cyan-400 tabular-nums font-medium shrink-0">
                  +{n(data.top_op.total)}
                </span>
              </div>
            </div>
          )}

          {/* Activity span */}
          {data.first_at && (
            <div className="border-t border-gray-800 mt-4 pt-4">
              <div className="text-gray-600 text-xs">
                Active since {formatDay(data.first_at)}
                {data.entry_count > 1 && data.last_at && data.last_at !== data.first_at
                  ? <> &middot; last {formatDay(data.last_at)}</>
                  : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Stats
