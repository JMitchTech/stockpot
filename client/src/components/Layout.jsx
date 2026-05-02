import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo1.png'
import nonna from '../assets/Nonna.png'
import NonnaSidebar from './Nonna'

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/menu', label: 'Menu' },
  { path: '/ingredients', label: 'Ingredients' },
  { path: '/waste', label: 'Waste Log' },
  { path: '/purchasing', label: 'Purchasing' },
  { path: '/vendors', label: 'Vendors' },
  { path: '/reports', label: 'Reports' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('stockpot_user') || '{}')
  const [nonnaOpen, setNonnaOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('stockpot_token')
    localStorage.removeItem('stockpot_user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6EC' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{
          backgroundColor: '#FDF6EC',
          borderBottom: '1px solid #E8D5B7'
        }}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          <img src={logo} alt="Stockpot" className="h-14" />
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#6B4F3A' }}>
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-white px-3 py-1 rounded transition hover:opacity-90"
              style={{ backgroundColor: '#C0392B' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside
          className="w-52 flex flex-col shrink-0 h-full overflow-hidden"
          style={{
            backgroundColor: '#F5ECD7',
            borderRight: '1px solid #E8D5B7'
          }}
        >
          {/* Nav links */}
          <nav className="flex flex-col gap-1 px-3 pt-6 overflow-y-auto flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? 'text-white' : 'hover:bg-amber-100'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#1B2A4A' : undefined,
                  color: isActive ? 'white' : '#3D2B1F'
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Nonna at bottom of sidebar */}
          <button
            onClick={() => setNonnaOpen(true)}
            className="flex flex-col items-center pb-4 pt-2 hover:scale-105 transition-transform"
            style={{ marginLeft: '-12px' }}
          >
            <img
              src={nonna}
              alt="Ask Nonna"
              className="w-36 h-36 object-contain drop-shadow-lg"
            />
            <span className="text-xs mt-1" style={{ color: '#6B4F3A' }}>
              Ask Nonna
            </span>
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

      </div>

      {/* Nonna chat panel */}
      <NonnaSidebar open={nonnaOpen} onClose={() => setNonnaOpen(false)} />

    </div>
  )
}