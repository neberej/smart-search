// main.ts
import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs'; // Added for icon path validation
import { startBackend, stopBackend, killPort, logToFile } from './backendLauncher';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
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

  // Quit (from React close button or system tray)
  ipcMain.on('app/close', () => {
    shouldQuit = true;
    stopBackend();
    mainWindow?.close(); // This time, `close` event will NOT prevent
    app.quit();
  });

  // Restart the app (from Settings page)
  ipcMain.on('app/restart', () => {
    stopBackend();
    app.relaunch();
    app.exit(0);
  });

  // Resize window (e.g. when opening Settings page)
  ipcMain.on('resize-window', (_e, height: number) => {
    if (mainWindow) {
      const [width] = mainWindow.getSize();
      mainWindow.setSize(width, height, true);
    }
  });
};

const createTray = () => {
  try {
    const iconPath = path.join(__dirname, '../build/icon.png');
    if (!fs.existsSync(iconPath)) {
      logToFile(`[Electron] Tray icon not found at: ${iconPath}`);
      throw new Error('Tray icon missing');
    }
    tray = new Tray(iconPath);
    logToFile(`[Electron] Tray clicked - ${iconPath}`);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: async () => {
          logToFile('[Electron] Tray Quit clicked'); // Minimal log for debugging
          shouldQuit = true;
          try {
            await stopBackend();
          } catch (error) {
            logToFile(`[Electron] Failed to stop backend: ${error}`);
          }
          if (tray) {
            tray.destroy();
            tray = null;
          }
          app.quit();
          // Fallback to ensure quit
          setTimeout(() => {
            logToFile('[Electron] app.quit() failed, forcing exit');
            app.exit(0);
          }, 1000);
        },
      },
    ]);
    logToFile('[Electron] Tray ready');
    tray.setToolTip('SmartSearch');
    tray.setContextMenu(contextMenu);
    logToFile('[Electron] Tray ready');
    // On macOS, clicking the tray icon can toggle the app
    tray.on('click', () => {
      logToFile('[Electron] Tray clicked');
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (error) {
    logToFile(`[Electron] Failed to create tray: ${error}`);
  }
};

app.whenReady().then(() => {
  killPort(8001);
  killPort(3000);
  startBackend();
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy(); // Clean up tray icon
    tray = null;
  }
});