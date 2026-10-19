'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./index');
const report = require('./report');

const VERSION = require('../package.json').version;

const USAGE = [
  'ql-compat ' + VERSION + ' — 扫描青龙 / 旧版 Node 不兼容 API',
  '',
  '用法:',
  '  ql-compat check <文件或目录...> [选项]',
  '  ql-compat rules',
  '  ql-compat --version',
  '',
  '选项:',
  '  --node <版本>     目标 Node 主版本，默认 14',
  '  --json            输出 JSON，便于接入 CI',
  '  --ignore <规则>   忽略规则，逗号分隔，可重复',
  '  --no-color        关闭颜色',
  '  -h, --help        显示帮助',
  '',
  '示例:',
  '  ql-compat check ./scripts --node 12',
  '  ql-compat check ./scripts --json > report.json'
].join('\n');

function parseArgs(argv) {
  const out = { command: '', targets: [], node: 14, json: false, color: true, ignore: [], help: false, version: false };
  let i = 0;
  if (argv.length && argv[0].charAt(0) !== '-') {
    out.command = argv[0];
    i = 1;
  }
  for (; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--node') {
      out.node = parseFloat(argv[++i]);
    } else if (arg.indexOf('--node=') === 0) {
      out.node = parseFloat(arg.slice(7));
    } else if (arg === '--ignore') {
      out.ignore = out.ignore.concat(String(argv[++i] || '').split(','));
    } else if (arg.indexOf('--ignore=') === 0) {
      out.ignore = out.ignore.concat(arg.slice(9).split(','));
    } else if (arg === '--json') {
      out.json = true;
    } else if (arg === '--no-color') {
      out.color = false;
    } else if (arg === '-h' || arg === '--help') {
      out.help = true;
    } else if (arg === '--version' || arg === '-v') {
      out.version = true;
    } else if (arg.charAt(0) === '-') {
      throw new Error('未知参数: ' + arg);
    } else {
      out.targets.push(arg);
    }
  }
  out.ignore = out.ignore.filter(function (v) { return v.length > 0; });
  return out;
}

function printRules() {
  const lines = ['当前支持 ' + lib.rules.length + ' 条规则:', ''];
  lib.rules.forEach(function (rule) {
    lines.push('  ' + rule.id);
    lines.push('    起始版本: Node ' + rule.since + '    默认级别: ' + rule.severity);
    lines.push('    ' + rule.hint);
    lines.push('    ' + rule.fix);
    lines.push('');
  });
  console.log(lines.join('\n'));
}

function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(err.message);
    console.error('');
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  if (args.version) {
    console.log(VERSION);
    return;
  }

  if (args.help || (!args.command && args.targets.length === 0)) {
    console.log(USAGE);
    return;
  }

  if (args.command === 'rules') {
    printRules();
    return;
  }

  if (args.command !== 'check') {
    console.error('未知命令: ' + args.command);
    console.error('');
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  if (args.targets.length === 0) {
    console.error('请至少指定一个文件或目录');
    process.exitCode = 2;
    return;
  }

  args.targets = args.targets.map(function (t) { return path.resolve(t); });

  const missing = args.targets.filter(function (t) {
    try {
      fs.statSync(t);
      return false;
    } catch (err) {
      return true;
    }
  });
  if (missing.length) {
    console.error('路径不存在: ' + missing.join(', '));
    process.exitCode = 2;
    return;
  }

  const result = lib.analyzeFiles(args.targets, { node: args.node, ignore: args.ignore });

  if (args.json) {
    console.log(report.formatJson(result, { node: args.node }));
  } else {
    const useColor = args.color && process.stdout.isTTY;
    const formatted = report.formatText(result, { color: useColor, node: args.node });
    console.log(formatted.text);
  }

  const hasError = result.findings.some(function (f) { return f.severity !== 'warn'; }) || result.errors.length > 0;
  process.exitCode = hasError ? 1 : 0;
}

module.exports = { main: main, parseArgs: parseArgs };
