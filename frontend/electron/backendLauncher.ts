import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { app } from 'electron';
import path from 'path';

let backendProcess: ChildProcessWithoutNullStreams | null = null;

export function startBackend() {
  if (backendProcess) {
    console.log('Backend already running.');
    return;
  }

  let exePath = path.join(
    process.resourcesPath,
    'backend',
    'smartsearch-backend',
    'smartsearch-backend'
  );

  if (process.platform === 'win32') {
    exePath += '.exe';
  }

  backendProcess = spawn(exePath, [], {
    stdio: 'pipe',
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
    backendProcess = null;
  });

  console.log('Backend process started.');
}

export function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
    console.log('Backend process killed.');
  } else {
    console.log('No backend process to kill.');
  }
}
