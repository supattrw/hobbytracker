const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('projectAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (payload) => ipcRenderer.invoke('save-project', payload),
  updateProject: (payload) => ipcRenderer.invoke('update-project', payload),
});