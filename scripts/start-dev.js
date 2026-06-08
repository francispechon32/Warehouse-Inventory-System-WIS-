/* eslint-disable no-undef */
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const root = path.resolve();
const portFile = path.join(root, 'server', 'port.txt');
const backendScript = path.join(root, 'server', 'index.js');

function startProcess(command, args, options = {}) {
  const useShell = command !== process.execPath;
  const proc = spawn(command, args, { stdio: 'inherit', shell: useShell, ...options });
  proc.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
  return proc;
}

async function waitForPortFile(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fs.access(portFile);
      const content = (await fs.readFile(portFile, 'utf-8')).trim();
      if (content) return content;
    } catch {
      // ignore, retry
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${portFile}`);
}

async function main() {
  const backend = startProcess(process.execPath, [backendScript], { env: process.env });

  try {
    const port = await waitForPortFile();
    console.log(`Backend port detected: ${port}`);
  } catch (err) {
    console.error(err.message);
    backend.kill();
    process.exit(1);
  }

  const vite = startProcess('npm', ['run', 'dev:frontend'], { env: process.env });

  const cleanup = () => {
    backend.kill();
    vite.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});