#!/usr/bin/env node
/* [#TASK-ES-516] 돈(광고·구독) 묶음 소멸 적용기 — main 이 움직여 index.html 이 충돌하면 main 판 위에 이 스크립트를 다시 돌린다(L010).
   각 치환은 정확히 한 번 맞아야 한다(0·2회 이상이면 멈춘다). 줄끝(CRLF)은 원래대로 둔다.
   사용: node docs/design/harness/money-cleanup/apply-money-cleanup.js [저장소 루트] */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..', '..'));

function edit(rel, fn) {
  const p = path.join(root, rel);
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  const c = { s: raw.replace(/\r\n/g, '\n') };
  c.rep = function (a, b) {
    const n = c.s.split(a).length - 1;
    if (n !== 1) throw new Error(rel + ': ' + n + '회 맞음 — ' + a.slice(0, 100));
    c.s = c.s.replace(a, () => b);
  };
  c.cutBetween = function (from, to) { // from 부터 지우고 to 는 남긴다
    const a = c.s.indexOf(from);
    if (a < 0 || c.s.indexOf(from, a + 1) >= 0) throw new Error(rel + ': 시작 표지 ' + from.slice(0, 80));
    const b = c.s.indexOf(to, a + from.length);
    if (b < 0) throw new Error(rel + ': 끝 표지 ' + to.slice(0, 80));
    c.s = c.s.slice(0, a) + c.s.slice(b);
  };
  fn(c);
  fs.writeFileSync(p, crlf ? c.s.replace(/\n/g, '\r\n') : c.s, 'utf8');
  console.log('고침', rel);
}

/* ── index.html ── */
edit('index.html', c => {
  // (1) 「아워골 앱 환경설정 및 보상형 광고 파이프라인」: 광고 상수 4개를 지우고 크레딧 원장 플래그는 남긴다(크레딧은 범위 밖 — REQ 1절)
  c.cutBetween('  /* ============ 아워골 앱 환경설정 및 보상형 광고 파이프라인 (TASK-ES-013) ============ */\n',
    '    // 💳 공용 크레딧(#TASK-ES-015).');
  c.rep('    // 💳 공용 크레딧(#TASK-ES-015).',
    '  /* ============ 아워골 앱 환경설정 ============\n' +
    '     [#TASK-ES-516] 템플릿 복제 광고 설정 4개는 상민님 결정(2026-10-06)으로 지웠다. 크레딧 원장 플래그만 남는다. */\n' +
    '  var OURGOAL_CONFIG = {\n' +
    '    // 💳 공용 크레딧(#TASK-ES-015).');
  // (2) 「구독 상태 (전체 기능 100% 완전 무료 제공)」
  c.rep('  /* ============ 구독 상태 (전체 기능 100% 완전 무료 제공) ============ */\n' +
    '  function subscriptionState(){\n' +
    '    var s = (state.profile && state.profile.settings) || {};\n' +
    "    if(!s.subscription) s.subscription = { isPro:true, plan:'free_all', expiresAt:null, billingKey:null };\n" +
    '    s.subscription.isPro = true;\n' +
    '    return s.subscription;\n' +
    '  }\n\n', '');
  // (3) 「안내 모달 (전체 기능 100% 완전 무료 제공)」 — 부르는 곳 0 인 안내 모달과 빈 배지 지우개
  c.cutBetween('  /* ============ 안내 모달 (전체 기능 100% 완전 무료 제공) ============ */\n',
    '  /* [#TASK-ES-437] gaugeSvg → js/tabs/goals/result-input.js');
  c.rep('    renderProBadge();\n    await checkStreakFreeze();', '    await checkStreakFreeze();');
  c.rep('    get renderProBadge(){ return renderProBadge; },\n', '');
  // (4) 「템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인」: 광고 함수 6개·광고 이름 복제 처리기·시연 전역을 지우고,
  //     복제 본체(executeDirectTemplateClone)와 마켓·전문 템플릿 기록 창은 그대로 둔다
  c.cutBetween('  /* ============ 템플릿 복제 보상형 광고(Rewarded Ad) 파이프라인 (TASK-ES-013) ============ */\n',
    '  function executeDirectTemplateClone(tpl, onSelectTemplate){');
  c.rep('  function executeDirectTemplateClone(tpl, onSelectTemplate){',
    '  /* ============ 템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013) ============\n' +
    '     [#TASK-ES-516] 복제 앞뒤의 보상형 광고 함수는 상민님 결정(2026-10-06)으로 지웠다. 복제는 아래 본체가 바로 한다. */\n' +
    '  function executeDirectTemplateClone(tpl, onSelectTemplate){');
  c.cutBetween('  function handleTemplateCloneWithAd(tpl, onSelectTemplate, forceAdFlow){\n',
    '  /* 🏪 템플릿 마켓플레이스 모달 */');
  c.rep('      function cloneTemplate(tpl){\n        return handleTemplateCloneWithAd(tpl, onSelectTemplate);\n      }',
    '      function cloneTemplate(tpl){\n        if(!tpl) return;\n        executeDirectTemplateClone(tpl, onSelectTemplate);\n      }');
  // (5) 부팅: 템플릿 복제 크레딧 모듈에 넘기던 광고 재생 손잡이
  c.rep('window.OurgoalTemplateCredit.init({ sb: sb, getState: function(){ return state; }, toast: toast, playRewardedAd: playRewardedAdVideo });',
    'window.OurgoalTemplateCredit.init({ sb: sb, getState: function(){ return state; }, toast: toast });');
});

