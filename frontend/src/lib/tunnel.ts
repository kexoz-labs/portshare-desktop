import { type RequestLogEntry, type ConnectionState } from './api'
import { toBase64, fromBase64 } from './utils'
import { encodeFrame, decodeFrame, type WireRequest } from './wire'

type CreateTunnelArgs = {
  apiBaseUrl: string
  clientId: string
  tunnelId?: string
  tunnelType?: string
  portRef: React.MutableRefObject<number | null>
  onStateChange: (state: ConnectionState, message?: string) => void
  onLogEntry: (entry: RequestLogEntry) => void
  routesRef: React.MutableRefObject<Array<{ path: string; port: number }>>
}

const SKIP_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'te',
  'trailer',
  'upgrade',
  'accept-encoding',
  'origin',
  'referer',
])

/** Dev-server chatter that inflates request counts without real payload. */
export function isNoiseRequestPath(path: string): boolean {
  const pathname = path.split('?')[0]?.toLowerCase() ?? ''
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/assets/') ||
    pathname.includes('/_next/webpack-hmr') ||
    pathname.endsWith('/__webpack_hmr') ||
    pathname.includes('/.well-known/') ||
    pathname === '/favicon.ico'
  )
}

function flattenHeaders(headers: Record<string, string[]> | undefined): Record<string, string> {
  const localHeaders: Record<string, string> = {}
  Object.entries(headers ?? {}).forEach(([key, value]) => {
    if (SKIP_HEADERS.has(key.toLowerCase())) return
    localHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value)
  })
  return localHeaders
}

function decodeBody(body: Uint8Array): string {
  if (!body.byteLength) return ''
  try {
    return new TextDecoder().decode(body)
  } catch {
    return '(binary or invalid text data)'
  }
}

/** Normalizes both wire formats (v2 binary frame / legacy JSON+base64). */
function parseIncoming(data: ArrayBuffer | string): { binary: boolean; request: WireRequest } {
  if (typeof data === 'string') {
    const raw = JSON.parse(data) as {
      id: string; method: string; path: string
      headers?: Record<string, string[]>; body?: string
    }
    return {
      binary: false,
      request: {
        id: raw.id, method: raw.method, path: raw.path,
        headers: raw.headers ?? {},
        body: raw.body ? fromBase64(raw.body) : new Uint8Array(0),
      },
    }
  }
  const { meta, body } = decodeFrame(data)
  return {
    binary: true,
    request: {
      id: meta.id ?? '', method: meta.method ?? 'GET', path: meta.path ?? '/',
      headers: meta.headers ?? {}, body,
    },
  }
}

type ProxyResult = { status: number; headers: Record<string, string[]>; body: Uint8Array }

async function proxyToLocal(port: number, request: WireRequest, localHeaders: Record<string, string>): Promise<ProxyResult> {
  if (window.portshare?.localRequest) {
    const result = await window.portshare.localRequest({
      port,
      method: request.method,
      path: request.path,
      headers: localHeaders,
      body: request.body.byteLength ? request.body : undefined,
    })
    const body = result.body instanceof Uint8Array ? result.body : new Uint8Array(result.body)
    return { status: result.status, headers: result.headers, body }
  }

  const response = await fetch(`http://127.0.0.1:${port}${request.path}`, {
    method: request.method,
    headers: localHeaders,
    body: request.method === 'GET' || request.method === 'HEAD' || !request.body.byteLength
      ? undefined
      : new Blob([request.body.slice()]),
  })
  const responseBody = new Uint8Array(await response.arrayBuffer())
  const headers: Record<string, string[]> = {}
  response.headers.forEach((value, name) => { headers[name] = [value] })
  return { status: response.status, headers, body: responseBody }
}

export function createTunnelConnection({ apiBaseUrl, clientId, tunnelId, tunnelType, portRef, onStateChange, onLogEntry, routesRef }: CreateTunnelArgs) {
  const protocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws'
  const tunnelParam = tunnelId ? `&tunnelId=${encodeURIComponent(tunnelId)}` : ''
  // proto=3 signals Yamux over WebSocket
  const tunnelUrl = `${protocol}://${new URL(apiBaseUrl).host}/tunnel/connect?clientId=${encodeURIComponent(clientId)}${tunnelParam}&proto=3`

  if (window.portshare?.startTunnel) {
    window.portshare?.onTunnelState?.((state: ConnectionState, msg?: string) => {
      onStateChange(state, msg)
    })
    
    window.portshare?.onLogEntry?.((entry: RequestLogEntry) => {
      onLogEntry(entry)
    })
    
    window.portshare.startTunnel({
      tunnelUrl,
      tunnelType,
      port: portRef.current ?? 3000
    })
    
    return {
      close: () => {
        window.portshare?.stopTunnel?.()
      }
    }
  }

  // Fallback if not running in Electron
  return {
    close: () => {}
  }
}
