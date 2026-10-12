'use strict';
// #TASK-ES-695 (지시함 DIR-006 묶음 P0) — 고치기 전후를 브라우저로 견주는 도구. 조사용이고 제품 파일을 건드리지 않는다.
// reports/TASK-ES-694/repro/tools/h.cjs(공용 틀)를 그대로 쓴다: 진짜 앱 화면 + 진짜 연결 라이브러리 + 브라우저 안 가짜 서버 + 가짜 세션. 실서버 · 실계정 통신 0.
// 사용: 이 파일을 h.cjs 가 있는 tools 폴더에 복사해 놓고(결과는 그 위 폴더의 raw/ · shots/ 에 쓰인다)
//   SF_WT=<재 볼 작업 폴더> node tools/p0-keep.cjs <records|goal|quota> <이름표(before|after)>
//   records : 사진 기록 저장(성공) + 올리지 못한 기록(500) → 새로 고침 → 기록 카드 · 기기 열쇠 · 다시 올리는 요청 · 다음 저장 · 수동 동기화 · 되돌리기
//   goal    : 올리지 못한 목표(목표 올리기 500) → 새로 고침 → 목표 화면 · 기기 열쇠
//   quota   : 올리지 못한 기록(500) 뒤 기기 저장소를 거의 가득 채우고(1,200자만 남김. SF_RESERVE=0 이면 한 자도 안 남김) 다시 열기 → 원래 백업이 남는가, 그 뒤 저장에서도 남는가
const fs = require('fs'), path = require('path');
const h = require('./h.cjs');
const SCEN = process.argv[2] || 'records', LABEL = process.argv[3] || 'after';
const RESERVE = process.env.SF_RESERVE === undefined ? 1200 : Number(process.env.SF_RESERVE); // quota 에서 비워 둘 글자 수(0 = 한 자도 안 남김)
const tag = '07-p0-' + SCEN + (SCEN === 'quota' && RESERVE !== 1200 ? '-남김' + RESERVE : '') + '-' + LABEL;
const UID = h.UID, BK = 'ourgoal_records_backup_' + UID, GBK = 'ourgoal_goals_backup_' + UID;
const KEYS = { backup: BK, prev: 'ourgoal_records_prev_' + UID, kept: 'ourgoal_records_kept_' + UID, gBackup: GBK, gPrev: 'ourgoal_goals_prev_' + UID, gKept: 'ourgoal_goals_kept_' + UID };
const MP = '재현P0사진기록', MU = '재현P0못올린기록', MG = '재현P0못올린목표';
// 기기 열쇠를 읽는다(본문은 표식 글자가 들어 있는지와 칸의 유무만 남긴다)
function devFn(KEYS, UID, marks) {
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var parse = function (s) { try { return JSON.parse(s); } catch (e) { return null; } };
  var out = { keys: {}, backup: null, kept: null, gKept: null, gBackup: null, keepStatus: null, hasModule: !!window.OurgoalLocalKeep };
  Object.keys(KEYS).forEach(function (n) { var v = get(KEYS[n]); out.keys[n] = v === null ? null : { chars: v.length, marks: marks.filter(function (m) { return v.indexOf(m) >= 0; }) }; });
  var b = parse(get(KEYS.backup));
  out.backup = Array.isArray(b) ? b.map(function (r) { return { id: String(r.id).slice(0, 8), text: String(r.text || '').slice(0, 24), photo: !!r.photo, feedback: !!r.feedback, energy: r.energy === undefined ? null : r.energy, focus: r.focus === undefined ? null : r.focus, notionDb: !!r.notionDb, structured: !!r.structured, themeMetadata: r.themeMetadata !== undefined && r.themeMetadata !== null }; }) : null;
  var kd = parse(get(KEYS.kept)); out.kept = kd && kd.items ? kd.items.map(function (i) { return { why: i.why, text: String((i.item && i.item.text) || '').slice(0, 24), photo: !!(i.item && i.item.photo) }; }) : null;
  var gb = parse(get(KEYS.gBackup)); out.gBackup = Array.isArray(gb) ? gb.map(function (g) { return String(g.title || '').slice(0, 24); }) : null;
  var gk = parse(get(KEYS.gKept)); out.gKept = gk && gk.items ? gk.items.map(function (i) { return { why: i.why, title: String((i.item && i.item.title) || '').slice(0, 24) }; }) : null;
  try { if (window.OurgoalLocalKeep) { var s = window.OurgoalLocalKeep.status(UID); out.keepStatus = { records: s.records && { last: s.records.last, held: s.records.held, kept: s.records.kept, prev: s.records.prev }, goals: s.goals && { last: s.goals.last, held: s.goals.held, kept: s.goals.kept, prev: s.goals.prev }, notes: s.notes }; } } catch (e) { out.keepStatus = { error: String(e && e.message) }; }
  return out;
}
const cardFn = function (MARK) { var cards = Array.prototype.slice.call(document.querySelectorAll('.rec-card[data-recid]')).filter(function (c) { return (c.textContent || '').indexOf(MARK) >= 0; }); var c = cards[0]; if (!c) return JSON.stringify({ found: false, n: 0 }); c.scrollIntoView({ block: 'center' }); var img = c.querySelector('img'); return JSON.stringify({ found: true, n: cards.length, hasImg: !!img, imgNatural: img ? img.naturalWidth + 'x' + img.naturalHeight : null, hasFeedbackText: /추천 액션|🤖/.test(c.innerText || ''), innerText: (c.innerText || '').replace(/\s+/g, ' ').slice(0, 160) }); };
(async () => {
  const libFile = path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js');
  const photo = path.join(h.OUT, 'lib', 'photo.png'); if (!fs.existsSync(photo)) fs.writeFileSync(photo, h.png(96, 96, [200, 60, 40]), { encoding: 'utf8' }); // 내용은 Buffer(PNG)
  const H = await h.open({ lib: libFile });
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
  if (SCEN === 'goal') H.S.tables.goals = [{ id: '44444444-4444-4444-8444-444444444444', user_id: UID, title: '서버에도 있는 목표', category: 'etc', due_date: null, created_at: '2026-10-01T00:00:00+00:00', visibility: 'private', topic: null, archived_at: null, result: null, milestones: [] }];
  const out = { tool: 'reports/TASK-ES-695/tools/p0-keep.cjs', scenario: SCEN, label: LABEL, appTree: h.WT, lib: h.libInfo(H.libPath), chrome: H.chrome, startedAt: new Date().toISOString(), note: '서버 답은 브라우저 안 가짜 서버가 흉내 낸 것이다. 로그인은 가짜 세션이다.' };
  const closeGreeting = async () => { const v = await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()'); if (v) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); } return v; };
  const tab = async name => { const c = await H.click('.navbtn[data-tab="' + name + '"]'); if (!c.ok || !c.hitSelf) await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="' + name + '"]\');if(b)b.click();})()'); await H.sleep(1300); };
  const dev = () => H.ev('JSON.stringify((' + devFn.toString() + ')(' + JSON.stringify(KEYS) + ',' + JSON.stringify(UID) + ',' + JSON.stringify([MP, MU, MG]) + '))').then(JSON.parse);
  const raw = key => H.ev('localStorage.getItem(' + JSON.stringify(key) + ')');
  const card = m => H.ev('(' + cardFn.toString() + ')(' + JSON.stringify(m) + ')').then(JSON.parse);
  const stateRec = m => H.ev('(function(){var p=window.OurgoalAppScope.scope.state.profile;var r=(p.records||[]).filter(function(x){return String(x.text||"").indexOf(' + JSON.stringify(m) + ')>=0;})[0];return JSON.stringify(r?{photo:!!r.photo,feedback:!!r.feedback,energy:r.energy===undefined?null:r.energy,focus:r.focus===undefined?null:r.focus,notionDb:!!r.notionDb,structured:!!r.structured}:null);})()').then(JSON.parse);
  const upsertsWith = (since, table, m) => H.reqsSince(since).filter(r => r.table === table && r.rw === 'write');
  const serverHas = (table, col, m) => (H.S.tables[table] || []).some(r => String(r[col] || '').indexOf(m) >= 0);
  const saveHome = async (text, withPhoto) => { await tab('home'); if (withPhoto) { await H.setFile('#capturePhotoInput', photo); await H.waitFor('!!window.OurgoalAppScope.scope.pendingCapturePhoto', 8000); await H.ev('(function(){[["sliderEnergy",60],["sliderFocus",40]].forEach(function(p){var el=document.getElementById(p[0]);if(el){el.value=p[1];el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}});})()'); } await H.type('#captureInput', text); const c = await H.click('#captureSave'); await H.sleep(9000); const closed = await H.closeModals(); return { click: c.ok && c.hitSelf, closed: closed.length }; };
  // 다시 열기: 서버가 아직 500 인 채로 빈 쪽(about:blank)으로 떠나 옛 화면을 끝낸 뒤, 서버를 정상으로 돌리고 앱을 다시 연다.
  // (같은 탭 새로 고침은 옛 화면이 사라지기 전에 돌던 저장이 '정상이 된 서버'로 올라가 버리는 경쟁이 있어, 올리지 못한 것의 재현에는 쓰지 않는다. 두 번째부터의 다시 열기는 그냥 새로 고침이다)
  const leaveAndReopen = async () => { await H.page.send('Page.navigate', { url: 'about:blank' }); await H.sleep(700); H.S.setMode({}); await H.sleep(200); await H.nav(); const entered = !!(await H.waitEntered(25000)); await H.sleep(3500); await closeGreeting().catch(() => null); await H.closeModals(); return entered; };
  const reloadAndSettle = async () => { await H.reload(); const entered = !!(await H.waitEntered(25000)); await H.sleep(3500); await closeGreeting().catch(() => null); await H.closeModals(); return entered; };
  try {
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000); await closeGreeting(); await H.dropSeed();
    if (SCEN === 'records') {
      out.savePhoto = await saveHome(MP, true);
      out.serverRowOfPhotoRecord = (H.S.tables.checkins || []).filter(r => String(r.text).indexOf(MP) >= 0).map(r => ({ keys: Object.keys(r).join(','), hasPhoto: JSON.stringify(r).indexOf('data:image') >= 0 }));
      H.S.setMode({ rest: '500' }); out.saveUnsent = await saveHome(MU, false); /* 서버는 새로 고침 직전까지 500 이다 — 그 사이의 저장(탭 그리기 등)이 올리지 못하게 */
      await tab('records'); out.beforeReload = { cardPhoto: await card(MP), cardUnsent: await card(MU), device: await dev(), statePhoto: await stateRec(MP) }; out.beforeReload.shot = await H.shot(tag + '-1-새로고침전-기록탭');
      const beforeRaw = await raw(BK); out.beforeReload.backupChars = beforeRaw ? beforeRaw.length : null;
      const m1 = H.S.seq; out.reloadEntered = await leaveAndReopen(); await tab('records');
      out.afterReload = { cardPhoto: await card(MP) }; await H.sleep(300); out.afterReload.shotPhoto = await H.shot(tag + '-2-새로고침뒤-사진기록카드');
      out.afterReload.cardUnsent = await card(MU); out.afterReload.statePhoto = await stateRec(MP); out.afterReload.stateUnsent = await stateRec(MU); out.afterReload.device = await dev();
      const prevRaw = await raw(KEYS.prev); out.afterReload.prevEqualsBackupBeforeReload = prevRaw === null ? null : prevRaw === beforeRaw;
      out.afterReload.checkinUpserts = upsertsWith(m1, 'checkins').map(r => ({ rows: r.rows, answered: r.answered })); out.afterReload.serverHasUnsent = serverHas('checkins', 'text', MU);
      out.afterReload.requestKinds = H.reqsSince(m1).filter(r => r.kind !== 'auth').map(r => r.method + ' ' + r.table).filter((v, i, a) => a.indexOf(v) === i);
      // 되돌리기: 직전 사본을 백업 자리로 → 덮어쓰기 전 글자와 같은가. 그 뒤 다시 불러 원래대로 돌려놓는다
      out.rollback = await H.ev('(function(){var K=window.OurgoalLocalKeep;if(!K||!K.restorePrevious)return JSON.stringify({available:false});var r=K.restorePrevious("records",' + JSON.stringify(UID) + ');return JSON.stringify({available:true,result:r});})()').then(JSON.parse);
      if (out.rollback.available) { out.rollback.backupEqualsBeforeReload = (await raw(BK)) === beforeRaw; out.rollback.deviceAfterRollback = (await dev()).backup; out.rollback.swapBack = await H.ev('JSON.stringify(window.OurgoalLocalKeep.restorePrevious("records",' + JSON.stringify(UID) + '))').then(JSON.parse); }
      // 다음 저장: 탭을 바꾸면 저장이 돈다(조사 06) → 그 뒤에도 남는가
      const m2 = H.S.seq; await tab('home'); await tab('records'); await H.sleep(1500);
      out.afterNextSave = { savesIssued: upsertsWith(m2, 'checkins').length, device: await dev(), statePhoto: await stateRec(MP), cardPhoto: await card(MP), serverHasUnsent: serverHas('checkins', 'text', MU) };
      // 수동 동기화 단추
      const m3 = H.S.seq; out.manualSyncClick = await H.ev('(function(){var b=document.getElementById("resyncAccountDataBtn");if(!b)return false;b.click();return true;})()'); await H.sleep(6000); await H.closeModals(); await tab('records');
      out.afterManualSync = { toasts: (await H.snap([MP])).toasts.slice(-3).map(t => t.text), requestKinds: H.reqsSince(m3).filter(r => r.kind !== 'auth').map(r => r.method + ' ' + r.table).filter((v, i, a) => a.indexOf(v) === i), device: await dev(), statePhoto: await stateRec(MP), cardPhoto: await card(MP), cardUnsent: await card(MU), serverHasUnsent: serverHas('checkins', 'text', MU) };
      out.afterManualSync.shot = await H.shot(tag + '-3-수동동기화뒤-사진기록카드');
      // 한 번 더 새로 고침
      out.reload2Entered = await reloadAndSettle(); await tab('records');
      out.afterReload2 = { cardPhoto: await card(MP), statePhoto: await stateRec(MP), device: await dev() };
    }
    if (SCEN === 'goal') {
      await tab('goals'); out.goalsBefore = await H.ev('JSON.stringify((window.OurgoalAppScope.scope.state.profile.goals||[]).map(function(g){return g.title;}))').then(JSON.parse);
      H.S.setMode({ 'goals.write': '500' });
      out.openAdd = await H.ev('(function(){var b=document.getElementById("sAddGoalBtn");if(b){b.click();return "sAddGoalBtn";}if(typeof window.promptNewGoal==="function"){window.promptNewGoal();return "promptNewGoal()";}return null;})()'); await H.sleep(800);
      out.manual = (await H.click('#ngManualBtn')).ok; await H.sleep(800); await H.type('#mGoalTitle', MG); out.saveClick = (await H.click('#mSave')).ok; await H.sleep(5000); await H.closeModals(); /* 목표 올리기는 새로 고침 직전까지 500 */
      out.beforeReload = { goalsInState: await H.ev('JSON.stringify((window.OurgoalAppScope.scope.state.profile.goals||[]).map(function(g){return g.title;}))').then(JSON.parse), bodyHasGoal: await H.ev('(document.body.innerText||"").indexOf(' + JSON.stringify(MG) + ')>=0'), device: await dev(), serverHasGoal: serverHas('goals', 'title', MG) }; out.beforeReload.shot = await H.shot(tag + '-1-새로고침전-목표탭');
      const beforeRaw = await raw(GBK);
      const m1 = H.S.seq; out.reloadEntered = await leaveAndReopen(); await tab('goals');
      out.afterReload = { goalsInState: await H.ev('JSON.stringify((window.OurgoalAppScope.scope.state.profile.goals||[]).map(function(g){return g.title;}))').then(JSON.parse), bodyHasGoal: await H.ev('(document.body.innerText||"").indexOf(' + JSON.stringify(MG) + ')>=0'), device: await dev(), serverHasGoal: serverHas('goals', 'title', MG), goalUpserts: upsertsWith(m1, 'goals').map(r => ({ rows: r.rows, answered: r.answered })) };
      const prevRaw = await raw(KEYS.gPrev); out.afterReload.prevEqualsBackupBeforeReload = prevRaw === null ? null : prevRaw === beforeRaw; out.afterReload.shot = await H.shot(tag + '-2-새로고침뒤-목표탭');
      const m2 = H.S.seq; await tab('home'); await tab('goals'); await H.sleep(1500);
      out.afterNextSave = { device: await dev(), serverHasGoal: serverHas('goals', 'title', MG), goalUpserts: upsertsWith(m2, 'goals').length };
    }
    if (SCEN === 'quota') {
      H.S.setMode({ rest: '500' }); out.saveUnsent = await saveHome(MU, false); /* 서버는 새로 고침 직전까지 500 */
      out.beforeFill = await dev(); const beforeRaw = await raw(BK);
      // 기기 저장소를 거의 가득 채운다(시험용 열쇠 zz_fill): 끝까지 채운 뒤 1,200자만 비운다 — 작은 쓰기(로그인 세션 등)는 되고, 보관 항목(이 기록은 2천 자 남짓)과 직전 사본은 안 들어가는 상태.
      // 한 자도 안 남기면 앱이 로그인 세션을 못 쓰고 다른 부팅 길(전체 사본)로 들어가 버려, 재려는 것(다시 열 때의 덮어쓰기)을 못 잰다 — 그 경우는 따로 적는다
      out.fill = await H.ev('(function(){var k="zz_fill",acc="",steps=[1048576,65536,4096,256,64];try{localStorage.removeItem(k);}catch(e){}for(var i=0;i<steps.length;i++){var chunk=new Array(steps[i]+1).join("x");for(;;){try{localStorage.setItem(k,acc+chunk);acc+=chunk;}catch(e){break;}}}var probe=null;try{localStorage.setItem("zz_probe",new Array(65).join("y"));probe="64자가 더 들어감";localStorage.removeItem("zz_probe");}catch(e){probe=String(e&&e.name);}var reserve='+RESERVE+';acc=acc.slice(0,Math.max(0,acc.length-reserve));localStorage.setItem(k,acc);var p2=null;try{localStorage.setItem("zz_probe",new Array(2001).join("y"));p2="2000자가 더 들어감";localStorage.removeItem("zz_probe");}catch(e){p2=String(e&&e.name);}return JSON.stringify({fillChars:acc.length,probe64AtBrim:probe,reservedChars:reserve,probe2000AfterReserve:p2});})()').then(JSON.parse);
      const m1 = H.S.seq; out.reloadEntered = await leaveAndReopen();
      const afterRaw = await raw(BK);
      out.afterReloadFull = { firstRequests: H.reqsSince(m1).filter(r => r.kind !== 'auth').slice(0, 8).map(r => r.method + ' ' + r.table + (r.rows ? ':' + r.rows : '')), backupUnchanged: afterRaw === beforeRaw, backupStillHasUnsent: !!afterRaw && afterRaw.indexOf(MU) >= 0, device: await dev(), stateUnsent: await stateRec(MU), checkinUpserts: upsertsWith(m1, 'checkins').map(r => ({ rows: r.rows, answered: r.answered })), serverHasUnsent: serverHas('checkins', 'text', MU), consoleWarns: H.con.filter(c => /OurgoalLocalKeep/.test(c.text)).map(c => c.text.slice(0, 120)) };
      const m2 = H.S.seq; await tab('records'); await tab('home'); await H.sleep(1500);
      const afterSaveRaw = await raw(BK);
      out.afterNextSaveFull = { savesIssued: upsertsWith(m2, 'checkins').length, backupStillHasUnsent: !!afterSaveRaw && afterSaveRaw.indexOf(MU) >= 0, device: await dev(), serverHasUnsent: serverHas('checkins', 'text', MU) };
      // 자리를 비우고 다시 열면 보관으로 옮겨지는가
      await H.ev('localStorage.removeItem("zz_fill")'); out.reload2Entered = await reloadAndSettle();
      out.afterReloadFreed = { device: await dev(), stateUnsent: await stateRec(MU), serverHasUnsent: serverHas('checkins', 'text', MU) };
    }
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 600); }
  out.checkinWrites = H.S.reqs.filter(r => r.table === 'checkins' && r.rw === 'write').map(r => ({ ms: r.ms, mode: r.mode, rows: r.rows, answered: r.answered })); // 기록 올리기 요청 전부(때 · 그때의 서버 상태 · 줄 수 · 답)
  out.exceptions = H.exc; out.console = H.con.slice(0, 30);
  const file = h.save(tag, out);
  const brief = { file, error: out.error, hasModule: (out.afterReload && out.afterReload.device.hasModule) || (out.afterReloadFull && out.afterReloadFull.device.hasModule) };
  if (SCEN === 'records') Object.assign(brief, { before: { card: out.beforeReload && { img: out.beforeReload.cardPhoto.hasImg, fb: out.beforeReload.cardPhoto.hasFeedbackText }, unsentOnScreen: out.beforeReload && out.beforeReload.cardUnsent.found }, afterReload: out.afterReload && { card: { img: out.afterReload.cardPhoto.hasImg, fb: out.afterReload.cardPhoto.hasFeedbackText }, state: out.afterReload.statePhoto, backupPhotoRec: (out.afterReload.device.backup || []).filter(r => r.text.indexOf(MP) >= 0)[0], unsentOnScreen: out.afterReload.cardUnsent.found, unsentInState: !!out.afterReload.stateUnsent, keys: out.afterReload.device.keys, kept: out.afterReload.device.kept, prevEq: out.afterReload.prevEqualsBackupBeforeReload, upserts: out.afterReload.checkinUpserts, serverHasUnsent: out.afterReload.serverHasUnsent, reqs: out.afterReload.requestKinds, last: out.afterReload.device.keepStatus && out.afterReload.device.keepStatus.records.last }, rollback: out.rollback && { available: out.rollback.available, ok: out.rollback.result && out.rollback.result.ok, eq: out.rollback.backupEqualsBeforeReload, swapBack: out.rollback.swapBack && out.rollback.swapBack.ok }, nextSave: out.afterNextSave && { saves: out.afterNextSave.savesIssued, state: out.afterNextSave.statePhoto, backupPhotoRec: (out.afterNextSave.device.backup || []).filter(r => r.text.indexOf(MP) >= 0)[0], kept: out.afterNextSave.device.kept, img: out.afterNextSave.cardPhoto.hasImg, serverHasUnsent: out.afterNextSave.serverHasUnsent }, manualSync: out.afterManualSync && { clicked: out.manualSyncClick, toasts: out.afterManualSync.toasts, reqs: out.afterManualSync.requestKinds, state: out.afterManualSync.statePhoto, img: out.afterManualSync.cardPhoto.hasImg, fb: out.afterManualSync.cardPhoto.hasFeedbackText, kept: out.afterManualSync.device.kept, unsentOnScreen: out.afterManualSync.cardUnsent.found, serverHasUnsent: out.afterManualSync.serverHasUnsent }, reload2: out.afterReload2 && { img: out.afterReload2.cardPhoto.hasImg, fb: out.afterReload2.cardPhoto.hasFeedbackText, state: out.afterReload2.statePhoto, kept: out.afterReload2.device.kept } });
  if (SCEN === 'goal') Object.assign(brief, { openAdd: out.openAdd, before: out.beforeReload && { goals: out.beforeReload.goalsInState, onScreen: out.beforeReload.bodyHasGoal, gBackup: out.beforeReload.device.gBackup, serverHasGoal: out.beforeReload.serverHasGoal }, afterReload: out.afterReload && { goals: out.afterReload.goalsInState, onScreen: out.afterReload.bodyHasGoal, gBackup: out.afterReload.device.gBackup, gKept: out.afterReload.device.gKept, keys: out.afterReload.device.keys, prevEq: out.afterReload.prevEqualsBackupBeforeReload, serverHasGoal: out.afterReload.serverHasGoal, upserts: out.afterReload.goalUpserts }, nextSave: out.afterNextSave && { gKept: out.afterNextSave.device.gKept, serverHasGoal: out.afterNextSave.serverHasGoal, upserts: out.afterNextSave.goalUpserts } });
  if (SCEN === 'quota') Object.assign(brief, { fill: out.fill, full: out.afterReloadFull && { first: out.afterReloadFull.firstRequests, backupUnchanged: out.afterReloadFull.backupUnchanged, hasUnsent: out.afterReloadFull.backupStillHasUnsent, unsentInState: !!out.afterReloadFull.stateUnsent, last: out.afterReloadFull.device.keepStatus && out.afterReloadFull.device.keepStatus.records.last, held: out.afterReloadFull.device.keepStatus && out.afterReloadFull.device.keepStatus.records.held, notes: out.afterReloadFull.device.keepStatus && out.afterReloadFull.device.keepStatus.notes, warns: out.afterReloadFull.consoleWarns, kept: out.afterReloadFull.device.kept, serverHasUnsent: out.afterReloadFull.serverHasUnsent }, nextSaveFull: out.afterNextSaveFull && { saves: out.afterNextSaveFull.savesIssued, hasUnsent: out.afterNextSaveFull.backupStillHasUnsent, serverHasUnsent: out.afterNextSaveFull.serverHasUnsent }, freed: out.afterReloadFreed && { kept: out.afterReloadFreed.device.kept, backup: (out.afterReloadFreed.device.backup || []).map(r => r.text), unsentInState: !!out.afterReloadFreed.stateUnsent, serverHasUnsent: out.afterReloadFreed.serverHasUnsent } });
  console.log(JSON.stringify(brief, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