/* ── js/core/profile-topbar.js: 상단 바가 부르던 빈 배지 지우개 ── */
edit('js/core/profile-topbar.js', c => {
  c.rep("    document.getElementById('topUserName').textContent = p.displayName;\n    L.renderProBadge();\n",
    "    document.getElementById('topUserName').textContent = p.displayName;\n");
});

/* ── js/tabs/settings/render.js: 설정 › 크레딧 칸 뒤에 붙던 「광고 보고 크레딧 받기」 ── */
edit('js/tabs/settings/render.js', c => {
  c.rep("    if(typeof OurgoalCredits !== 'undefined'){ OurgoalCredits.renderSettingsSection(document.getElementById('settingsCreditsBlock')).then(function(){ if(window.OurgoalTemplateCredit) window.OurgoalTemplateCredit.renderAdOptIn(document.getElementById('settingsCreditsBlock')); }); } // KF-2 #TASK-ES-017: 선택형 \"광고 보고 크레딧 받기\"\n",
    "    if(typeof OurgoalCredits !== 'undefined'){ OurgoalCredits.renderSettingsSection(document.getElementById('settingsCreditsBlock')); }\n");
});

/* ── js/tabs/settings/app-defaults.js: 새 계정 기본값에서 구독 칸을 뺀다
      (이미 저장된 칸은 지우지 않는다 — js/core/gcal-token.js 의 Object.assign(defaultSettings(), 저장값) 병합이 그대로 둔다) ── */
edit('js/tabs/settings/app-defaults.js', c => {
  c.rep("hasSeenGuide:false, subscription:{ isPro:true, plan:'free_all', expiresAt:null, billingKey:null }, maxBaseCrafts:3",
    'hasSeenGuide:false, maxBaseCrafts:3');
});

/* ── js/template-credit.js: 선택형 보상 광고 버튼·광고 크레딧 적립 ── */
edit('js/template-credit.js', c => {
  c.rep(' * 아워골 — 템플릿 복제 크레딧 + 선택형 보상 광고 (KF-2 #TASK-ES-017, E3)', ' * 아워골 — 템플릿 복제 크레딧 (KF-2 #TASK-ES-017, E3)');
  c.rep(' *   - 광고는 "광고 보고 크레딧 받기" 선택형 버튼 한 경로뿐. 복제 흐름 앞뒤에는 광고가 없다.\n',
    ' *   - 광고는 없다(#TASK-ES-516, 상민님 결정 2026-10-06).\n');
  c.rep(' *   OurgoalTemplateCredit.init({ sb, getState, toast, playRewardedAd })', ' *   OurgoalTemplateCredit.init({ sb, getState, toast })');
  c.rep(' *   OurgoalTemplateCredit.renderAdOptIn(containerEl)            → 플래그·크레딧 둘 다 켜졌을 때만 버튼을 붙인다\n', '');
  c.rep('  var countCache = {};\n  var lastAdAt = 0;\n', '  var countCache = {};\n');
  c.cutBetween('  function adFlagOn() {\n', '  global.OurgoalTemplateCredit = {');
  c.rep('    renderAdOptIn: renderAdOptIn,\n', '');
  c.rep('    _reset: function () { serverOk = null; countCache = {}; lastAdAt = 0; }', '    _reset: function () { serverOk = null; countCache = {}; }');
});

/* ── ui.css: 페이월 요금 칸·PRO 배지 선택자(그리는 곳 0) ── */
edit('ui.css', c => {
  const gone = ['.pro-badge', '.pw-discount', '.pw-plan-row', '.pw-plan', '.pw-plan .pw-price', '.pw-plan .pw-unit'];
  const isGone = sel => gone.includes(sel.trim());
  let removedRules = 0, removedSel = 0;
  c.s = c.s.replace(/(^|[}\n])([^{}@]*?)\{([^{}]*)\}/g, (m, lead, selText, body) => {
    const sels = selText.split(',');
    if (!sels.some(isGone)) return m;
    const keep = sels.filter(x => !isGone(x));
    if (!keep.length) { removedRules++; return lead === '\n' ? '' : lead; }
    removedSel += sels.length - keep.length;
    let out = keep.join(',');
    if (/^\n/.test(selText) && !/^\n/.test(out)) out = '\n' + out.replace(/^\s+/, '');
    return lead + out + '{' + body + '}';
  });
  console.log('  ui.css 규칙 삭제', removedRules, '· 묶음 선택자 삭제', removedSel);
});

/* ── app-ads.txt: AdMob 게시자 선언 파일 ── */
const adsTxt = path.join(root, 'app-ads.txt');
if (fs.existsSync(adsTxt)) { fs.unlinkSync(adsTxt); console.log('지움 app-ads.txt'); }
