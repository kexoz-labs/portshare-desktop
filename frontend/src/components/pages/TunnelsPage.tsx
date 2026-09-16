import { useState, type FormEvent } from 'react'
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
  routePortStatus: Record<number, boolean | null>
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
  connected:    'Live',
  disconnected: 'Reconnecting…',
}

export default function TunnelsPage({
  session, connState, portInput, setPortInput, onPortSubmit,
  onCopyUrl, copyFeedback, requestLog, routeRules, onRouteRulesChange, routePortStatus, portListening, isBusy, onNewTunnel,
  persistentTunnels, selectedTunnelId, onSelectTunnel, onStartTunnel, onStopTunnel, onDeleteTunnel
}: Props) {
  const publicUrl = session?.subdomain ? `https://${session.subdomain}.${ROOT_DOMAIN}` : null
  const isConnected = connState === 'connected'
  const [showRoutes, setShowRoutes] = useState(false)

  return (
    <div className="ps-main">
      <div className="ps-page-header animate-fade-down">
        <div>
          <h1 className="ps-page-title">Tunnels</h1>
        </div>
        <div className="ps-header-actions">
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={onNewTunnel}>
            New tunnel
          </button>
        </div>
      </div>

      <div className="ps-page-content">
        {/* Saved tunnels */}
        <div className="ps-card ps-saved-tunnels animate-fade-up">
          <div className="ps-saved-tunnels-heading">
            <div>
              <div className="ps-section-title">Saved tunnels</div>
              <div className="ps-tunnel-card-subtitle">Persistent configurations for this client</div>
            </div>
            <span className="ps-badge ps-badge-gray">{persistentTunnels.length}</span>
          </div>
          {persistentTunnels.length === 0 ? (
            <div className="ps-empty ps-empty-compact">
              <span className="ps-empty-sub">No saved tunnel configurations yet.</span>
            </div>
          ) : (
            <div className="ps-saved-tunnel-list">
              {persistentTunnels.map(tunnel => {
                const selected = tunnel.id === selectedTunnelId
                return (
                  <div
                    className={`ps-saved-tunnel ${selected ? 'selected' : ''}`}
                    key={tunnel.id}
                    onClick={() => onSelectTunnel(tunnel)}
                  >
                    <span className={`ps-saved-tunnel-dot ${tunnel.active ? 'active' : ''}`} />
                    <div className="ps-saved-tunnel-main">
                      <strong>{tunnel.subdomain}.{ROOT_DOMAIN}</strong>
                      <small>localhost:{tunnel.port} · {tunnel.tunnelType?.toUpperCase() ?? 'HTTP'}</small>
                    </div>
                    <span className={`ps-badge ${tunnel.active ? 'ps-badge-green' : 'ps-badge-gray'}`}>
                      {tunnel.active ? 'Running' : 'Stopped'}
                    </span>
                    <div className="ps-saved-tunnel-actions">
                      {tunnel.active ? (
                        <button
                          className="ps-btn ps-btn-secondary ps-btn-sm"
                          onClick={event => { event.stopPropagation(); onStopTunnel(tunnel) }}
                          disabled={isBusy}
                        >
                          Stop
                        </button>
                      ) : (
                        <button
                          className="ps-btn ps-btn-primary ps-btn-sm"
                          onClick={event => { event.stopPropagation(); onStartTunnel(tunnel) }}
                          disabled={isBusy}
                        >
                          Start
                        </button>
                      )}
                      <button
                        className="ps-btn ps-btn-ghost ps-btn-sm"
                        style={{ color: 'var(--red)' }}
                        onClick={event => { event.stopPropagation(); onDeleteTunnel(tunnel) }}
                        disabled={isBusy}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active session */}
        {session?.subdomain ? (
          <>
            <div className={`ps-tunnel-card ${isConnected ? 'tunnel-connected' : ''} animate-fade-up`}>
              <div className="ps-tunnel-card-header">
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: isConnected ? 'var(--green)' : 'var(--yellow)',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {session.subdomain}.{ROOT_DOMAIN}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-soft)', fontFamily: 'var(--mono-font)', marginTop: 1 }}>
                    localhost:{session.port ?? '—'}
                  </div>
                </div>
                <span className={`ps-badge ${isConnected ? 'ps-badge-green' : 'ps-badge-yellow'}`}>
                  {statusText[connState]}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {publicUrl && (
                    <>
                      <button className="ps-btn ps-btn-secondary ps-btn-sm" onClick={onCopyUrl}>
                        {copyFeedback === 'copied' ? 'Copied' : 'Copy URL'}
                      </button>
                      <a href={publicUrl} target="_blank" rel="noreferrer" className="ps-btn ps-btn-secondary ps-btn-sm">
                        Open
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
                  {portListening !== null && (
                    <span className={`ps-port-status ${portListening ? 'listening' : 'offline'}`} style={{ marginBottom: 2 }}>
                      {portListening ? 'Listening' : 'Not listening'}
                    </span>
                  )}
                  <button type="submit" className="ps-btn ps-btn-secondary ps-btn-sm" disabled={isBusy}>
                    Apply
                  </button>
                </form>

                {(!persistentTunnels.find(t => t.id === selectedTunnelId)?.tunnelType ||
                  persistentTunnels.find(t => t.id === selectedTunnelId)?.tunnelType === 'http') && (
                  <>
                    <button
                      className="ps-btn ps-btn-ghost ps-btn-sm"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => setShowRoutes(v => !v)}
                    >
                      {showRoutes ? 'Hide route rules' : 'Route rules'}
                    </button>
                    {showRoutes && (
                      <RouteRulesEditor rules={routeRules} onChange={onRouteRulesChange} portStatus={routePortStatus} />
                    )}
                  </>
                )}
              </div>

              <div className="ps-tunnel-card-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="ps-tunnel-stat">
                  <span className="ps-tunnel-stat-label">Protocol</span>
                  <span className="ps-tunnel-stat-value" style={{ fontSize: 14, textTransform: 'uppercase' }}>
                    {persistentTunnels.find(t => t.id === selectedTunnelId)?.tunnelType ?? 'HTTP'}
                  </span>
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

            {/* Terminal log */}
            <div className="ps-tunnel-console animate-fade-up delay-100">
              <div className="ps-tunnel-console-header">
                <span className="ps-tunnel-console-dot red" />
                <span className="ps-tunnel-console-dot yellow" />
                <span className="ps-tunnel-console-dot green" />
                <span className="ps-tunnel-console-title">PortShare — tunnel</span>
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
              <span className="ps-empty-title">No active tunnels</span>
              <span className="ps-empty-sub">Create a tunnel to expose a local service to the internet.</span>
              <button className="ps-btn ps-btn-primary" onClick={onNewTunnel} style={{ marginTop: 8 }}>
                New tunnel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
