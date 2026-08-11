const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const PRODUCTS_DIR = path.join(PUBLIC_DIR, 'products');
const PRODUCTS_FILE = path.join(PRODUCTS_DIR, 'products.json');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const SETTINGS_FILE = path.join(PRODUCTS_DIR, 'settings.json');

// Ensure directories exist
if (!fs.existsSync(PRODUCTS_DIR)) {
  fs.mkdirSync(PRODUCTS_DIR);
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Simple Static Server with JSON Products API
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Endpoint: Get Products
  if (pathname === '/api/products' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });
    if (fs.existsSync(PRODUCTS_FILE)) {
      fs.createReadStream(PRODUCTS_FILE).pipe(res);
    } else {
      res.end(JSON.stringify([]));
    }
    return;
  }

  // API Endpoint: Save Products
  if (pathname === '/api/products' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const products = JSON.parse(body);
        if (!Array.isArray(products)) {
          throw new Error('Products must be a JSON array');
        }
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, message: 'Products saved successfully!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Get Settings
  if (pathname === '/api/settings' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    });
    if (fs.existsSync(SETTINGS_FILE)) {
      fs.createReadStream(SETTINGS_FILE).pipe(res);
    } else {
      res.end(JSON.stringify({}));
    }
    return;
  }

  // API Endpoint: Save Settings
  if (pathname === '/api/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const settings = JSON.parse(body);
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, message: 'Settings saved successfully!' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API Endpoint: Upload Images
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (!payload || !Array.isArray(payload.images)) {
          throw new Error('Images must be an array');
        }

        const urls = [];
        payload.images.forEach((img, idx) => {
          if (!img.data) return;

          const match = img.data.match(/^data:image\/([^;]+);base64,(.+)$/s);
          if (!match) return;

          let ext = match[1];
          if (ext === 'jpeg') ext = 'jpg';
          if (ext === 'svg+xml') ext = 'svg';
          ext = ext.replace(/[^a-zA-Z0-9]/g, '');

          const base64Data = match[2].trim();
          const buffer = Buffer.from(base64Data, 'base64');
          
          const uniqueName = `img-${Date.now()}-${idx}.${ext}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, uniqueName), buffer);
          urls.push(`uploads/${uniqueName}`);
        });

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, urls }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Serve static files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 AuraStore Server running locally at http://localhost:${PORT}`);
  console.log(`Products catalog file resides in: products/products.json`);
});
