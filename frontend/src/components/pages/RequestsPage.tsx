import { useMemo, useState } from 'react'
import { Trash2, Search, Copy, Download, MousePointerClick, ArrowRightLeft } from 'lucide-react'
import type { RequestLogEntry } from '../../lib/api'
import { isNoiseRequestPath } from '../../lib/tunnel'

type Props = {
  requestLog: RequestLogEntry[]
  onClear: () => void
  retention: number
  onRetentionChange: (value: number) => void
}

function methodClass(method: string) {
  return `method-tag method-tag-${method.toLowerCase()}`
}

function statusClass(status: number | null) {
  if (!status) return ''
  if (status < 300) return 'status-2xx'
  if (status < 400) return 'status-3xx'
  if (status < 500) return 'status-4xx'
  return 'status-5xx'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const SENSITIVE_HEADERS = /authorization|cookie|set-cookie|proxy-authorization|x-api-key|x-auth-token/i

function syntaxHighlightJSON(json: string) {
  let str = json
  str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return str.replace(/(("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?))/g, (match) => {
    let cls = 'var(--blue)'
    if (/^"/.test(match)) {
      if (/:$/.test(match)) { cls = 'var(--text)' }
      else { cls = 'var(--green)' }
    } else if (/true|false/.test(match)) {
      cls = 'var(--yellow)'
    } else if (/null/.test(match)) {
      cls = 'var(--red)'
    }
    return `<span style="color: ${cls}">${match}</span>`
  })
}

function formatBody(body: string | undefined) {
  if (!body) return ''
  try { return syntaxHighlightJSON(JSON.stringify(JSON.parse(body), null, 2)) } catch { return body }
}

function redactHeaders(headers: Record<string, string> | undefined, showSensitive: boolean) {
  return Object.entries(headers ?? {}).map(([key, value]) => [key, !showSensitive && SENSITIVE_HEADERS.test(key) ? '[hidden]' : value] as const)
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function curlCommand(entry: RequestLogEntry) {
  const headers = Object.entries(entry.headers ?? {}).map(([key, value]) => ` -H ${shellQuote(`${key}: ${value}`)}`).join('')
  const body = entry.body ? ` --data-raw ${shellQuote(entry.body)}` : ''
  return `curl -X ${entry.method}${headers}${body} ${shellQuote(entry.path)}`
}

export default function RequestsPage({ requestLog, onClear, retention, onRetentionChange }: Props) {
  const [selected, setSelected] = useState<RequestLogEntry | null>(null)
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'response' | 'timing'>('headers')
  const [showFrameworkRequests, setShowFrameworkRequests] = useState(false)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showSensitive, setShowSensitive] = useState(false)
  const [copied, setCopied] = useState(false)

  const methods = useMemo(() => [...new Set(requestLog.map(entry => entry.method))].sort(), [requestLog])
  const displayLog = requestLog.filter(entry => {
    if (!showFrameworkRequests && isNoiseRequestPath(entry.path)) return false
    if (methodFilter !== 'all' && entry.method !== methodFilter) return false
    if (statusFilter !== 'all' && !String(entry.status ?? '').startsWith(statusFilter)) return false
    return !search.trim() || `${entry.method} ${entry.path}`.toLowerCase().includes(search.trim().toLowerCase())
  })

  const copyCurl = async () => {
    if (!selected) return
    await navigator.clipboard.writeText(curlCommand(selected))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const exportCurl = () => {
    if (!selected) return
    const blob = new Blob([`${curlCommand(selected)}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `portshare-${selected.id || 'request'}.sh`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="ps-main" style={{ overflow: 'hidden' }}>
      <div className="ps-inspector animate-fade-in">
        {/* Request list */}
        <div className="ps-req-list">
          <div className="ps-req-list-header">
            <span className="ps-req-list-title">
              Requests {displayLog.length > 0 && <span style={{ color: 'var(--text-soft)' }}>({displayLog.length})</span>}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label className="ps-req-retention">
                Keep{' '}
                <select value={retention} onChange={event => onRetentionChange(Number(event.target.value))}>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </label>
              <button
                className={`ps-btn ps-btn-ghost ps-btn-sm ${showFrameworkRequests ? 'active' : ''}`}
                onClick={() => setShowFrameworkRequests(v => !v)}
              >
                {showFrameworkRequests ? 'Hide assets' : 'Show assets'}
              </button>
              <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={onClear} style={{ color: 'var(--red)' }}>
                <Trash2 size={13} style={{ marginRight: 4 }} />
                Clear
              </button>
            </div>
          </div>

          <div className="ps-req-filters">
            <div className="ps-req-search">
              <Search size={14} className="ps-req-search-icon" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search path…" />
            </div>
            <select value={methodFilter} onChange={event => setMethodFilter(event.target.value)}>
              <option value="all">Method</option>
              {methods.map(method => <option key={method} value={method}>{method}</option>)}
            </select>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="all">Status</option>
              <option value="2">2xx</option>
              <option value="3">3xx</option>
              <option value="4">4xx</option>
              <option value="5">5xx</option>
            </select>
            <label className="ps-req-sensitive">
              <input type="checkbox" checked={showSensitive} onChange={event => setShowSensitive(event.target.checked)} />
              {' '}Sensitive
            </label>
          </div>

          {displayLog.length === 0 ? (
            <div className="ps-empty" style={{ flex: 1 }}>
              <ArrowRightLeft size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <span className="ps-empty-title">No requests yet</span>
              <span className="ps-empty-sub">Make a request to your tunnel URL to see it appear here.</span>
            </div>
          ) : (
            [...displayLog].reverse().map((entry, i) => (
              <div
                key={`${entry.id}-${i}`}
                className={`ps-req-item ${selected?.id === entry.id ? 'selected' : ''}`}
                onClick={() => setSelected(entry)}
                style={{ animationDelay: `${Math.min(i * 20, 200)}ms` }}
              >
                <span className={methodClass(entry.method)}>{entry.method}</span>
                <span className="ps-req-path">{entry.path}</span>
                <div className="ps-req-meta">
                  <span className={`ps-req-duration ${statusClass(entry.status)}`} style={{ fontSize: 11, fontFamily: 'var(--mono-font)' }}>
                    {entry.status ?? '???'}
                  </span>
                  <span className="ps-req-time">{entry.durationMs != null ? `${entry.durationMs}ms` : ''}</span>
                  <span className="ps-req-time">{formatTime(entry.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="ps-detail-panel">
          {selected ? (
            <>
              <div className="ps-detail-panel-header">
                <span className={methodClass(selected.method)}>{selected.method}</span>
                <span style={{ fontFamily: 'var(--mono-font)', fontSize: 12.5, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selected.path}
                </span>
                <span className={`ps-badge ${selected.status && selected.status < 400 ? 'ps-badge-green' : 'ps-badge-red'}`}>
                  {selected.status ?? 'ERR'}
                </span>
                {selected.durationMs != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-soft)', fontFamily: 'var(--mono-font)' }}>
                    {selected.durationMs}ms
                  </span>
                )}
                <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={() => void copyCurl()}>
                  <Copy size={13} style={{ marginRight: 4 }} />
                  {copied ? 'Copied' : 'Copy curl'}
                </button>
                <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={exportCurl}>
                  <Download size={13} style={{ marginRight: 4 }} />
                  Export .sh
                </button>
              </div>

              <div className="ps-detail-tabs">
                {(['headers', 'body', 'response', 'timing'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`ps-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="ps-detail-body animate-fade-in">
                {activeTab === 'headers' && (
                  <>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        General
                      </div>
                      <div className="ps-code">
                        <div><span style={{ color: 'var(--text-muted)' }}>URL:</span> {selected.path}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Method:</span> {selected.method}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> {selected.status ?? 'Error'}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Time:</span> {formatTime(selected.timestamp)}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        Request Headers
                      </div>
                      <div className="ps-code">
                        {selected.headers && Object.keys(selected.headers).length > 0 ? (
                          redactHeaders(selected.headers, showSensitive).map(([k, v]) => (
                            <div key={k}><span style={{ color: 'var(--text-muted)' }}>{k}:</span> {v}</div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--text-muted)' }}>(No headers recorded)</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {activeTab === 'body' && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      Request Body
                    </div>
                    {selected.method === 'GET' ? (
                      <div className="ps-code" style={{ whiteSpace: 'pre' }}>(no body)</div>
                    ) : (
                      <div className="ps-code" style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: formatBody(selected.body) || '(empty body)' }} />
                    )}
                  </div>
                )}
                {activeTab === 'response' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        Response Headers
                      </div>
                      <div className="ps-code">
                        {selected.responseHeaders && Object.keys(selected.responseHeaders).length > 0
                          ? redactHeaders(selected.responseHeaders, showSensitive).map(([key, value]) => <div key={key}><span style={{ color: 'var(--text-muted)' }}>{key}:</span> {value}</div>)
                          : '(No response headers recorded)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        Response Body
                      </div>
                      <div className="ps-code" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }} dangerouslySetInnerHTML={{ __html: formatBody(selected.responseBody) || '(empty response body)' }} />
                    </div>
                  </div>
                )}
                {activeTab === 'timing' && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      Timing
                    </div>
                    <div className="ps-code">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Round trip:</span>{' '}
                        {selected.durationMs != null ? `${selected.durationMs}ms` : '—'}
                      </div>
                      <div style={{ color: 'var(--text-soft)', marginTop: 8 }}>
                        Time to proxy the request to localhost and receive the response. Fine-grained DNS/TLS splits are not recorded.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="ps-empty" style={{ flex: 1 }}>
              <MousePointerClick size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <span className="ps-empty-title">Select a request</span>
              <span className="ps-empty-sub">Click any request in the list to inspect headers, body, and timing.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
