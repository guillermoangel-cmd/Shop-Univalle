import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';

const rootDir = process.cwd();
const composeMongoHosts = new Set([
  'catalog-mongo',
  'user-mongo',
  'orders-mongo',
]);

function getLocalMongoUri(configuredUri, fallbackUri) {
  const uri = configuredUri || fallbackUri;
  const parsedUri = new URL(uri);
  if (composeMongoHosts.has(parsedUri.hostname)) {
    parsedUri.hostname = '127.0.0.1';
  }
  return parsedUri.toString();
}

function canConnectToLocalMongo(uri) {
  const { hostname, port } = new URL(uri);
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return Promise.resolve(true);
  }

  return new Promise((resolveConnection) => {
    const socket = createConnection({
      host: hostname,
      port: Number(port) || 27017,
    });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolveConnection(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolveConnection(false);
    });
    socket.once('error', () => resolveConnection(false));
  });
}

function loadDotEnv() {
  const envPath = resolve(rootDir, '.env');
  const parsed = {};
  if (!existsSync(envPath)) return parsed;

  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    parsed[key] = val;
  }
  return parsed;
}

const fileEnv = loadDotEnv();
const baseEnv = {
  ...process.env,
  ...fileEnv,
  JWT_SECRET:
    process.env.JWT_SECRET ||
    fileEnv.JWT_SECRET ||
    'univalle-shop-dev-jwt-secret-2026-super-seguro',
};

const services = [
  {
    name: 'CATALOG',
    color: '\x1b[36m', // Cyan
    cwd: resolve(rootDir, 'services/catalog-service'),
    command: 'npm',
    args: ['run', 'start:dev'],
    env: {
      ...baseEnv,
      PORT: '3002',
      MONGODB_URI: getLocalMongoUri(
        baseEnv.CATALOG_MONGODB_URI,
        'mongodb://127.0.0.1:27017/univalle-catalog',
      ),
    },
  },
  {
    name: 'USERS  ',
    color: '\x1b[32m', // Green
    cwd: resolve(rootDir, 'services/user-service'),
    command: 'npm',
    args: ['run', 'start:dev'],
    env: {
      ...baseEnv,
      PORT: '3003',
      MONGODB_URI: getLocalMongoUri(
        baseEnv.USER_MONGODB_URI,
        'mongodb://127.0.0.1:27017/univalle_users',
      ),
    },
  },
  {
    name: 'ORDERS ',
    color: '\x1b[35m', // Magenta
    cwd: resolve(rootDir, 'services/orders-service'),
    command: 'npm',
    args: ['run', 'start:dev'],
    env: {
      ...baseEnv,
      PORT: '3004',
      MONGODB_URI: getLocalMongoUri(
        baseEnv.ORDERS_MONGODB_URI,
        'mongodb://127.0.0.1:27017/univalle_orders',
      ),
    },
  },
  {
    name: 'GATEWAY',
    color: '\x1b[33m', // Yellow
    cwd: resolve(rootDir, 'api-gateway'),
    command: 'npm',
    args: ['run', 'start:dev'],
    env: {
      ...baseEnv,
      PORT: '3000',
      CATALOG_SERVICE_URL: 'http://localhost:3002',
      USER_SERVICE_URL: 'http://localhost:3003',
      ORDERS_SERVICE_URL: 'http://localhost:3004',
    },
  },
  {
    name: 'FRONT  ',
    color: '\x1b[34m', // Blue
    cwd: resolve(rootDir, 'frontend'),
    command: 'npm',
    args: ['run', 'dev'],
    env: {
      ...baseEnv,
      VITE_API_GATEWAY_URL: 'http://localhost:3000',
    },
  },
];

const resetColor = '\x1b[0m';
const children = [];
let isShuttingDown = false;

console.log('\n========================================================');
console.log(' 🚀 Iniciando Univalle Shop (Todos los servicios en 1 terminal)');
console.log('--------------------------------------------------------');
console.log(' • Frontend (React/Vite) : http://localhost:5173');
console.log(' • Vista Carrito directa : http://localhost:5173/cart');
console.log(' • API Gateway           : http://localhost:3000');
console.log(' • Catalog Service       : http://localhost:3002');
console.log(' • User Service          : http://localhost:3003');
console.log(' • Orders Service        : http://localhost:3004');
console.log('========================================================\n');

const mongoServices = services.filter((service) => service.env.MONGODB_URI);
const unavailableMongoServices = (
  await Promise.all(
    mongoServices.map(async (service) => ({
      service,
      available: await canConnectToLocalMongo(service.env.MONGODB_URI),
    })),
  )
)
  .filter(({ available }) => !available)
  .map(({ service }) => service);

if (unavailableMongoServices.length > 0) {
  const unavailableEndpoints = unavailableMongoServices.map((service) => {
    const { hostname, port } = new URL(service.env.MONGODB_URI);
    return `${service.name.trim()} (${hostname}:${port || 27017})`;
  });
  console.error(
    `MongoDB no responde para: ${unavailableEndpoints.join(', ')}. Inícialo o revisa la configuración antes de ejecutar este comando.`,
  );
  console.error('  docker run --rm --name univalle-users-mongo -p 27017:27017 mongo:8');
  process.exit(1);
}

function prefixLines(tag, color, stream, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) {
        target.write(`${color}[${tag}]${resetColor} ${line}\n`);
      }
    }
  });
}

function launchService(svc) {
  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    env: svc.env,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  prefixLines(svc.name, svc.color, child.stdout, process.stdout);
  prefixLines(svc.name, svc.color, child.stderr, process.stderr);

  child.on('exit', (code) => {
    if (!isShuttingDown && code !== null && code !== 0) {
      console.error(
        `${svc.color}[${svc.name}]${resetColor} finalizó con código ${code}. Reiniciando automáticamente en 1.5s...`,
      );
      setTimeout(() => {
        if (!isShuttingDown) {
          launchService(svc);
        }
      }, 1500);
    }
  });

  children.push(child);
}

for (const svc of services) {
  launchService(svc);
}

function shutdown() {
  isShuttingDown = true;
  console.log('\n🛑 Deteniendo todos los servicios de Univalle Shop...');
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
