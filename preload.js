const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('projectAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProject: (payload) => ipcRenderer.invoke('save-project', payload),
  updateProject: (payload) => ipcRenderer.invoke('update-project', payload),
  
  getFilePath: (file) => {
    if (webUtils && typeof webUtils.getPathForFile === 'function') {
      return webUtils.getPathForFile(file);
    }
    return file.path || null;
  },
});