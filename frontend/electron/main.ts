import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend, killPort } from './backendLauncher';

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 800, height: 500,
    frame: false, center: true, show: false,
    title: 'SmartSearch',
    icon: path.join(__dirname, '../build/icon.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  await mainWindow.loadFile(path.join(app.getAppPath(), 'build', 'index.html'));

  // register global shortcut (CmdOrCtrl+Space)
  globalShortcut.register('CommandOrControl+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  ipcMain.on('app/close', () => {
    stopBackend();
    mainWindow?.close();
    app.quit();
  });

  ipcMain.on('resize-window', (_e, height: number) => {
    if (mainWindow) {
      const [width] = mainWindow.getSize();
      mainWindow.setSize(width, height, true);
    }
  });
};

app.whenReady().then(() => {
  killPort(8001);
  killPort(3000);
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
