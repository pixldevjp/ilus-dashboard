import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [denied, setDenied] = useState(false)   // authenticated, but not authorized for THIS org
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user', {
      credentials: 'include',
    })
      .then(res => {
        if (res.ok) return res.json()
        if (res.status === 403) {
          // Signed in with Discord, but no access to this org's dashboard
          // (status not active, or dashboard_access not granted by the bot).
          setDenied(true)
        }
        return null   // 401 / other → treated as not-logged-in
      })
      .then(data => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-cyan-400 text-lg tracking-widest animate-pulse">LOADING...</div>
    </div>
  )

  // Authenticated but denied → explain, don't silently bounce to login.
  if (denied) {
    const handleSignOut = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]

      fetch('/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-XSRF-TOKEN': decodeURIComponent(token),
          'Content-Type': 'application/json',
        },
      }).finally(() => { window.location.href = '/' })
    }

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-cyan-400 text-xl font-bold tracking-widest mb-4">ACCESS DENIED</h1>
          <p className="text-gray-300 mb-2">
            You're signed in, but your account doesn't have access to this dashboard.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            If you believe this is a mistake, contact your organization's administrator.
          </p>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/history" element={user ? <History /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
