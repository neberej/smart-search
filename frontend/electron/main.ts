import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // remove default OS chrome
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Hide top menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load React production build
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));

  // Open dev tool
  mainWindow.webContents.openDevTools();

  // Handle close from React
  ipcMain.on('app/close', () => {
    mainWindow?.close();
  });
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
console.log("Electron main started");
