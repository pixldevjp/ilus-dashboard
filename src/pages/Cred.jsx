import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Cred — the member's balance, lifetime earned, and recent credit MOVEMENT for
// the org they are viewing. Fetches /api/cred. Read-only.
//
// Recent activity is grouped: all ledger rows for one operation (its hourly
// vc_sweep increments + the vc_op close settlement) collapse into a SINGLE
// line showing the op's total, with an entry count in the meta. Movements that
// are not part of an op — adjustments, spends, penalties, gifts, manual awards
// (no op_ulid) — are first-class events and each stay their own line. The
// grouping + N-event cap happen server-side, so each op line shows its FULL
// total, not a partial sum of whatever rows fit a window.

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Map ledger entry types to a short human label.
function typeLabel(type) {
  switch (type) {
    case 'vc_op':        return 'Operation'
    case 'vc_sweep':     return 'Op tracking'
    case 'manual_award': return 'Award'
    case 'spend':        return 'Spent'
    case 'adjustment':   return 'Adjustment'
    default:             return type || 'Entry'
  }
}

function Cred() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cred', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-cyan-400 text-sm tracking-widest animate-pulse">LOADING CREDITS...</div>
    </div>
  )

  if (error) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-red-400 text-sm">Could not load credits ({error}).</div>
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-gray-400 text-xs tracking-widest uppercase">Credits</h3>
        <span className="text-gray-600 text-xs tracking-wide">{data.org?.name}</span>
      </div>

      {/* Balance — the headline number */}
      <div className="mb-1">
        <span className="text-4xl font-bold text-cyan-400 tabular-nums">
          {data.balance.toLocaleString()}
        </span>
        <span className="text-gray-500 text-sm ml-2">cred</span>
      </div>
      <div className="text-gray-500 text-xs mb-6">
        {data.lifetime.toLocaleString()} earned all-time
      </div>

      {/* Recent activity — grouped events */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-gray-500 text-xs tracking-widest uppercase mb-3">Recent activity</h4>

        {data.entries.length === 0 ? (
          <div className="text-gray-600 text-sm">No activity yet.</div>
        ) : (
          <ul className="space-y-2">
            {data.entries.map(e => {
              const isOp = Boolean(e.op_ulid)
              const title = isOp
                ? (e.op_name || 'Operation')
                : (e.reason || typeLabel(e.type))
              // Meta line: type label, date, and — for grouped ops — how many
              // ledger rows were summed into this line.
              const countNote = isOp && e.entry_count > 1
                ? ` · ${e.entry_count} entries`
                : ''
              return (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="text-gray-200 truncate">{title}</div>
                    <div className="text-gray-600 text-xs">
                      {typeLabel(e.type)} &middot; {formatWhen(e.created_at)}{countNote}
                    </div>
                  </div>
                  <span className={
                    'tabular-nums font-medium ml-3 shrink-0 ' +
                    (e.amount >= 0 ? 'text-cyan-400' : 'text-red-400')
                  }>
                    {e.amount >= 0 ? '+' : ''}{e.amount.toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-4">
          <Link
            to="/history"
            className="text-cyan-400/80 hover:text-cyan-400 text-xs tracking-wide transition-colors"
          >
            View full history &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cred
