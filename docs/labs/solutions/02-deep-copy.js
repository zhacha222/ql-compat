'use strict';

// 参考答案 2：手写深拷贝，并用 hasOwnProperty 判断键是否存在。

function cloneConfig(config) {
  if (config === null || typeof config !== 'object') return config;
  if (Array.isArray(config)) return config.map(cloneConfig);
  const out = {};
  Object.keys(config).forEach(function (key) {
    out[key] = cloneConfig(config[key]);
  });
  return out;
}

function hasKey(config, key) {
  return Object.prototype.hasOwnProperty.call(config, key);
}

module.exports = { cloneConfig: cloneConfig, hasKey: hasKey };
