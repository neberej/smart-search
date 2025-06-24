import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startBackend, stopBackend } from './backendLauncher';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function waitForBackendReady(url: string, maxAttempts = 10, interval = 1000): Promise<void> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const check = () => {
      fetch(url)
        .then((res) => {
          if (res.ok) resolve();
          else throw new Error(`Status ${res.status}`);
        })
        .catch(() => {
          if (++attempts >= maxAttempts) reject(new Error('Backend not responding'));
          else setTimeout(check, interval);
        });
    };

    check();
  });
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    title: 'SmartSearch',
    icon: path.join(__dirname, '../build/icon.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Hide initially while backend loads
  });

  mainWindow.setMenuBarVisibility(false);

  // Show loading screen
  const loadingHtml = path.join(app.getAppPath(), 'loading.html');
  if (fs.existsSync(loadingHtml)) {
    mainWindow.loadFile(loadingHtml);
    mainWindow.show();
  }

  try {
    console.log('[Electron] Waiting for backend...');
    await waitForBackendReady('http://localhost:8001/health');
    console.log('[Electron] Backend is ready.');
  } catch (err) {
    console.error('[Electron] Backend failed to start:', err);
    // Optionally show an error screen
    return;
  }

  const indexHtmlPath = path.join(app.getAppPath(), 'build', 'index.html');
  await mainWindow.loadFile(indexHtmlPath);
  mainWindow.show();

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  //mainWindow.webContents.openDevTools();

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
