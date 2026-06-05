import { useState, useEffect } from 'react'

// Cred — a self-contained dashboard card showing the member's current point
// balance, lifetime earned, and recent ledger activity for the org they are
// viewing. Fetches its own data from /api/cred. Read-only.
//
// Drops into Dashboard as <Cred />. Later this becomes the first tile of the
// bird's-eye overview; the "View full history" link will route to a paged,
// searchable ledger view (not yet built).

function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Map ledger entry types to a short human label + accent.
function typeLabel(type) {
  switch (type) {
    case 'vc_op':       return 'Operation'
    case 'vc_sweep':    return 'Op tracking'
    case 'manual_award':return 'Award'
    case 'spend':       return 'Spent'
    case 'adjustment':  return 'Adjustment'
    default:            return type || 'Entry'
  }
}

function Cred() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://ilus.app/api/cred', { credentials: 'include' })
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

      {/* Recent activity */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-gray-500 text-xs tracking-widest uppercase mb-3">Recent activity</h4>

        {data.entries.length === 0 ? (
          <div className="text-gray-600 text-sm">No activity yet.</div>
        ) : (
          <ul className="space-y-2">
            {data.entries.map(e => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <div className="text-gray-200 truncate">
                    {e.op_name || e.reason || typeLabel(e.type)}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {typeLabel(e.type)} &middot; {formatWhen(e.created_at)}
                  </div>
                </div>
                <span className={
                  'tabular-nums font-medium ml-3 ' +
                  (e.amount >= 0 ? 'text-cyan-400' : 'text-red-400')
                }>
                  {e.amount >= 0 ? '+' : ''}{e.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Stub for the future paged/searchable full-history view */}
        <div className="mt-4">
          <span className="text-gray-600 text-xs tracking-wide cursor-not-allowed">
            View full history (coming soon)
          </span>
        </div>
      </div>
    </div>
  )
}

export default Cred
