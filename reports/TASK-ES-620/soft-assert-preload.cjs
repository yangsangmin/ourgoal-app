'use strict';
// #TASK-ES-620 조사 도구(작업자 측정, 판정 아님) — 단언 전수 조사용 미리 읽기(--require).
// 시험지는 첫 단언 실패에서 멈춘다(check 하나·파일 하나에 깨지는 단언이 여럿이어도 첫 줄만 보인다).
// 깨지는 단언을 전부 세려고, assert 모듈의 단언이 실패해도 던지지 않고 「파일:줄·메시지」를 기록만 하게 바꾼다.
// 이 미리 읽기로 돌린 결과의 종료 코드·통과 수는 증거로 쓰지 않는다(단언이 던지지 않으므로 뒤 코드가 달리 돈다) — 「어느 줄의 단언이 실패하는가」의 목록만 쓴다.
// 종료 코드·검사 수 증명은 이 미리 읽기 없이 따로 돌린다(reports/TASK-ES-620/run-plain.cjs).
//   ES620_SOFT_OUT  : 기록 파일(JSON 줄, 추가 쓰기)
//   ES620_SOFT_ROOT : 트리 뿌리(기록하는 경로의 기준). 없으면 process.cwd()
const fs = require('fs');
const path = require('path');
const Module = require('module');

const OUT = process.env.ES620_SOFT_OUT;
const ROOT = path.resolve(process.env.ES620_SOFT_ROOT || process.cwd()).replace(/\\/g, '/').toLowerCase() + '/';
const SELF = __filename.replace(/\\/g, '/').toLowerCase();
const ENTRY = (process.argv[1] || '').replace(/\\/g, '/');

function frameOf(stack) {
  const lines = String(stack || '').split('\n');
  for (const l of lines) {
    const m = /\(?((?:[A-Za-z]:)?[^():]+):(\d+):(\d+)\)?\s*$/.exec(l);
    if (!m || !/^\s+at /.test(l)) continue;
    const f = m[1].replace(/^file:\/+/, '').replace(/\\/g, '/');
    const low = f.toLowerCase();
    if (low === SELF || low.indexOf('/node_modules/') >= 0 || low.indexOf('node:') === 0) continue;
    if (low.indexOf(ROOT) !== 0) continue;
    return { file: f.slice(ROOT.length), line: Number(m[2]), col: Number(m[3]) };
  }
  return null;
}
function write(rec) {
  if (!OUT) return;
  rec.entry = ENTRY.toLowerCase().indexOf(ROOT) === 0 ? ENTRY.slice(ROOT.length) : ENTRY;
  try { fs.appendFileSync(OUT, JSON.stringify(rec) + '\n', 'utf8'); } catch (e) { /* 기록 실패는 조사 결과에 빈칸으로 남는다 */ }
}
function brief(v) {
  if (typeof v === 'string') return v.length > 160 ? v.slice(0, 160) + '…' : v;
  if (v === null || v === undefined || typeof v === 'number' || typeof v === 'boolean') return v === undefined ? null : v;
  return Object.prototype.toString.call(v);
}

const real = require('assert');
function soften(fn, name) {
  return function () {
    try { return fn.apply(this, arguments); }
    catch (err) {
      if (!err || err.name !== 'AssertionError') throw err; // 단언이 아닌 예외(시험지가 기대하는 throw 등)는 그대로 둔다
      const at = frameOf(new Error().stack) || frameOf(err.stack);
      write({ kind: 'assert', fn: name, at, message: String(err.message || '').split('\n')[0].slice(0, 300), actual: brief(err.actual), expected: brief(err.expected), operator: err.operator || null });
      return undefined;
    }
  };
}
function wrapAssert(src) {
  const w = soften(src, 'assert');
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (k === 'AssertionError' || k === 'CallTracker') { w[k] = v; continue; }
    if (k === 'strict') continue;
    // rejects·doesNotReject 는 약속을 돌려준다 — 여기서는 감싸지 않는다(이 저장소 시험지에서 배선 글자 단언에 쓰이지 않는다)
    if (typeof v === 'function' && k !== 'rejects' && k !== 'doesNotReject') w[k] = soften(v, k); else w[k] = v;
  }
  return w;
}
const softLoose = wrapAssert(real);
const softStrict = wrapAssert(real.strict);
softLoose.strict = softStrict; softStrict.strict = softStrict;

const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'assert' || request === 'node:assert') return softLoose;
  if (request === 'assert/strict' || request === 'node:assert/strict') return softStrict;
  return origLoad.apply(this, arguments);
};

// 단언이 아닌 길로 끝나는 시험(직접 throw · process.exit(1))도 어디서 끝났는지 남긴다.
const origExit = process.exit;
process.exit = function (code) {
  const c = code === undefined ? (process.exitCode || 0) : code;
  if (c) write({ kind: 'exit', code: c, at: frameOf(new Error().stack) });
  return origExit.apply(process, arguments);
};
process.on('uncaughtException', (err) => {
  write({ kind: 'crash', at: frameOf(err && err.stack), message: String((err && err.message) || err).split('\n')[0].slice(0, 300), name: (err && err.name) || null });
  process.stderr.write(String((err && err.stack) || err) + '\n');
  origExit.call(process, 1);
});
