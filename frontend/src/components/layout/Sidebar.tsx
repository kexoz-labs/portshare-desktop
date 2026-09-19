import { LayoutDashboard, Network, Activity, Globe, Settings, LogOut, LogIn } from 'lucide-react'
import type { ConnectionState } from '../../lib/api'
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
  connState: ConnectionState
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tunnels',   label: 'Tunnels',   icon: Network         },
  { id: 'requests',  label: 'Requests',  icon: Activity        },
  { id: 'domains',   label: 'Domains',   icon: Globe           },
  { id: 'settings',  label: 'Settings',  icon: Settings        },
]

const connLabel: Record<ConnectionState, string> = {
  idle:         'Idle',
  connecting:   'Connecting',
  connected:    'Connected',
  disconnected: 'Reconnecting',
}

const connColor: Record<ConnectionState, string> = {
  idle:         'var(--text-soft)',
  connecting:   'var(--yellow)',
  connected:    'var(--green)',
  disconnected: 'var(--yellow)',
}

export default function Sidebar({ activePage, onNavigate, requestCount, ownerEmail, onLogin, onLogout, connState }: Props) {
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
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`ps-nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} className="ps-nav-icon" />
            {label}
            {id === 'requests' && requestCount > 0 && (
              <span className="ps-nav-badge">{requestCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Account / Auth */}
      <div className="ps-sidebar-status">
        {ownerEmail ? (
          <div style={{ padding: '0 2px' }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-soft)',
              marginBottom: 8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 2px',
            }}>
              {ownerEmail}
            </div>
            <button
              className="ps-btn ps-btn-secondary ps-btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onLogout}
            >
              <LogOut size={13} style={{ marginRight: 6 }} />
              Sign out
            </button>
          </div>
        ) : (
          <button
            className="ps-btn ps-btn-secondary ps-btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onLogin}
          >
            <LogIn size={13} style={{ marginRight: 6 }} />
            Sign in with Google
          </button>
        )}
      </div>
    </aside>
  )
}
