// global.d.ts or electron.d.ts
export {}; // make it a module

declare global {
  interface Window {
    electron?: {
      ipcRenderer: {
        send: (channel: string, data?: any) => void;
        // add other ipcRenderer methods you use here
      };
      // other exposed APIs if any
    };
  }
}
