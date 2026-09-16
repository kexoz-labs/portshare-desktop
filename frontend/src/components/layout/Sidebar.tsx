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

const navItems: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tunnels',   label: 'Tunnels'   },
  { id: 'requests',  label: 'Requests'  },
  { id: 'domains',   label: 'Domains'   },
  { id: 'settings',  label: 'Settings'  },
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

      {/* Connection status + account */}
      <div className="ps-sidebar-status">
        {/* Live connection pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          marginBottom: 8,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: connColor[connState],
            flexShrink: 0,
            boxShadow: connState === 'connected' ? `0 0 0 2px rgba(52,211,153,0.18)` : 'none',
            animation: connState === 'connecting' || connState === 'disconnected' ? 'pulse-dot 1.2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
            {connLabel[connState]}
          </span>
        </div>

        {ownerEmail ? (
          <div style={{ padding: '0 2px 4px' }}>
            <div style={{
              fontSize: 11,
              color: 'var(--text-soft)',
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 2px',
            }}>
              {ownerEmail}
            </div>
            <button
              className="ps-btn ps-btn-ghost ps-btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onLogout}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            className="ps-btn ps-btn-secondary ps-btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onLogin}
          >
            Sign in with Google
          </button>
        )}
      </div>
    </aside>
  )
}
