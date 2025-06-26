import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend, killPort } from './backendLauncher';

let mainWindow: BrowserWindow | null = null;
let shouldQuit = false;

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 165,
    frame: false,
    center: true,
    show: true,
    skipTaskbar: false,
    title: 'SmartSearch',
    icon: path.join(__dirname, '../build/icon.icns'),
    transparent: true,
    opacity: 0.95,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  await mainWindow.loadFile(path.join(app.getAppPath(), 'build', 'index.html'));

  // Handles Ctrl+W or native close
  mainWindow.on('close', (e) => {
    if (!shouldQuit) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  // Global shortcut: Ctrl+Space to toggle
  globalShortcut.register('CommandOrControl+Space', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      const [width] = mainWindow.getSize();
      mainWindow.setSize(width, 165, true);
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      mainWindow.show();
      mainWindow.focus();

      setTimeout(() => {
        mainWindow?.setVisibleOnAllWorkspaces(false);
      }, 100);

      mainWindow.webContents.send('reset-search');
    }
  });

  // Hide (minimize) the window
  ipcMain.on('app/minimize', () => {
    mainWindow?.hide();
  });

  // Quit (from React close button)
  ipcMain.on('app/close', () => {
    shouldQuit = true;
    stopBackend();
    mainWindow?.close(); // This time, `close` event will NOT prevent
    app.quit();
  });

  // Resize window (e.g. when opening Settings page)
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
