const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  closeApp: () => ipcRenderer.send('app/close'),
  ipcRenderer: {
    send: (channel: string, data?: any) => {
      ipcRenderer.send(channel, data);
    },
  },
});
