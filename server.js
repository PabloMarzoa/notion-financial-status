const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const STATIC_DIR = path.join(__dirname, 'dist', 'finanzas', 'browser');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version, x-requested-with');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Notion API Reverse Proxy
  if (req.url.startsWith('/api/notion/')) {
    const notionPath = req.url.replace('/api/notion/', '/v1/');

    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const postData = Buffer.concat(body);

      const options = {
        hostname: 'api.notion.com',
        port: 443,
        path: notionPath,
        method: req.method,
        headers: {
          'Authorization': req.headers['authorization'] || '',
          'Notion-Version': req.headers['notion-version'] || '2022-06-28',
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const notionReq = https.request(options, (notionRes) => {
        const responseHeaders = { ...notionRes.headers };
        responseHeaders['access-control-allow-origin'] = '*';
        responseHeaders['access-control-allow-methods'] = 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
        responseHeaders['access-control-allow-headers'] = 'Content-Type, Authorization, Notion-Version, x-requested-with';

        res.writeHead(notionRes.statusCode, responseHeaders);
        notionRes.pipe(res);
      });

      notionReq.on('error', (err) => {
        console.error('Notion Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: err.message }));
      });

      notionReq.write(postData);
      notionReq.end();
    });
    return;
  }

  // 2. Static File Serving (Angular SPA)
  if (req.method === 'GET' || req.method === 'HEAD') {
    let cleanUrl = req.url.split('?')[0];
    let filePath = path.join(STATIC_DIR, cleanUrl);

    // If directory or root, serve index.html
    if (cleanUrl === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(STATIC_DIR, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileStream = fs.createReadStream(filePath);
      
      res.writeHead(200, { 'Content-Type': contentType });
      fileStream.pipe(res);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Financial Status app server running on http://0.0.0.0:${PORT}`);
});
