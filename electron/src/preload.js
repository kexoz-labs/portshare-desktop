const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('portshare', {
  localRequest: (payload) => ipcRenderer.invoke('portshare:local-request', payload),
  checkPort: (port) => ipcRenderer.invoke('portshare:check-port', port),
  notify: (payload) => ipcRenderer.invoke('portshare:notify', payload),
});
