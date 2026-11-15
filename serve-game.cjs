const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const { stat } = require('node:fs/promises');
const { extname, resolve, sep } = require('node:path');
const { execFile } = require('node:child_process');

const host = '127.0.0.1';
const port = Number(process.env.INDIA_FUTURES_PORT ?? 4173);
const address = `http://${host}:${port}`;
const root = resolve(__dirname, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const open = process.argv.includes('--open');

function openBrowser() {
  execFile('explorer.exe', [address], { windowsHide: true });
}

async function serve(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let filename;
  try {
    const path = decodeURIComponent(new URL(request.url, address).pathname);
    filename = resolve(root, path === '/' ? 'index.html' : `.${path}`);
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (!filename.startsWith(root + sep) || !types[extname(filename)]) {
    response.writeHead(404).end();
    return;
  }
  const info = await stat(filename).catch(() => null);
  if (!info?.isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': types[extname(filename)], 'Content-Length': info.size,
    'Cache-Control': filename.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'X-Game': 'india-alternate-futures', 'X-Content-Type-Options': 'nosniff' });
  if (request.method === 'HEAD') response.end();
  else createReadStream(filename).on('error', () => response.destroy()).pipe(response);
}

async function main() {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error('Set INDIA_FUTURES_PORT to a port between 1024 and 65535.');
    process.exitCode = 1;
    return;
  }
  const build = await stat(resolve(root, 'index.html')).catch(() => null);
  if (!build?.isFile()) {
    console.error('Game build is missing. Run npm ci and npm run build first.');
    process.exitCode = 1;
    return;
  }
  const server = createServer(serve);
  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE' && open) {
      const existing = await fetch(address, { method: 'HEAD', signal: AbortSignal.timeout(1500) }).catch(() => null);
      if (existing?.headers.get('x-game') === 'india-alternate-futures') {
        openBrowser();
        return;
      }
    }
    console.error(`Could not start the game at ${address}. ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    console.log(`India: Alternate Futures is running at ${address}. Keep this window open while playing.`);
    if (open) openBrowser();
  });
}

void main();
