'use strict';
// #TASK-ES-395 아바타·EXP 쪼개기 PR-5 — index.html 인라인 EXP 코드를 js/avatar/xp.js(EXP 세포)로 옮기는 생성기(작업자 도구, 판정 아님).
//   옮기는 선언(이전 전 index.html 의 「XP/레벨 시스템」 구간): XP_RULES · XP_LOG_MAX · xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · awardXP · notifyXpGained
//   바꾸는 글자: ① IIFE 스코프 이름 state · nowISO → L.state · L.nowISO (js/core/app-scope.js 통로, 이미 노출된 이름)
//               ② 저장 어댑터: awardXP 머리 두 줄(settings.xp 만들기·읽기)을 xpStore(true) 한 곳으로 모음 — 저장 위치는 그대로 settings.xp
//   index.html: 구간 자리에는 안내 주석 + window.* 대입 5줄(원래 자리) · IIFE 머리에 같은 이름 가져오기 · <script src="js/avatar/xp.js"> 1줄(avatar-system.js 앞)
// 재실행해도 같은 결과(이미 옮겼으면 멈춤). 사용: node gen-avatar-xp.js <APP_DIR>
const fs = require('fs'), path = require('path'), assert = require('assert');
const APP = path.resolve(process.argv[2] || '.');
const IDX = path.join(APP, 'index.html');
const OUT = path.join(APP, 'js', 'avatar', 'xp.js');
const raw = fs.readFileSync(IDX, 'utf8');
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
const lines = raw.split(/\r?\n/);
const START = '  /* ============ XP/레벨 시스템 ============ */';
const END = '  window.notifyXpGained = notifyXpGained;';
const s = lines.indexOf(START), e = lines.indexOf(END);
if (s < 0) { console.log('이미 옮김(구간 머리 없음) — 멈춤'); process.exit(0); }
assert.ok(e > s, '구간 끝 줄');
const block = lines.slice(s + 1, e + 1);
const WIN = /^  window\.(triggerAvatarCelebrationPopup|xpForLevel|levelForXP|levelProgress|notifyXpGained) = \1;$/;
const winLines = block.filter(l => WIN.test(l));
assert.strictEqual(winLines.length, 5, 'window 대입 5줄');
let moved = block.filter(l => !WIN.test(l));
while (moved.length && moved[moved.length - 1].trim() === '') moved.pop();
// ① 스코프 이름 접두
let nState = 0, nNow = 0;
moved = moved.map(l => l
  .replace(/(^|[^A-Za-z0-9_$.])state\./g, (m, p) => { nState++; return p + 'L.state.'; })
  .replace(/(^|[^A-Za-z0-9_$.])nowISO\(/g, (m, p) => { nNow++; return p + 'L.nowISO('; }));
assert.strictEqual(nState, 7, 'state. 7곳(팝업 1줄 4곳 + awardXP 머리 3곳)');
assert.strictEqual(nNow, 1, 'nowISO( 1곳');
// ② 저장 어댑터
const A1 = '    if(!L.state.profile.settings.xp) L.state.profile.settings.xp = { total:0, log:[] };';
const A2 = '    var xp = L.state.profile.settings.xp;';
const ai = moved.indexOf(A1);
assert.ok(ai > 0 && moved[ai + 1] === A2 && moved[ai - 1] === '  function awardXP(amount, reason){', 'awardXP 머리 두 줄');
moved.splice(ai, 2, '    var xp = xpStore(true);');
const ADAPTER = [
  '  // 저장 어댑터(1단계): EXP 를 어디에 두는지는 이 함수 하나만 안다 — 지금은 옮기기 전과 같은 state.profile.settings.xp.',
  '  // create=true 면 없을 때 { total:0, log:[] } 를 만들어 둔다(옮기기 전 awardXP 머리 두 줄 글자 그대로), false 면 만들지 않고 없으면 null(프로필이 없어도 던지지 않음).',
  '  // 서버 원장 이관(2단계, 결심 K-XP1 뒤)은 이 함수만 바꾼다 — 호출처는 다시 만지지 않는다.',
  '  function xpStore(create){',
  '    if(!create){',
  '      var s = L.state && L.state.profile && L.state.profile.settings;',
  '      return (s && s.xp) || null;',
  '    }',
  '    if(!L.state.profile.settings.xp) L.state.profile.settings.xp = { total:0, log:[] };',
  '    return L.state.profile.settings.xp;',
  '  }',
];
const awi = moved.indexOf('  function awardXP(amount, reason){');
moved.splice(awi, 0, ...ADAPTER);
const header = [
  '/**',
  ' * OurGoal Avatar Cell: EXP·레벨 (#TASK-ES-395 · 아바타·EXP 쪼개기 PR-5, 설계 docs/specs/REQ-TASK-ES-384-AVATAR-EXP-PLAN.md 3-2절)',
  ' *',
  ' * index.html 인라인 IIFE 의 「XP/레벨 시스템」 구간(이전 전 ' + (s + 1) + '~' + (e + 1) + '줄)의 선언을 동작 그대로 옮겼다(생성기 docs/design/harness/module-split/gen-avatar-xp.js).',
  ' *   XP_RULES · XP_LOG_MAX · xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · awardXP · notifyXpGained',
  ' * 바꾼 것: 인라인 스코프 이름은 L.<이름>(state · nowISO), 저장은 어댑터 xpStore 하나로 모음 — 저장 위치는 그대로 state.profile.settings.xp.',
  ' * index.html 은 IIFE 맨 위에서 이 키트(OurgoalAvatarParts.xp — 새 전역 없음)의 이름을 같은 이름으로 가져온다 — 지급 호출처·app-scope getter 는 글자 그대로다.',
  ' * window.xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · notifyXpGained 대입 줄은 이전 전과 같은 자리(index.html)에 있다.',
  ' * 능력: xp.award(지급) · xp.read(읽기, 만들지 않음) 을 js/core/capabilities.js 에 준다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  '  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state · nowISO)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.',
  '  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};',
  '  var CELL = \'avatar/xp\';',
  '',
];
const footer = [
  '',
  '  // 읽기(만들지 않음): 지금 합계와 레벨 진행 — xp.read 능력',
  '  function readXP(){',
  '    var xp = xpStore(false);',
  '    var total = xp ? xp.total : 0;',
  '    return levelProgress(total);',
  '  }',
  '',
  '  // 키트: 아바타 부품 통로(OurgoalAvatarParts, #TASK-ES-389 의 전역) 안의 xp 칸 — 새 전역 이름을 만들지 않는다.',
  '  var AVP = global.OurgoalAvatarParts = global.OurgoalAvatarParts || {};',
  '  var K = AVP.xp = AVP.xp || {};',
  '  K.XP_RULES = XP_RULES;',
  '  K.XP_LOG_MAX = XP_LOG_MAX;',
  '  K.xpForLevel = xpForLevel;',
  '  K.levelForXP = levelForXP;',
  '  K.levelProgress = levelProgress;',
  '  K.triggerAvatarCelebrationPopup = triggerAvatarCelebrationPopup;',
  '  K.awardXP = awardXP;',
  '  K.notifyXpGained = notifyXpGained;',
  '  K.xpStore = xpStore;',
  '  K.readXP = readXP;',
  '  K.CELL = CELL;',
  '',
  '  var caps = global.OurgoalCapabilities;',
  "  if (!caps && typeof module !== 'undefined' && module.exports && typeof require === 'function') {",
  "    caps = require('../core/capabilities.js');",
  '  }',
  "  if (caps && typeof caps.provide === 'function') {",
  "    caps.provide('xp.award', awardXP, {",
  '      cell: CELL,',
  "      description: 'EXP 를 지급한다(합계 더하기 + 이력 맨 앞에 기록, 200건 상한) — 저장은 state.profile.settings.xp(기기). 0 보다 크면 축하 팝업, 홈 링에 알림',",
  "      sideEffect: 'local',",
  "      input: { amount: 'number', reason: 'string' },",
  "      output: { total: 'number', leveledUp: 'boolean' }",
  '    });',
  "    caps.provide('xp.read', readXP, {",
  '      cell: CELL,',
  "      description: '지금 EXP 합계와 레벨 진행(level·xp·into·span·pct)을 읽는다. 저장 칸이 없으면 0 으로 계산하고 만들지 않는다',",
  "      sideEffect: 'none',",
  '      input: null,',
  "      output: { level: 'number', xp: 'number', into: 'number', span: 'number', pct: 'number' }",
  '    });',
  '  }',
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  '})(typeof window !== \'undefined\' ? window : globalThis);',
  '',
];
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, [...header, ...moved, ...footer].join('\n'), 'utf8');

