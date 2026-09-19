const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8888;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Load Vercel rewrites for local parity
let rewrites = [];
try {
  const vercelCfg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'vercel.json'), 'utf8'));
  if (Array.isArray(vercelCfg.rewrites)) {
    rewrites = vercelCfg.rewrites;
  }
} catch (e) {}

function matchRewrite(reqPath) {
  for (const r of rewrites) {
    if (r.source === reqPath) {
      return r.destination;
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Check API route with Vercel rewrites support
  let targetApiPath = reqPath;
  const rewritten = matchRewrite(reqPath);
  if (rewritten) {
    targetApiPath = rewritten;
  }

  if (targetApiPath.startsWith('/api/')) {
    let apiFile = path.join(ROOT_DIR, targetApiPath + '.js');
    if (!fs.existsSync(apiFile)) {
      apiFile = path.join(ROOT_DIR, targetApiPath);
    }
    if (fs.existsSync(apiFile) && fs.statSync(apiFile).isFile()) {
      try {
        const handler = require(apiFile);
        let bodyBuffer = [];
        req.on('data', chunk => bodyBuffer.push(chunk));
        req.on('end', async () => {
          const rawBody = Buffer.concat(bodyBuffer).toString('utf8');
          if (rawBody) {
            try { req.body = JSON.parse(rawBody); } catch (e) { req.body = rawBody; }
          } else {
            req.body = {};
          }

          // Mock Vercel response methods
          res.status = function (code) {
            res.statusCode = code;
            return res;
          };
          res.json = function (data) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
            return res;
          };

          try {
            await (typeof handler === 'function' ? handler(req, res) : (handler.default ? handler.default(req, res) : res.status(500).json({ error: 'Handler not callable' })));
          } catch (handlerErr) {
            console.error('API execution error:', handlerErr);
            if (!res.headersSent) {
              res.status(500).json({ error: handlerErr.message });
            }
          }
        });
        return;
      } catch (modErr) {
        console.error('API require error:', modErr);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: modErr.message }));
        return;
      }
    }
  }

  const filePath = path.join(ROOT_DIR, decodeURIComponent(reqPath));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🚀 OurGoal Preview Server running at http://localhost:' + PORT);
  console.log('====================================================');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
