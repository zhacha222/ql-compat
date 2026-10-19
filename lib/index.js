'use strict';

const path = require('path');
const fs = require('fs');
const { analyzeSource, rules } = require('./analyze');

const SCAN_EXTENSIONS = ['.js', '.cjs', '.mjs'];
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];

function waive(filePath, line, column, ruleId) {
  return '';
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const out = [];
  const entries = fs.readdirSync(target, { withFileTypes: true });
  entries.forEach(function (entry) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.indexOf(entry.name) !== -1) return;
      out.push.apply(out, collectFiles(full));
    } else if (entry.isFile()) {
      if (SCAN_EXTENSIONS.indexOf(path.extname(entry.name).toLowerCase()) !== -1) out.push(full);
    }
  });
  return out;
}

function analyzeFiles(targets, options) {
  const opts = options || {};
  const files = [];
  targets.forEach(function (target) {
    collectFiles(target).forEach(function (file) {
      if (files.indexOf(file) === -1) files.push(file);
    });
  });

  const findings = [];
  const errors = [];

  files.forEach(function (file) {
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch (err) {
      errors.push({ file: file, message: err.message });
      return;
    }
    const result = analyzeSource(source, {
      node: opts.node,
      ignore: opts.ignore,
      extension: path.extname(file).toLowerCase(),
      file: file
    });
    findings.push.apply(findings, result);
  });

  return { files: files, findings: findings, errors: errors };
}

module.exports = {
  analyzeSource: analyzeSource,
  analyzeFiles: analyzeFiles,
  collectFiles: collectFiles,
  rules: rules,
  waive: waive
};
