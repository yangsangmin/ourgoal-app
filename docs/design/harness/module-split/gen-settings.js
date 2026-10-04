'use strict';
// 설정 탭 이전 생성기: index.html 의 설정 렌더 코드를 글자 그대로 js/tabs/settings/*.js 로 옮기고,
// 인라인 IIFE 스코프 이름은 L.<이름>(브리지), 다른 파일로 간 이전 함수는 K.<이름>(설정 키트)으로만 바꾼다.
const fs = require('fs');
const path = require('path');
const NM = ''; // @babel/* 는 NODE_PATH 로 찾는다(예: NODE_PATH=C:/dev/ourgoal-app/node_modules)
const parser = require(NM + '@babel/parser');
const traverse = require(NM + '@babel/traverse').default;

const APP = process.argv[2];
const SRC = process.argv[3] || path.join(APP, 'index.html'); // 원본(이전 전) index.html
const html = fs.readFileSync(SRC, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
let sLine = -1, eLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { sLine = i + 1; break; }
}
for (let i = sLine; i < lines.length; i++) if (lines[i].startsWith('</script>')) { eLine = i; break; }
const off = sLine; // parse line → html line (1-based): +off
const code = lines.slice(sLine, eLine).join('\n');
const ast = parser.parse(code, { sourceType: 'script', ranges: true });

// html 줄(1-based) 구간 → 대상 파일
const FILES = {
  render: 'js/tabs/settings/render.js',
  profile: 'js/tabs/settings/sub-profile.js',
  security: 'js/tabs/settings/sub-security.js',
  notify: 'js/tabs/settings/sub-notify.js',
  appearance: 'js/tabs/settings/sub-appearance.js',
  integrations: 'js/tabs/settings/sub-integrations.js',
  data: 'js/tabs/settings/sub-data.js',
};
const MOVED_FN = ['renderSettingsHeroCard', 'collapseAllSettingsSections', 'toggleAdvancedSettings', 'formatStorageBytes', 'paintCacheUsage', 'renderSettingsScreen'];
// 여러 탭이 같이 쓰는 순수 헬퍼: js/core/ui-helpers.js 로 실제로 옮긴다(설정이 쓰는 것만, 인라인 스코프 변수를 읽지 않는 것만)
const CORE_UI = ['escapeHtml', 'a11ySwitch', 'nowISO', 'download', 'triggerHaptic', 'triggerHapticFeedback'];
const MOVED = new Set([...MOVED_FN, 'bindSettingsHapticDelegate', 'bindSettingsStaticHandlers']);

let iife = null;
traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iScope = iife.scope;
const top = iife.get('body').get('body');
const H = n => n.loc.start.line + off, HE = n => n.loc.end.line + off;
const fnNode = name => top.find(s => s.isFunctionDeclaration() && s.node.id.name === name);
const rss = fnNode('renderSettingsScreen');
const RS = H(rss.node), RE = HE(rss.node);
// 설정 아코디언 햅틱 위임(문서 클릭 리스너) 문 하나, 그리고 renderSettingsScreen 바로 뒤의 정적 바인딩 문들
const hapticStmt = top.find(s => s.isExpressionStatement() && H(s.node) > HE(fnNode('renderSettingsHeroCard').node) && H(s.node) < H(fnNode('collapseAllSettingsSections').node));
const staticStmts = [];
for (const s of top) { if (H(s.node) > RE && s.isExpressionStatement()) staticStmts.push(s); else if (H(s.node) > RE) break; }
const ST_S = H(staticStmts[0].node), ST_E = HE(staticStmts[staticStmts.length - 1].node);

