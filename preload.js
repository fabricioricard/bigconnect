const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startMiningWithThreads: (threads) => ipcRenderer.invoke('start-mining', threads),
  toggleSharing: (state) => ipcRenderer.invoke('toggle-sharing', state),
  registerUser: (email, password) => ipcRenderer.invoke('register-user', { email, password }),
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  onSharingStatus: (callback) => ipcRenderer.on('sharing-status', (event, status) => callback(status)),
  onMinerLog: (callback) => ipcRenderer.on('miner-log', (event, log) => callback(log)),
  onMinerError: (callback) => ipcRenderer.on('miner-error', (event, error) => callback(error))
});