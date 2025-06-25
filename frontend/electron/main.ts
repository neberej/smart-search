import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend, killPort } from './backendLauncher';

let mainWindow: BrowserWindow | null = null;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    frame: false,
    center: true,
    title: 'SmartSearch',
    icon: path.join(__dirname, '../build/icon.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);

  const indexHtmlPath = path.join(app.getAppPath(), 'build', 'index.html');
  await mainWindow.loadFile(indexHtmlPath);
  mainWindow.show();

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on('app/close', () => {
    stopBackend();
    mainWindow?.close();
    app.quit();
  });

  ipcMain.on('resize-window', (_event, height: number) => {
    if (mainWindow) {
      const [width] = mainWindow.getSize();
      mainWindow.setSize(width, height, true);
    }
  });
};

app.whenReady().then(() => {
  // Ensure clean port state
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