// renderSettingsScreen 본문 구간: 머리(앱 맞춤·위젯까지) + 소블록 6 구간. 경계는 주석 줄 기준(아래에서 문 경계 검사).
const bodyStmts = rss.get('body').get('body');
const firstLineOf = (needle, from) => { for (let l = from; l <= RE; l++) if (lines[l - 1].includes(needle)) return l; throw new Error('경계 못 찾음: ' + needle); };
const B_PROFILE = firstLineOf('// 🔒 공개 범위 및 프라이버시', RS);
const B_SECURITY = firstLineOf('// 🔐 계정 및 보안', RS);
const B_NOTIFY = firstLineOf('// 체크인 시간 설정', RS);
const B_APPEAR = firstLineOf('// 🎨 화면 스타일', RS);
const B_INTEG = firstLineOf('// 📅 구글 캘린더 연동', RS);
const B_DATA = firstLineOf('// AI 설정 (Gemini API 전면 단일화)', RS);
const SECTIONS = [
  ['profile', B_PROFILE, B_SECURITY - 1], ['security', B_SECURITY, B_NOTIFY - 1], ['notify', B_NOTIFY, B_APPEAR - 1],
  ['appearance', B_APPEAR, B_INTEG - 1], ['integrations', B_INTEG, B_DATA - 1], ['data', B_DATA, RE - 1],
];
// 문 경계 검사: 모든 본문 문이 한 구간 안에 통째로 있어야 한다
const secOfLine = l => { if (l > RS && l < B_PROFILE) return 'render'; const s = SECTIONS.find(([, a, b]) => l >= a && l <= b); return s ? s[0] : null; };
for (const st of bodyStmts) {
  const a = secOfLine(H(st.node)), b = secOfLine(HE(st.node));
  if (!a || a !== b) throw new Error('구간 경계가 문을 가른다: ' + H(st.node) + '~' + HE(st.node));
}
// 지역 변수 교차 검사: settings 말고는 한 구간에서만 쓰여야 한다
for (const [n, b] of Object.entries(rss.scope.bindings)) {
  const ls = [b.path.node, ...b.referencePaths.map(p => p.node), ...b.constantViolations.map(p => p.node)].map(x => secOfLine(H(x)));
  const set = new Set(ls);
  if (n !== 'settings' && set.size > 1) throw new Error('구간을 넘는 지역 변수: ' + n + ' ' + [...set]);
}
const settingsDecl = rss.scope.bindings.settings;
if (settingsDecl.constantViolations.length) throw new Error('settings 재할당 있음');
if (secOfLine(H(settingsDecl.path.node)) !== 'render') throw new Error('settings 선언이 머리에 없음');

// html 줄 → 파일 키
const fileOfLine = l => {
  const inFn = name => { const f = fnNode(name).node; return l >= H(f) && l <= HE(f); };
  if (['renderSettingsHeroCard', 'collapseAllSettingsSections', 'toggleAdvancedSettings', 'formatStorageBytes', 'paintCacheUsage'].some(inFn)) return 'render';
  if (l >= H(hapticStmt.node) && l <= HE(hapticStmt.node)) return 'render';
  if (l >= ST_S && l <= ST_E) return 'render';
  if (l === RS || l === RE) return 'render';
  if (l > RS && l < RE) return secOfLine(l);
  return null;
};
// 이전 함수가 선언된 파일
const DECL_FILE = { renderSettingsHeroCard: 'render', collapseAllSettingsSections: 'render', toggleAdvancedSettings: 'render', formatStorageBytes: 'render', paintCacheUsage: 'render', renderSettingsScreen: 'render' };

