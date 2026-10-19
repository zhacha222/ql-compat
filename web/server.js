'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { analyzeSource } = require('../lib/analyze');

const MAX_BODY = 200 * 1024;
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 60;

function createApp(options) {
  const opts = options || {};
  const indexPath = path.join(__dirname, 'index.html');
  const buckets = Object.create(null);

  function allow(ip) {
    const now = Date.now();
    const bucket = buckets[ip] || (buckets[ip] = { start: now, count: 0 });
    if (now - bucket.start > WINDOW_MS) {
      bucket.start = now;
      bucket.count = 0;
    }
    bucket.count++;
    return bucket.count <= MAX_PER_WINDOW;
  }

  function send(res, status, type, body) {
    res.writeHead(status, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'"
    });
    res.end(body);
  }

  function sendJson(res, status, payload) {
    send(res, status, 'application/json; charset=utf-8', JSON.stringify(payload));
  }

  return http.createServer(function (req, res) {
    const ip = (req.socket && req.socket.remoteAddress) || 'unknown';

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      fs.readFile(indexPath, 'utf8', function (err, html) {
        if (err) return sendJson(res, 500, { error: '页面读取失败' });
        send(res, 200, 'text/html; charset=utf-8', html);
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/healthz') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/check') {
      if (!allow(ip)) return sendJson(res, 429, { error: '请求过于频繁，请稍后再试' });

      let size = 0;
      const chunks = [];
      req.on('data', function (chunk) {
        size += chunk.length;
        if (size > MAX_BODY) {
          sendJson(res, 413, { error: '代码超过 200KB 上限' });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', function () {
        let payload;
        try {
          payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch (err) {
          return sendJson(res, 400, { error: '请求体不是合法 JSON' });
        }
        if (!payload || typeof payload.code !== 'string') {
          return sendJson(res, 400, { error: '缺少 code 字段' });
        }
        const node = Number(payload.node) || (opts.node || 14);
        const findings = analyzeSource(payload.code, {
          node: node,
          extension: '.js',
          file: 'snippet.js'
        });
        sendJson(res, 200, { target: node, findings: findings });
      });
      return;
    }

    sendJson(res, 404, { error: 'Not Found' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 8080;
  const server = createApp();
  server.listen(port, '0.0.0.0', function () {
    console.log('ql-compat web listening on :' + port);
  });
}

module.exports = { createApp: createApp };
