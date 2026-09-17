import { type FormEvent } from 'react'
import { Plus, Copy, Lock, ShieldAlert, BarChart3, Clock, ArrowRightLeft } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ClientSession, ConnectionState, RequestLogEntry, UsagePoint } from '../../lib/api'
import { ROOT_DOMAIN, tierOf } from '../../lib/api'
import NewTunnelModal from '../modals/NewTunnelModal'
import TunnelConsole from '../dashboard/TunnelConsole'

type Props = {
  session: ClientSession | null
  connState: ConnectionState
  portInput: string
  setPortInput: (v: string) => void
  onPortSubmit: (e: FormEvent<HTMLFormElement>) => void
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
  portListening: boolean | null
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
  connected:    { label: 'Live',         cls: 'ps-badge-green' },
  disconnected: { label: 'Reconnecting', cls: 'ps-badge-yellow' },
}

export default function DashboardPage({
  session, connState, portInput, setPortInput, onPortSubmit,
  gauthEnabled, onAuthToggle, isBusy,
  totalRequests, onCopyUrl, copyFeedback, requestLog, bytesIn, bytesOut, dailyUsage,
  portListening, uptimeSeconds,
  showNewTunnel, onOpenNewTunnel, onCloseNewTunnel, onCreateTunnel, tunnelType,
}: Props) {
  const publicUrl = session?.subdomain
    ? `https://${session.subdomain}.${ROOT_DOMAIN}`
    : null

  const bwPct = session
    ? Math.min(100, (session.bandwidthUsed / session.bandwidthLimit) * 100)
    : 0

  const badge = connBadge[connState]
  const tier = session ? tierOf(session) : null
  const TIER_LABEL: Record<string, string> = {
    anonymous: 'Guest', verified: 'Verified', pro: 'Pro', pro_plus: 'Pro+',
  }

  return (
    <div className="ps-main">
      {/* Header */}
      <div className="ps-page-header animate-fade-down">
        <div>
          <h1 className="ps-page-title">Dashboard</h1>
        </div>
        <div className="ps-header-actions">
          <button className="ps-btn ps-btn-primary ps-btn-sm" onClick={onOpenNewTunnel}>
            <Plus size={13} style={{ marginRight: 4 }} />
            New tunnel
          </button>
        </div>
      </div>

      <div className="ps-page-content">
        {/* ── Tunnel Card ── */}
        <div className={`ps-tunnel-card ${connState === 'connected' ? 'tunnel-connected' : ''} animate-fade-up`}>

          {/* URL row */}
          <div className="ps-tunnel-card-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              {publicUrl ? (
                <div
                  className="ps-tunnel-url"
                  onClick={onCopyUrl}
                  title="Click to copy"
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {publicUrl}
                  </span>
                  <span style={{ fontSize: 11, color: copyFeedback === 'copied' ? 'var(--green)' : 'var(--text-soft)', flexShrink: 0, marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Copy size={11} />
                    {copyFeedback === 'copied' ? 'Copied' : 'Copy'}
                  </span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-soft)', fontSize: 12 }}>
                  No subdomain configured
                </div>
              )}
            </div>
            <span className={`ps-badge ${badge.cls}`}>{badge.label}</span>
          </div>

          {/* Port + Auth — core controls, always visible */}
          <div className="ps-tunnel-card-body">
            <form onSubmit={onPortSubmit}>
              <div className="ps-input-wrap">
                <label className="ps-label">Local port</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div className="ps-input-group" style={{ flex: 1 }}>
                    <span className="ps-input-prefix">:</span>
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
                  <button type="submit" className="ps-btn ps-btn-secondary ps-btn-sm" disabled={isBusy}>
                    Apply
                  </button>
                </div>
                {portListening !== null && (
                  <span className={`ps-port-status ${portListening ? 'listening' : 'offline'}`} style={{ marginTop: 4 }}>
                    {portListening ? 'Listening' : 'Not listening'}
                  </span>
                )}
              </div>
            </form>

            {/* Google Auth toggle */}
            {gauthEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={14} style={{ color: session?.requireAuth ? 'var(--cyan)' : 'var(--text-muted)' }} />
                    Auth wall
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-soft)', marginTop: 2, paddingLeft: 20 }}>
                    {session?.requireAuth ? 'Requires Google sign-in' : 'Public access'}
                  </div>
                </div>
                <label className="ps-toggle">
                  <input
                    type="checkbox"
                    checked={session?.requireAuth ?? false}
                    onChange={onAuthToggle}
                    disabled={isBusy}
                  />
                  <div className="ps-toggle-track" />
                </label>
              </div>
            )}
          </div>

          {/* Stats bar — trimmed to 3 key metrics */}
          <div className="ps-tunnel-card-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label"><ArrowRightLeft size={11} /> Requests</span>
              <span className="ps-tunnel-stat-value">{totalRequests.toLocaleString()}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label"><BarChart3 size={11} /> Transferred</span>
              <span className="ps-tunnel-stat-value">{formatBytes(bytesIn + bytesOut)}</span>
            </div>
            <div className="ps-tunnel-stat">
              <span className="ps-tunnel-stat-label"><Clock size={11} /> Uptime</span>
              <span className="ps-tunnel-stat-value">{connState === 'connected' ? formatUptime(uptimeSeconds) : '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Bandwidth ── */}
        {session && (
          <div className="ps-card animate-fade-up delay-100" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Bandwidth</span>
                {tier && (
                  <span className="ps-badge ps-badge-gray" style={{ marginLeft: 8 }}>{TIER_LABEL[tier]}</span>
                )}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono-font)', color: 'var(--text-soft)' }}>
                {formatBytes(session.bandwidthUsed)} / {formatBytes(session.bandwidthLimit)}
              </span>
            </div>
            <div className="ps-bandwidth-bar">
              <div className="ps-bandwidth-fill" style={{ width: `${bwPct}%` }} />
            </div>
            {dailyUsage.length > 0 && (
              <div style={{ height: 56, marginTop: 12, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...dailyUsage].reverse().map(p => ({ time: p.period, bytes: p.totalBytes }))}>
                    <defs>
                      <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                      itemStyle={{ color: 'var(--text)' }}
                      formatter={(val: number | string) => [formatBytes(Number(val)), 'Traffic']}
                      labelStyle={{ color: 'var(--text-soft)', marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="bytes" stroke="var(--accent)" fillOpacity={1} fill="url(#colorBw)" strokeWidth={1.5} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-soft)' }}>
              {(100 - bwPct).toFixed(1)}% remaining this period
            </div>
          </div>
        )}

        {/* ── Live console ── */}
        {session?.subdomain && (!tunnelType || tunnelType === 'http' || tunnelType === 'tcp' || tunnelType === 'udp') && (
          <TunnelConsole
            connState={connState}
            port={portInput}
            publicUrl={publicUrl ?? ''}
            requestLog={requestLog}
          />
        )}

        {/* ── E2E CLI info ── */}
        {session?.subdomain && tunnelType === 'e2e' && (
          <div className="ps-card animate-fade-up delay-100" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={14} style={{ color: 'var(--yellow)' }} />
              CLI required for E2E encryption
            </div>
            <div className="ps-code">
              portshare proxy --port {portInput || '443'} --subdomain {session.subdomain}
            </div>
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
