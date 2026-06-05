import { Outlet } from 'react-router-dom'
import Footer from './Footer'

// Layout — shared chrome for every routed page. The matched child route renders
// at <Outlet />; Footer sits below it on every page. Add future app-wide chrome
// (a top nav, a global banner) here rather than repeating it per page.
//
// min-h-screen + flex column keeps the footer at the bottom even on short pages.

function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default Layout
