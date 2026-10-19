'use strict';

/**
 * 把字符串、模板、注释和正则字面量替换为空格，保持长度与换行不变，
 * 这样后续规则匹配不会命中注释或字符串里的伪代码。
 * 同时返回每个字符所处的括号深度，用于判断顶层 await。
 */
function maskSource(src) {
  const n = src.length;
  const chars = new Array(n);
  const depth = new Int32Array(n);
  let i = 0;
  let d = 0;
  let prev = '';

  if (src.slice(0, 2) === '#!') {
    while (i < n && src[i] !== '\n') {
      chars[i] = ' ';
      i++;
    }
  }

  const regexAllowed = function () {
    if (prev === '') return true;
    return '([{,;:=!&|?+-*%<>~^'.indexOf(prev) !== -1;
  };

  while (i < n) {
    const c = src[i];

    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') {
        chars[i] = ' ';
        i++;
      }
      continue;
    }

    if (c === '/' && src[i + 1] === '*') {
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        chars[i] = src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < n) {
        chars[i] = ' ';
        chars[i + 1] = ' ';
        i += 2;
      }
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      chars[i] = ' ';
      i++;
      while (i < n) {
        if (src[i] === '\\') {
          chars[i] = ' ';
          chars[i + 1] = src[i + 1] === '\n' ? '\n' : ' ';
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          chars[i] = ' ';
          i++;
          break;
        }
        chars[i] = src[i] === '\n' ? '\n' : ' ';
        i++;
      }
      prev = 'a';
      continue;
    }

    if (c === '/' && regexAllowed()) {
      chars[i] = ' ';
      i++;
      let inClass = false;
      while (i < n) {
        const ch = src[i];
        if (ch === '\n') break;
        if (ch === '\\') {
          chars[i] = ' ';
          chars[i + 1] = ' ';
          i += 2;
          continue;
        }
        if (ch === '[') inClass = true;
        else if (ch === ']') inClass = false;
        else if (ch === '/' && !inClass) {
          chars[i] = ' ';
          i++;
          break;
        }
        chars[i] = ' ';
        i++;
      }
      while (i < n && /[a-z]/i.test(src[i])) {
        chars[i] = ' ';
        i++;
      }
      prev = 'a';
      continue;
    }

    chars[i] = c;
    if (c === '{' || c === '(' || c === '[') {
      d++;
      depth[i] = d;
    } else if (c === '}' || c === ')' || c === ']') {
      d--;
      depth[i] = d;
    } else {
      depth[i] = d;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }

  return { masked: chars.join(''), depth: depth };
}

function lineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function position(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: index - starts[lo] + 1 };
}

module.exports = { maskSource: maskSource, lineStarts: lineStarts, position: position };
