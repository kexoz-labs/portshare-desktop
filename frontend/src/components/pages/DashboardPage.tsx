import { useState, type FormEvent } from 'react'
import { Copy, ExternalLink, Activity, Clock, ChevronDown, ChevronUp, Database, Plus, Check } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ClientSession, ConnectionState, RequestLogEntry, UsagePoint } from '../../lib/api'
import { ROOT_DOMAIN, tierOf } from '../../lib/api'
import NewTunnelModal from '../modals/NewTunnelModal'
import TunnelConsole from '../dashboard/TunnelConsole'
import RouteRulesEditor from '../dashboard/RouteRulesEditor'

type Props = {
  session: ClientSession | null
  connState: ConnectionState
  portInput: string
  setPortInput: (v: string) => void
  onPortSubmit: (e: FormEvent<HTMLFormElement>) => void
  domainInput: string
  setDomainInput: (v: string) => void
  onDomainSubmit: (e: FormEvent<HTMLFormElement>) => void
  gauthEnabled: boolean
  onAuthToggle: () => void
  isBusy: boolean
  totalRequests: number
  onCopyUrl: () => void
  copyFeedback: 'idle' | 'copied' | 'failed'
  requestLog: RequestLogEntry[]
  bytesIn: number
  bytesOut: number
  dailyUsage: UsagePoint[]
  monthlyUsage: UsagePoint[]
  portListening: boolean | null
  routeRules: Array<{ path: string; port: number }>
  onRouteRulesChange: (rules: Array<{ path: string; port: number }>) => void
  routePortStatus: Record<number, boolean | null>
  statusMessage: string
  uptimeSeconds: number
  showNewTunnel: boolean
  onOpenNewTunnel: () => void
  onCloseNewTunnel: () => void
  onCreateTunnel: (subdomain: string, port: number, tunnelType: string, password?: string, duration?: string, oneTime?: boolean, logoUrl?: string, welcomeMessage?: string) => void | Promise<void>
  tunnelType?: 'http' | 'tcp' | 'udp' | 'e2e' | 'pty'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const connBadge: Record<ConnectionState, { label: string; cls: string }> = {
  idle:         { label: 'Idle',         cls: 'ps-badge-gray' },
  connecting:   { label: 'Connecting',   cls: 'ps-badge-yellow' },
  connected:    { label: 'Connected',    cls: 'ps-badge-green' },
  disconnected: { label: 'Reconnecting', cls: 'ps-badge-yellow' },
}

export default function DashboardPage({
  session, connState, portInput, setPortInput, onPortSubmit,
  domainInput, setDomainInput, onDomainSubmit,
  gauthEnabled, onAuthToggle, isBusy,
  totalRequests, onCopyUrl, copyFeedback, requestLog, bytesIn, bytesOut, dailyUsage, monthlyUsage, portListening, routeRules, onRouteRulesChange, routePortStatus, statusMessage, uptimeSeconds,
  showNewTunnel, onOpenNewTunnel, onCloseNewTunnel, onCreateTunnel, tunnelType,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const publicUrl = session?.subdomain
    ? `https://${session.subdomain}.${ROOT_DOMAIN}`
    : null

  const bwPct = session
    ? Math.min(100, (session.bandwidthUsed / session.bandwidthLimit) * 100)
    : 0

  const badge = connBadge[connState]

  return (
    <div className="ps-main">
      {/* Header */}
      <div className="ps-page-header animate-fade-down">
        <div>
          <h1 className="ps-page-title">Dashboard</h1>
          <p className="ps-page-subtitle">
            {connState === 'connected' ? 'Tunnel is live and forwarding traffic' : statusMessage}
          </p>
        </div>
        <div className="ps-header-actions">
          <button
            className="ps-btn ps-btn-primary ps-btn-sm"
            onClick={onOpenNewTunnel}
          >
            <Plus size={13} />
            New tunnel
          </button>
        </div>
      </div>

      <div className="ps-page-content">
        {/* Tunnel Card */}
        <div
          className={`ps-tunnel-card ${connState === 'connected' ? 'tunnel-connected' : ''} animate-fade-up`}
        >
          <div className="ps-tunnel-card-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              {publicUrl ? (
                <div className="ps-tunnel-url" onClick={onCopyUrl} title="Click to copy">
                  {copyFeedback === 'copied'
                    ? <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    : <Copy size={14} style={{ flexShrink: 0, color: 'var(--text-soft)' }} />
                  }
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {publicUrl}
                  </span>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ marginLeft: 'auto', color: 'var(--text-soft)', flexShrink: 0 }}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              ) : (
                <div style={{ color: 'var(--text-soft)', fontSize: 12 }}>No subdomain configured</div>
              )}
            </div>
            <div className="ps-header-actions">
              <span className={`ps-badge ${badge.cls}`}>{badge.label}</span>
            </div>
          </div>

          {/* Tunnel Config row */}
          <div className="ps-tunnel-card-body">
            <form onSubmit={onPortSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div className="ps-input-wrap" style={{ flex: 1 }}>
                <label className="ps-label">Local Port</label>
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
                <span className={`ps-port-status ${portListening === true ? 'listening' : portListening === false ? 'offline' : ''}`}>
                  {portListening === true ? 'Listening' : portListening === false ? 'Not listening' : 'Checking...'}
                </span>
              </div>
              <button
                type="submit"
                className="ps-btn ps-btn-secondary ps-btn-sm"
                disabled={isBusy}
                style={{ marginBottom: 1 }}
              >
                Update
              </button>
            </form>

            {/* Advanced */}
            <button
              className="ps-btn ps-btn-ghost ps-btn-sm"
              style={{ alignSelf: 'flex-start', gap: 5 }}
              onClick={() => setShowAdvanced(v => !v)}
            >
              {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div
                className="animate-fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}
              >
                <div className="ps-divider" />
                {/* Custom Domain */}
                <form onSubmit={onDomainSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="ps-input-wrap" style={{ flex: 1 }}>
                    <label className="ps-label">Custom Domain</label>
                    <input
                      className="ps-input"
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      placeholder="tunnel.yourdomain.com"
                    />
                  </div>
                  <button type="submit" className="ps-btn ps-btn-secondary ps-btn-sm" disabled={isBusy}>
                    Map
                  </button>
                </form>

                {/* Auth toggle */}
                <div className="ps-settings-row" style={{ padding: '8px 0', borderBottom: 'none' }}>
                  <div className="ps-settings-row-info">
                    <div className="ps-settings-row-label">Google Auth Wall</div>
                    <div className="ps-settings-row-desc">
                      {gauthEnabled ? 'Visitors must sign in with Google' : 'Tunnel is publicly accessible'}
                    </div>
                  </div>
                  <label className="ps-toggle">
                    <input
                      type="checkbox"
                      checked={session?.requireAuth ?? false}
                      onChange={onAuthToggle}
                      disabled={!gauthEnabled || isBusy}
                    />
                    <div className="ps-toggle-track" />
                  </label>
                </div>
                {(!tunnelType || tunnelType === 'http') && (
                  <RouteRulesEditor rules={routeRules} onChange={onRouteRulesChange} portStatus={routePortStatus} />
                )}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="ps-tunnel-card-stats">
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Requests</span>
              <span className="ps-tunnel-stat-value">{totalRequests.toLocaleString()}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">In bytes</span>
              <span className="ps-tunnel-stat-value">{formatBytes(bytesIn)}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Out bytes</span>
              <span className="ps-tunnel-stat-value">{formatBytes(bytesOut)}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Total bytes</span>
              <span className="ps-tunnel-stat-value">{formatBytes(bytesIn + bytesOut)}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Bandwidth</span>
              <span className="ps-tunnel-stat-value">{session ? formatBytes(session.bandwidthUsed) : '—'}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Uptime</span>
              <span className="ps-tunnel-stat-value">{connState === 'connected' ? formatUptime(uptimeSeconds) : '—'}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label">Plan</span>
              <span className="ps-tunnel-stat-value" style={{ textTransform: 'capitalize', fontSize: 14 }}>
                {session ? ({ anonymous: 'Guest', verified: 'Verified', pro: 'Pro', pro_plus: 'Pro+' } as const)[tierOf(session)] : '—'}
              </span>
            </div>
          </div>
        </div>

        {(dailyUsage.length > 0 || monthlyUsage.length > 0) && <div className="ps-card ps-usage-history animate-fade-up delay-100">
          <div className="ps-section-title">Usage history</div>
          <div className="ps-usage-history-grid">
            <div><div className="ps-usage-history-heading">Daily · last 30 days</div>{dailyUsage.slice(0, 7).map(point => <div className="ps-usage-history-row" key={point.period}><span>{point.period}</span><strong>{formatBytes(point.totalBytes)}</strong><small>{point.totalRequests} requests</small></div>)}</div>
            <div><div className="ps-usage-history-heading">Monthly</div>{monthlyUsage.slice(0, 6).map(point => <div className="ps-usage-history-row" key={point.period}><span>{point.period}</span><strong>{formatBytes(point.totalBytes)}</strong><small>{point.totalRequests} requests</small></div>)}</div>
          </div>
          <p className="ps-usage-history-note">Bandwidth includes request and response bodies plus HTTP request and response headers.</p>
        </div>}

        {/* Bandwidth usage */}
        {session && (
          <div className="ps-card animate-fade-up delay-100" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={14} style={{ color: 'var(--text-soft)' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Bandwidth Usage</span>
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono-font)', color: 'var(--text-soft)' }}>
                {formatBytes(session.bandwidthUsed)} / {formatBytes(session.bandwidthLimit)}
              </span>
            </div>
            <div className="ps-bandwidth-bar">
              <div className="ps-bandwidth-fill" style={{ width: `${bwPct}%` }} />
            </div>
            
            {dailyUsage.length > 0 && (
              <div style={{ height: 60, marginTop: 12, width: '100%', marginLeft: -4, marginRight: -4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...dailyUsage].reverse().map(p => ({ time: p.period, bytes: p.totalBytes }))}>
                    <defs>
                      <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: 'var(--text)' }}
                      formatter={(val: number | string) => [formatBytes(Number(val)), 'Traffic']}
                      labelStyle={{ color: 'var(--text-soft)', marginBottom: 4 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bytes" 
                      stroke="var(--blue)" 
                      fillOpacity={1} 
                      fill="url(#colorBw)" 
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-soft)' }}>
              {(100 - bwPct).toFixed(1)}% remaining this period
            </div>
          </div>
        )}

        {/* Quick stats grid */}
        <div className="animate-fade-up delay-150" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="ps-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <span className="ps-stat-label">Total Requests</span>
              <Activity size={14} style={{ color: 'var(--text-soft)' }} />
            </div>
            <div className="ps-stat-value">{totalRequests.toLocaleString()}</div>
            <div className="ps-stat-sub">Since session start</div>
          </div>
          <div className="ps-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <span className="ps-stat-label">Local port</span>
              <Activity size={14} style={{ color: 'var(--text-soft)' }} />
            </div>
            <div className="ps-stat-value">
              {session?.port ?? '—'}
            </div>
            <div className="ps-stat-sub">Traffic is forwarded here</div>
          </div>
          <div className="ps-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <span className="ps-stat-label">Uptime</span>
              <Clock size={14} style={{ color: 'var(--text-soft)' }} />
            </div>
            <div className="ps-stat-value">
              {connState === 'connected' ? formatUptime(uptimeSeconds) : '—'}
            </div>
            <div className="ps-stat-sub">Current session</div>
          </div>
        </div>

        {session?.subdomain && (!tunnelType || tunnelType === 'http' || tunnelType === 'tcp' || tunnelType === 'udp') && (
          <TunnelConsole
            connState={connState}
            port={portInput}
            publicUrl={publicUrl ?? ''}
            requestLog={requestLog}
          />
        )}

        {session?.subdomain && (tunnelType === 'e2e') && (
          <div className="ps-card animate-fade-up delay-100" style={{ padding: '16px 20px', marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                CLI Connection Required
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-soft)' }}>
                {tunnelType === 'e2e' && 'E2E Encryption terminates TLS locally, which requires the CLI client to run in proxy mode:'}
              </div>
            </div>
            <div className="ps-code">
              {tunnelType === 'e2e' && `portshare proxy --port ${portInput || '443'} --subdomain ${session.subdomain}`}
            </div>
          </div>
        )}

        {/* SSH tunnel info */}
        {tunnelType !== 'udp' && tunnelType !== 'e2e' && (
          <div className="ps-card animate-fade-up delay-200" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Zero-Install SSH Tunnel
              </span>
              <span className="ps-badge ps-badge-gray">SSH</span>
            </div>
            <div className="ps-code">
              ssh -R 80:localhost:{portInput || '3000'} portshare.kexoz.dev
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-soft)', marginTop: 10 }}>
              No client install needed. Use native SSH to create tunnels from any machine.
            </p>
          </div>
        )}
      </div>

      {showNewTunnel && (
        <NewTunnelModal
          onClose={onCloseNewTunnel}
          initialSubdomain={session?.subdomain ?? ''}
          onSubmit={onCreateTunnel}
        />
      )}
    </div>
  )
}
