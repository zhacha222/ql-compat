'use strict';

const assert = require('assert');
const execFileSync = require('child_process').execFileSync;
const path = require('path');
const lib = require('../lib/index');

const cases = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  cases.push({ name: name, fn: fn });
}

function analyze(source, options) {
  return lib.analyzeSource(source, options || {});
}

function ids(findings) {
  return findings.map(function (f) { return f.ruleId; });
}

console.log('ql-compat 测试');

test('识别全局 fetch', function () {
  const out = analyze('const r = await fetch("https://example.com");', { node: 14 });
  assert.ok(ids(out).indexOf('no-global-fetch') !== -1);
});

test('字符串里的 fetch 不误报', function () {
  const out = analyze('const s = "await fetch(x)";', { node: 14 });
  assert.strictEqual(out.length, 0);
});

test('注释里的 API 不误报', function () {
  const out = analyze('// AbortSignal.timeout(1000)\n/* structuredClone(a) */', { node: 14 });
  assert.strictEqual(out.length, 0);
});

test('模板字符串里的 API 不误报', function () {
  const out = analyze('const t = `AbortSignal.timeout(1) ${x}`;', { node: 14 });
  assert.strictEqual(out.length, 0);
});

test('对象方法 at 属性不误报', function () {
  const out = analyze('obj.at("x");', { node: 14 });
  assert.deepStrictEqual(ids(out), ['no-array-at']);
  const out2 = analyze('obj["at"](1);', { node: 14 });
  assert.strictEqual(out2.length, 0);
});

test('已声明本地 fetch 时不报告', function () {
  const out = analyze('function fetch() {}\nfetch("x");', { node: 14 });
  assert.strictEqual(out.length, 0);
});

test('顶层 await 在 CommonJS 中报告', function () {
  const out = analyze('const a = await Promise.resolve(1);', { node: 14, extension: '.js' });
  assert.ok(ids(out).indexOf('no-top-level-await') !== -1);
});

test('函数内 await 不报告', function () {
  const out = analyze('async function main() {\n  await go();\n}', { node: 14, extension: '.js' });
  assert.strictEqual(out.length, 0);
});

test('ESM 顶层 await 不报告', function () {
  const out = analyze('import fs from "fs";\nawait go();', { node: 14, extension: '.js' });
  assert.strictEqual(out.length, 0);
});

test('目标版本足够高时全部放行', function () {
  const source = 'fetch(u); AbortSignal.timeout(1); structuredClone(a); Object.hasOwn(b, "c");';
  const out = analyze(source, { node: 20 });
  assert.strictEqual(out.length, 0);
});

test('ignore 生效', function () {
  const out = analyze('fetch(u);', { node: 14, ignore: ['no-global-fetch'] });
  assert.strictEqual(out.length, 0);
});

test('识别 node: 前缀、Promise.any 与 WeakRef', function () {
  const out = analyze(
    'const fs = require("node:fs");\nPromise.any([a, b]);\nconst r = new WeakRef(obj);',
    { node: 12 }
  );
  const found = ids(out);
  assert.ok(found.indexOf('no-node-protocol') !== -1);
  assert.ok(found.indexOf('no-promise-any') !== -1);
  assert.ok(found.indexOf('no-weak-ref') !== -1);
});

test('node: 前缀在 Node 16 目标下放行', function () {
  const out = analyze('const fs = require("node:fs");', { node: 16 });
  assert.strictEqual(out.length, 0);
});

test('行号列号正确', function () {
  const out = analyze('// x\n\n  fetch(u);', { node: 14 });
  assert.strictEqual(out[0].line, 3);
  assert.strictEqual(out[0].column, 3);
});

test('CLI 扫描目录并对问题返回退出码 1', function () {
  const target = path.join(__dirname, 'fixtures');
  let code = 0;
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [path.join(__dirname, '..', 'bin', 'ql-compat.js'), 'check', target, '--json'], { encoding: 'utf8' });
  } catch (err) {
    code = err.status;
    stdout = String(err.stdout || '');
  }
  assert.strictEqual(code, 1);
  const parsed = JSON.parse(stdout);
  assert.ok(parsed.findings.length >= 3);
});

test('CLI 对干净文件返回 0', function () {
  const target = path.join(__dirname, 'fixtures', 'clean');
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'bin', 'ql-compat.js'), 'check', target, '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(out);
  assert.strictEqual(parsed.findings.length, 0);
});

require('./server')(test);
require('./labs')(test);

let index = 0;

function next() {
  if (index >= cases.length) {
    console.log('');
    console.log(passed + ' 通过, ' + failed + ' 失败');
    if (failed > 0) process.exit(1);
    return;
  }

  const current = cases[index++];
  let settled = false;

  function done(err) {
    if (settled) return;
    settled = true;
    if (err) {
      failed++;
      console.log('  FAIL ' + current.name);
      console.log('       ' + (err && err.message));
    } else {
      passed++;
      console.log('  ok   ' + current.name);
    }
    next();
  }

  try {
    if (current.fn.length > 0) current.fn(done);
    else {
      current.fn();
      done();
    }
  } catch (err) {
    done(err);
  }
}

next();
