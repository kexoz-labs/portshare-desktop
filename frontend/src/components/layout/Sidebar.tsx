import Logo from '../ui/Logo'

type Page = 'dashboard' | 'tunnels' | 'requests' | 'domains' | 'settings'

type Props = {
  activePage: Page
  onNavigate: (page: Page) => void
  requestCount: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  ownerEmail: string
  onLogin: () => void
  onLogout: () => void
}

const navItems: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tunnels',   label: 'Tunnels'   },
  { id: 'requests',  label: 'Requests'  },
  { id: 'domains',   label: 'Domains'   },
  { id: 'settings',  label: 'Settings'  },
]

export default function Sidebar({ activePage, onNavigate, requestCount, ownerEmail, onLogin, onLogout }: Props) {
  return (
    <aside className="ps-sidebar animate-slide-left">
      {/* Brand */}
      <div className="ps-sidebar-brand">
        <div className="ps-brand-icon">
          <Logo style={{ color: 'var(--text-strong)', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div className="ps-brand-name">PortShare</div>
          <div className="ps-brand-version">Desktop</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="ps-nav" style={{ flex: 1 }}>
        {navItems.map(({ id, label }) => (
          <button
            key={id}
            className={`ps-nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            {label}
            {id === 'requests' && requestCount > 0 && (
              <span className="ps-nav-badge">{requestCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="ps-sidebar-status">
        {ownerEmail ? (
          <div style={{ padding: '0 2px 8px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ownerEmail}
            </div>
            <button className="ps-btn ps-btn-ghost ps-btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="ps-btn ps-btn-secondary ps-btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogin}>
            Sign in with Google
          </button>
        )}
      </div>
    </aside>
  )
}
