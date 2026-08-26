const http = require('http');
const https = require('https');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Configuración completa de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Notion-Version, x-requested-with');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Comprobar si la ruta es para Notion
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
        // Combinar cabeceras asegurando CORS en la respuesta de Notion
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
  } else {
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Notion Proxy Server listening on http://localhost:${PORT}`);
});
