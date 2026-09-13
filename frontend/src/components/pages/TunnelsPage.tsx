import { useState, type FormEvent } from 'react'
import { Link2, Plus, Copy, ExternalLink, Check, ChevronDown, ChevronUp, Play, Square, Trash2 } from 'lucide-react'
import type { ClientSession, ConnectionState, PersistentTunnel, RequestLogEntry } from '../../lib/api'
import { ROOT_DOMAIN } from '../../lib/api'
import RouteRulesEditor from '../dashboard/RouteRulesEditor'

type Props = {
  session: ClientSession | null
  connState: ConnectionState
  portInput: string
  setPortInput: (v: string) => void
  onPortSubmit: (e: FormEvent<HTMLFormElement>) => void
  onCopyUrl: () => void
  copyFeedback: 'idle' | 'copied' | 'failed'
  requestLog: RequestLogEntry[]
  routeRules: Array<{ path: string; port: number }>
  onRouteRulesChange: (rules: Array<{ path: string; port: number }>) => void
  persistentTunnels: PersistentTunnel[]
  selectedTunnelId: string | null
  onSelectTunnel: (tunnel: PersistentTunnel) => void
  onStartTunnel: (tunnel: PersistentTunnel) => void
  onStopTunnel: (tunnel: PersistentTunnel) => void
  onDeleteTunnel: (tunnel: PersistentTunnel) => void
  portListening: boolean | null
  isBusy: boolean
  onNewTunnel: () => void
}

const statusText: Record<ConnectionState, string> = {
  idle:         'Idle',
  connecting:   'Connecting…',
  connected:    'Connected',
  disconnected: 'Reconnecting…',
}

