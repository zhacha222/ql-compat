'use strict';

// 实验 2：深拷贝配置对象，并判断某个键是否存在。
// structuredClone 与 Object.hasOwn 在旧版 Node 上都不存在。

function cloneConfig(config) {
  return structuredClone(config);
}

function hasKey(config, key) {
  return Object.hasOwn(config, key);
}

module.exports = { cloneConfig: cloneConfig, hasKey: hasKey };
