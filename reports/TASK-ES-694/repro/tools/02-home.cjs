'use strict';
// 물음 2·3: 홈 「오늘 기록」 저장을 (가) 성공 (나) 500 (다) 응답 없음 (라) 401 (마) 통신 거절 (바) 진짜 오프라인 으로 — 화면·기기·대기줄·콘솔, 그리고 새로 고침 뒤.
// 사용: node tools/02-home.cjs <ok|500|hang|401|netfail|offline> <서버의 옛 기록 수 0|2> [새로 고침 때 서버 상태 ok|500|netfail|hang]
const path = require('path');
const h = require('./h.cjs');
const COND = process.argv[2] || 'ok', NOLD = Number(process.argv[3] || 2), RELOAD = process.argv[4] || 'ok', HOW = process.argv[5] || 'reload'; // HOW: reload=같은 탭 새로 고침(그 순간 서버는 이미 RELOAD 상태) · lateok=새로 고침을 누른 0.15초 뒤에야 서버가 정상 · crash=탭을 강제로 죽인 뒤 다시 연다
const NAMES = { ok: '가-성공', '500': '나-500', hang: '다-응답없음', '401': '라-401', netfail: '마-통신거절', offline: '바-오프라인' };
const MARK = '재현' + COND + '새기록';
const tag = '02-home-' + NAMES[COND] + '-서버옛기록' + NOLD + (RELOAD !== 'ok' ? (COND === 'offline' ? '-온라인복귀때' : '-새로고침때') + RELOAD : '') + (HOW === 'lateok' ? '-새로고침뒤에야정상' : HOW === 'crash' ? '-탭강제종료' : '');
(async () => {
  const H = await h.open({ lib: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js') });
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(NOLD);
  const out = { tool: 'tools/02-home.cjs', condition: NAMES[COND], serverOldRecords: NOLD, reloadServerState: RELOAD, reloadHow: HOW, marker: MARK, lib: h.libInfo(H.libPath), chrome: H.chrome, startedAt: new Date().toISOString(), steps: {} };
  const closeGreeting = async () => { const v = await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()'); if (v) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); } return v; };
  const reqLine = a => a.map(r => r.method + ' ' + r.table + (r.rows ? ':' + r.rows : '') + '→' + r.answered).join(' | ');
  try {
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000);
    out.greetingClosed = await closeGreeting(); await H.dropSeed();
    out.steps.before = await H.snap([MARK]); out.steps.before.shot = await H.shot(tag + '-1-저장전');
    // 조건을 건다
    if (COND === 'offline') { await H.page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); H.S.setMode({ all: 'netfail' }); await H.sleep(400); }
    else if (COND === '401') H.S.setMode({ rest: '401', auth: '401' });
    else if (COND !== 'ok') H.S.setMode({ rest: COND });
    const mark0 = H.S.seq, con0 = H.con.length;
    await H.type('#captureInput', MARK);
    out.steps.typed = await H.snap([MARK]);
    out.click = await H.click('#captureSave'); const tClick = Date.now();
    for (const [name, at] of [['after250ms', 250], ['after1500ms', 1500], ['after4s', 4000], ['after9s', 9000]]) {
      await H.sleep(Math.max(0, tClick + at - Date.now()));
      const s = await H.snap([MARK]); s.msAfterClick = Date.now() - tClick; if (at === 1500 || at === 9000) s.shot = await H.shot(tag + '-2-저장후' + (at === 1500 ? '1.5초' : '9초'));
      out.steps[name] = s;
    }
    out.toastsAfterClick = (out.steps.after9s.toasts || []).filter(t => t.at >= tClick - 50).map(t => ({ msAfterClick: t.at - tClick, show: t.show, text: t.text }));
    // 화면의 기록 목록(기록 탭). 덮개가 떠 있으면 사용자가 하듯 닫는다(닫은 것을 적는다).
    out.layersBeforeTab = out.steps.after9s.openLayers;
    out.aiSheetWasOpen = await H.closeModals();
    await H.sleep(300);
    out.clickRecordsTab = await H.click('.navbtn[data-tab="records"]'); await H.sleep(1200);
    if (!out.clickRecordsTab.hitSelf) { out.tabFallback = '덮개에 가려 눌리지 않아 탭 단추의 click() 을 직접 불렀다'; await H.ev('document.querySelector(\'.navbtn[data-tab="records"]\').click()'); await H.sleep(1200); }
    out.steps.recordsTab = await H.snap([MARK]); out.steps.recordsTab.shot = await H.shot(tag + '-3-기록탭');
    if (COND === '401') { // 세션 검사(로그인 60초 뒤부터 15초마다)가 무엇을 하는지 본다
      await H.sleep(Math.max(0, 85000 - (Date.now() - tClick)));
      out.steps.after85s = await H.snap([MARK]); out.steps.after85s.shot = await H.shot(tag + '-4-85초뒤');
    }
    out.requestsDuringSave = H.reqsSince(mark0); out.consoleDuringSave = H.con.slice(con0);
    out.serverAfterSave = H.serverView(); out.serverHasNew = (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0);
    // ----- 새로 고침 -----
    if (COND === 'offline' && HOW !== 'crash') { // 같은 탭이 살아 있는 채로 온라인이 된다 → online 사건이 대기줄을 처리한다. 그때 서버 상태 = RELOAD. 그 뒤 서버는 정상으로 돌아오고 새로 고침한다.
      H.S.setMode(RELOAD === 'ok' ? {} : { rest: RELOAD }); const m3 = H.S.seq, tOn = Date.now(); await H.page.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await H.sleep(4500);
      out.afterOnlineSameTab = await H.snap([MARK]); out.afterOnlineSameTab.toastsSinceOnline = out.afterOnlineSameTab.toasts.filter(t => t.at >= tOn - 50 && t.show).map(t => t.text); out.afterOnlineSameTab.writes = H.reqsSince(m3).filter(r => r.rw === 'write' && (r.table === 'checkins' || r.table === 'users')).map(r => r.table + (r.ids ? ':' + r.ids.join('/') : '') + '→' + r.answered); out.afterOnlineSameTab.serverHasNew = (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0); out.afterOnlineSameTab.shot = await H.shot(tag + '-4-온라인복귀뒤'); out.afterOnlineSameTab.console = H.con.slice(-6);
      H.S.setMode({});
    }
    if (HOW === 'reload' && COND !== 'offline') H.S.setMode(RELOAD === 'ok' ? {} : { rest: RELOAD });
    const mark1 = H.S.seq, con1 = H.con.length, tReload = Date.now(); out.reloadCmdMs = H.ms();
    if (HOW === 'crash' && COND === 'offline') { out.leaveHow = '오프라인인 채로 빈 쪽(about:blank)으로 떠났다가 온라인으로 바꾸고 다시 열었다(탭 죽이기 대신 — 죽인 뒤에는 망 상태를 바꿀 수 없었다)'; await H.page.send('Page.navigate', { url: 'about:blank' }); await H.sleep(800); await H.page.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); H.S.setMode({}); await H.sleep(300); await H.nav(); }
    else if (HOW === 'crash') { await H.page.send('Page.crash', {}, 4000).catch(e => { out.crashNote = String(e.message).slice(0, 80); }); await H.sleep(800); if (COND === 'offline') await H.page.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); H.S.setMode(RELOAD === 'ok' ? {} : { rest: RELOAD }); await H.nav(); }
    else if (HOW === 'lateok') { const p = H.reload(); await H.sleep(150); H.S.setMode(RELOAD === 'ok' ? {} : { rest: RELOAD }); out.modeFlippedMs = H.ms(); await p; }
    else await H.reload();
    out.reload = {}; if (!(await H.waitEntered(5000))) { out.reload.at5s = await H.snap([MARK]).catch(e => ({ snapError: String(e.message).slice(0, 120) })); out.reload.at5s.shot = await H.shot(tag + '-5a-새로고침5초'); out.reload.at5s.bodyText = await H.ev('(document.body.innerText||"").replace(/s+/g," ").slice(0,200)').catch(() => null); }
    out.reload.entered = !!(await H.waitEntered(RELOAD === 'ok' ? 25000 : 40000)); out.reload.msToEnter = Date.now() - tReload;
    await H.sleep(3500); out.reload.greetingClosed = await closeGreeting().catch(() => null);
    out.reload.home = await H.snap([MARK]); out.reload.home.shot = await H.shot(tag + '-5-새로고침뒤-홈');
    const c2 = await H.click('.navbtn[data-tab="records"]'); if (!c2.ok || !c2.hitSelf) await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="records"]\');if(b)b.click();})()'); await H.sleep(1200);
    out.reload.recordsTab = await H.snap([MARK]); out.reload.recordsTab.shot = await H.shot(tag + '-6-새로고침뒤-기록탭');
    out.reload.requests = H.reqsSince(mark1); out.reload.console = H.con.slice(con1);
    out.reload.checkinUpserts = out.reload.requests.filter(r => r.table === 'checkins' && r.rw === 'write').map(r => ({ ms: r.ms, msAfterReloadCmd: r.ms - out.reloadCmdMs, mode: r.mode, rows: r.rows, ids: r.ids, answered: r.answered }));
    out.reload.serverHasNew = (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0);
    out.reload.server = H.serverView();
    if (COND === '401') { // 로그아웃된 뒤 다시 로그인(가짜 세션을 다시 심고 새로 고침) — 서버는 정상
      const m4 = H.S.seq; await H.reseed(); await H.reload(); out.relogin = { entered: !!(await H.waitEntered(25000)) }; await H.sleep(3500); await closeGreeting().catch(() => null);
      await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="records"]\');if(b)b.click();})()'); await H.sleep(1200);
      out.relogin.recordsTab = await H.snap([MARK]); out.relogin.shot = await H.shot(tag + '-7-다시로그인뒤-기록탭'); out.relogin.checkinUpserts = H.reqsSince(m4).filter(r => r.table === 'checkins' && r.rw === 'write').map(r => ({ ids: r.ids, answered: r.answered })); out.relogin.serverHasNew = (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0);
    }
    if (COND === 'offline' && HOW === 'crash') { // 다시 켠 뒤 대기줄이 남아 있는가, 그 뒤 오프라인→온라인 사건이 오면 어떻게 되는가
      const m2 = H.S.seq; await H.page.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await H.sleep(500); await H.page.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await H.sleep(4000);
      out.afterOnlineEvent = await H.snap([MARK]); out.afterOnlineEvent.requests = H.reqsSince(m2).filter(r => r.rw === 'write'); out.afterOnlineEvent.serverHasNew = (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0); out.afterOnlineEvent.shot = await H.shot(tag + '-7-온라인사건뒤');
    }
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 600); }
  out.exceptions = H.exc; out.staticMisses = H.srv.requests.filter(r => r.status !== 200).map(r => r.path).filter((v, i, a) => a.indexOf(v) === i).slice(0, 30);
  const m = (s) => s && s.marks && s.marks[MARK];
  const brief = {
    file: h.save(tag, out), error: out.error, entered: out.entered, click: out.click && (out.click.hitSelf ? '단추 맞음' : '가림:' + out.click.hit),
    toasts: out.toastsAfterClick,
    t250: out.steps.after250ms && { input: out.steps.after250ms.input.value, btn: out.steps.after250ms.btn, state: m(out.steps.after250ms).inStateRecords, ls: m(out.steps.after250ms).inLocalStorage },
    t9s: out.steps.after9s && { input: out.steps.after9s.input.value, btn: out.steps.after9s.btn, state: m(out.steps.after9s).inStateRecords, ls: m(out.steps.after9s).inLocalStorage, queue: out.steps.after9s.queue, layers: (out.steps.after9s.openLayers || []).map(x => x.slice(0, 60)), aiSheetWasOpen: out.aiSheetWasOpen, online: out.steps.after9s.online },
    recordsTab: out.steps.recordsTab && { cardsWithNew: m(out.steps.recordsTab).inCards, visible: m(out.steps.recordsTab).inCardsVisible, cards: out.steps.recordsTab.cards.total },
    after85s: out.steps.after85s && { screen: out.steps.after85s.screen, profile: out.steps.after85s.profile && out.steps.after85s.profile.nRecords, ls: Object.keys(out.steps.after85s.ls), toasts: out.steps.after85s.toasts.slice(-3).map(t => t.text) },
    saveReqs: out.requestsDuringSave && reqLine(out.requestsDuringSave).slice(0, 700), console: (out.consoleDuringSave || []).map(c => c.type + ':' + c.text.slice(0, 90)).slice(0, 6), serverHasNew: out.serverHasNew,
    afterOnlineSameTab: out.afterOnlineSameTab && { queue: out.afterOnlineSameTab.queue, toasts: out.afterOnlineSameTab.toastsSinceOnline, writes: out.afterOnlineSameTab.writes, serverHasNew: out.afterOnlineSameTab.serverHasNew, console: out.afterOnlineSameTab.console.map(c => c.text.slice(0, 80)) },
    afterOnlineEvent: out.afterOnlineEvent && { queue: out.afterOnlineEvent.queue, state: m(out.afterOnlineEvent).inStateRecords, ls: m(out.afterOnlineEvent).inLocalStorage, serverHasNew: out.afterOnlineEvent.serverHasNew, toasts: out.afterOnlineEvent.toasts.slice(-3).map(t => t.text), up: out.afterOnlineEvent.requests.map(r => r.table + ':' + (r.ids || []).join('/')) },
    relogin: out.relogin && { entered: out.relogin.entered, state: m(out.relogin.recordsTab).inStateRecords, cards: m(out.relogin.recordsTab).inCardsVisible, nRecords: out.relogin.recordsTab.profile && out.relogin.recordsTab.profile.nRecords, ls: m(out.relogin.recordsTab).inLocalStorage, up: out.relogin.checkinUpserts, serverHasNew: out.relogin.serverHasNew },
    at5s: out.reload && out.reload.at5s && { screen: out.reload.at5s.screen, body: out.reload.at5s.bodyText, hasProfile: !!out.reload.at5s.profile },
    reload: out.reload && { entered: out.reload.entered, msToEnter: out.reload.msToEnter, state: m(out.reload.recordsTab) && m(out.reload.recordsTab).inStateRecords, cards: m(out.reload.recordsTab) && m(out.reload.recordsTab).inCardsVisible, nRecords: out.reload.recordsTab && out.reload.recordsTab.profile && out.reload.recordsTab.profile.nRecords, ls: m(out.reload.recordsTab) && m(out.reload.recordsTab).inLocalStorage, queue: out.reload.recordsTab && out.reload.recordsTab.queue, upserts: out.reload.checkinUpserts, serverHasNew: out.reload.serverHasNew, toasts: out.reload.recordsTab && out.reload.recordsTab.toasts.map(t => t.text).filter((v, i, a) => a.indexOf(v) === i).slice(-4), console: (out.reload.console || []).map(c => c.type + ':' + c.text.slice(0, 90)).slice(0, 5) },
    exceptions: out.exceptions.slice(0, 3)
  };
  console.log(JSON.stringify(brief, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
