const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const port = 8787;
const types = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

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
