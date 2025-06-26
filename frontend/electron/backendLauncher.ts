// backendLauncher.ts
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';
import { app } from 'electron';
import net from 'net';

// Log to /tmp/smartsearch.log (accessible location)
const logFile = '/tmp/smartsearch.log';
let logStream = fs.createWriteStream(logFile, { flags: 'a' });
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const LOG_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

let backendProcess: ChildProcess | null = null;

// Export logToFile for use in main.ts
export function logToFile(message: string) {
  // Check log file size
  try {
    const stats = fs.statSync(logFile);
    if (stats.size > MAX_LOG_SIZE) {
      logStream.end();
      const backupFile = `${logFile}.${Date.now()}`;
      fs.renameSync(logFile, backupFile);
      fs.writeFileSync(logFile, '');
      logStream = fs.createWriteStream(logFile, { flags: 'a' });
      logToFile(`[Electron] Log file rotated to ${backupFile}`);
    }
  } catch (error) {
    console.error(`Failed to check/rotate log file: ${error}`);
  }

  const timestampedMessage = `${new Date().toISOString()} ${message}\n`;
  logStream.write(timestampedMessage);
  console.log(message);
}

// Clean up old log files on startup
function cleanupLogFile() {
  try {
    // Check main log file age
    const stats = fs.statSync(logFile);
    const now = Date.now();
    if (now - stats.mtimeMs > LOG_RETENTION_MS) {
      logStream.end();
      fs.unlinkSync(logFile);
      fs.writeFileSync(logFile, '');
      logStream = fs.createWriteStream(logFile, { flags: 'a' });
      logToFile('[Electron] Log file cleared due to age');
    }

    // Clean up rotated logs (smartsearch.log.*)
    const tmpDir = path.dirname(logFile);
    const files = fs.readdirSync(tmpDir);
    const rotatedLogs = files.filter((file) => file.startsWith('smartsearch.log.') && !isNaN(Number(file.split('.').pop())));
    for (const file of rotatedLogs) {
      const filePath = path.join(tmpDir, file);
      const fileStats = fs.statSync(filePath);
      if (now - fileStats.mtimeMs > LOG_RETENTION_MS) {
        fs.unlinkSync(filePath);
        logToFile(`[Electron] Deleted old rotated log: ${filePath}`);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      fs.writeFileSync(logFile, '');
      logStream = fs.createWriteStream(logFile, { flags: 'a' });
    } else {
      console.error(`Failed to clean up log file: ${error}`);
    }
  }
}

export function killPort(port: number) {
  try {
    const result = execSync(`lsof -ti tcp:${port}`).toString().split('\n').filter(Boolean);

    for (const pid of result) {
      const cmd = execSync(`ps -p ${pid} -o command=`).toString().trim();

      if (/smartsearch-backend|electron/i.test(cmd)) {
        logToFile(`[Electron] Killing PID ${pid} using port ${port}: ${cmd}`);
        process.kill(parseInt(pid), 'SIGKILL');
      } else {
        logToFile(`[Electron] Skipping PID ${pid} using port ${port}: ${cmd}`);
      }
    }
  } catch (err: any) {
    logToFile(`[Electron] No process to kill on port ${port}: ${err.message}`);
  }
}

export function startBackend() {
  cleanupLogFile(); // Clean up log files on startup

  const PORT = 8001;
  const backendDir = path.join(process.resourcesPath, 'backend', 'smartsearch-backend');
  let exePath = path.join(backendDir, 'smartsearch-backend');
  if (process.platform === 'win32') {
    exePath += '.exe';
  }

  if (!fs.existsSync(exePath)) {
    logToFile(`[Electron] Backend binary not found at: ${exePath}`);
    throw new Error(`Backend binary missing`);
  }
  try {
    fs.accessSync(exePath, fs.constants.X_OK);
    logToFile(`[Electron] Backend binary is executable: ${exePath}`);
  } catch (e: unknown) {
    const error = e as NodeJS.ErrnoException;
    logToFile(`[Electron] Backend binary not executable: ${error.message || 'Unknown error'}`);
    throw error;
  }

  try {
    fs.chmodSync(exePath, 0o755);
    logToFile(`[Electron] Set execute permissions on backend binary: ${exePath}`);
  } catch (e: unknown) {
    const error = e as NodeJS.ErrnoException;
    logToFile(`[Electron] Failed to set permissions on backend binary: ${error.message || 'Unknown error'}`);
  }

  logToFile(`[Electron] Launching backend from: ${exePath}`);

  const env = {
    ...process.env,
    PYTHONPATH: backendDir,
  };

  backendProcess = spawn(exePath, [], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    cwd: backendDir,
  });

  backendProcess.on('error', (err: NodeJS.ErrnoException) => {
    logToFile(`[Electron] Spawn error: ${err.message}`);
    if (err.code) logToFile(`[Electron] Error code: ${err.code}`);
    if (err.stack) logToFile(`[Electron] Error stack: ${err.stack}`);
  });

  backendProcess.stdout?.on('data', (data) => {
    logToFile(`[Backend stdout]: ${data.toString().trim()}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    logToFile(`[Backend stderr]: ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    logToFile(`[Electron] Backend exited with code: ${code}`);
    backendProcess = null;
  });
}

export async function stopBackend(): Promise<void> {
  if (!backendProcess) {
    logToFile('[Electron] No backend process to stop');
    return;
  }

  return new Promise((resolve, reject) => {
    logToFile(`[Electron] Stopping backend process (PID: ${backendProcess?.pid})`);

    backendProcess?.on('close', (code) => {
      logToFile(`[Electron] Backend process (PID: ${backendProcess?.pid}) exited with code: ${code}`);
      backendProcess = null;
      resolve();
    });

    backendProcess?.on('error', (err) => {
      logToFile(`[Electron] Error stopping backend process: ${err.message}`);
      backendProcess = null;
      reject(err);
    });

    backendProcess?.kill('SIGTERM');

    setTimeout(() => {
      if (backendProcess && backendProcess.pid) {
        logToFile(`[Electron] Backend process (PID: ${backendProcess.pid}) did not exit, sending SIGKILL`);
        backendProcess.kill('SIGKILL');
      }
    }, 2000);
  });
}