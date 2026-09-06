const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
/* 포트: `PORT=8790 node scripts/static-server.js` 또는 `node scripts/static-server.js 8790` (구현 서브에이전트가 컨트롤타워의 8787과 별도로 띄울 수 있게) */
const port = Number(process.env.PORT || process.argv[2] || 8787);
const types = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

http.createServer(function(req, res){
  var urlPath = req.url.split('?')[0];
  if(urlPath === '/') urlPath = '/index.html';
  var filePath = path.join(root, decodeURIComponent(urlPath));
  fs.readFile(filePath, function(err, data){
    if(err){ res.writeHead(404); res.end('not found'); return; }
    var ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, function(){ console.log('listening on '+port); });
