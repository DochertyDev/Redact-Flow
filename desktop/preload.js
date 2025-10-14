const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  getBackendPort: () => ipcRenderer.invoke('get-backend-port'),
  onBackendPort: (callback) => ipcRenderer.on('backend-port', (event, port) => callback(port))
});
