import { type RequestLogEntry, type ConnectionState } from './api'

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

export function createTunnelConnection({ apiBaseUrl, clientId, tunnelId, tunnelType, portRef, onStateChange, onLogEntry }: CreateTunnelArgs) {
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
    } as unknown)
    
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
