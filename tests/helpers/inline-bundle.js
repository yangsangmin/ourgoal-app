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

// L.(js/core/app-scope.js 통로)로 인라인 이름을 읽는 세포 파일만
function inlineCellFiles() {
  return walk(TABS_DIR).filter((f) => fs.readFileSync(f, 'utf8').indexOf('OurgoalAppScope') >= 0);
}

function readCell(f) { return fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])L\.(?=[A-Za-z_$])/g, '$1'); }

// html: index.html 원문(시험지가 읽은 그대로). 돌려주는 값의 맨 앞은 원문 그대로다.
function withInlineCells(html) {
  const parts = inlineCellFiles();
  const src = [html, ...parts.map(readCell)].join('\n');
  if (src.slice(0, html.length) !== html) throw new Error('인라인 합본 맨 앞이 index.html 원문이 아님');
  return src;
}

module.exports = { inlineCellFiles, withInlineCells, readCell };
