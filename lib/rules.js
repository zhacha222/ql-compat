'use strict';

function declares(masked, name) {
  const pattern =
    '(?:function|class)\\s+' + name + '\\b' +
    '|\\b(?:const|let|var)\\s+' + name + '\\b' +
    '|\\bglobalThis\\.' + name + '\\s*=[^=]' +
    '|\\bglobal\\.' + name + '\\s*=[^=]' +
    '|\\b' + name + '\\s*=[^=]';
  return new RegExp(pattern).test(masked);
}

function usesModuleSyntax(masked) {
  return /(^|[^.\w$])import\s+[\w{*"']/m.test(masked) ||
    /(^|[^.\w$])export\s+[\w{*]/m.test(masked);
}

const rules = [
  {
    id: 'no-global-fetch',
    since: 18,
    severity: 'error',
    title: '全局 fetch',
    hint: 'Node 18 起才内置全局 fetch，旧版会抛 ReferenceError: fetch is not defined',
    fix: '改用 http/https 封装，或引入 node-fetch 并在文件顶部赋值到 fetch',
    test: function (ctx) {
      const re = /(^|[^.\w$])fetch\s*\(/g;
      const out = [];
      let m;
      while ((m = re.exec(ctx.masked))) {
        if (declares(ctx.masked, 'fetch')) continue;
        if (/function\s*$/.test(ctx.masked.slice(Math.max(0, m.index), m.index + m[0].length))) continue;
        out.push({ index: m.index + m[1].length });
      }
      return out;
    }
  },
  {
    id: 'no-abort-signal-timeout',
    since: 17.3,
    severity: 'error',
    title: 'AbortSignal.timeout()',
    hint: 'Node 17.3 起才提供，旧版调用会抛 TypeError',
    fix: '用 AbortController + setTimeout 自行实现超时信号',
    test: function (ctx) {
      return collect(ctx.masked, /AbortSignal\.timeout\s*\(/g);
    }
  },
  {
    id: 'no-structured-clone',
    since: 17,
    severity: 'error',
    title: 'structuredClone()',
    hint: 'Node 17 起才提供',
    fix: '改用 JSON 深拷贝或 v8.serialize/deserialize',
    test: function (ctx) {
      const out = [];
      const re = /(^|[^.\w$])structuredClone\s*\(/g;
      let m;
      while ((m = re.exec(ctx.masked))) {
        if (declares(ctx.masked, 'structuredClone')) continue;
        out.push({ index: m.index + m[1].length });
      }
      return out;
    }
  },
  {
    id: 'no-array-at',
    since: 16.6,
    severity: 'warn',
    title: 'Array.prototype.at()',
    hint: 'Node 16.6 起才提供，旧版返回 undefined 并抛 TypeError',
    fix: '改用 arr[arr.length - n] 写法',
    test: function (ctx) {
      return collect(ctx.masked, /\.at\s*\(/g);
    }
  },
  {
    id: 'no-object-has-own',
    since: 16.9,
    severity: 'error',
    title: 'Object.hasOwn()',
    hint: 'Node 16.9 起才提供',
    fix: '改用 Object.prototype.hasOwnProperty.call(obj, key)',
    test: function (ctx) {
      return collect(ctx.masked, /Object\.hasOwn\s*\(/g);
    }
  },
  {
    id: 'no-fs-rm-sync',
    since: 14.14,
    severity: 'error',
    title: 'fs.rmSync()',
    hint: 'Node 14.14 起才提供，旧版需走 fs.rmdirSync({recursive:true})',
    fix: '改用 fs.rmdirSync(path, { recursive: true }) 或先探测再回退',
    test: function (ctx) {
      return collect(ctx.masked, /\.rmSync\s*\(/g);
    }
  },
  {
    id: 'no-string-replace-all',
    since: 15,
    severity: 'warn',
    title: 'String.prototype.replaceAll()',
    hint: 'Node 15 起才提供',
    fix: '改用 split(sep).join(repl) 或带 g 标志的正则',
    test: function (ctx) {
      return collect(ctx.masked, /\.replaceAll\s*\(/g);
    }
  },
  {
    id: 'no-top-level-await',
    since: 14.8,
    severity: 'error',
    title: '顶层 await',
    hint: 'CommonJS 脚本里顶层 await 会直接抛 SyntaxError',
    fix: '包进 async function main() 后调用，或改用 .mjs 并确认运行环境支持',
    test: function (ctx) {
      if (ctx.extension === '.mjs' || usesModuleSyntax(ctx.masked)) return [];
      const out = [];
      const re = /\bawait\b/g;
      let m;
      while ((m = re.exec(ctx.masked))) {
        if (ctx.depth[m.index] === 0) out.push({ index: m.index });
      }
      return out;
    }
  }
];

function collect(masked, re) {
  const out = [];
  let m;
  while ((m = re.exec(masked))) out.push({ index: m.index });
  return out;
}

module.exports = { rules: rules };
