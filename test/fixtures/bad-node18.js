'use strict';

async function run(url) {
  const response = await fetch(url);
  const clone = structuredClone({ ok: true });
  const signal = AbortSignal.timeout(3000);
  const last = [1, 2, 3].at(-1);
  return { response: response, clone: clone, signal: signal, last: last };
}

run('https://example.com');
