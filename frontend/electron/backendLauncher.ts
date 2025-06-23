import { spawn } from 'child_process';
import { app } from 'electron';
import path from 'path';

export function launchBackend() {
  let exePath = path.join(process.resourcesPath, 'backend', 'smartsearch-backend', 'smartsearch-backend');
  if (process.platform === 'win32') {
    exePath += '.exe';
  }

  const backendProcess = spawn(exePath, [], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  return backendProcess;
}