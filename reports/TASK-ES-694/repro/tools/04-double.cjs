'use strict';
// 물음 5: 서버 응답이 늦을 때(쓰기마다 3초 뒤 성공) 저장 단추를 여러 번 누르면 기록 수 · 경험치가 어떻게 되는가.
// 사용: node tools/04-double.cjs <home|modal|assistant|goal> [single]   (single = 대조군: 한 번만 누른다)
// 누르는 때: 0초 · 0.4초 · 1.5초(세 번). 진짜 마우스 사건으로 단추 가운데를 누른다. 단추가 가려졌거나 없어졌으면 그 사실을 적는다.
const path = require('path');
const h = require('./h.cjs');
const TARGET = process.argv[2] || 'home', SINGLE = process.argv[3] === 'single';
const NAMES = { home: '홈오늘기록', modal: '기록창', assistant: '기록도우미', goal: '목표만들기' };
const MARK = '재현두번' + TARGET, tag = '04-두번누르기-' + NAMES[TARGET] + (SINGLE ? '-대조군한번' : '') + (process.env.SF_ALLOW_DUP ? '-서버가같은id묶음을받는가정' : '');
const BTN = { home: '#captureSave', modal: '#mSave', assistant: '#recAiSaveBtn', goal: '#mSave' }[TARGET];
(async () => {
  const H = await h.open({ lib: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js') });
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
  const out = { tool: 'tools/04-double.cjs', target: NAMES[TARGET], single: SINGLE, marker: MARK, lib: h.libInfo(H.libPath), chrome: H.chrome, startedAt: new Date().toISOString(), note: '가짜 서버는 쓰기(POST/PATCH)마다 3초 뒤에 성공으로 답한다. 한 묶음 안에 같은 id 가 두 번 들어오면 Postgres 의 알려진 규칙(21000)대로 묶음 전체를 거절하게 해 두었다 — 운영 DB 로 확인한 것은 아니다.' };
  const closeGreeting = async () => { const v = await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()'); if (v) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); } return v; };
  const tab = async name => { const c = await H.click('.navbtn[data-tab="' + name + '"]'); if (!c.ok || !c.hitSelf) await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="' + name + '"]\');if(b)b.click();})()'); await H.sleep(1300); };
  const clickText = async (text) => { const p = await H.ev('(function(){var els=Array.prototype.slice.call(document.querySelectorAll("button,a,[role=button]")).filter(function(e){var r=e.getBoundingClientRect();return (e.textContent||"").indexOf(' + JSON.stringify(text) + ')>=0&&r.width>0&&r.height>0&&getComputedStyle(e).visibility!=="hidden";});var e=els[0];if(!e)return null;e.scrollIntoView({block:"center"});var r=e.getBoundingClientRect();var x=r.left+r.width/2,y=r.top+r.height/2;var hit=document.elementFromPoint(x,y);return JSON.stringify({x:x,y:y,n:els.length,hitSelf:!!hit&&(hit===e||e.contains(hit)),id:e.id||null});})()'); if (!p) return { ok: false }; const o = JSON.parse(p); await H.page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: o.x, y: o.y, button: 'left', clickCount: 1 }); await H.page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: o.x, y: o.y, button: 'left', clickCount: 1 }); return Object.assign({ ok: true }, o); };
  const count = () => H.ev('(function(){var S=window.OurgoalAppScope.scope,p=S.state.profile,M=' + JSON.stringify(MARK) + ';var recs=(p.records||[]).filter(function(r){return String(r.text||"").indexOf(M)>=0;});var goals=(p.goals||[]).filter(function(g){return String(g.title||"").indexOf(M)>=0;});var xp=null;try{xp=p.settings&&p.settings.xp?p.settings.xp.total:null;}catch(e){}var o=document.getElementById("modalOverlay");var b=document.querySelector(' + JSON.stringify(BTN) + ');return JSON.stringify({records:recs.length,recordIds:recs.map(function(r){return String(r.id).slice(0,8);}),distinctRecordIds:Object.keys(recs.reduce(function(a,r){a[r.id]=1;return a;},{})).length,goals:goals.length,distinctGoalIds:Object.keys(goals.reduce(function(a,g){a[g.id]=1;return a;},{})).length,xp:xp,nRecordsAll:(p.records||[]).length,nGoalsAll:(p.goals||[]).length,modalOpen:!!o&&o.classList.contains("active"),btn:b?{text:(b.textContent||"").replace(/\\s+/g," ").trim().slice(0,30),disabled:!!b.disabled,visible:b.getBoundingClientRect().width>0}:null,cards:Array.prototype.slice.call(document.querySelectorAll(".rec-card[data-recid]")).filter(function(c){return (c.textContent||"").indexOf(M)>=0;}).length});})()').then(JSON.parse);
  try {
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000); await closeGreeting(); await H.dropSeed();
    out.prep = [];
    if (TARGET === 'home') { await H.type('#captureInput', MARK); }
    if (TARGET === 'modal') { await tab('records'); out.prep.push({ open: await clickText('새 기록 작성') }); await H.sleep(700); await H.type('#rText', MARK); }
    if (TARGET === 'assistant') { await tab('records'); out.prep.push({ openCard: await clickText('빠른 기록') }); await H.sleep(600); await H.type('#recAgentInput', MARK); out.prep.push({ send: await H.click('#recAgentSendBtn') }); await H.sleep(700); }
    if (TARGET === 'goal') { await tab('goals'); out.prep.push({ add: await H.click('#sAddGoalBtn') }); await H.sleep(700); out.prep.push({ manual: await H.click('#ngManualBtn') }); await H.sleep(700); await H.type('#mGoalTitle', MARK); }
    out.before = await count(); out.before.shot = await H.shot(tag + '-1-누르기전');
    if (!out.before.btn || !out.before.btn.visible) throw new Error('저장 단추가 보이지 않는다: ' + BTN + ' ' + JSON.stringify(out.prep).slice(0, 300));
    H.S.setMode({}, { 'rest.write': 3000 });
    const mark0 = H.S.seq, t0 = Date.now(); out.clicks = [];
    for (const at of (SINGLE ? [0] : [0, 400, 1500])) {
      await H.sleep(Math.max(0, t0 + at - Date.now()));
      const pre = await count(); const c = await H.click(BTN);
      out.clicks.push({ plannedMs: at, actualMs: Date.now() - t0, btnBefore: pre.btn, modalOpenBefore: pre.modalOpen, click: c.ok ? { hitSelf: c.hitSelf, hit: c.hit, disabledBefore: c.disabledBefore } : c });
    }
    await H.sleep(2500 - Math.min(2500, Date.now() - t0)); out.at2_5s = await count(); out.at2_5s.shot = await H.shot(tag + '-2-2.5초');
    await H.sleep(16000); out.at18s = await count(); out.at18s.toasts = (await H.snap([MARK])).toasts.filter(t => t.at >= t0 - 50 && t.show).map(t => t.text);
    out.closedModals = await H.closeModals();
    if (TARGET !== 'goal') await tab('records'); else await tab('goals');
    out.final = await count(); out.final.shot = await H.shot(tag + '-3-끝');
    const reqs = H.reqsSince(mark0).filter(r => r.rw === 'write' && (r.table === 'checkins' || r.table === 'goals'));
    out.writes = reqs.map(r => ({ msAfterFirstClick: r.ms - (t0 - H.t0), table: r.table, rows: r.rows, ids: r.ids, duplicateIdsInBatch: r.ids ? r.ids.length - new Set(r.ids).size : 0, answered: r.answered, answerCode: r.answerCode }));
    out.server = { checkinsWithMark: (H.S.tables.checkins || []).filter(r => String(r.text).indexOf(MARK) >= 0).length, goalsWithMark: (H.S.tables.goals || []).filter(r => String(r.title).indexOf(MARK) >= 0).length };
    out.xpDelta = (out.final.xp === null || out.before.xp === null) ? null : out.final.xp - out.before.xp; out.xpBefore = out.before.xp; out.xpAfter = out.final.xp;
    // 그 뒤 새로 고침(서버는 바로 답한다)
    H.S.setMode({}, {}); await H.reload(); out.reload = { entered: !!(await H.waitEntered(25000)) }; await H.sleep(3500); await closeGreeting().catch(() => null);
    if (TARGET !== 'goal') await tab('records'); else await tab('goals');
    out.reload.count = await count().catch(e => ({ err: String(e.message).slice(0, 100) })); out.reload.shot = await H.shot(tag + '-4-새로고침뒤');
    out.reload.server = { checkinsWithMark: (H.S.tables.checkins || []).filter(r => String(r.text).indexOf(MARK) >= 0).length, goalsWithMark: (H.S.tables.goals || []).filter(r => String(r.title).indexOf(MARK) >= 0).length };
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 500); }
  out.exceptions = H.exc; out.console = H.con.slice(0, 20);
  console.log(JSON.stringify({ file: h.save(tag, out), error: out.error, prep: out.prep, clicks: out.clicks && out.clicks.map(c => c.actualMs + 'ms:' + (c.click.hitSelf ? '맞음' : '가림(' + c.click.hit + ')') + (c.btnBefore ? (c.btnBefore.disabled ? '[잠김]' : '[열림]') + (c.btnBefore.visible ? '' : '[안 보임]') : '[단추 없음]') + (c.modalOpenBefore ? '[창 열림]' : '')), before: out.before && { records: out.before.records, goals: out.before.goals, xp: out.before.xp },
    final: out.final && { records: out.final.records, distinctRecordIds: out.final.distinctRecordIds, goals: out.final.goals, distinctGoalIds: out.final.distinctGoalIds, xp: out.final.xp, cards: out.final.cards, modalOpen: out.final.modalOpen }, xpDelta: out.xpDelta, toasts: out.at18s && out.at18s.toasts, closedModals: out.closedModals,
    writes: out.writes && out.writes.map(w => w.msAfterFirstClick + 'ms ' + w.table + ':' + w.rows + (w.duplicateIdsInBatch ? '(같은 id ' + w.duplicateIdsInBatch + '쌍)' : '') + '→' + w.answered + (w.answerCode ? '/' + w.answerCode : '')), server: out.server, reload: out.reload && { count: out.reload.count && { records: out.reload.count.records, goals: out.reload.count.goals, cards: out.reload.count.cards, xp: out.reload.count.xp }, server: out.reload.server }, exceptions: out.exceptions.slice(0, 3), console: out.console.slice(0, 4).map(c => c.text.slice(0, 100)) }, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
