const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  closeApp: () => ipcRenderer.send('app/close'),
  ipcRenderer: {
    send: (channel: string, data?: any) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      const handler = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    }
  },
});
