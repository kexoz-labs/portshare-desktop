import { useState } from 'react'
import { QUICK_PORTS } from '../../lib/storage'
import { ROOT_DOMAIN } from '../../lib/api'

type Props = {
  onClose: () => void
  initialSubdomain?: string
  onSubmit: (subdomain: string, port: number, tunnelType: string, password?: string, duration?: string, oneTime?: boolean, logoUrl?: string, welcomeMessage?: string) => void | Promise<void>
}

const TYPES = [
  { id: 'web',  label: 'Web',      desc: 'HTTP / HTTPS' },
  { id: 'tcp',  label: 'TCP',      desc: 'Any TCP service' },
  { id: 'udp',  label: 'UDP',      desc: 'Any UDP service' },
  { id: 'pty',  label: 'Terminal', desc: 'Browser shell' },
] as const

type Category = typeof TYPES[number]['id']

export default function NewTunnelModal({ onClose, onSubmit, initialSubdomain = '' }: Props) {
  const [port, setPort] = useState('')
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  const [category, setCategory] = useState<Category>('web')
  const [security, setSecurity] = useState<'standard' | 'private'>('standard')
  const [password, setPassword] = useState('')
  const [duration, setDuration] = useState('')

  const computedTunnelType =
    category === 'web' && security === 'standard' ? 'http' :
    category === 'web' && security === 'private'  ? 'e2e' :
    category === 'tcp' && security === 'standard' ? 'tcp' :
    category === 'tcp' && security === 'private'  ? 'e2e' :
    category === 'udp' ? 'udp' :
    category === 'pty' ? 'pty' :
    'http'

  const handleSubmit = () => {
    const p = Number(port)
    if (!p || p < 1 || p > 65535) return
    if (!subdomain.trim()) return
    void onSubmit(subdomain.trim().toLowerCase(), p, computedTunnelType, password || undefined, duration || undefined, false, undefined, undefined)
  }

  return (
    <div className="ps-modal-overlay" onClick={onClose}>
      <div className="ps-modal" onClick={e => e.stopPropagation()}>
        <div className="ps-modal-header">
          <span className="ps-modal-title">New tunnel</span>
          <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="ps-modal-body">

          {/* Subdomain */}
          <div className="ps-input-wrap">
            <label className="ps-label">Public address</label>
            <div className="ps-input-group">
              <input
                className="ps-input ps-input-mono"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                placeholder="my-app"
                autoFocus
              />
              <span className="ps-input-suffix">.{ROOT_DOMAIN}</span>
            </div>
          </div>

          {/* Port */}
          <div className="ps-input-wrap">
            <label className="ps-label">Local port</label>
            <div className="ps-input-group">
              <span className="ps-input-prefix">localhost:</span>
              <input
                className="ps-input ps-input-mono"
                type="number"
                value={port}
                onChange={e => setPort(e.target.value)}
                placeholder="3000"
                min={1}
                max={65535}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              />
            </div>
            {/* Quick-select chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
              {QUICK_PORTS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`ps-btn ps-btn-sm ${Number(port) === p ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setPort(String(p))}
                  style={{ fontFamily: 'var(--mono-font)', fontSize: 11 }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic type */}
          <div className="ps-input-wrap">
            <label className="ps-label">Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TYPES.map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  className={`ps-btn ${category === id ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => { setCategory(id); setSecurity('standard') }}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 3, height: 'auto' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, lineHeight: 1.3 }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Encryption (only for web + tcp) */}
          {(category === 'web' || category === 'tcp') && (
            <div className="ps-input-wrap">
              <label className="ps-label">Encryption</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  className={`ps-btn ${security === 'standard' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setSecurity('standard')}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 3, height: 'auto' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>Standard</span>
                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, lineHeight: 1.3 }}>
                    {category === 'web' ? 'TLS ends at gateway' : 'Forward traffic directly'}
                  </span>
                </button>
                <button
                  type="button"
                  className={`ps-btn ${security === 'private' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setSecurity('private')}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 3, height: 'auto' }}
                >
                  <span style={{ fontWeight: 600, fontSize: 12.5 }}>Private</span>
                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.7, lineHeight: 1.3 }}>
                    {category === 'web' ? 'TLS ends on your device' : 'End-to-end encrypted'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Optional: password + expiry */}
          <div className="ps-input-wrap">
            <label className="ps-label">Optional — password &amp; expiry</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                className="ps-input"
                type="password"
                placeholder="Password protect (Basic Auth)"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <input
                className="ps-input ps-input-mono"
                placeholder="Auto-expire after (e.g. 1h, 30m)"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>

        </div>
        <div className="ps-modal-footer">
          <button className="ps-btn ps-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="ps-btn ps-btn-primary"
            onClick={handleSubmit}
            disabled={!subdomain.trim() || !port || Number(port) < 1}
          >
            Start tunnel
          </button>
        </div>
      </div>
    </div>
  )
}
