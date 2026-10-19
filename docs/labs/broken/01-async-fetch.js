'use strict';

// 实验 1：用全局 fetch 抓取接口。
// 在 Node 14 上，fetch 并不存在，这段代码会在调用处直接抛异常。

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  return JSON.parse(text);
}

fetchJson('https://example.com/api').then(function (data) {
  console.log('拿到 ' + Object.keys(data).length + ' 个字段');
});
