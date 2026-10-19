'use strict';

// 参考答案 3：去掉 node: 前缀，把顶层 await 包进 async main。

const fs = require('fs');

async function main() {
  const raw = await fs.promises.readFile('config.json', 'utf8');
  const config = JSON.parse(raw);
  const sources = config.sources || [];
  const lastSource = sources.length ? sources[sources.length - 1] : null;
  console.log(lastSource);
}

main().catch(function (err) {
  console.error(err);
  process.exitCode = 1;
});
