'use strict';

const { maskSource, lineStarts, position } = require('./mask');
const { rules } = require('./rules');

function analyzeSource(source, options) {
  const opts = options || {};
  const target = opts.node || 14;
  const ignored = opts.ignore || [];
  const extension = opts.extension || '.js';
  const file = opts.file || '<input>';

  const maskedInfo = maskSource(source);
  const starts = lineStarts(source);
  const ctx = {
    source: source,
    masked: maskedInfo.masked,
    depth: maskedInfo.depth,
    strings: maskedInfo.strings,
    extension: extension
  };

  const findings = [];

  rules.forEach(function (rule) {
    if (ignored.indexOf(rule.id) !== -1) return;
    if (rule.since <= target) return;

    const hits = rule.test(ctx);
    hits.forEach(function (hit) {
      const pos = position(starts, hit.index);
      findings.push({
        file: file,
        line: pos.line,
        column: pos.column,
        ruleId: rule.id,
        severity: rule.severity,
        title: rule.title,
        since: rule.since,
        hint: rule.hint,
        fix: rule.fix,
        target: target
      });
    });
  });

  findings.sort(function (a, b) {
    return a.line - b.line || a.column - b.column || (a.ruleId < b.ruleId ? -1 : 1);
  });

  return findings;
}

module.exports = { analyzeSource: analyzeSource, rules: rules };
