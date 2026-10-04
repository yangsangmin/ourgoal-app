#!/usr/bin/env node
/**
 * gen-template-data.js — #TASK-ES-364 (쪼개는 순서 7: 데이터 파일)
 *
 * 이전 전 js/goal-templates-data.js 를 입력으로 받아 템플릿 60종 배열을 카테고리 6개 데이터 파일로
 * 글자 그대로 옮기고, 원래 파일은 같은 전역(OURGOAL_60_TEMPLATES)·같은 함수(list·getByCategory·getById·search)를
 * 내는 조립자로 다시 쓴다. 손으로 옮기지 않는다(MODULE-SPLIT-PROTOCOL 5절 2).
 *
 * 사용: node gen-template-data.js <APP 루트> <이전 전 goal-templates-data.js>
 *
 * 검사(어기면 중단):
 *  ① 배열 원소 경계가 정확히 60개 · ② 카테고리가 이어서 나온다(같은 카테고리가 두 번 끊겨 나오면 순서가 바뀌므로 중단)
 *  ③ 카테고리는 PART_ORDER 6개 그대로 · ④ 옮긴 원소 글자 = 원본 원소 글자(마지막 원소의 끝 쉼표만 다름)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PART_ORDER = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
const PART_DIR = 'js/data/goal-templates';

function fail(msg) { console.error('[gen-template-data] 중단: ' + msg); process.exit(1); }

const app = process.argv[2];
const srcPath = process.argv[3];
if (!app || !srcPath) fail('사용: node gen-template-data.js <APP 루트> <이전 전 goal-templates-data.js>');

const src = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
const lines = src.split('\n');
const start = lines.indexOf('  var TEMPLATES = [');
const end = lines.indexOf('  ];', start);
if (start < 0 || end < 0) fail('var TEMPLATES = [ … ]; 구간을 못 찾음');

// 배열 원소 = 정확히 "  {" 로 시작해 "  }" 또는 "  }," 로 끝나는 줄 묶음
const elems = [];
let cur = null;
for (let i = start + 1; i < end; i++) {
  const l = lines[i];
  if (l === '  {') { if (cur) fail('원소 경계 중첩 ' + (i + 1)); cur = { from: i, body: [l] }; continue; }
  if (!cur) fail('원소 밖 줄 ' + (i + 1) + ': ' + l);
  cur.body.push(l);
  if (l === '  }' || l === '  },') { elems.push(cur); cur = null; }
}
if (cur) fail('닫히지 않은 원소');
if (elems.length !== 60) fail('원소 수 ' + elems.length + ' ≠ 60');

const groups = new Map();
let prevCat = null;
for (const e of elems) {
  const obj = JSON.parse(e.body.join('\n').replace(/,$/, ''));
  e.obj = obj;
  if (obj.category !== prevCat) {
    if (groups.has(obj.category)) fail('카테고리 ' + obj.category + ' 가 끊겨 두 번 나온다 — 나누면 순서가 바뀐다');
    groups.set(obj.category, []);
    prevCat = obj.category;
  }
  groups.get(obj.category).push(e);
}
if (JSON.stringify(Array.from(groups.keys())) !== JSON.stringify(PART_ORDER)) fail('카테고리 순서가 PART_ORDER 와 다르다: ' + Array.from(groups.keys()).join(','));

const LABEL = {};
for (const cat of PART_ORDER) LABEL[cat] = groups.get(cat)[0].obj.categoryMajorLabel;

fs.mkdirSync(path.join(app, PART_DIR), { recursive: true });
const written = [];
for (const cat of PART_ORDER) {
  const es = groups.get(cat);
  const body = [];
  es.forEach((e, idx) => {
    const b = e.body.slice();
    if (idx === es.length - 1) b[b.length - 1] = '  }'; // 파트의 마지막 원소만 끝 쉼표를 뗀다(값 동일)
    body.push(...b);
  });
  const out = [
    '/**',
    ' * @role 목표 템플릿 데이터 — ' + LABEL[cat] + ' ' + es.length + '종 (category: ' + cat + ')',
    ' *',
    ' * #TASK-ES-364: js/goal-templates-data.js 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).',
    ' * 조립자 js/goal-templates-data.js 가 health→study→career→hobby→mind→relation 순서로 이어 OURGOAL_60_TEMPLATES.list 를 만든다.',
    ' * 생성기: docs/design/harness/module-split/gen-template-data.js — 손으로 고치지 말고 내용을 바꿀 때도 이 파일만 고친다.',
    ' */',
    '(function(root) {',
    "  'use strict';",
    '',
    '  var LIST = [',
    ...body,
    '  ];',
    '',
    "  if (typeof module === 'object' && module && module.exports) {",
    '    module.exports = LIST;',
    '  } else if (root) {',
    '    (root.OurgoalGoalTemplateParts = root.OurgoalGoalTemplateParts || {}).' + cat + ' = LIST;',
    '  }',
    "})(typeof self !== 'undefined' ? self : this);",
    ''
  ].join('\n');
  const rel = PART_DIR + '/' + cat + '.js';
  fs.writeFileSync(path.join(app, rel), out, 'utf8');
  written.push([rel, out.split('\n').length - 1, es.length]);
}

