import { useState } from 'react'
import { X } from 'lucide-react'
import { QUICK_PORTS } from '../../lib/storage'
import { ROOT_DOMAIN } from '../../lib/api'

type Props = {
  onClose: () => void
  initialSubdomain?: string
  onSubmit: (subdomain: string, port: number, tunnelType: string, password?: string, duration?: string, oneTime?: boolean) => void | Promise<void>
}

export default function NewTunnelModal({ onClose, onSubmit, initialSubdomain = '' }: Props) {
  const [port, setPort] = useState('')
  const [subdomain, setSubdomain] = useState(initialSubdomain)
  
  const [category, setCategory] = useState<'web' | 'tcp' | 'udp' | 'pty'>('web')
  const [security, setSecurity] = useState<'standard' | 'private'>('standard')

  const [password, setPassword] = useState('')
  const [duration, setDuration] = useState('')
  const [oneTime, setOneTime] = useState(false)

  // Compute final tunnelType for the backend based on user selections
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
    void onSubmit(subdomain.trim().toLowerCase(), p, computedTunnelType, password, duration, oneTime)
  }

  return (
    <div className="ps-modal-overlay" onClick={onClose}>
      <div className="ps-modal" onClick={e => e.stopPropagation()}>
        <div className="ps-modal-header">
          <span className="ps-modal-title">Forward a local port</span>
          <button className="ps-btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="ps-modal-body">
          <div className="ps-input-wrap">
            <label className="ps-label">Public subdomain</label>
            <div className="ps-input-group">
              <input className="ps-input ps-input-mono" value={subdomain} onChange={e => setSubdomain(e.target.value)} placeholder="my-app" autoFocus />
              <span className="ps-input-prefix">.{ROOT_DOMAIN}</span>
            </div>
          </div>
          <div className="ps-input-wrap">
            <label className="ps-label">Quick select</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_PORTS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`ps-btn ps-btn-sm ${Number(port) === p ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setPort(String(p))}
                  style={{ fontFamily: 'var(--mono-font)', fontSize: 12 }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

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
          </div>

          <div className="ps-input-wrap" style={{ marginTop: 8 }}>
            <label className="ps-label">Traffic Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className={`ps-btn ${category === 'web' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                onClick={() => { setCategory('web'); setSecurity('standard'); }}
                style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>🌐</span> Web
                </div>
                <div style={{ fontSize: 11, textAlign: 'left', color: category === 'web' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3 }}>
                  Expose HTTP/HTTPS applications
                </div>
              </button>

              <button
                type="button"
                className={`ps-btn ${category === 'tcp' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                onClick={() => { setCategory('tcp'); setSecurity('standard'); }}
                style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>🔌</span> TCP
                </div>
                <div style={{ fontSize: 11, textAlign: 'left', color: category === 'tcp' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3 }}>
                  Expose any TCP service
                </div>
              </button>

              <button
                type="button"
                className={`ps-btn ${category === 'udp' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                onClick={() => setCategory('udp')}
                style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 6, opacity: category === 'udp' ? 1 : 0.6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>📡</span> UDP
                </div>
                <div style={{ fontSize: 11, textAlign: 'left', color: category === 'udp' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3 }}>
                  Expose any UDP service
                </div>
              </button>

              <button
                type="button"
                className={`ps-btn ${category === 'pty' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                onClick={() => setCategory('pty')}
                style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 6, opacity: category === 'pty' ? 1 : 0.6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <span style={{ fontSize: 14 }}>⌨️</span> Terminal
                </div>
                <div style={{ fontSize: 11, textAlign: 'left', color: category === 'pty' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3 }}>
                  Share a browser terminal
                </div>
              </button>
            </div>
          </div>

          {(category === 'web' || category === 'tcp') && (
            <div className="ps-input-wrap">
              <label className="ps-label">{category === 'web' ? 'Encryption' : 'Security'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className={`ps-btn ${security === 'standard' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setSecurity('standard')}
                  style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 4 }}
                >
                  <div style={{ fontWeight: 600 }}>Standard</div>
                  <div style={{ fontSize: 11, textAlign: 'left', color: security === 'standard' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3, fontWeight: 400 }}>
                    {category === 'web' 
                      ? 'TLS terminates at PortShare Gateway'
                      : 'Forward TCP traffic directly'
                    }
                  </div>
                </button>

                <button
                  type="button"
                  className={`ps-btn ${security === 'private' ? 'ps-btn-primary' : 'ps-btn-secondary'}`}
                  onClick={() => setSecurity('private')}
                  style={{ height: 'auto', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 12px', gap: 4 }}
                >
                  <div style={{ fontWeight: 600 }}>Private</div>
                  <div style={{ fontSize: 11, textAlign: 'left', color: security === 'private' ? 'rgba(255,255,255,0.9)' : 'var(--text-soft)', lineHeight: 1.3, fontWeight: 400 }}>
                    {category === 'web'
                      ? 'TLS terminates on your device.'
                      : 'End-to-end encrypted locally.'
                    }
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="ps-input-wrap" style={{ marginTop: 16 }}>
            <label className="ps-label">Advanced Constraints</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="ps-input-group">
                <input
                  className="ps-input"
                  type="password"
                  placeholder="Password protect (Basic Auth)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="ps-input-group" style={{ display: 'flex', gap: 8 }}>
                <input
                  className="ps-input ps-input-mono"
                  style={{ flex: 1 }}
                  placeholder="Duration (e.g. 1h, 30m)"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: 'var(--card)', padding: '0 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={oneTime} onChange={e => setOneTime(e.target.checked)} />
                  One-Time
                </label>
              </div>
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
            Start forwarding
          </button>
        </div>
      </div>
    </div>
  )
}