export default function TunnelsPage({
  session, connState, portInput, setPortInput, onPortSubmit,
  onCopyUrl, copyFeedback, requestLog, routeRules, onRouteRulesChange, portListening, isBusy, onNewTunnel
  , persistentTunnels, selectedTunnelId, onSelectTunnel, onStartTunnel, onStopTunnel, onDeleteTunnel
}: Props) {
  const publicUrl = session?.subdomain ? `https://${session.subdomain}.${ROOT_DOMAIN}` : null
  const isConnected = connState === 'connected'
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="ps-main">
      <div className="ps-page-header animate-fade-down">
        <div>
          <h1 className="ps-page-title">Tunnels</h1>
          <p className="ps-page-subtitle">Active and recent tunnel sessions</p>
        </div>
        <div className="ps-header-actions">
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={onNewTunnel}>
            <Plus size={13} />
            New Tunnel
          </button>
        </div>
      </div>

      <div className="ps-page-content">
        <div className="ps-card ps-saved-tunnels animate-fade-up">
          <div className="ps-saved-tunnels-heading">
            <div>
              <div className="ps-section-title">Saved tunnels</div>
              <div className="ps-tunnel-card-subtitle">Persistent configurations for this client</div>
            </div>
            <span className="ps-badge ps-badge-gray">{persistentTunnels.length}</span>
          </div>
          {persistentTunnels.length === 0 ? <div className="ps-empty ps-empty-compact"><span className="ps-empty-sub">No saved tunnel configurations yet.</span></div> : <div className="ps-saved-tunnel-list">{persistentTunnels.map(tunnel => {
            const selected = tunnel.id === selectedTunnelId
            return <div className={`ps-saved-tunnel ${selected ? 'selected' : ''}`} key={tunnel.id} onClick={() => onSelectTunnel(tunnel)}>
              <span className={`ps-saved-tunnel-dot ${tunnel.active ? 'active' : ''}`} />
              <div className="ps-saved-tunnel-main"><strong>{tunnel.subdomain}.{ROOT_DOMAIN}</strong><small>localhost:{tunnel.port} · {tunnel.pathRoutes.length} route{tunnel.pathRoutes.length === 1 ? '' : 's'}</small></div>
              <span className={`ps-badge ${tunnel.active ? 'ps-badge-green' : 'ps-badge-gray'}`}>{tunnel.active ? 'Running' : 'Stopped'}</span>
              <div className="ps-saved-tunnel-actions">{tunnel.active ? <button className="ps-btn-icon" title="Stop tunnel" onClick={event => { event.stopPropagation(); onStopTunnel(tunnel) }} disabled={isBusy}><Square size={12} /></button> : <button className="ps-btn-icon" title="Start tunnel" onClick={event => { event.stopPropagation(); onStartTunnel(tunnel) }} disabled={isBusy}><Play size={12} /></button>}<button className="ps-btn-icon" title="Delete tunnel" onClick={event => { event.stopPropagation(); onDeleteTunnel(tunnel) }} disabled={isBusy}><Trash2 size={12} /></button></div>
            </div>
          })}</div>}
        </div>

        {session?.subdomain ? (
          <>
          <div className={`ps-tunnel-card ${isConnected ? 'tunnel-connected' : ''} animate-fade-up`}>
            <div className="ps-tunnel-card-header">
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: isConnected ? 'var(--green)' : 'var(--yellow)',
                boxShadow: isConnected ? '0 0 0 2px rgba(52,211,153,0.2)' : '0 0 0 2px rgba(251,191,36,0.2)',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  {session.subdomain}.{ROOT_DOMAIN}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-soft)', fontFamily: 'var(--mono-font)', marginTop: 1 }}>
                  localhost:{session.port ?? '—'}
                </div>
              </div>
              <span
                className={`ps-badge ${isConnected ? 'ps-badge-green' : 'ps-badge-yellow'}`}
                style={{ textTransform: 'uppercase' }}
              >
                {statusText[connState]}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {publicUrl && (
                  <>
                    <button className="ps-btn-icon" onClick={onCopyUrl} title="Copy URL">
                      {copyFeedback === 'copied' ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                    </button>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ps-btn-icon"
                      title="Open in browser"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Port config */}
            <div className="ps-tunnel-card-body">
              <form onSubmit={onPortSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div className="ps-input-wrap" style={{ flex: 1, maxWidth: 260 }}>
                  <label className="ps-label">Forwarding to</label>
                  <div className="ps-input-group">
                    <span className="ps-input-prefix">localhost:</span>
                    <input
                      className="ps-input ps-input-mono"
                      value={portInput}
                      onChange={e => setPortInput(e.target.value)}
                      placeholder="3000"
                      type="number"
                      min={1}
                      max={65535}
                    />
                  </div>
                </div>
                <span className={`ps-port-status ${portListening === true ? 'listening' : portListening === false ? 'offline' : ''}`}>
                  {portListening === true ? 'Listening' : portListening === false ? 'Not listening' : 'Checking...'}
                </span>
                <button type="submit" className="ps-btn ps-btn-secondary ps-btn-sm" disabled={isBusy}>
                  Update Port
                </button>
              </form>
              <button className="ps-btn ps-btn-ghost ps-btn-sm" style={{ alignSelf: 'flex-start', gap: 5 }} onClick={() => setShowAdvanced(value => !value)}>
                {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Advanced Options
              </button>
              {showAdvanced && <RouteRulesEditor rules={routeRules} onChange={onRouteRulesChange} />}
            </div>

            <div className="ps-tunnel-card-stats">
              <div className="ps-tunnel-stat">
                <span className="ps-tunnel-stat-label">Protocol</span>
                <span className="ps-tunnel-stat-value" style={{ fontSize: 14 }}>HTTPS</span>
              </div>
              <div className="ps-tunnel-stat">
                <span className="ps-tunnel-stat-label">Plan</span>
                <span className="ps-tunnel-stat-value" style={{ fontSize: 14, textTransform: 'capitalize' }}>{session.plan}</span>
              </div>
              <div className="ps-tunnel-stat">
                <span className="ps-tunnel-stat-label">Auth</span>
                <span className="ps-tunnel-stat-value" style={{ fontSize: 14 }}>{session.requireAuth ? 'Google' : 'Public'}</span>
              </div>
              <div className="ps-tunnel-stat">
                <span className="ps-tunnel-stat-label">Custom Domain</span>
                <span className="ps-tunnel-stat-value" style={{ fontSize: 12, color: 'var(--text-soft)' }}>
                  {session.customDomain || 'None'}
                </span>
              </div>
            </div>
          </div>

          <div className="ps-tunnel-console animate-fade-up delay-100" aria-label="Tunnel terminal output">
            <div className="ps-tunnel-console-header">
              <span className="ps-tunnel-console-dot red" />
              <span className="ps-tunnel-console-dot yellow" />
              <span className="ps-tunnel-console-dot green" />
              <span className="ps-tunnel-console-title">PortShare - tunnel</span>
            </div>
            <div className="ps-tunnel-console-body">
              <div><span className="ps-tunnel-console-prompt">&gt;</span> portshare connect --port {portInput || '3000'}</div>
              <div className="ps-tunnel-console-muted">{isConnected ? 'Tunnel established' : statusText[connState]}</div>
              <div className="ps-tunnel-console-url">{publicUrl}</div>
              <div>Forwarding -&gt; localhost:{portInput || '3000'}</div>
              <div className="ps-tunnel-console-divider" />
              {requestLog.length === 0 ? (
                <div className="ps-tunnel-console-muted">Waiting for requests...</div>
              ) : (
                requestLog.slice(-5).reverse().map(entry => (
                  <div className="ps-tunnel-console-request" key={entry.id}>
                    <span className={`method-tag method-tag-${entry.method.toLowerCase()}`}>{entry.method}</span>
                    <span>{entry.path}</span>
                    <span className="ps-tunnel-console-status">{entry.status ?? 'ERR'}</span>
                    <span className="ps-tunnel-console-muted">{entry.durationMs ?? '-'}ms</span>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
        ) : (
          <div className="ps-card animate-fade-up">
            <div className="ps-empty">
              <Link2 size={32} />
              <span className="ps-empty-title">No active tunnels</span>
              <span className="ps-empty-sub">Create a tunnel to expose your local service to the internet.</span>
              <button className="ps-btn ps-btn-primary" onClick={onNewTunnel} style={{ marginTop: 8 }}>
                <Plus size={13} />
                New Tunnel
              </button>
            </div>
          </div>
        )}

        {/* SSH Quick-connect */}
        <div className="ps-card animate-fade-up delay-100" style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Zero-Install SSH Tunnel
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>
              Use native SSH on any machine — no client install required.
            </div>
          </div>
          <div className="ps-code">
            ssh -R 80:localhost:{portInput || '3000'} portshare.kexoz.dev
          </div>
        </div>
      </div>
    </div>
  )
}
