'use strict';
// 인라인 스크립트 세포화 P0 구역(#TASK-ES-437~) DOM·저장값·토스트 전후 비교 — 1차 dom-compare-inline-split-1.js(#TASK-ES-423)의 틀(실행·스냅샷·시간/난수 지우기)을 그대로 쓰고 단계만 세트로 바꾼다.
// 이전 전(base)과 이전 후(after) 앱을 같은 순서로 조작하고 단계마다 활성 화면 HTML·모달·localStorage·토스트·콘솔 오류·옮긴 이름의 window 종류를 기록해 맞댄다.
// 세트 1(#TASK-ES-437): 설정 탭(테마 카드 → applyTheme, 아바타 인사 미리보기 → openAvatarGreetingPopup·closeAvatarGreetingPopup, 이용약관·개인정보 링크 → showLegalModal,
//   앱 활용 가이드 다시보기 → 미니 가이드 「상세 혜택 안내」 → 건너뛰기 → showCommTourModal → 나중에/소통 탭 보러가기), 게스트 백업 권유 창(window.openGuestBackupNudgeModal·checkGuestBackupNudge),
//   목표 탭(게이지 gaugeSvg 가 그려지는 화면) · 팀 연계 개인목표 창·팀원 초대 창(window 노출 이름) · 템플릿 1초 이식(window.importTemplateInstantly),
//   홈 3초 체크인 예시 문구(window.applyQuickCunningText) · 레벨업 띠(앱 스코프 통로 showLevelUpBanner) · 노션 보내기 꺼짐 경로(통로 sendToNotion) · 비밀번호 변경 창(통로 openChangePasswordModal) · 탭 왕복.
//   부르는 이름은 모두 이전 전 앱에도 같은 이름으로 있는 window 노출·앱 스코프 통로다(두 앱에 같은 조작).
// 로컬 정적 서버 + 헤드리스 Chrome + shots-lib 게스트 시드·Supabase 목(원격·실계정 없음). 시간·난수 값만 지운다(세트 2 부터: 앱 잠금 PIN 해시는 무작위 소금이라 <pinhash>, 저장공간 추정치 navigator.storage.estimate 는 실행마다 달라 <usage>). 같은 기준 앱 2회로 본질 변동을 먼저 잰다.
// 세트 2(#TASK-ES-442)는 SETS 의 2 머리 주석에 적었다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node dom-compare-inline-p0.js <baseApp> <afterApp> <out.json> <세트 번호>
const http = require('http'), fs = require('fs'), path = require('path');
const HARN = path.join(__dirname, '..') + '/';
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require(HARN + 'shots-lib.js');
const { boot, goTab, sleep } = require(HARN + 'tab-states.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serve(dir) {
  dir = path.resolve(dir);
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  const port = 5500 + Math.floor(Math.random() * 400);
  return new Promise(r => s.listen(port, () => r({ s, base: 'http://127.0.0.1:' + port })));
}
const click = sel => ({ evalFn: '(function(){ var el = document.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12); })()' });
const clickIn = sel => ({ evalFn: '(function(){ var root = document.querySelector("#modalOverlay"); var el = root && root.querySelector(' + JSON.stringify(sel) + '); if(!el) return "missing"; el.click(); return "clicked:" + (el.textContent||"").trim().slice(0,12) + "|" + JSON.stringify(el.dataset); })()' });
// 캔버스 해시(FNV-1a 32비트) — 그림 글자 전체를 맞대는 대신 해시·길이를 적는다
const ev = js => ({ evalFn: '(function(){ try { var r = (function(){ ' + js + ' })(); return String(r); } catch(e){ return "throw:" + String(e).slice(0,80); } })()' });
const evA = js => ({ evalFn: '(async function(){ try { var r = await (async function(){ ' + js + ' })(); return String(r); } catch(e){ return "throw:" + String(e).slice(0,80); } })()' });
const S = 'var S = window.OurgoalAppScope && window.OurgoalAppScope.scope; ';
const G0 = 'var g = (window.MOCK_GROUPS || [])[0]; if(!g) return "no-group"; ';
// 세트마다: 단계 목록 + 옮긴 이름(window 종류를 전후 맞댄다)
const SETS = {
  1: {
    names: ['applyTheme', 'applyAppSettings', 'openAvatarGreetingPopup', 'closeAvatarGreetingPopup', 'showLevelUpBanner', 'showLastAuthBadge', 'initRememberedAuthFields', 'openChangePasswordModal', 'checkPendingDeletionRestore', 'showLegalModal', 'openGuestBackupNudgeModal', 'checkGuestBackupNudge', 'openTeamLinkedPersonalGoalModal', 'openTeamInviteModal', 'importTemplateInstantly', 'templateMilestones', 'gaugeSvg', 'hybridDashboardHtml', 'resultLineHtml', 'openAiResultAssistantModal', 'sendToNotion', 'checkStreakFreeze', 'applyQuickCunningText', 'showCommTourModal'],
    steps: [
      ['set-enter', { goTab: 'settings' }],
      ['theme-white', click('.theme-card[data-themeid="white"]'), 800],
      ['theme-focus', click('.theme-card[data-themeid="focus-sanctuary"]'), 800],
      ['greet-preview', click('#btnPreviewAvatarGreeting'), 800],
      ['greet-close', ev('if(typeof window.closeAvatarGreetingPopup !== "function") return "no-fn"; window.closeAvatarGreetingPopup(); return "closed";'), 600],
      ['terms-open', click('#setTermsLink'), 600],
      ['terms-close', { closeModal: true }],
      ['privacy-open', click('#setPrivacyLink'), 600],
      ['privacy-close', { closeModal: true }],
      ['guide-open', click('#btnRestartGuide'), 800],
      ['guide-detail', click('#btnMiniGuideDetail'), 800],
      ['guide-skip-tour', clickIn('#guideSkip1'), 800],
      ['tour-skip', clickIn('#tourSkip'), 600],
      ['set-enter-2', { goTab: 'settings' }],
      ['guide-open-2', click('#btnRestartGuide'), 800],
      ['guide-detail-2', click('#btnMiniGuideDetail'), 800],
      ['guide-skip-tour-2', clickIn('#guideSkip1'), 800],
      ['tour-go', clickIn('#tourGo'), 1200],
      ['nudge-open', ev('if(typeof window.openGuestBackupNudgeModal !== "function") return "no-fn"; window.openGuestBackupNudgeModal(); return "opened";'), 600],
      ['nudge-close', { closeModal: true }],
      ['nudge-check', ev('if(typeof window.checkGuestBackupNudge !== "function") return "no-fn"; return "r:" + window.checkGuestBackupNudge();'), 600],
      ['nudge-check-close', { closeModal: true }],
      ['pw-change', ev(S + 'if(!S || typeof S.openChangePasswordModal !== "function") return "no-fn"; S.openChangePasswordModal(); return "opened";'), 600],
      ['pw-change-close', { closeModal: true }],
      ['goals-enter', { goTab: 'goals' }],
      ['team-linked-open', ev(G0 + 'if(typeof window.openTeamLinkedPersonalGoalModal !== "function") return "no-fn"; window.openTeamLinkedPersonalGoalModal(g.id, g.name); return "opened:" + g.id;'), 600],
      ['team-linked-close', { closeModal: true }],
      ['team-invite-open', ev(G0 + 'if(typeof window.openTeamInviteModal !== "function") return "no-fn"; window.openTeamInviteModal(g.id, g.name); return "opened:" + g.id;'), 600],
      ['team-invite-close', { closeModal: true }],
      ['tmpl-import', evA('if(typeof window.importTemplateInstantly !== "function") return "no-fn"; var r = await window.importTemplateInstantly("es437-cmp", "비교용 템플릿", "study", [{ title: "1단계" }, { title: "2단계" }]); return "r:" + JSON.stringify(r === undefined ? null : r).slice(0, 60);'), 1500],
      ['tmpl-import-close', { closeModal: true }],
      ['goals-enter-2', { goTab: 'goals' }],
      ['home-enter', { goTab: 'home' }],
      ['cunning-text', ev('if(typeof window.applyQuickCunningText !== "function") return "no-fn"; window.applyQuickCunningText("비교용 예시 문구"); var el = document.activeElement; return "applied:" + (el && el.id);'), 600],
      ['levelup-banner', ev(S + 'if(!S || typeof S.showLevelUpBanner !== "function" || typeof S.levelForXP !== "function") return "no-fn"; S.showLevelUpBanner(S.levelForXP(5000)); var b = document.getElementById("levelUpBannerSlot"); return "banner:" + (b ? b.innerHTML.length : -1);'), 600],
      ['notion-off', evA(S + 'if(!S || typeof S.sendToNotion !== "function") return "no-fn"; var r = await S.sendToNotion({ text: "비교", createdAt: "2026-10-05T00:00:00.000Z" }, null); return "r:" + r;'), 300],
      ['close-all', { closeModal: true }],
      ['tab-roundtrip', { tabRoundTrip: true }],
    ],
  },
  // 세트 2(#TASK-ES-442): 설정 탭(기기 목록 renderActiveDevicesList·getRegisteredDevices → 「다른 기기 모두 로그아웃」 openLogoutOtherDevicesConfirmModal,
  //   앱 잠금 스위치 → openTwoFactorSetupModal: 4자리 아님·불일치·저장(hashAppLockPin) → 앱 진입 PIN 확인 창 window.challengeTwoFactorModal: 틀린·맞는 PIN(verifyAppLockPin)
  //   → 스위치 다시 → openTwoFactorDisableModal: 틀린·맞는 PIN), 탭 활용법 허브(#btnTabGuideHub → openTabGuideHubModal → 탭 단추 renderTabGuideContent),
  //   개발 디버그 버튼(window.initDevDebugButtons 다시 부름 → 버튼 수), 온보딩(window.startOnboarding → 첫 화면), 목표 상세 서랍(window.openGoalDetailDrawer → 프롬프트 백과사전
  //   renderPromptEncyclopediaHtml·wirePromptEncyclopediaEvents → 펼치기·AI 맞춤 탭), 노션 변환(통로 convertTextToNotionDbRecord), 일정 완료 토글(통로 toggleScheduleDone 두 번).
  2: {
    names: ['getRegisteredDevices', 'renderActiveDevicesList', 'openLogoutOtherDevicesConfirmModal', 'isHashedAppLockPin', 'appLockCryptoAvailable', 'sha256HexAppLock', 'hashAppLockPin', 'verifyAppLockPin', 'openTwoFactorSetupModal', 'openTwoFactorDisableModal', 'challengeTwoFactorModal', 'initDevDebugButtons', 'migrateGuestDataToUser', 'renderTabGuideContent', 'openTabGuideHubModal', 'startOnboarding', 'getUserPrompts', 'getLikedPromptIds', 'getPromptLikesMap', 'openAddUserPromptModal', 'renderPromptEncyclopediaHtml', 'wirePromptEncyclopediaEvents', 'convertTextToNotionDbRecord', 'toggleScheduleDone', 'TAB_GUIDE_DATA', 'ONBOARDING_AVATARS', 'defaultSettings', 'goalProgress', 'msCounts', 'resultPct'],
    steps: [
      ['set-enter', { goTab: 'settings' }],
      ['devices-list', ev('var c = document.getElementById("activeDevicesContainer"); var b = document.getElementById("activeDeviceCountBadge"); return "devices:" + (c ? c.children.length : -1) + ":" + (b ? b.textContent.trim() : "-");')],
      ['logout-others-open', click('#logoutOtherDevicesBtn'), 600],
      ['logout-others-close', { closeModal: true }],
      ['pin-setup-open', click('#twoFactorSwitch'), 600],
      ['pin-short', ev('var r = document.querySelector("#modalOverlay"); var a = r && r.querySelector("#twoFaPinInput"), b = r && r.querySelector("#twoFaPinConfirm"); if(!a || !b) return "missing"; a.value = "12"; b.value = "12"; r.querySelector("#btnSave2Fa").click(); return "clicked";'), 600],
      ['pin-mismatch', ev('var r = document.querySelector("#modalOverlay"); var a = r && r.querySelector("#twoFaPinInput"), b = r && r.querySelector("#twoFaPinConfirm"); if(!a || !b) return "missing"; a.value = "1234"; b.value = "4321"; r.querySelector("#btnSave2Fa").click(); return "clicked";'), 600],
      ['pin-save', ev('var r = document.querySelector("#modalOverlay"); var a = r && r.querySelector("#twoFaPinInput"), b = r && r.querySelector("#twoFaPinConfirm"); if(!a || !b) return "missing"; a.value = "1234"; b.value = "1234"; r.querySelector("#btnSave2Fa").click(); return "clicked";'), 1500],
      ['pin-hashed', ev('var s = window.state && window.state.profile && window.state.profile.settings; var p = s && s.twoFactorPin; return "on:" + !!(s && s.twoFactorAuth) + ":hashed:" + (typeof window.isHashedAppLockPin === "function" ? window.isHashedAppLockPin(p) : "no-fn");')],
      ['challenge-open', ev('try { sessionStorage.removeItem("ourgoal_2fa_verified"); } catch(e){} if(typeof window.challengeTwoFactorModal !== "function") return "no-fn"; window.__p0ok = 0; window.challengeTwoFactorModal(function(){ window.__p0ok = 1; }); return "opened";'), 600],
      ['challenge-wrong', ev('var i = document.querySelector("#challenge2FaPin"); if(!i) return "missing"; i.value = "0000"; document.querySelector("#btnVerify2FaChallenge").click(); return "clicked";'), 1200],
      ['challenge-right', ev('var i = document.querySelector("#challenge2FaPin"); if(!i) return "missing"; i.value = "1234"; document.querySelector("#btnVerify2FaChallenge").click(); return "clicked";'), 1200],
      ['challenge-result', ev('var v = null; try { v = sessionStorage.getItem("ourgoal_2fa_verified"); } catch(e){} return "ok:" + window.__p0ok + ":verified:" + v;')],
      ['set-enter-2', { goTab: 'settings' }],
      ['pin-disable-open', click('#twoFactorSwitch'), 600],
      ['pin-disable-wrong', ev('var r = document.querySelector("#modalOverlay"); var i = r && r.querySelector("#disable2FaPinInput"); if(!i) return "missing"; i.value = "9999"; r.querySelector("#btnConfirmDisable2Fa").click(); return "clicked";'), 1200],
      ['pin-disable-right', ev('var r = document.querySelector("#modalOverlay"); var i = r && r.querySelector("#disable2FaPinInput"); if(!i) return "missing"; i.value = "1234"; r.querySelector("#btnConfirmDisable2Fa").click(); return "clicked";'), 1500],
      ['pin-off', ev('var s = window.state && window.state.profile && window.state.profile.settings; return "on:" + !!(s && s.twoFactorAuth) + ":pin:" + !!(s && s.twoFactorPin);')],
      ['guide-hub-open', click('#btnTabGuideHub'), 800],
      ['guide-hub-goals', clickIn('.guide-tab-nav-btn[data-tabkey="goals"]'), 600],
      ['guide-hub-records', clickIn('.guide-tab-nav-btn[data-tabkey="records"]'), 600],
      ['guide-hub-close', { closeModal: true }],
      ['debug-buttons', ev('if(typeof window.initDevDebugButtons !== "function") return "no-fn"; window.initDevDebugButtons(); return "debug:" + document.querySelectorAll("[id*=ebug]").length;'), 300],
      ['onboarding-open', ev('if(typeof window.startOnboarding !== "function") return "no-fn"; window.startOnboarding(); return "opened";'), 1200],
      ['onboarding-close', { closeModal: true }],
      ['goals-enter', { goTab: 'goals' }],
      ['goal-drawer', ev('var g = window.state && (window.state.goals || [])[0]; if(!g || typeof window.openGoalDetailDrawer !== "function") return "no-goal"; window.openGoalDetailDrawer(g.id); return "opened:" + g.id;'), 1500],
      ['prompt-toggle', ev('var b = document.querySelector("#btnTogglePromptAccordion"); if(!b) return "missing"; b.click(); return "clicked";'), 800],
      ['prompt-tab-ai', ev('var b = document.querySelector(".btn-prompt-tab[data-ptab=\\"ai\\"]"); if(!b) return "missing"; b.click(); return "clicked";'), 800],
      ['prompt-html', ev(S + 'if(!S || typeof S.renderPromptEncyclopediaHtml !== "function") return "no-fn"; var h = String(S.renderPromptEncyclopediaHtml("goals")); var x = 2166136261; for (var i = 0; i < h.length; i++){ x ^= h.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return "len" + h.length + ":h" + x.toString(16);')],
      ['drawer-close', { closeModal: true }],
      ['notion-convert', ev(S + 'if(!S || typeof S.convertTextToNotionDbRecord !== "function") return "no-fn"; return JSON.stringify(S.convertTextToNotionDbRecord("오늘 20km 1시간 40분 완주했어 땀 많이 흘림", "ms", { title: "러닝 완주" }, { category: "exercise" }));')],
      ['goal-math', ev(S + 'if(!S) return "no-scope"; var g = (window.state && window.state.goals || [])[0] || null; var out = {}; ["goalProgress", "msCounts", "resultPct", "defaultSettings"].forEach(function(n){ var f = S[n]; if(typeof f !== "function"){ out[n] = "no-fn"; return; } try { out[n] = JSON.stringify(n === "msCounts" ? f(g && g.milestones && g.milestones[0]) : n === "resultPct" ? f({ value: 7, target: 10 }) : n === "defaultSettings" ? f() : f(g)); } catch(e){ out[n] = "throw:" + String(e).slice(0, 60); } }); return JSON.stringify(out);')],
      ['cal-enter', { goTab: 'calendar' }],
      ['sched-seed', ev('var s = window.state; if(!s || !s.profile) return "no-state"; s.profile.settings = s.profile.settings || {}; var g = (s.goals || [])[0]; var m = g && (g.milestones || [])[0]; s.profile.settings.customSchedules = s.profile.settings.customSchedules || []; s.profile.settings.customSchedules.unshift({ id: "es442-s1", title: "비교용 일정", date: "2026-10-05", time: "09:00", done: false, linkedLevel: m ? "ms" : null, linkedId: m ? m.id : null, linkedGoalId: g ? g.id : null }); return "seeded:" + (g ? g.id : "-") + ":" + (m ? m.id : "-");')],
      ['sched-toggle', evA(S + 'if(!S || typeof S.toggleScheduleDone !== "function") return "no-fn"; var s = window.state || {}; var list = (s.profile && s.profile.settings && s.profile.settings.customSchedules) || []; var c = list[0]; if(!c) return "no-sched"; await S.toggleScheduleDone(c.id, "custom"); return "toggled:" + c.id + ":" + JSON.stringify(c).length;'), 1200],
      ['sched-toggle-back', evA(S + 'if(!S || typeof S.toggleScheduleDone !== "function") return "no-fn"; var s = window.state || {}; var list = (s.profile && s.profile.settings && s.profile.settings.customSchedules) || []; var c = list[0]; if(!c) return "no-sched"; await S.toggleScheduleDone(c.id, "custom"); return "toggled:" + c.id;'), 1200],
      ['close-all', { closeModal: true }],
      ['tab-roundtrip', { tabRoundTrip: true }],
    ],
  },
};
const SET = process.argv[5] || '1';
if (!SETS[SET]) throw new Error('세트 없음 ' + SET);
const STEPS = SETS[SET].steps;
const MOVED_NAMES = SETS[SET].names;
async function snapshot(page) {
  return page.evaluate((names) => {
    const scr = document.querySelector('.screen.active');
    const mo = document.getElementById('modalOverlay');
    const ls = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); } } catch (e) { ls.__error = String(e).slice(0, 80); }
    const toastEl = document.querySelector('#toast');
    return { html: scr ? scr.outerHTML : null, modal: mo ? (mo.className + '|' + mo.innerHTML) : null, ls, toast: toastEl ? (toastEl.className + '|' + toastEl.textContent.trim()) : null,
      activeScreen: scr ? scr.id : null, downloads: (window.__es423dl || []).splice(0),
      // 옮긴 이름이 window 에 새로 달리지 않았는가(이전 전과 같아야 한다 — window 노출 줄은 원래 자리에 그대로 있다)
      globals: Object.fromEntries(names.map(n => [n, typeof window[n]])),
      kits: Object.fromEntries(['OurgoalSettingsKit', 'OurgoalGoalsKit', 'OurgoalRecordsKit', 'OurgoalCalendarKit', 'OurgoalCommKit'].map(k => [k, window[k] ? Object.keys(window[k]).sort().join(',') : null])) };
  }, MOVED_NAMES);
}
const VOL = x => x == null ? x : String(x).replace(/sha256v1\$[A-Za-z0-9_:-]+\$[0-9a-f]{64}/g, () => 'sha256v1:<pinhash>').replace(/약 [0-9.]+ (B|KB|MB) 사용 중/g, '약 <usage> 사용 중').replace(/data:image\/png;base64,[A-Za-z0-9+\/=]+/g, () => 'data:image/png;<canvas>').replace(/dev_\d+_[a-z0-9]+/g, 'dev_<id>').replace(/(firstLogin|lastActive)(\W*):\d+/g, '$1$2:<t>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<iso>').replace(/\b1[789]\d{11}\b/g, '<ms>')
  .replace(/(\W)seed(\W*):\d+/g, '$1seed$2:<rnd>').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
  .replace(/\b(ms|t|task|g|goal|fc|qr|c)_[a-z0-9]{8,}/g, '$1_<uid>')
  .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d(?![:\d])/g, '<dtl>').replace(/(lsSim(?:StatusTime|ClockTime)\\*"[^>]*>)\d{1,2}:\d\d/g, '$1<hh:mm>').replace(/127\.0\.0\.1:\d+/g, '127.0.0.1:<port>').replace(/(mnPreviewName\\*"?>)[^<]+/g, '$1<anon>');
