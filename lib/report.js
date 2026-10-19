'use strict';

const path = require('path');

const COLORS = {
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m',
  dim: '\u001b[2m',
  bold: '\u001b[1m',
  reset: '\u001b[0m'
};

function colorize(enabled, color, text) {
  if (!enabled) return text;
  return COLORS[color] + text + COLORS.reset;
}

function formatText(result, options) {
  const opts = options || {};
  const colors = opts.color === true;
  const cwd = opts.cwd || process.cwd();
  const lines = [];
  let errors = 0;
  let warnings = 0;

  result.errors.forEach(function (item) {
    lines.push(colorize(colors, 'red', '读取失败: ' + item.file + ' — ' + item.message));
    errors++;
  });

  result.findings.forEach(function (f) {
    const rel = path.relative(cwd, f.file).split(path.sep).join('/');
    const level = f.severity === 'warn' ? 'warn ' : 'error';
    const shownLevel = f.severity === 'warn'
      ? colorize(colors, 'yellow', level)
      : colorize(colors, 'red', level);
    if (f.severity === 'warn') warnings++;
    else errors++;

    lines.push(
      colorize(colors, 'bold', rel + ':' + f.line + ':' + f.column) +
      '  ' + shownLevel + '  ' +
      colorize(colors, 'cyan', f.ruleId) +
      colorize(colors, 'dim', '  Node ' + f.since + '+ / target ' + f.target)
    );
    lines.push('    ' + f.hint);
    lines.push('    ' + colorize(colors, 'dim', '建议: ' + f.fix));
  });

  if (result.findings.length > 0) {
    lines.push('');
    lines.push(
      '共 ' + result.findings.length + ' 个问题' +
      '（' + errors + ' error, ' + warnings + ' warn），扫描 ' + result.files.length + ' 个文件'
    );
  } else if (result.errors.length === 0) {
    lines.push('未发现问题，扫描 ' + result.files.length + ' 个文件（target Node ' + (opts.node || 14) + '）');
  }

  return { text: lines.join('\n'), errors: errors, warnings: warnings };
}

function formatJson(result, options) {
  const opts = options || {};
  return JSON.stringify({
    target: opts.node || 14,
    filesScanned: result.files.length,
    findings: result.findings,
    errors: result.errors
  }, null, 2);
}

module.exports = { formatText: formatText, formatJson: formatJson };
