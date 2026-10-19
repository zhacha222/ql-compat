'use strict';

const assert = require('assert');
const http = require('http');
const { createApp } = require('../web/server');

module.exports = function runServerTests(test) {
  test('web: 健康检查与扫描接口', function (done) {
    const server = createApp();
    server.listen(0, '127.0.0.1', function () {
      const port = server.address().port;

      function request(method, urlPath, body, cb) {
        const payload = body === undefined ? null : JSON.stringify(body);
        const req = http.request({
          host: '127.0.0.1',
          port: port,
          path: urlPath,
          method: method,
          headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
        }, function (res) {
          const chunks = [];
          res.on('data', function (c) { chunks.push(c); });
          res.on('end', function () {
            cb(null, res.statusCode, Buffer.concat(chunks).toString('utf8'));
          });
        });
        req.on('error', cb);
        if (payload) req.write(payload);
        req.end();
      }

      request('GET', '/healthz', undefined, function (err, code, text) {
        if (err) { server.close(); return done(err); }
        try {
          assert.strictEqual(code, 200);
          assert.strictEqual(JSON.parse(text).ok, true);
        } catch (e) { server.close(); return done(e); }

        request('GET', '/', undefined, function (errPage, codePage, textPage) {
          if (errPage) { server.close(); return done(errPage); }
          try {
            assert.strictEqual(codePage, 200);
            assert.ok(textPage.indexOf('ql-compat 在线检查') !== -1);
          } catch (e) { server.close(); return done(e); }

          request('POST', '/api/check', { code: 'fetch("x");', node: 14 }, function (err2, code2, text2) {
            server.close();
            if (err2) return done(err2);
            try {
              assert.strictEqual(code2, 200);
              const body = JSON.parse(text2);
              assert.strictEqual(body.findings[0].ruleId, 'no-global-fetch');
              done();
            } catch (e) { done(e); }
          });
        });
      });
    });
  });
};
