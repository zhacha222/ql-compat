'use strict';

const http = require('http');

function fetch(url) {
  return new Promise(function (resolve, reject) {
    http.get(url, function (res) {
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve({ body: Buffer.concat(chunks) }); });
    }).on('error', reject);
  });
}

function timeoutSignal(ms) {
  const controller = new AbortController();
  setTimeout(function () { controller.abort(); }, ms);
  return controller.signal;
}

module.exports = { fetch: fetch, timeoutSignal: timeoutSignal };
