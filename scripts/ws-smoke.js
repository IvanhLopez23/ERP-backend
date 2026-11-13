/**
 * Smoke test de integración del chat por WebSocket.
 *
 * Requisitos:
 *   - Base de datos migrada y semilla aplicada.
 *   - `pnpm build` ejecutado previamente (usa dist/main.js).
 *   - Puerto 9000 libre.
 *
 * Uso:
 *   pnpm ws:smoke
 */

const { spawn, execSync } = require('child_process');
const { io } = require('socket.io-client');

const BASE = 'http://localhost:9000';
const API = `${BASE}/api`;
const CREDENCIALES = { nombreUsuario: 'admin', contrasena: '1234' };

const child = spawn(process.execPath, ['dist/main.js'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

const logs = [];
let exited = false;
child.on('exit', () => {
  exited = true;
});
child.stdout.on('data', (data) => logs.push(data.toString()));
child.stderr.on('data', (data) => logs.push(data.toString()));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitReady(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (exited) return false;
    try {
      const res = await fetch(`${BASE}/api/docs`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.status < 500) return true;
    } catch {
      // Aún no escucha.
    }
    await sleep(1000);
  }
  return false;
}

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

function waitForConnect(socket, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timeout esperando la conexión WebSocket')),
      timeoutMs,
    );
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(new Error(`connect_error: ${error?.message ?? error}`));
    });
  });
}

function waitForEvent(socket, evento, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(evento, handler);
      reject(new Error(`Timeout esperando el evento ${evento}`));
    }, timeoutMs);
    const handler = (payload) => {
      clearTimeout(timer);
      socket.off(evento, handler);
      resolve(payload);
    };
    socket.on(evento, handler);
  });
}

async function main() {
  console.log('1. Esperando arranque del servidor...');
  if (!(await waitReady())) {
    throw new Error(
      `El servidor no arrancó.\n${logs.join('').split('\n').slice(-40).join('\n')}`,
    );
  }

  console.log('2. Login...');
  const login = await api('POST', '/auth/login', { body: CREDENCIALES });
  if (login.status !== 201 || !login.json?.token) {
    throw new Error(`Login falló: ${login.status} ${JSON.stringify(login.json)}`);
  }

  console.log('3. Buscando una conversación...');
  const conversaciones = await api('GET', '/chat/conversaciones', {
    token: login.json.token,
  });
  const conversacion = Array.isArray(conversaciones.json)
    ? conversaciones.json[0]
    : undefined;
  if (!conversacion?.publicId) {
    throw new Error(
      `No hay conversaciones para probar. Ejecuta el seed de desarrollo.\n${JSON.stringify(conversaciones.json)}`,
    );
  }

  console.log('4. Solicitando ticket efímero...');
  const ticket = await api('POST', '/chat/ws-ticket', {
    token: login.json.token,
  });
  if (ticket.status !== 201 || !ticket.json?.token) {
    throw new Error(`Ticket falló: ${ticket.status} ${JSON.stringify(ticket.json)}`);
  }

  console.log('5. Conectando WebSocket...');
  const socket = io(BASE, {
    auth: { token: ticket.json.token },
    transports: ['websocket', 'polling'],
    reconnection: false,
  });

  try {
    await waitForConnect(socket);
    console.log('   Conexión OK');

    console.log('6. chat:join...');
    const joined = waitForEvent(socket, 'chat:joined');
    socket.emit('chat:join', {
      conversacionPublicId: conversacion.publicId,
    });
    const joinedPayload = await joined;
    if (joinedPayload.conversacionPublicId !== conversacion.publicId) {
      throw new Error('chat:joined devolvió una conversación distinta');
    }
    console.log('   chat:joined OK');

    console.log('7. chat:send...');
    const contenido = `smoke ${new Date().toISOString()}`;
    const mensaje = waitForEvent(socket, 'chat:mensaje');
    socket.emit('chat:send', {
      conversacionPublicId: conversacion.publicId,
      contenido,
    });
    const mensajePayload = await mensaje;
    if (mensajePayload.mensaje?.contenido !== contenido) {
      throw new Error('chat:mensaje no devolvió el contenido enviado');
    }
    console.log('   chat:mensaje OK');

    console.log('\n✅ Smoke test WebSocket completado correctamente.');
  } finally {
    socket.close();
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Smoke test falló:', error.message);
    console.error(logs.join('').split('\n').slice(-50).join('\n'));
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!exited) {
      child.kill();
      await sleep(1500);
      if (!exited) {
        try {
          execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
        } catch {
          // Ya terminó.
        }
      }
    }
  });