// 바꿔 쓸 식별자 수집
const edits = []; // {start, end, text}
const bridged = new Map();
const movedRegions = [rss, hapticStmt, ...staticStmts, ...MOVED_FN.filter(n => n !== 'renderSettingsScreen').map(fnNode)];
for (const m of movedRegions) {
  m.traverse({
    Identifier(p) {
      const n = p.node.name;
      const par = p.parent;
      if ((p.parentPath.isMemberExpression() || p.parentPath.isOptionalMemberExpression()) && par.property === p.node && !par.computed) return;
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed && !par.shorthand) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isLabeledStatement() || p.parentPath.isBreakStatement() || p.parentPath.isContinueStatement()) return;
      const b = p.scope.getBinding(n);
      if (!b || b.scope !== iScope) return;
      if (p.parentPath.isFunctionDeclaration() && par.id === p.node) return; // 이전 함수 선언 이름
      const here = fileOfLine(H(p.node));
      if (!here) throw new Error('파일 미정 줄 ' + H(p.node));
      let repl;
      if (MOVED.has(n)) { if (DECL_FILE[n] === here) return; repl = 'K.' + n; }
      else if (CORE_UI.includes(n)) { repl = 'U.' + n; }
      else { repl = 'L.' + n; if (!bridged.has(n)) bridged.set(n, { assigned: false, kind: b.kind }); }
      if (CORE_UI.includes(n) && ((p.parentPath.isAssignmentExpression() && par.left === p.node) || p.parentPath.isUpdateExpression())) throw new Error('core 헬퍼에 대입: ' + n);
      if (p.parentPath.isAssignmentExpression() && par.left === p.node) bridged.get(n).assigned = true;
      if (p.parentPath.isUpdateExpression()) bridged.get(n).assigned = true;
      if (p.parentPath.isObjectProperty() && par.shorthand) { edits.push({ start: par.start, end: par.end, text: n + ': ' + repl }); return; }
      edits.push({ start: p.node.start, end: p.node.end, text: repl });
    }
  });
}
// 같은 자리 중복 제거(shorthand 는 key/value 가 같은 노드)
const seen = new Set();
const uniq = edits.filter(e => { const k = e.start + ':' + e.end; if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.start - a.start);
let newCode = code;
for (const e of uniq) newCode = newCode.slice(0, e.start) + e.text + newCode.slice(e.end);
const newLines = newCode.split('\n'); // 줄 수는 그대로(바꿔 쓴 글자에 줄바꿈 없음)
if (newLines.length !== code.split('\n').length) throw new Error('줄 수가 바뀜');
const NL = l => newLines[l - 1 - off]; // html 줄 → 바꿔 쓴 줄
const range = (a, b) => { const o = []; for (let l = a; l <= b; l++) o.push(NL(l)); return o; };
const fnRange = name => range(H(fnNode(name).node), HE(fnNode(name).node));

const HEADER_BRIDGE = [
  "  // 공용 부품은 js/core 두 곳으로만 읽는다(설정 전용 통로 없음).",
  "  //  U = js/core/ui-helpers.js — 여러 탭이 같이 쓰는 순수 헬퍼(escapeHtml·a11ySwitch·nowISO·download·triggerHaptic·triggerHapticFeedback), 코드가 실제로 옮겨 와 있다.",
  "  //  L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·saveProfile·toast …)를 getter 로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.",
  "  var U = global.OurgoalUiHelpers || {};",
  "  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};",
  "  // 설정 키트: 설정 파일끼리 서로 부르는 함수 묶음(전역 이름을 새로 늘리지 않는다)",
  "  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};",
];
const SUB = {
  profile: { glob: 'OurgoalSettingsSubProfile', fn: 'renderProfileSection', id: 'profile', name: '공개 범위·아바타 인사·활동 상태', container: 'profileCard', title: 'Profile & Privacy (공개 범위 · 아바타 인사 팝업 · 실시간 활동 상태)' },
  security: { glob: 'OurgoalSettingsSubSecurity', fn: 'renderSecuritySection', id: 'security', name: '계정 및 보안', container: 'setAccountEmail', title: 'Account & Security (계정 표시 · 비밀번호 · 앱 잠금 PIN · 다른 기기 로그아웃)' },
  notify: { glob: 'OurgoalSettingsSubNotify', fn: 'renderNotifySection', id: 'notify', name: '체크인 시간·알림', container: 'checkinTimesRow', title: 'Check-in Times & Notifications (체크인 시간 · 알림 센터 · 방해금지 · 유형별 알림)' },
  appearance: { glob: 'OurgoalSettingsSubAppearance', fn: 'renderAppearanceSection', id: 'appearance', name: '화면 스타일', container: 'themeGrid', title: 'Appearance (테마 · 고대비 · 글자 크기 · 데이터 절약)' },
  integrations: { glob: 'OurgoalSettingsSubIntegrations', fn: 'renderIntegrationsSection', id: 'integrations', name: '외부 연동·차단·잇템', container: 'gcalStatusBox', title: 'Integrations (구글 캘린더 · 가상 페르소나 · 휴지통/차단 · 노션 · 잇템)' },
  data: { glob: 'OurgoalSettingsSubData', fn: 'renderDataSection', id: 'data', name: 'AI·저장공간·내보내기·지원', container: 'geminiKeyBlock', title: 'AI · Storage · Export · Support (AI 키 · 자동 제안 · 캐시 · 내보내기 형식 · 고객지원 · 고급 설정 햅틱)' },
};
const ORDER = ['profile', 'security', 'notify', 'appearance', 'integrations', 'data'];
const out = {};
for (const key of ORDER) {
  const sdef = SUB[key];
  const [, a, b] = SECTIONS.find(s => s[0] === key);
  const body = range(a, b);
  out[FILES[key]] = [
    '/**',
    ' * OurGoal Settings Sub-Block: ' + sdef.title,
    ' *',
    ' * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 renderSettingsScreen 의 이 구간(이전 전 ' + a + '~' + b + '줄)을 동작 그대로 옮겼다.',
    ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).',
    ' * 그리는 순서와 같은 settings 객체는 renderSettingsScreen(js/tabs/settings/render.js)이 정한다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
    ' */',
    '(function(global) {',
    "  'use strict';",
    ...HEADER_BRIDGE,
    '',
    '  /* 섹션 렌더: renderSettingsScreen 이 원래 순서대로 부른다. settings = state.profile.settings (renderSettingsScreen 이 한 번 읽어 넘긴 같은 객체) */',
    '  function ' + sdef.fn + '(settings){',
    ...body,
    '  }',
    '',
    '  var ' + sdef.glob + ' = {',
    "    id: '" + sdef.id + "',",
    "    megaBlockId: 'settings',",
    "    name: '" + sdef.name + "',",
    "    containerId: '" + sdef.container + "',",
    '',
    '    /** 실제 렌더(섹션 단위). 인자: settings 객체. renderSettingsScreen 이 순서대로 부른다. */',
    '    render: ' + sdef.fn + ',',
    '',
    '    /**',
    "     * 소블록 단독 마운트는 그리지 않고 false('그리지 않음')를 돌려준다.",
    '     * 설정 화면은 섹션끼리 settings 객체·호출 순서를 공유하므로 renderSettingsScreen 이 한 번에 그린다 —',
    "     * 메가블록(index.js)은 이 false 를 보고 이전과 같은 경로(setTab 의 renderSettingsScreen)로 넘긴다. (#TASK-ES-353 '실제로 그렸는가' 판정 유지)",
    '     */',
    '    mount: function(container, state, events) {',
    '      this.dispose(events);',
    '      return false;',
    '    },',
    '',
    '    /** 이 소블록이 건 구독 해제(#TASK-ES-353 소유자 키). 설정 섹션은 view:sync 로 다시 그리지 않는다(이전과 같음). */',
    '    dispose: function(events) {',
    '      var ev = events || global.OurgoalEvents;',
    "      if (ev && typeof ev.offOwner === 'function') ev.offOwner('settings/" + sdef.id + "');",
    '    }',
    '  };',
    '',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = ' + sdef.glob + ';',
    '  }',
    '  global.' + sdef.glob + ' = ' + sdef.glob + ';',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ];
}
// render.js
const headRange = range(RS + 1, B_PROFILE - 1);
const hapticLines = range(H(hapticStmt.node), HE(hapticStmt.node));
const hapticComment = NL(H(hapticStmt.node) - 1).trim().startsWith('//') ? [NL(H(hapticStmt.node) - 1)] : [];
const staticLines = range(ST_S, ST_E);
const indent = arr => arr.map(l => l.length ? '  ' + l : l);
out[FILES.render] = [
  '/**',
  ' * OurGoal Settings Screen Renderer (설정 화면 렌더 — 화면 단위 조립)',
  ' *',
  ' * #TASK-ES-354 (노션 CORE-07 · SET-07): index.html 인라인 IIFE 에 있던 설정 탭 렌더 코드를 동작 그대로 옮겼다.',
  ' *   renderSettingsHeroCard · collapseAllSettingsSections · toggleAdvancedSettings · formatStorageBytes · paintCacheUsage ·',
  ' *   renderSettingsScreen(머리 + 소블록 6개를 원래 순서로 호출) · 설정 아코디언 햅틱 위임 · 설정 화면 정적 버튼 바인딩',
  ' * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 다른 설정 파일 함수는 K.<이름>. 버그도 그대로 옮겼다.',
  ' * index.html 은 IIFE 맨 위에서 이 키트(window.OurgoalSettingsKit)의 함수를 같은 이름으로 가져와 부른다 — 호출하는 쪽 20여 곳은 그대로다.',
  ' * renderSettingsScreen 은 window 에 새로 노출하지 않는다(노출하면 js/components.js 의 win.renderSettingsScreen 분기가 새로 돌아 동작이 바뀐다).',
  ' * 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  ...HEADER_BRIDGE,
  '',
  ...fnRange('renderSettingsHeroCard'),
  '',
  '  /* 이전 전에는 IIFE 실행 중 이 자리에서 바로 등록됐다. 등록 순서를 지키려고 index.html 이 같은 자리에서 이 함수를 부른다. */',
  '  function bindSettingsHapticDelegate(){',
  ...indent(hapticComment),
  ...indent(hapticLines),
  '  }',
  '',
  ...range(H(fnNode('collapseAllSettingsSections').node) - 1, H(fnNode('collapseAllSettingsSections').node) - 1).filter(l => l.trim().startsWith('/*')),
  ...fnRange('collapseAllSettingsSections'),
  '',
  ...fnRange('toggleAdvancedSettings'),
  '',
  ...range(H(fnNode('formatStorageBytes').node) - 1, H(fnNode('formatStorageBytes').node) - 1).filter(l => l.trim().startsWith('/*')),
  ...fnRange('formatStorageBytes'),
  ...fnRange('paintCacheUsage'),
  '',
  NL(RS),
  ...headRange,
  '    // [#TASK-ES-354] 여기부터는 소블록 파일로 옮긴 구간이다. 원래 순서 그대로, 위에서 읽은 같은 settings 객체를 넘긴다.',
  ...ORDER.map(k => '    global.' + SUB[k].glob + '.render(settings);'),
  NL(RE),
  '',
  '  /* 이전 전에는 renderSettingsScreen 바로 뒤에서 IIFE 실행 중 등록됐다. index.html 이 같은 자리에서 이 함수를 부른다. */',
  '  function bindSettingsStaticHandlers(){',
  ...indent(staticLines),
  '  }',
  '',
  '  K.renderSettingsHeroCard = renderSettingsHeroCard;',
  '  K.bindSettingsHapticDelegate = bindSettingsHapticDelegate;',
  '  K.collapseAllSettingsSections = collapseAllSettingsSections;',
  '  K.toggleAdvancedSettings = toggleAdvancedSettings;',
  '  K.formatStorageBytes = formatStorageBytes;',
  '  K.paintCacheUsage = paintCacheUsage;',
  '  K.renderSettingsScreen = renderSettingsScreen;',
  '  K.bindSettingsStaticHandlers = bindSettingsStaticHandlers;',
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = K;',
  '  }',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];

