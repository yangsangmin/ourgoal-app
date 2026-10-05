'use strict';
// #TASK-ES-441 (인라인 스크립트 세포화 P0 구역 선행 — 시험지): index.html 인라인 IIFE 의 함수가 js/tabs/<탭>/*.js 세포
// (js/core/app-scope.js 통로 L. 로 인라인 이름을 읽는 파일)로 옮겨 가도(동작 그대로) 같은 단언이 같은 코드를 찾도록,
// index.html 글자에서 함수를 잘라 가거나 글자를 찾는 시험지는 '인라인 합본' = index.html(원문 그대로, 맨 앞) + 세포 js/tabs/**/*.js(경로순) 를 본다.
// 세포 쪽은 생성기 접두 L. 만 떼고 읽는다(옮기기는 이름 참조에 L. 만 붙이므로, 떼면 인라인에 있던 글자와 같다).
// scripts/smoke-test.js 의 합본 읽기(#TASK-ES-357)·tests/helpers/components-bundle.js(#TASK-ES-412)와 같은 규칙이다. 단언·기대값은 그대로다.
// 세포 파일이 없으면 합본 = 원문. 원문이 맨 앞이라 원문에 있는 글자는 원래 자리에서 먼저 찾힌다.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const TABS_DIR = path.join(ROOT, 'js', 'tabs');

function walk(dir) {
  let out = [];
  let names = [];
  try { names = fs.readdirSync(dir).sort(); } catch (e) { return out; }
  for (const n of names) {
    const f = path.join(dir, n);
    const st = fs.statSync(f);
    if (st.isDirectory()) out = out.concat(walk(f));
    else if (n.endsWith('.js')) out.push(f);
  }
  return out;
}

// #TASK-ES-465 (인라인 어려움 기관 묶음 선행): 기관 세포는 js/core/*.js(맨 위 칸)에 둔다. 그중 인라인에서 생성기로 옮겨 온 파일만
// (생성기 표지 `이전 전 index.html …(#TASK-… 생성기 표지)` 를 담은 파일 — app-scope.js·event-bus.js 같은 원래 기관은 빠진다) 합본 뒤에 붙인다.
const CORE_DIR = path.join(ROOT, 'js', 'core');
const MOVED_MARK = /\/\* ---- 이전 전 index\.html \d+~\d+줄\(#TASK-[\w-]+ 생성기 표지\) ---- \*\//;
function coreMovedCellFiles() {
  let names = [];
  try { names = fs.readdirSync(CORE_DIR).sort(); } catch (e) { return []; }
  return names.filter((n) => n.endsWith('.js')).map((n) => path.join(CORE_DIR, n))
    .filter((f) => fs.statSync(f).isFile() && MOVED_MARK.test(fs.readFileSync(f, 'utf8')));
}

// L.(js/core/app-scope.js 통로)로 인라인 이름을 읽는 세포 파일만(js/tabs 경로순, 그다음 js/core 의 인라인 이전 세포 경로순)
function inlineCellFiles() {
  return walk(TABS_DIR).filter((f) => fs.readFileSync(f, 'utf8').indexOf('OurgoalAppScope') >= 0).concat(coreMovedCellFiles());
}

function readCell(f) { return fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])L\.(?=[A-Za-z_$])/g, '$1'); }

// html: index.html 원문(시험지가 읽은 그대로). 돌려주는 값의 맨 앞은 원문 그대로다.
function withInlineCells(html) {
  const parts = inlineCellFiles();
  const src = [html, ...parts.map(readCell)].join('\n');
  if (src.slice(0, html.length) !== html) throw new Error('인라인 합본 맨 앞이 index.html 원문이 아님');
  return src;
}

// #TASK-ES-519 (인라인 3단계 Z4 시험지 선행): 시험지가 index.html 에서 「함수 시작 ~ 원래 자리 window 노출 줄 앞」을 잘라 실행하는 경우.
// 함수가 세포로 옮겨 가면 노출 줄은 index.html 원래 자리에 남고(생성기 표준 — 노출 순서 보존) 함수 글자는 합본 뒤쪽 세포에 있어, 합본 한 덩어리에서는 구간이 끊긴다.
// - 원문에 함수가 있고 그 뒤에 노출 줄이 있으면(아직 원래 자리) 원문을 그대로 돌려준다 — 시험지의 잘라 읽기가 이전과 한 글자도 다르지 않다.
// - 아니면 함수 글자를 합본의 세포 쪽에서 괄호 짝으로 잘라 오고(L. 만 뗀 글자 = 옮기기 전 글자), 노출 줄은 원문에 있을 때만 그 뒤에 잇는다.
//   노출 줄이 원문에서 사라졌거나 함수가 어디에도 없으면 그 글자가 빠지므로 시험지의 「시작점·종료점 발견」 단언이 그대로 실패를 알린다(검사를 약하게 하지 않는다).
// 돌려주는 글자의 맨 앞은 빈 줄이다(원문에서처럼 함수 시작 위치가 0 보다 크다).
function cutFunctionWithExposure(html, head, exposure) {
  const s = html.indexOf(head);
  if (s >= 0 && html.indexOf(exposure, s) > s) return html;
  const src = withInlineCells(html);
  const start = src.indexOf(head, html.length);
  if (start < 0) return html;
  let i = src.indexOf('{', start), depth = 0, q = null, end = -1;
  for (; i >= 0 && i < src.length; i++) {
    const ch = src[i], nx = src[i + 1];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '/' && nx === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
    if (ch === '/' && nx === '*') { i = src.indexOf('*/', i) + 1; if (i <= 0) break; continue; }
    if (ch === '\'' || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return html;
  return '\n' + src.slice(start, end + 1) + '\n' + (html.indexOf(exposure) >= 0 ? exposure : '');
}

module.exports = { inlineCellFiles, withInlineCells, readCell, cutFunctionWithExposure };
