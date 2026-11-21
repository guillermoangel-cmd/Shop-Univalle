import { execSync } from 'node:child_process';

const TARGET_PORTS = new Set(['3000', '3002', '3003', '3004', '5173']);

function freePortsWindows() {
  const output = execSync('netstat -ano -p TCP', { encoding: 'utf8' });
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.includes('LISTENING')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;
    const localAddr = parts[1];
    const pid = parts[parts.length - 1];
    const port = localAddr.split(':').pop();
    if (port && TARGET_PORTS.has(port) && /^\d+$/.test(pid) && pid !== '0') {
      pids.add(pid);
    }
  }

  if (pids.size === 0) {
    console.log('✅ Todos los puertos (3000, 3002, 3003, 3004, 5173) están libres.');
    return;
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      console.log(`🧹 Proceso huérfano PID ${pid} detenido.`);
    } catch {
      console.warn(`⚠️ No se pudo detener el PID ${pid} (puede requerir cerrar la terminal donde corre).`);
    }
  }
}

if (process.platform === 'win32') {
  freePortsWindows();
} else {
  console.log('Este script automático está optimizado para Windows.');
}

