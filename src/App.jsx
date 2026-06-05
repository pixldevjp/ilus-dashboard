import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Layout from './components/Layout' 

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://ilus.app/api/user', {
      credentials: 'include',
    })
      .then(res => res.ok ? res.json() : null)
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
