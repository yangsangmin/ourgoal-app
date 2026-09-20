'use strict';
// 법정(court) — 스냅샷 디렉터리를 127.0.0.1 임의 포트로 서빙하는 최소 정적 서버. 의존성 없음.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

// denyPrefixes: 배포되지 않는 경로(scratch·docs·scripts·court 등)는 서빙하지 않는다 → 작업자가 만든 데모 페이지로 결과를 연출할 수 없다.
function start(rootDir, denyPrefixes) {
  const root = path.resolve(rootDir);
  const deny = (denyPrefixes || []).map(d => d.toLowerCase());
  const requests = [];
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]); } catch (_) { res.writeHead(400); return res.end('bad request'); }
    if (p.endsWith('/')) p += 'index.html';
    // 차단 검사는 "실제로 열릴 파일" 기준으로 한다. 요청 글자 그대로 검사하면 /./scratch/…, //scratch/…, /js/../scratch/…, 역슬래시 표기로 빠져나간다.
    const resolved = path.resolve(path.join(root, p.replace(/\\/g, '/')));
    const rel = '/' + path.relative(root, resolved).split(path.sep).join('/');
    if (deny.some(d => (rel.toLowerCase() + '/').startsWith(d) || rel.toLowerCase().startsWith(d))) { requests.push({ path: p, status: 404, denied: true }); res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('not served by court'); }
    const fp = resolved;
    const inside = fp === root || fp.startsWith(root + path.sep);
    let stat = null;
    if (inside) { try { stat = fs.statSync(fp); } catch (_) { stat = null; } }
    if (!inside || !stat || !stat.isFile()) {
      requests.push({ path: p, status: 404 });
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end('not found');
    }
    requests.push({ path: p, status: 200 });
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        port, url: 'http://127.0.0.1:' + port, root, requests,
        close: () => new Promise(r => { server.closeAllConnections && server.closeAllConnections(); server.close(() => r()); }),
      });
    });
  });
}

module.exports = { start, MIME };
