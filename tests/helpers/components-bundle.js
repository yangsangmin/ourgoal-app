'use strict';
// #TASK-ES-412 (공통 UI 컴포넌트 세포 쪼개기 선행 — 시험지): 직통 핸들러 코드가 js/components.js 에서 js/components-*.js 세포
// (공통 UI 컴포넌트 세포 키트 OurgoalComponentsKit 에 함수를 담는 파일)로 옮겨 가도(동작 그대로) 같은 단언이 같은 코드를 찾도록,
// tests 의 components.js 소스 글자 검사는 '컴포넌트 합본' = js/components.js(원문 그대로, 맨 앞) + 키트 부품 js/components-*.js(이름순) 를 본다.
// scripts/smoke-test.js 의 COMPONENTS_SRC 와 같은 규칙이다(부품만 생성기 접두 T.·K. 를 떼고 읽는다). 단언·기대값은 그대로다.
// 부품 파일이 없으면 합본 = 원문, 브라우저 읽는 순서 = [js/components.js] 하나.
const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', '..', 'js');
const COMPONENTS_JS = path.join(JS_DIR, 'components.js');

function componentsPartFiles() {
  return fs.readdirSync(JS_DIR).sort()
    .filter((n) => n.indexOf('components-') === 0 && n.endsWith('.js'))
    .map((n) => path.join(JS_DIR, n))
    .filter((f) => fs.statSync(f).isFile() && fs.readFileSync(f, 'utf8').indexOf('OurgoalComponentsKit') >= 0);
}

function readPart(f) { return fs.readFileSync(f, 'utf8').replace(/(^|[^A-Za-z0-9_$.])[TK]\.(?=[A-Za-z_$])/g, '$1'); }

function readComponentsBundle() {
  const raw = fs.readFileSync(COMPONENTS_JS, 'utf8');
  const parts = componentsPartFiles();
  const src = [raw, ...parts.map(readPart)].join('\n');
  if (src.slice(0, raw.length) !== raw) throw new Error('컴포넌트 합본 맨 앞이 js/components.js 원문이 아님');
  if (parts.length === 0 && src !== raw) throw new Error('컴포넌트 합본이 js/components.js 와 다름(부품 파일이 없을 때)');
  return src;
}

// index.html 이 읽는 순서(부품 먼저, 원본 마지막) — vm 으로 직접 돌리는 시험이 브라우저와 같은 순서로 읽게 한다.
function componentsLoadOrder() { return [...componentsPartFiles(), COMPONENTS_JS]; }

module.exports = { COMPONENTS_JS, componentsPartFiles, readComponentsBundle, componentsLoadOrder };
