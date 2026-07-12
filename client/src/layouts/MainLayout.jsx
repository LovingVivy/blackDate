import { NavLink, Outlet } from 'react-router-dom'
import './MainLayout.css'

const navItems = [
  { to: '/', label: 'Trang chủ' },
  { to: '/about', label: 'Giới thiệu' },
]

export function MainLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="Trang chủ BlackDate">
          BlackDate
        </NavLink>
        <nav className="site-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
