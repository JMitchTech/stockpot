import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo1.png'

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
          <img src={logo} alt="Stockpot" className="h-15" />
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

      <div className="flex flex-1">

        {/* Sidebar */}
        <aside
          className="w-52 flex flex-col pt-6 shrink-0"
          style={{
            backgroundColor: '#F5ECD7',
            borderRight: '1px solid #E8D5B7'
          }}
        >
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'text-white'
                      : 'hover:bg-amber-100'
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
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}