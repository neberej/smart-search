import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend } from './backendLauncher';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    title: 'SmartSearch',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  //mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
  //mainWindow.loadFile(path.resolve(__dirname, 'build/index.html'));

  const indexHtmlPath = path.join(app.getAppPath(), 'build', 'index.html');
  mainWindow.loadFile(indexHtmlPath);

  mainWindow.webContents.openDevTools();

  ipcMain.on('app/close', () => {
    stopBackend();
    mainWindow?.close();
  });
  
};

app.whenReady().then(() => {
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
