import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If the backend writes its active port to server/port.txt, use it for proxying.
let backendTarget = 'http://localhost:4000';
try {
  const portFile = path.join(__dirname, 'server', 'port.txt');
  if (fs.existsSync(portFile)) {
    const p = fs.readFileSync(portFile, 'utf-8').trim();
    if (p) backendTarget = `http://localhost:${p}`;
  }
} catch {
  // fallback to default
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
