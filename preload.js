const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startMiningWithThreads: (threads) => ipcRenderer.send('start-mining-with-threads', threads), 
  toggleSharing: (state) => ipcRenderer.invoke('toggle-sharing', state),
  registerUser: (email, password) => ipcRenderer.invoke('register-user', email, password), 
  openDashboard: () => ipcRenderer.invoke('open-dashboard'), 
  onSharingStatus: (callback) => ipcRenderer.on('sharing-status', (_, status) => callback(status)),
  onMinerLog: (callback) => ipcRenderer.on('miner-log', (_, log) => callback(log)),
  onMinerError: (callback) => ipcRenderer.on('miner-error', (_, error) => callback(error)),
  storeEmail: (email) => ipcRenderer.invoke('store-email', email)
});