// index.html 새 판: 이전 구간을 지우고, 같은 자리에 등록 순서 보존 호출 + window 노출 줄을 남긴다
const heroS = H(fnNode('renderSettingsHeroCard').node) - 1; // 바로 위 주석 줄 포함
if (!lines[heroS - 1].includes('RENDER: SETTINGS HERO CARD')) throw new Error('hero 주석 줄 위치 다름');
const hapS = H(hapticStmt.node) - (hapticComment.length ? 1 : 0), hapE = HE(hapticStmt.node);
const keepWin = [];
for (let l = hapE + 1; l < RS; l++) if (/^\s*window\.(collapseAllSettingsSections|toggleAdvancedSettings|paintCacheUsage)\s*=/.test(lines[l - 1])) keepWin.push(lines[l - 1]);
if (keepWin.length !== 3) throw new Error('window 노출 줄 3개가 아님: ' + keepWin.length);
// 지우는 구간 안의 최상위 문은 이전 대상이거나 남기는 window 노출 3줄뿐이어야 한다
const movedSet = new Set(movedRegions.map(m => m.node));
for (const s of top) {
  const l = H(s.node);
  if (l < heroS || l > ST_E) continue;
  if (movedSet.has(s.node)) continue;
  if (s.isExpressionStatement() && /^\s*window\.(collapseAllSettingsSections|toggleAdvancedSettings|paintCacheUsage)\s*=/.test(lines[l - 1])) continue;
  throw new Error('지우는 구간에 예상 밖 문: ' + l + ' ' + lines[l - 1].trim().slice(0, 80));
}
const uiNodes = CORE_UI.map(n => { const f = fnNode(n); if (!f) throw new Error('core 헬퍼 없음 ' + n); return f; });
for (const f of uiNodes) {
  f.traverse({ ReferencedIdentifier(p) { const b = p.scope.getBinding(p.node.name); if (b && b.scope === iScope && !CORE_UI.includes(p.node.name)) throw new Error('core 헬퍼가 인라인 스코프 이름을 읽음: ' + f.node.id.name + ' → ' + p.node.name); } });
  const bnd = iScope.getBinding(f.node.id.name);
  if (bnd.constantViolations.length) throw new Error('core 헬퍼 재대입/중복 선언: ' + f.node.id.name);
}
const uiDrop = new Map(); // html 줄 → 대신 넣을 글자(첫 줄) 또는 null(지움)
for (const f of uiNodes) { const a = H(f.node), b = HE(f.node); for (let l = a; l <= b; l++) uiDrop.set(l, l === a ? '  /* [#TASK-ES-354 CORE-07] ' + f.node.id.name + ' → js/core/ui-helpers.js 로 옮김(맨 위에서 같은 이름으로 가져온다) */' : null); }
// 바로 위 한 줄 설명 주석은 함께 옮긴다
const uiLead = {};
for (const f of uiNodes) { const prev = lines[H(f.node) - 2]; if (/^\s*\/\*.*\*\/\s*$/.test(prev) && !/=====/.test(prev)) { uiLead[f.node.id.name] = prev; uiDrop.set(H(f.node) - 1, null); } }
out['js/core/ui-helpers.js'] = [
  '/**',
  ' * OurGoal UI Helpers (여러 탭이 같이 쓰는 순수 화면 헬퍼)',
  ' *',
  ' * #TASK-ES-354 (노션 CORE-07): index.html 인라인 IIFE 의 공용 헬퍼 중 설정 탭이 쓰고, 인라인 스코프 변수를 읽지 않는 것만 글자 그대로 옮겼다.',
  ' * index.html 은 IIFE 맨 위에서 같은 이름으로 가져와 쓰고(호출하는 곳은 그대로), 옮긴 탭 파일은 U.<이름> 으로 읽는다.',
  ' * window 노출은 이전과 같은 자리(index.html)에서만 한다(window.triggerHapticFeedback 등). 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md',
  ' */',
  '(function(global) {',
  "  'use strict';",
  '',
  ...uiNodes.flatMap(f => [...(uiLead[f.node.id.name] ? [uiLead[f.node.id.name]] : []), ...lines.slice(H(f.node) - 1, HE(f.node)), '']),
  '  var OurgoalUiHelpers = {',
  ...CORE_UI.map((n, i) => '    ' + n + ': ' + n + (i === CORE_UI.length - 1 ? '' : ',')),
  '  };',
  '',
  "  if (typeof module !== 'undefined' && module.exports) {",
  '    module.exports = OurgoalUiHelpers;',
  '  }',
  '  global.OurgoalUiHelpers = OurgoalUiHelpers;',
  "})(typeof window !== 'undefined' ? window : globalThis);",
  '',
];
const replacement = [
  '  /* ============ [#TASK-ES-354 CORE-07·SET-07] 설정 탭 렌더 → js/tabs/settings/render.js · sub-*.js 로 옮김 ============',
  '     renderSettingsHeroCard · collapseAllSettingsSections · toggleAdvancedSettings · formatStorageBytes · paintCacheUsage · renderSettingsScreen',
  '     과 설정 화면 정적 바인딩. 함수는 이 IIFE 맨 위에서 같은 이름으로 가져온다. 아래 호출·노출 줄은 이전 전과 같은 순서를 지키려고 같은 자리에 둔다. */',
  '  // 설정 아코디언 인터랙션 12ms 햅틱 배선 (#TASK-ES-218)',
  '  bindSettingsHapticDelegate();',
  ...keepWin,
  '  // 체크인 시간 추가·테스트 알림·내보내기·가져오기 버튼 바인딩',
  '  bindSettingsStaticHandlers();',
];
const pre = []; for (let l = 1; l < heroS; l++) { if (uiDrop.has(l)) { if (uiDrop.get(l) !== null) pre.push(uiDrop.get(l)); } else pre.push(lines[l - 1]); }
const newHtmlLines = [...pre, ...replacement, ...lines.slice(ST_E)];
// IIFE 맨 위("use strict" 다음): 가져오기 + 브리지 노출
const usIdx = newHtmlLines.findIndex((l, i) => i > sLine - 1 && l.includes('"use strict";'));
const bridgedSorted = [...bridged.keys()].sort();
const IMPORTS = ['renderSettingsScreen', 'collapseAllSettingsSections', 'toggleAdvancedSettings', 'paintCacheUsage', 'bindSettingsHapticDelegate', 'bindSettingsStaticHandlers'];
const header = [
  '',
  '  /* ============ [#TASK-ES-354 CORE-07] 모듈 이음매 (docs/specs/MODULE-SPLIT-PROTOCOL.md) ============',
  '     ① 가져오기: 바깥 파일로 옮긴 함수를 이 스코프에서 같은 이름으로 부른다(전역에 새 이름을 만들지 않는다).',
  '     ② 공용 헬퍼: 여러 탭이 같이 쓰는 순수 헬퍼는 js/core/ui-helpers.js(window.OurgoalUiHelpers)에 있다. 같은 이름으로 가져온다.',
  '     ③ 앱 스코프 통로: 옮긴 코드가 읽는 이 스코프의 공용 상태·함수를 window.OurgoalAppScope.scope 한 곳에만 getter 로 노출한다(목록은 스코프 분석으로 뽑았다 — 옮긴 코드가 실제로 쓰는 이름만). 모든 탭이 같은 통로를 쓴다. */',
  '  var _ui = window.OurgoalUiHelpers;',
  ...CORE_UI.map(n => '  var ' + n + ' = _ui.' + n + ';'),
  '  var _settingsKit = window.OurgoalSettingsKit;',
  ...IMPORTS.map(n => '  var ' + n + ' = _settingsKit.' + n + ';'),
  "  window.OurgoalAppScope.expose('index.html', {",
  ...bridgedSorted.map((n, i) => {
    const info = bridged.get(n);
    const comma = i === bridgedSorted.length - 1 ? '' : ',';
    return '    get ' + n + '(){ return ' + n + '; }' + (info.assigned ? ', set ' + n + '(v){ ' + n + ' = v; }' : '') + comma;
  }),
  '  });',
];
newHtmlLines.splice(usIdx + 1, 0, ...header);
// 스크립트 태그: 브리지(코어) + 새 설정 파일
const storeIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/core/store.js"></script>');
newHtmlLines.splice(storeIdx + 1, 0, '<script src="js/core/app-scope.js"></script>', '<script src="js/core/ui-helpers.js"></script>');
const appIdx = newHtmlLines.findIndex(l => l.trim() === '<script src="js/tabs/settings/sub-appearance.js"></script>');
newHtmlLines.splice(appIdx + 1, 0,
  '<script src="js/tabs/settings/sub-notify.js"></script>',
  '<script src="js/tabs/settings/sub-integrations.js"></script>',
  '<script src="js/tabs/settings/sub-data.js"></script>',
  '<script src="js/tabs/settings/render.js"></script>');

fs.writeFileSync(path.join(APP, 'index.html'), newHtmlLines.join(EOL), 'utf8');
for (const [f, arr] of Object.entries(out)) fs.writeFileSync(path.join(APP, f), arr.join('\n'), 'utf8');
const meta = { scriptHtmlLines: [sLine + 1, eLine], renderSettingsScreen: [RS, RE], sections: SECTIONS, hero: [heroS, null], static: [ST_S, ST_E], bridged: bridgedSorted.map(n => ({ n, ...bridged.get(n) })), edits: uniq.length,
  removedHtmlRange: [heroS, ST_E], removedLines: ST_E - heroS + 1 };
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'gen-meta.json'), JSON.stringify(meta, null, 1));
console.log('edits', uniq.length, 'bridged', bridgedSorted.length, 'removed html lines', heroS, '~', ST_E);
for (const [f, arr] of Object.entries(out)) console.log(f, arr.length - 1);
