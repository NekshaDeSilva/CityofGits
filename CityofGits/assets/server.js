require('dotenv').config();
const fetch = require('node-fetch');

// AstraDB config from .env
const ASTRA_DB_ID = process.env.ASTRA_DB_ID;
const ASTRA_DB_KEYSPACE = process.env.ASTRA_DB_KEYSPACE;
const ASTRA_DB_API_ENDPOINT = process.env.ASTRA_DB_API_ENDPOINT;
const ASTRA_DB_APPLICATION_TOKEN = process.env.ASTRA_DB_APPLICATION_TOKEN;

const CHAT_COLLECTION = 'cityofgitsdatas';
const ASTRA_COLLECTION_URL = `${ASTRA_DB_API_ENDPOINT}/api/rest/v2/namespaces/${ASTRA_DB_KEYSPACE}/collections/${CHAT_COLLECTION}`;

console.log('ASTRA_COLLECTION_URL:', ASTRA_COLLECTION_URL);
console.log('ASTRA_DB_APPLICATION_TOKEN:', ASTRA_DB_APPLICATION_TOKEN ? 'set' : 'NOT SET');

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { parse } = require('querystring');

const PORT = 8080;
const ROOT_DIR = path.join(__dirname, 'CityofGits');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname;

    if (req.method === 'POST' && pathname === '/send') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const message = data.message;
                if (!message || typeof message !== 'string') {
                    res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ error: 'Invalid message format' }));
                    return;
                }

                const timestamp = new Date().toISOString();
                const payload = { message, timestamp };

                const response = await fetch(ASTRA_COLLECTION_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('POST /send failed:', errText);
                    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ error: 'Failed to store message', detail: errText }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (err) {
                console.error('POST /send error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

   if (req.method === 'GET' && pathname === '/latest') {
  (async () => {
    try {
      const response = await fetch(`${ASTRA_COLLECTION_URL}?page-size=20`, {
        headers: {
          'X-Cassandra-Token': ASTRA_DB_APPLICATION_TOKEN
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('GET /latest failed:', errText);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Failed to fetch messages', detail: errText }));
        return;
      }

      const json = await response.json();
      const docs = json?.data ? Object.values(json.data) : [];

      // Sort descending by timestamp, take the latest 5
      const latest5 = docs
        .filter(doc => doc.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // final sort: oldest to newest

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(latest5));
    } catch (err) {
      console.error('GET /latest error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: err.message }));
    }
  })();
  return;
}


    // All other code unchanged (serving files, etc)...
    if (pathname === '/') pathname = '/index.html';

    if (pathname === '/world.json') {
        const worldJsonPath = path.join(__dirname, 'world.json');
        if (fs.existsSync(worldJsonPath)) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(worldJsonPath).pipe(res);
            return;
        }
    }

    const filePath = path.join(ROOT_DIR, pathname);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.end(`File not found: ${pathname}`);
            return;
        }

        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Access-Control-Allow-Origin', '*');

        fs.createReadStream(filePath).pipe(res);
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        console.log(`CityofGits running at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please close other applications using this port or change the PORT variable.`);
        } else {
            console.error('Server error:', err.message);
        }
    });
}

module.exports = server;


server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close other applications using this port or change the PORT variable.`);
    } else {
        console.error('Server error:', err.message);
    }
});
