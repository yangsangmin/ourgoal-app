#!/usr/bin/env node
/**
 * gen-expert-templates.js — #TASK-ES-425 (세포 분열: 전문가 목표 템플릿 레지스트리)
 *
 * 이전 전 js/goal-templates-registry.js(2,815줄)를 입력으로 받아
 *  - MATCH_RULES 배열 원소 60개와 TEMPLATE_MAP 항목 60개를 템플릿 id 접두(TPL-HLT·STD·CAR·HOB·MND·REL)별로
 *    js/data/expert-templates/<분야>.js 6개 데이터 세포로 "줄 그대로" 옮기고(끝 쉼표 포함, 고친 글자 0),
 *  - 원래 파일은 머리 주석·함수 3개·module.exports 를 그대로 두고, 두 이름(MATCH_RULES·TEMPLATE_MAP)을
 *    같은 순서로 다시 조립하는 몇 줄로 데이터 자리를 바꾼다.
 * 손으로 옮기지 않는다(CELL_SPLIT 2). 데이터를 고칠 때도 이 생성기를 고친다.
 *
 * 사용: node gen-expert-templates.js <APP 루트> <이전 전 goal-templates-registry.js>
 *
 * 검사(어기면 중단):
 *  ① 두 구간(var MATCH_RULES = [ … ]; / var TEMPLATE_MAP = { … };)을 정확히 찾는다
 *  ② 규칙 원소·지도 항목이 각각 60개 · ③ 접두가 PARTS 순서로 이어서 나온다(끊기면 순서가 바뀌므로 중단)
 *  ④ 각 분야 10개씩 · ⑤ 만든 파일은 모두 800줄 이하
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PARTS = [
  { prefix: 'HLT', file: 'health', label: '운동·건강' },
  { prefix: 'STD', file: 'study', label: '학습·자격' },
  { prefix: 'CAR', file: 'career', label: '커리어·머니' },
  { prefix: 'HOB', file: 'hobby', label: '취미·창작' },
  { prefix: 'MND', file: 'mind', label: '마음·습관' },
  { prefix: 'REL', file: 'relation', label: '관계·생활' }
];
const PART_DIR = 'js/data/expert-templates';
const MAX_LINES = 800;

function fail(msg) { console.error('[gen-expert-templates] 중단: ' + msg); process.exit(1); }

const app = process.argv[2];
const srcPath = process.argv[3];
if (!app || !srcPath) fail('사용: node gen-expert-templates.js <APP 루트> <이전 전 goal-templates-registry.js>');

// 저장소 원본(blob)은 LF 다. core.autocrlf 로 풀린 CRLF 사본이 들어와도 LF 로 맞춰 읽는다(git 이 다시 LF 로 저장).
const src = fs.readFileSync(srcPath, 'utf8').replace(/\r\n/g, '\n');
if (src.indexOf('\r') >= 0) fail('줄 끝이 아닌 자리에 CR 이 있다 — 줄 그대로 옮기기 전제가 깨진다');
const lines = src.split('\n');

// ① 구간
const rStart = lines.indexOf('var MATCH_RULES = [');
const rEnd = lines.indexOf('];', rStart);
const mStart = lines.indexOf('var TEMPLATE_MAP = {');
const mEnd = lines.indexOf('};', mStart);
if (rStart < 0 || rEnd < 0 || mStart !== rEnd + 1 || mEnd < 0) fail('MATCH_RULES / TEMPLATE_MAP 구간 경계를 못 찾음');

// 원소 묶기: "  {"(규칙) 또는 '  "TPL-…": {'(지도)로 시작해 "  }" / "  }," 로 끝나는 줄 묶음
function chunks(from, to, isOpen, idOf) {
  const out = []; let cur = null;
  for (let i = from + 1; i < to; i++) {
    const l = lines[i];
    if (isOpen(l)) { if (cur) fail('원소 경계 중첩 ' + (i + 1)); cur = { from: i, body: [l] }; continue; }
    if (!cur) fail('원소 밖 줄 ' + (i + 1) + ': ' + l);
    cur.body.push(l);
    if (l === '  }' || l === '  },') { cur.id = idOf(cur); out.push(cur); cur = null; }
  }
  if (cur) fail('닫히지 않은 원소');
  return out;
}
const rules = chunks(rStart, rEnd, l => l === '  {', c => JSON.parse(c.body.join('\n').replace(/,$/, '')).id);
const entries = chunks(mStart, mEnd, l => /^  "TPL-[A-Z]{3}-\d{2}": \{$/.test(l), c => c.body[0].match(/"(TPL-[A-Z]{3}-\d{2})"/)[1]);
if (rules.length !== 60) fail('규칙 원소 수 ' + rules.length + ' ≠ 60');
if (entries.length !== 60) fail('지도 항목 수 ' + entries.length + ' ≠ 60');

// ③④ 접두 순서
function group(list, what) {
  const g = new Map(); let prev = null;
  for (const c of list) {
    const p = c.id.split('-')[1];
    if (p !== prev) { if (g.has(p)) fail(what + ' 접두 ' + p + ' 가 끊겨 두 번 나온다'); g.set(p, []); prev = p; }
    g.get(p).push(c);
  }
  const order = Array.from(g.keys());
  if (JSON.stringify(order) !== JSON.stringify(PARTS.map(x => x.prefix))) fail(what + ' 접두 순서가 PARTS 와 다르다: ' + order.join(','));
  for (const [p, arr] of g) if (arr.length !== 10) fail(what + ' ' + p + ' 가 10개가 아니다: ' + arr.length);
  return g;
}
const rg = group(rules, 'MATCH_RULES');
const mg = group(entries, 'TEMPLATE_MAP');

const written = [];
fs.mkdirSync(path.join(app, PART_DIR), { recursive: true });
for (const p of PARTS) {
  const out = [
    '/**',
    ' * @role 전문가 목표 템플릿 레지스트리 자료 — ' + p.label + ' 10종 (TPL-' + p.prefix + '-01~10)',
    ' *',
    ' * #TASK-ES-425: js/goal-templates-registry.js 의 MATCH_RULES·TEMPLATE_MAP 에서 이 분야 줄을 글자 그대로 옮긴 자료만 있다(로직 없음).',
    ' * 조립자 js/goal-templates-registry.js 가 ' + PARTS.map(x => x.prefix).join('→') + ' 순서로 이어 같은 MATCH_RULES 배열·TEMPLATE_MAP 객체를 만든다.',
    ' * 서버(api/goaltemplate.js 스마트 폴백)가 require 로 읽는다. 브라우저 script 태그로는 부르지 않는다.',
    ' * 생성기: docs/design/harness/module-split/gen-expert-templates.js — 손으로 고치지 말고 내용을 바꿀 때도 생성기를 고친다.',
    ' */',
    '(function() {',
    'var MATCH_RULES = ['
  ];
  for (const c of rg.get(p.prefix)) out.push(...c.body);
  out.push('];');
  out.push('var TEMPLATE_MAP = {');
  for (const c of mg.get(p.prefix)) out.push(...c.body);
  out.push('};');
  out.push('var part = { MATCH_RULES: MATCH_RULES, TEMPLATE_MAP: TEMPLATE_MAP };');
  out.push("if (typeof module !== 'undefined' && module.exports) module.exports = part;");
  out.push('})();');
  out.push('');
  const rel = PART_DIR + '/' + p.file + '.js';
  const text = out.join('\n');
  const n = text.split('\n').length - 1;
  if (n > MAX_LINES) fail(rel + ' 가 ' + n + '줄 > ' + MAX_LINES);
  fs.writeFileSync(path.join(app, rel), text, 'utf8');
  written.push({ file: rel, lines: n });
}

