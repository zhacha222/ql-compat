'use strict';

// 参考答案 1：自己用 http/https 封装请求，不依赖全局 fetch。

const http = require('http');
const https = require('https');

function pickModule(url) {
  return url.indexOf('https:') === 0 ? https : http;
}

function fetchJson(url) {
  return new Promise(function (resolve, reject) {
    const request = pickModule(url).get(url, function (response) {
      const chunks = [];
      response.on('data', function (chunk) { chunks.push(chunk); });
      response.on('end', function () {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on('error', reject);
  });
}

fetchJson('https://example.com/api').then(function (data) {
  console.log('拿到 ' + Object.keys(data).length + ' 个字段');
});
