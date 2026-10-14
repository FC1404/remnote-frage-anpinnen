const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = { '.json': 'application/json', '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.zip': 'application/zip', '.md': 'text/plain' };
if (!fs.existsSync(path.join(root, 'manifest.json'))) {
  console.error('Bitte zuerst npm run build ausführen.');
  process.exit(1);
}
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'baggage, sentry-trace');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { res.writeHead(400); res.end(); return; }
  // Only serve files at the build root, never notes, source folders or parent paths.
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || !types[path.extname(name)]) { res.writeHead(404); res.end(); return; }
  fs.readFile(path.join(root, name), (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', types[path.extname(name)] + (name.endsWith('.zip') ? '' : '; charset=utf-8'));
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? 'Port 8080 ist bereits belegt. Falls das Plugin schon läuft, nutze http://localhost:8080 in RemNote.' : error.message);
  process.exitCode = 1;
});
server.listen(8080, '127.0.0.1', () => console.log('Frage anpinnen bereit: http://localhost:8080 — Fenster geöffnet lassen.'));