// 조립자: 머리 주석(1줄) + 조립 몇 줄 + 원래 꼬리(지도 닫는 줄 다음부터 끝까지, 글자 그대로)
const head = lines.slice(0, rStart);
const tail = lines.slice(mEnd + 1);
const assembler = [
  '// #TASK-ES-425 세포 분열: 분야별 자료는 js/data/expert-templates/<분야>.js 로 글자 그대로 옮겼다. 여기서는 같은 순서로 같은 이름에 다시 모은다.',
  '// (부품은 require 로만 읽힌다 — 이 파일은 원래부터 서버 전용 CommonJS 다)',
  'var MATCH_RULES = [];',
  'var TEMPLATE_MAP = {};',
  '(function() {',
  "  var parts = typeof require === 'function' ? [",
  ...PARTS.map((p, i) => "    require('./data/expert-templates/" + p.file + ".js')" + (i < PARTS.length - 1 ? ',' : '')),
  '  ] : [];',
  '  for (var i = 0; i < parts.length; i++) {',
  '    var part = parts[i];',
  '    for (var j = 0; j < part.MATCH_RULES.length; j++) MATCH_RULES.push(part.MATCH_RULES[j]);',
  '    for (var k in part.TEMPLATE_MAP) {',
  '      if (Object.prototype.hasOwnProperty.call(part.TEMPLATE_MAP, k)) TEMPLATE_MAP[k] = part.TEMPLATE_MAP[k];',
  '    }',
  '  }',
  '})();'
];
const orig = head.concat(assembler, tail).join('\n');
const on = orig.split('\n').length - (orig.endsWith('\n') ? 1 : 0);
if (on > MAX_LINES) fail('조립자가 ' + on + '줄 > ' + MAX_LINES);
fs.writeFileSync(path.join(app, 'js/goal-templates-registry.js'), orig, 'utf8');
written.push({ file: 'js/goal-templates-registry.js', lines: on });

const spans = { head: [1, rStart], rules: [rStart + 1, rEnd + 1], map: [mStart + 1, mEnd + 1], tail: [mEnd + 2, lines.length] };
console.log(JSON.stringify({ ok: true, source: { lines: lines.length - (src.endsWith('\n') ? 1 : 0), spans }, written }, null, 2));
