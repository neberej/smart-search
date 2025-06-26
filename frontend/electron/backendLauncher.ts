import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import path from 'path';
import { app } from 'electron';
import net from 'net';

let backendProcess: ChildProcess | null = null;

// Log to /tmp/smartsearch.log (accessible location)
const logFile = '/tmp/smartsearch.log';
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log to both console and file
function logToFile(message: string) {
  const timestampedMessage = `${new Date().toISOString()} ${message}\n`;
  logStream.write(timestampedMessage);
  console.log(message);
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
  const PORT = 8001;
  // Point to the actual binary inside the smartsearch-backend directory
  const backendDir = path.join(process.resourcesPath, 'backend', 'smartsearch-backend');
  let exePath = path.join(backendDir, 'smartsearch-backend'); // Binary is likely here
  if (process.platform === 'win32') {
    exePath += '.exe';
  }

  // Verify binary exists and is executable
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

  // Set executable permissions
  try {
    fs.chmodSync(exePath, 0o755);
    logToFile(`[Electron] Set execute permissions on backend binary: ${exePath}`);
  } catch (e: unknown) {
    const error = e as NodeJS.ErrnoException;
    logToFile(`[Electron] Failed to set permissions on backend binary: ${error.message || 'Unknown error'}`);
  }

  logToFile(`[Electron] Launching backend from: ${exePath}`);

  // Set environment for PyInstaller bundle
  const env = {
    ...process.env,
    PYTHONPATH: backendDir // Point to backend directory for .dylib files
  };

  backendProcess = spawn(exePath, [], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    cwd: backendDir // Set working directory to backend folder
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
  });
}

export function stopBackend() {
  if (backendProcess) {
    logToFile('[Electron] Stopping backend process...');
    backendProcess.kill();
    backendProcess = null;
  }
}