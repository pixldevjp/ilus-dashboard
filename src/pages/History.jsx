import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'

// History — the full, paged, searchable ledger view for the authenticated
// member within the org they are viewing. Read-only. Fetches from
// /api/cred/history, which scopes every query to (org_id, discord_id) server
// side; this page never sees another org's rows.
//
// All filter/sort/page state lives in the URL (useSearchParams) so the view is
// shareable, bookmarkable, and survives refresh + back button. That URL-as-
// state choice is why this is a route and not a modal.

// Fuller timestamp than the dashboard card — a history view wants precision.
function formatWhen(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Short label for the type column / filter. Mirrors Cred.jsx so the two views
// speak the same language; unknown types fall through to the raw value.
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

const SORTS = [
  { value: 'newest',      label: 'Newest first' },
  { value: 'oldest',      label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount: high to low' },
  { value: 'amount_asc',  label: 'Amount: low to high' },
]

const PER_PAGE = 25

function History() {
  const [params, setParams] = useSearchParams()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Read current state from the URL (single source of truth).
  const page   = Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  const q      = params.get('q') || ''
  const sort   = params.get('sort') || 'newest'
  const type   = params.get('type') || ''
  const from   = params.get('from') || ''
  const to     = params.get('to') || ''

  // Local input state for the search box (debounced into the URL separately).
  const [qInput, setQInput] = useState(q)
  // Filters panel open if any advanced filter is active on first load.
  const [showFilters, setShowFilters] = useState(Boolean(type || from || to))

  // Keep the visible search box in sync if the URL changes underneath us
  // (e.g. back button, or clearing filters).
  useEffect(() => { setQInput(q) }, [q])

  // Helper: merge changes into the URL params. Any change that affects the
  // result set resets page to 1 (unless we're explicitly paging).
  const update = useCallback((changes, { resetPage = true } = {}) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(changes)) {
        if (v === '' || v == null) next.delete(k)
        else next.set(k, v)
      }
      if (resetPage) next.delete('page')   // back to page 1
      return next
    }, { replace: true })
  }, [setParams])

  // Debounce the search input into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput !== q) update({ q: qInput })
    }, 350)
    return () => clearTimeout(t)
  }, [qInput, q, update])

  // Fetch whenever the URL-derived query changes.
  useEffect(() => {
    const sp = new URLSearchParams()
    sp.set('page', String(page))
    sp.set('per_page', String(PER_PAGE))
    if (q)    sp.set('q', q)
    if (sort) sp.set('sort', sort)
    if (type) sp.set('type', type)
    if (from) sp.set('from', from)
    if (to)   sp.set('to', to)

    setLoading(true)
    setError(null)
    fetch(`/api/cred/history?${sp.toString()}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [page, q, sort, type, from, to])

  const meta  = data?.meta
  const types = data?.types || []
  const hasActiveFilters = Boolean(type || from || to)

  const goToPage = (p) => {
    if (!meta) return
    const target = Math.min(Math.max(1, p), meta.last_page)
    update({ page: String(target) }, { resetPage: false })
  }

  const clearFilters = () => {
    update({ type: '', from: '', to: '' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-cyan-400 text-xs tracking-widest uppercase transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Credit history</h1>
          {meta && (
            <span className="text-gray-600 text-xs tracking-wide tabular-nums">
              {meta.total.toLocaleString()} {meta.total === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>

        {/* Controls: search + sort always visible; advanced behind a toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                type="text"
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                placeholder="Search op name or reason..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => update({ sort: e.target.value })}
              className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/60 transition-colors"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={
                'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm border transition-colors ' +
                (showFilters || hasActiveFilters
                  ? 'border-cyan-500/60 text-cyan-400'
                  : 'border-gray-800 text-gray-400 hover:text-gray-200')
              }
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col sm:flex-row gap-3 sm:items-end">
              {/* Type */}
              <label className="flex-1 block">
                <span className="block text-gray-500 text-xs tracking-widest uppercase mb-1">Type</span>
                <select
                  value={type}
                  onChange={e => update({ type: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/60 transition-colors"
                >
                  <option value="">All types</option>
                  {types.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
              </label>

              {/* From */}
              <label className="flex-1 block">
                <span className="block text-gray-500 text-xs tracking-widest uppercase mb-1">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={e => update({ from: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/60 transition-colors [color-scheme:dark]"
                />
              </label>

              {/* To */}
              <label className="flex-1 block">
                <span className="block text-gray-500 text-xs tracking-widest uppercase mb-1">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={e => update({ to: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/60 transition-colors [color-scheme:dark]"
                />
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-red-400 text-xs tracking-wide transition-colors py-2"
                >
                  <X size={13} /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-cyan-400 text-sm tracking-widest animate-pulse">LOADING HISTORY...</div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">Could not load history ({error}).</div>
          ) : !data || data.entries.length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">
              {q || hasActiveFilters ? 'No entries match these filters.' : 'No activity yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {data.entries.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-gray-200 text-sm truncate">
                      {e.op_name || e.reason || typeLabel(e.type)}
                    </div>
                    <div className="text-gray-600 text-xs mt-0.5">
                      {typeLabel(e.type)} &middot; {formatWhen(e.created_at)}
                      {e.awarded_by ? <> &middot; by {e.awarded_by}</> : null}
                    </div>
                  </div>
                  <span className={
                    'tabular-nums font-medium shrink-0 ' +
                    (e.amount >= 0 ? 'text-cyan-400' : 'text-red-400')
                  }>
                    {e.amount >= 0 ? '+' : ''}{e.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-800 text-gray-300 hover:border-cyan-500/60 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-800 disabled:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft size={15} /> Prev
            </button>

            <span className="text-gray-500 text-xs tracking-wide tabular-nums">
              Page {meta.page} of {meta.last_page}
            </span>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= meta.last_page}
              className="inline-flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-800 text-gray-300 hover:border-cyan-500/60 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-800 disabled:hover:text-gray-300 transition-colors"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default History