function sortKeys(x) { if (Array.isArray(x)) return x.map(sortKeys); if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) o[k] = sortKeys(x[k]); return o; } return x; }
function normLs(ls) {
  const o = {};
  for (const [k, v] of Object.entries(ls)) {
    if (/^ph_/.test(k)) continue; // posthog 분석 SDK 상태(실행마다 무작위 id)
    let val = v;
    try { const j = JSON.parse(v); val = JSON.stringify(sortKeys(j), (key, x) => key === 'bonusCraftCredits' ? undefined : (/(At|Time|time|_at|updated|ts)$/.test(key) && typeof x !== 'object') ? '<t>' : (key === 'hash' && typeof x === 'string') ? '<hash>' : x); } catch (e) {}
    o[k] = VOL(val);
  }
  return o;
}
async function run(app, label) {
  const { s, base } = await serve(app);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR'] });
  const ctx = await browser.createBrowserContext();
  const page = await shots.newPage(ctx, true, 'focus-sanctuary');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.type() + '|' + d.message()); d.dismiss().catch(() => {}); });
  // 내려받기: <a download> 클릭을 가로채 이름과 이미지 해시만 적는다(파일은 만들지 않는다)
  await page.evaluateOnNewDocument(() => {
    window.__es423dl = [];
    const OA = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { const u = String(this.href || ''); let h = 2166136261; for (let i = 0; i < u.length; i++) { h ^= u.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } window.__es423dl.push('download|' + this.download + '|len' + u.length + '|h' + h.toString(16)); return; }
      return OA.apply(this, arguments);
    };
  });
  await page.goto(base + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  const bootNote = await boot(page);
  const steps = [];
  for (const [name, act, extra] of STEPS) {
    const errBefore = errors.length, dlgBefore = dialogs.length;
    let note = '';
    if (act.evalFn) note = String(await page.evaluate(act.evalFn));
    else if (act.goTab) { const r = await goTab(page, act.goTab); note = 'tab:' + act.goTab + ':' + (r.ok ? 'ok' : r.note); }
    else if (act.closeModal) note = await page.evaluate(() => { if (typeof window.closeModal !== 'function') return 'no-fn'; window.closeModal(); return 'closed'; });
    else if (act.tabRoundTrip) { await goTab(page, 'home'); await goTab(page, 'records'); note = 'roundtrip'; }
    await sleep(900 + (extra || 0));
    const snap = await snapshot(page);
    steps.push({ name, note: VOL(note), dialogs: dialogs.slice(dlgBefore), downloads: snap.downloads, html: VOL(snap.html), modal: VOL(snap.modal), ls: normLs(snap.ls), toast: VOL(snap.toast), activeScreen: snap.activeScreen, globals: snap.globals, kits: snap.kits, newErrors: errors.slice(errBefore) });
  }
  await browser.close(); s.close();
  return { label, bootNote, steps, errors };
}
(async () => {
  const [A, B, OUT] = process.argv.slice(2);
  console.log('set', SET, 'steps', STEPS.length);
  const ra = await run(A, 'base'), ra2 = await run(A, 'base-2'), rb = await run(B, 'after');
  // kits 칸은 이번 이전이 탭 키트에 이름을 더하므로 다르다(의도한 차이) — 맞대지 않고 따로 적는다
  const FIELDS = ['note', 'dialogs', 'downloads', 'html', 'modal', 'ls', 'toast', 'activeScreen', 'globals', 'newErrors'];
  const cmp = (P, Q) => {
    const out = [];
    P.steps.forEach((sa, i) => {
      const sb = Q.steps[i];
      for (const k of FIELDS) {
        const x = JSON.stringify(sa[k]), y = JSON.stringify(sb[k]);
        if (x === y) continue;
        let at = 0; while (at < x.length && x[at] === y[at]) at++;
        out.push({ step: sa.name, field: k, base: x.slice(Math.max(0, at - 120), at + 200), after: y.slice(Math.max(0, at - 120), at + 200) });
      }
    });
    return out;
  };
  const diffs = cmp(ra, rb);
  const baseVsBase = cmp(ra, ra2);
  const summary = { set: SET, env: 'local static server + headless Chrome + guest seed + Supabase mock (no remote, no real account)',
    steps: ra.steps.map(s => s.name), notes: ra.steps.map((s, i) => s.name + ' => ' + s.note + ' / ' + rb.steps[i].note),
    comparedFields: ra.steps.length * FIELDS.length,
    digestAfter: rb.steps.map(s => ({ step: s.name, note: s.note, toast: s.toast, downloads: s.downloads, dialogs: s.dialogs, activeScreen: s.activeScreen, modalHead: (s.modal || '').slice(0, 160), newErrors: s.newErrors })),
    differing: diffs.length, diffs, baseVsBaseDiffering: baseVsBase.length, baseVsBase,
    errorsBase: ra.errors, errorsBase2: ra2.errors, errorsAfter: rb.errors, bootBase: ra.bootNote, bootAfter: rb.bootNote,
    kitsBase: ra.steps[0].kits, kitsAfter: rb.steps[0].kits };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 1));
  console.log('steps', ra.steps.length, 'compared', summary.comparedFields, 'differing', diffs.length, 'base-vs-base differing', baseVsBase.length, 'errors base/base2/after', ra.errors.length, ra2.errors.length, rb.errors.length);
  console.log(summary.notes.join('\n'));
  for (const d of diffs.slice(0, 12)) console.log(JSON.stringify(d).slice(0, 600));
  for (const d of baseVsBase.slice(0, 6)) console.log('BB', JSON.stringify(d).slice(0, 400));
})().catch(e => { console.error(e); process.exitCode = 1; });
