const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('portshare', {
  localRequest: (payload) => ipcRenderer.invoke('portshare:local-request', payload),
  checkPort: (port) => ipcRenderer.invoke('portshare:check-port', port),
  notify: (payload) => ipcRenderer.invoke('portshare:notify', payload),
  startTunnel: (config) => ipcRenderer.invoke('portshare:start-tunnel', config),
  stopTunnel: () => ipcRenderer.invoke('portshare:stop-tunnel'),
  updateTray: (tunnels) => ipcRenderer.invoke('portshare:update-tray', tunnels),
  setAutoStart: (enabled) => ipcRenderer.invoke('portshare:set-autostart', enabled),
  onTunnelState: (callback) => {
    ipcRenderer.on('portshare:tunnel-state', (_event, state, msg) => callback(state, msg));
  },
  onLogEntry: (callback) => {
    ipcRenderer.on('portshare:tunnel-log', (_event, entry) => callback(entry));
  }
});
