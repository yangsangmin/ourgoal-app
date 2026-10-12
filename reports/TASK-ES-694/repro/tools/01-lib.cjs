'use strict';
// 물음 1: 진짜 Supabase 라이브러리가 500 · 401 · 응답 없음 · 통신 거절에 어떤 모양으로 답하는가(예외인가 {error} 인가).
// 앱이 만든 바로 그 연결(L.sb)로 upsert · select · maybeSingle 을 불러 본다. 라이브러리 두 판(운영이 지금 받는 CDN @2 = 2.117.3, 저장소에 든 2.115.0).
const path = require('path');
const h = require('./h.cjs');
const LIBS = [{ name: 'cdn-2.117.3', file: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js') }, { name: 'vendor-2.115.0', file: h.DEFAULT_LIB }];
const MODES = ['ok', '500', '500html', '503', '401', 'netfail', 'hang'];
function probe(UID, n, LIMIT) {
  var sb = window.OurgoalAppScope.scope.sb;
  var shape = function (label, thunk) {
    var t = Date.now();
    var p; try { p = Promise.resolve(thunk()); } catch (e) { return Promise.resolve({ call: label, threwSync: true, name: e && e.name, message: String(e && e.message).slice(0, 160) }); }
    return Promise.race([
      p.then(function (r) { var e = r && r.error; return { call: label, outcome: e ? '{error} 를 돌려줌(예외 아님)' : '성공 값을 돌려줌', ms: Date.now() - t, resultKeys: r ? Object.keys(r).join(',') : null, status: r ? r.status : null, statusText: r ? r.statusText : null, dataType: r ? (r.data === null ? 'null' : Array.isArray(r.data) ? 'array(' + r.data.length + ')' : typeof r.data) : null, error: e ? { name: e.name || null, message: String(e.message).slice(0, 200), code: e.code === undefined ? null : e.code, details: e.details === undefined ? null : String(e.details).slice(0, 200), hint: e.hint === undefined ? null : e.hint } : null }; },
        function (e) { return { call: label, outcome: '예외(거절)', ms: Date.now() - t, name: e && e.name, message: String(e && e.message).slice(0, 200) }; }),
      new Promise(function (res) { setTimeout(function () { res({ call: label, outcome: Math.round(LIMIT / 1000) + '초가 지나도 끝나지 않음(대기 중)', ms: Date.now() - t }); }, LIMIT); })
    ]);
  };
  return Promise.all([
    shape('upsert(checkins)', function () { return sb.from('checkins').upsert([{ id: 'lib-probe-' + n, user_id: UID, type: 'note', text: 'lib probe' }]); }),
    shape('select(checkins)', function () { return sb.from('checkins').select('*').eq('user_id', UID).order('start_at', { ascending: false }); }),
    shape('maybeSingle(users)', function () { return sb.from('users').select('*').eq('id', UID).maybeSingle(); })
  ]).then(function (a) { return JSON.stringify(a); });
}
(async () => {
  const out = { tool: 'tools/01-lib.cjs', startedAt: new Date().toISOString(), note: '서버 답은 브라우저 안(CDP Fetch)에서 흉내낸 것. 500=JSON 본문, 500html=HTML 본문, 503=글자 본문, 401=PostgREST 의 JWT expired 모양, netfail=통신 자체를 거절(InternetDisconnected), hang=답을 주지 않음.', libs: [] };
  for (const lib of LIBS) {
    const H = await h.open({ lib: lib.file });
    H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(2);
    const L = { lib: lib.name, info: h.libInfo(lib.file), chrome: H.chrome, modes: {} };
    try {
      await H.nav(); L.entered = !!(await H.waitEntered(25000)); await H.sleep(2000);
      let n = 0;
      for (const m of MODES) {
        H.S.setMode({ rest: m });
        L.modes[m] = JSON.parse(await H.ev('(' + probe.toString() + ')(' + JSON.stringify(h.UID) + ',' + (++n) + ',' + (m === 'hang' ? 8000 : 45000) + ')', 60000)); const mark = H.S.reqs.length; L.modes[m].forEach(r => { r.requestsSent = H.S.reqs.filter(q => !q.preflight && q.mode === m && q.table === (/users/.test(r.call) ? 'users' : 'checkins') && q.rw === (/upsert/.test(r.call) ? 'write' : 'read')).length; });
        H.S.setMode({}); await H.releaseHung('fail'); await H.sleep(300);
      }
    } catch (e) { L.error = String(e && e.message); }
    L.console = H.con.slice(-20); L.exceptions = H.exc;
    out.libs.push(L); await H.close();
  }
  const line = out.libs.map(L => L.lib + (L.error ? ' ERR ' + L.error : '') + '\n' + Object.keys(L.modes).map(m => '  ' + m + ': ' + L.modes[m].map(r => r.call.split('(')[0] + '=' + r.outcome.slice(0, 14) + '(' + r.ms + 'ms,요청' + r.requestsSent + ')' + (r.error ? '[' + r.status + ' ' + JSON.stringify(r.error.message).slice(0, 60) + ' code=' + r.error.code + ']' : '') + (r.name ? '[' + r.name + ': ' + r.message.slice(0, 50) + ']' : '') + (r.error ? '' : r.status ? '[' + r.status + ' ' + r.dataType + ']' : '')).join(' ; ')).join('\n')).join('\n');
  console.log(line); console.log(h.save('01-lib-shapes', out));
  process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
