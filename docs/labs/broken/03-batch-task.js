'use strict';

// 实验 3：读取配置文件并取最后一个数据源。
// node: 前缀、顶层 await、Array.at 三种写法在旧版 Node 上都不可用。

const fs = require('node:fs');

const config = JSON.parse(await fs.promises.readFile('config.json', 'utf8'));

const lastSource = config.sources.at(-1);

console.log(lastSource);
