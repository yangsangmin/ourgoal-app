'use strict';
// 견줌(I 의 화면 판): 500 으로 저장이 실패한 뒤 앱을 켠 채로 서버가 정상으로 돌아오면, 사용자가 아무것도 안 해도 그 기록이 올라가는가. 그 뒤 탭을 바꾸면 올라가는가.
const path = require('path');
const h = require('./h.cjs');
const MARK = '재현저절로올라가나', tag = '06-켠채로서버복구';
(async () => {
  const H = await h.open({ lib: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js') });
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
  const out = { tool: 'tools/06-selfheal.cjs', marker: MARK, lib: h.libInfo(H.libPath), startedAt: new Date().toISOString() };
  const has = () => (H.S.tables.checkins || []).some(r => String(r.text).indexOf(MARK) >= 0);
  const ups = n => H.reqsSince(n).filter(r => r.table === 'checkins' && r.rw === 'write').map(r => ({ ms: r.ms, rows: r.rows, answered: r.answered }));
  try {
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000);
    if (await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()')) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); }
    await H.dropSeed(); H.S.setMode({ rest: '500' });
    const m0 = H.S.seq; await H.type('#captureInput', MARK); out.click = await H.click('#captureSave'); await H.sleep(12000);
    out.failedUpserts = ups(m0); out.closed = await H.closeModals();
    H.S.setMode({}); const m1 = H.S.seq, t1 = Date.now(); out.serverRecoveredAtMs = H.ms();
    await H.sleep(45000); // 아무것도 하지 않고 45초
    out.idle45s = { upserts: ups(m1), serverHasNew: has() };
    const m2 = H.S.seq; await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="records"]\');if(b)b.click();})()'); await H.sleep(2500);
    await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="home"]\');if(b)b.click();})()'); await H.sleep(2500);
    out.afterTabSwitch = { upserts: ups(m2), serverHasNew: has() };
    out.otherWritesWhileIdle = H.reqsSince(m1).filter(r => r.rw === 'write').map(r => r.table).reduce((a, t) => { a[t] = (a[t] || 0) + 1; return a; }, {});
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 500); }
  console.log(JSON.stringify({ file: h.save(tag, out), error: out.error, failedUpserts: out.failedUpserts && out.failedUpserts.length, idle45s: out.idle45s, afterTabSwitch: out.afterTabSwitch, otherWritesWhileIdle: out.otherWritesWhileIdle }, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