// 조립자: 머리(UMD 노출부, 원래 글자) + 배열 자리에 파트 잇기 + 꼬리(함수, 원래 글자)
const head = lines.slice(0, start);
const tail = lines.slice(end + 1);
const assembly = [
  '  // #TASK-ES-364: 템플릿 60종 데이터는 카테고리 6개 파일(js/data/goal-templates/<category>.js)에 있다.',
  '  // 브라우저: index.html 이 이 파일보다 먼저 6개를 읽어 OurgoalGoalTemplateParts 에 둔다. Node: require 로 읽는다.',
  '  // 원래 배열과 같은 순서로 잇는다 — 동일성 시험 tests/goal-templates-data-split.test.js',
  '  var PART_ORDER = [' + PART_ORDER.map(c => "'" + c + "'").join(', ') + '];',
  '  function loadParts() {',
  "    if (typeof module === 'object' && module && module.exports && typeof require === 'function') {",
  '      return {',
  ...PART_ORDER.map((c, i) => "        " + c + ": require('./data/goal-templates/" + c + ".js')" + (i < PART_ORDER.length - 1 ? ',' : '')),
  '      };',
  '    }',
  "    var host = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null);",
  '    return (host && host.OurgoalGoalTemplateParts) || {};',
  '  }',
  '  var PARTS = loadParts();',
  '  var TEMPLATES = [];',
  '  PART_ORDER.forEach(function(cat) {',
  '    var part = PARTS[cat];',
  '    if (part && part.length) TEMPLATES.push.apply(TEMPLATES, part);',
  '  });'
];
const assembler = head.concat(assembly, tail).join('\n');
fs.writeFileSync(path.join(app, 'js/goal-templates-data.js'), assembler, 'utf8');
written.push(['js/goal-templates-data.js', assembler.split('\n').length - (assembler.endsWith('\n') ? 1 : 0), 'assembler']);

// ④ 글자 검사: 파트 원소를 다시 이어 원본 원소 글자와 대조
let joined = [];
for (const cat of PART_ORDER) {
  const t = fs.readFileSync(path.join(app, PART_DIR, cat + '.js'), 'utf8').split('\n');
  const a = t.indexOf('  var LIST = [');
  const b = t.indexOf('  ];', a);
  const seg = t.slice(a + 1, b);
  seg[seg.length - 1] = '  },';
  joined = joined.concat(seg);
}
joined[joined.length - 1] = '  }';
const orig = lines.slice(start + 1, end);
if (joined.join('\n') !== orig.join('\n')) fail('④ 옮긴 글자가 원본과 다르다');

for (const w of written) console.log(w[0] + '\t' + w[1] + '줄\t' + w[2]);
console.log('④ 글자 검사: 60개 원소 글자 원본과 같음(파트 끝 쉼표만 다름)');