// index.html — 구간 자리
const NOTE = [
  '  /* ============ XP/레벨 시스템 ============',
  '     [#TASK-ES-395] 선언(XP_RULES · XP_LOG_MAX · xpForLevel · levelForXP · levelProgress · triggerAvatarCelebrationPopup · awardXP · notifyXpGained)은 js/avatar/xp.js 로 옮김(동작 그대로).',
  '     이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 window 대입 줄은 원래 자리 그대로다. */',
];
const newBlock = [...NOTE, ...winLines];
lines.splice(s, e - s + 1, ...newBlock);
// IIFE 머리 가져오기
const HEAD_AFTER = '  var download = _ui.download;';
const hi = lines.indexOf(HEAD_AFTER);
assert.ok(hi > 0 && hi < s, 'IIFE 머리 기준 줄');
const IMPORT = [
  '  /* [#TASK-ES-395] EXP 세포 가져오기 — js/avatar/xp.js(window.OurgoalAvatarParts.xp)로 옮긴 EXP 이름을 같은 이름으로 부른다. 지급 호출처·app-scope getter 는 글자 그대로다. */',
  '  var _xp = window.OurgoalAvatarParts.xp;',
  '  var XP_RULES = _xp.XP_RULES;',
  '  var xpForLevel = _xp.xpForLevel;',
  '  var levelForXP = _xp.levelForXP;',
  '  var levelProgress = _xp.levelProgress;',
  '  var triggerAvatarCelebrationPopup = _xp.triggerAvatarCelebrationPopup;',
  '  var awardXP = _xp.awardXP;',
  '  var notifyXpGained = _xp.notifyXpGained;',
];
lines.splice(hi + 1, 0, ...IMPORT);
// <script>
const TAG_BEFORE = '  <script src="js/avatar-system.js?v=20260913-es054"></script>';
const ti = lines.indexOf(TAG_BEFORE);
assert.ok(ti > 0, 'avatar-system.js <script> 줄');
lines.splice(ti, 0, '  <script src="js/avatar/xp.js?v=20261005-es395"></script>');
fs.writeFileSync(IDX, lines.join(EOL), 'utf8');
console.log(JSON.stringify({ movedFrom: [s + 1, e + 1], movedLines: block.length, xpJsLines: [...header, ...moved, ...footer].length - 1, stateRefs: nState, nowIsoRefs: nNow, windowLinesKept: winLines.length, importLines: IMPORT.length, scriptTag: 1 }));
