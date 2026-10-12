'use strict';
// 로그인 상태를 만들 수 있는지부터 잰다: 가짜 세션 + 가짜 서버(사용자 행 1 · 옛 기록 2)로 부팅 → 앱에 들어가는가, 어떤 서버 요청이 나가는가.
const h = require('./h.cjs');
(async () => {
  const H = await h.open({});
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
  let out = { tool: 'tools/00-boot.cjs', lib: h.libInfo(H.libPath), chrome: H.chrome, startedAt: new Date().toISOString() };
  try {
    await H.nav();
    out.entered = !!(await H.waitEntered(25000));
    await H.sleep(2500);
    out.snap = await H.snap(['옛기록']);
    out.shot = await H.shot('00-boot-home');
    out.clickRecordsTab = await H.click('.navbtn[data-tab="records"]'); await H.sleep(1200);
    out.snapRecordsTab = await H.snap(['옛기록']);
    out.shotRecords = await H.shot('00-boot-records-tab');
    out.libCheck = await H.ev('JSON.stringify({hasLib: !!(window.supabase && window.supabase.createClient), sbIsClient: !!(window.OurgoalAppScope.scope.sb && window.OurgoalAppScope.scope.sb.from), xpKit: Object.keys((window.OurgoalAvatarParts||{}).xp||{}).slice(0,30)})').then(JSON.parse);
  } catch (e) { out.error = String(e && e.message); }
  out.requests = H.S.reqs; out.console = H.con; out.exceptions = H.exc; out.staticMisses = H.srv.requests.filter(r => r.status !== 200).map(r => r.path).slice(0, 40);
  console.log(JSON.stringify({ entered: out.entered, error: out.error, screen: out.snap && out.snap.screen, nRecords: out.snap && out.snap.profile && out.snap.profile.nRecords, cards: out.snapRecordsTab && out.snapRecordsTab.cards.total, cardsVisible: out.snapRecordsTab && out.snapRecordsTab.cards.visible, layers: out.snap && out.snap.openLayers, reqs: H.S.reqs.filter(r => !r.preflight).map(r => r.method + ' ' + r.kind + '/' + r.table + '→' + r.answered).join(' | ').slice(0, 1500), preflights: H.S.reqs.filter(r => r.preflight).length, con: H.con.length, exc: H.exc.map(e => e.text).slice(0, 5), lib: out.libCheck, file: h.save('00-boot', out) }, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
