#!/usr/bin/env node
/**
 * gen-avatar-data.js — #TASK-ES-386 (아바타·EXP 쪼개기 PR-2: 페르소나 데이터, 설계 REQ-TASK-ES-384 5절)
 *
 * 이전 전 js/avatar-system.js 를 입력으로 받아 BODY_THEMES_320(320종 페르소나) 배열을 MBTI 16개 데이터 파일
 * (js/data/avatar-personas/<mbti>.js)로 글자 그대로 옮기고, avatar-system.js 의 배열 자리는 같은 이름·같은 순서의
 * 배열을 다시 만드는 조립 줄로 바꾼다. 그 밖의 글자는 한 자도 바꾸지 않는다. 손으로 옮기지 않는다(MODULE-SPLIT-PROTOCOL 5절 2).
 * 선례: gen-template-data.js (#TASK-ES-364).
 *
 * 사용: node gen-avatar-data.js <APP 루트> <이전 전 avatar-system.js>
 *
 * 검사(어기면 중단):
 *  ① 배열 원소 경계가 정확히 320개 · ② MBTI 가 이어서 나온다(같은 MBTI 가 끊겨 두 번 나오면 순서가 바뀌므로 중단)
 *  ③ MBTI 순서 = PART_ORDER 16개 그대로, 각 20개 · ④ 옮긴 원소 글자 = 원본 원소 글자(파트 마지막 원소의 끝 쉼표만 다름)
 *  ⑤ 조립 뒤 avatar-system.js 에서 배열 구간을 뺀 나머지 글자 = 원본에서 배열 구간을 뺀 나머지 글자
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PART_ORDER = ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp',
  'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp'];
const PART_DIR = 'js/data/avatar-personas';
const OPEN_LINE = '  var BODY_THEMES_320 = [';
const CLOSE_LINE = '];';

function fail(msg) { console.error('[gen-avatar-data] 중단: ' + msg); process.exit(1); }

const app = process.argv[2];
const srcPath = process.argv[3];
if (!app || !srcPath) fail('사용: node gen-avatar-data.js <APP 루트> <이전 전 avatar-system.js>');

const raw = fs.readFileSync(srcPath, 'utf8');
if (raw.indexOf('\r\n') !== -1) fail('CRLF 줄끝 — 원본은 LF 여야 한다');
const lines = raw.split('\n');
const start = lines.indexOf(OPEN_LINE);
const end = lines.indexOf(CLOSE_LINE, start);
if (start < 0 || end < 0) fail('var BODY_THEMES_320 = [ … ]; 구간을 못 찾음');

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
if (elems.length !== 320) fail('① 원소 수 ' + elems.length + ' ≠ 320');

const groups = new Map();
let prev = null;
for (const e of elems) {
  const obj = JSON.parse(e.body.join('\n').replace(/,$/, ''));
  e.obj = obj;
  const key = String(obj.mbti).toLowerCase();
  if (key !== prev) {
    if (groups.has(key)) fail('② MBTI ' + key + ' 가 끊겨 두 번 나온다 — 나누면 순서가 바뀐다');
    groups.set(key, []);
    prev = key;
  }
  groups.get(key).push(e);
}
if (JSON.stringify(Array.from(groups.keys())) !== JSON.stringify(PART_ORDER)) fail('③ MBTI 순서가 PART_ORDER 와 다르다: ' + Array.from(groups.keys()).join(','));
for (const k of PART_ORDER) if (groups.get(k).length !== 20) fail('③ ' + k + ' 원소 ' + groups.get(k).length + ' ≠ 20');

fs.mkdirSync(path.join(app, PART_DIR), { recursive: true });
const written = [];
for (const key of PART_ORDER) {
  const es = groups.get(key);
  const body = [];
  es.forEach((e, idx) => {
    const b = e.body.slice();
    if (idx === es.length - 1) b[b.length - 1] = '  }'; // 파트의 마지막 원소만 끝 쉼표를 뗀다(값 동일)
    body.push(...b);
  });
  const first = es[0].obj;
  const last = es[es.length - 1].obj;
  const out = [
    '/**',
    ' * @role 아바타 페르소나 데이터 — ' + first.mbti + ' ' + es.length + '종 (id ' + first.id + '~' + last.id + ', group ' + first.group + ')',
    ' *',
    ' * #TASK-ES-386: js/avatar-system.js 의 BODY_THEMES_320 에서 글자 그대로 옮긴 데이터만 있다(로직 없음).',
    ' * js/avatar-system.js 가 intj→intp→…→esfp 순서로 이어 BODY_THEMES_320 을 만든다.',
    ' * 생성기: docs/design/harness/module-split/gen-avatar-data.js — 동일성 시험: tests/ 폴더 avatar-personas-split 시험',
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
    '    (root.OurgoalAvatarPersonaParts = root.OurgoalAvatarPersonaParts || {}).' + key + ' = LIST;',
    '  }',
    "})(typeof self !== 'undefined' ? self : this);",
    ''
  ].join('\n');
  const rel = PART_DIR + '/' + key + '.js';
  fs.writeFileSync(path.join(app, rel), out, 'utf8');
  written.push([rel, out.split('\n').length - 1, es.length]);
}

// 조립: 배열 구간(OPEN_LINE ~ CLOSE_LINE) 자리에만 파트 잇기 줄을 넣는다. 머리·꼬리는 원래 글자.
const head = lines.slice(0, start);
const tail = lines.slice(end + 1);
const assembly = [
  '  // #TASK-ES-386: 320종 페르소나 데이터는 MBTI 16개 파일(js/data/avatar-personas/<mbti>.js)에 있다.',
  '  // 브라우저: index.html 이 이 파일보다 먼저 16개를 읽어 전역 OurgoalAvatarPersonaParts 에 둔다. Node: require 로 읽는다.',
  '  // 원래 배열과 같은 순서로 잇는다 — 동일성 시험: tests/ 폴더 avatar-personas-split 시험',
  '  var PERSONA_PART_ORDER = [' + PART_ORDER.map(k => "'" + k + "'").join(', ') + '];',
  '  function loadPersonaParts() {',
  "    if (typeof module === 'object' && module && module.exports && typeof require === 'function') {",
  '      return {',
  ...PART_ORDER.map((k, i) => "        " + k + ": require('./data/avatar-personas/" + k + ".js')" + (i < PART_ORDER.length - 1 ? ',' : '')),
  '      };',
  '    }',
  "    return (typeof OurgoalAvatarPersonaParts !== 'undefined' && OurgoalAvatarPersonaParts) || {};",
  '  }',
  '  var PERSONA_PARTS = loadPersonaParts();',
  '  var BODY_THEMES_320 = [];',
  '  PERSONA_PART_ORDER.forEach(function (key) {',
  '    var part = PERSONA_PARTS[key];',
  '    if (part && part.length) BODY_THEMES_320.push.apply(BODY_THEMES_320, part);',
  '  });'
];
const assembled = head.concat(assembly, tail).join('\n');
fs.writeFileSync(path.join(app, 'js/avatar-system.js'), assembled, 'utf8');
written.push(['js/avatar-system.js', assembled.split('\n').length - (assembled.endsWith('\n') ? 1 : 0), 'assembler']);

// ④ 글자 검사: 파트 원소를 다시 이어 원본 원소 글자와 대조
let joined = [];
for (const key of PART_ORDER) {
  const t = fs.readFileSync(path.join(app, PART_DIR, key + '.js'), 'utf8').split('\n');
  const a = t.indexOf('  var LIST = [');
  const b = t.indexOf('  ];', a);
  const seg = t.slice(a + 1, b);
  seg[seg.length - 1] = '  },';
  joined = joined.concat(seg);
}
joined[joined.length - 1] = '  }';
if (joined.join('\n') !== lines.slice(start + 1, end).join('\n')) fail('④ 옮긴 글자가 원본과 다르다');

// ⑤ 나머지 글자 검사: 조립 줄을 뺀 avatar-system.js = 원본에서 배열 구간을 뺀 글자
const after = fs.readFileSync(path.join(app, 'js/avatar-system.js'), 'utf8').split('\n');
const restAfter = after.slice(0, start).concat(after.slice(start + assembly.length)).join('\n');
const restBase = head.concat(tail).join('\n');
if (restAfter !== restBase) fail('⑤ 배열 밖 글자가 원본과 다르다');

for (const w of written) console.log(w[0] + '\t' + w[1] + '줄\t' + w[2]);
console.log('④ 글자 검사: 320개 원소 글자 원본과 같음(파트 끝 쉼표만 다름)');
console.log('⑤ 나머지 글자 검사: 배열 구간 밖 ' + (head.length + tail.length - (raw.endsWith('\n') ? 1 : 0)) + '줄 원본과 같음');
