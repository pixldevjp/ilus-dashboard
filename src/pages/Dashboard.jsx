import Cred from './Cred'
import { LogOut } from 'lucide-react'

function Dashboard({ user }) {

  const handleLogout = () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1]

    fetch('https://ilus.app/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-XSRF-TOKEN': decodeURIComponent(token),
        'Content-Type': 'application/json',
      },
    }).then(() => {
      window.location.href = '/'
    })
    .catch((err) => {
      console.error('Logout failed:', err)
      window.location.href = '/'
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-cyan-400 font-bold tracking-widest">FNSC</span>
          <span className="text-gray-500 text-sm ml-3">Fleet Operations</span>
        </div>
        <div className="flex items-center gap-4">
          {user?.avatar && (
            <img src={user.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
          )}
          <span className="text-gray-300 text-sm">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">Welcome, {user?.name}</h2>
          <p className="text-gray-500 text-sm mt-1">Here is what is happening right now.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Cred />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
