'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const lib = require('../lib/index');

module.exports = function runLabTests(test) {
  const labs = path.join(__dirname, '..', 'docs', 'labs');

  test('实验材料：错误示例全部被检出', function () {
    const files = lib.collectFiles(path.join(labs, 'broken'));
    assert.strictEqual(files.length, 3, '错误示例应为 3 个文件');
    files.forEach(function (file) {
      const findings = lib.analyzeSource(fs.readFileSync(file, 'utf8'), { node: 14, file: file });
      assert.ok(findings.length > 0, path.basename(file) + ' 应至少命中一条规则');
    });
  });

  test('实验材料：参考答案零告警', function () {
    const files = lib.collectFiles(path.join(labs, 'solutions'));
    assert.strictEqual(files.length, 3, '参考答案应为 3 个文件');
    files.forEach(function (file) {
      const findings = lib.analyzeSource(fs.readFileSync(file, 'utf8'), { node: 14, file: file });
      assert.deepStrictEqual(findings, [], path.basename(file) + ' 不应命中任何规则');
    });
  });
};
