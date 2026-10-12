'use strict';
// 견줌(K 의 범위): 로그인하지 않은 둘러보기(게스트) 사용자가 사진 기록을 저장하고 새로 고침하면 사진·피드백이 남는가. 서버는 전부 거절(401)로 둔다(게스트는 서버 권한이 없다고 보고).
const fs = require('fs'), path = require('path');
const h = require('./h.cjs');
const MARK = '재현게스트사진기록', tag = '05-게스트-사진' + (process.env.SF_FAIL_LIB ? '-라이브러리못받음' : '');
const cardFn = function (MARK) { var cards = Array.prototype.slice.call(document.querySelectorAll('.rec-card[data-recid]')).filter(function (c) { return (c.textContent || '').indexOf(MARK) >= 0; }); var c = cards[0]; if (!c) return JSON.stringify({ found: false }); c.scrollIntoView({ block: 'center' }); var img = c.querySelector('img'); return JSON.stringify({ found: true, n: cards.length, hasImg: !!img, innerText: (c.innerText || '').replace(/\s+/g, ' ').slice(0, 200) }); };
(async () => {
  const photo = path.join(h.OUT, 'lib', 'photo.png'); if (!fs.existsSync(photo)) fs.writeFileSync(photo, h.png(96, 96, [200, 60, 40]), { encoding: 'utf8' });
  const H = await h.open({ lib: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js'), seedSession: false });
  H.S.setMode({ rest: '401', auth: '401' });
  const out = { tool: 'tools/05-guest.cjs', marker: MARK, lib: h.libInfo(H.libPath), startedAt: new Date().toISOString(), steps: [] };
  const goRecords = async () => { const c = await H.click('.navbtn[data-tab="records"]'); if (!c.ok || !c.hitSelf) await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="records"]\');if(b)b.click();})()'); await H.sleep(1300); };
  const closeGreeting = async () => { const v = await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()'); if (v) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); } return v; };
  try {
    await H.nav(); await H.waitFor('!!document.querySelector("#btnLandingPreviewDirect")', 15000); await H.sleep(1500);
    out.steps.push({ landingShot: await H.shot(tag + '-1-랜딩') });
    out.steps.push({ clickPreview: await H.click('#btnLandingPreviewDirect') }); await H.sleep(2500);
    out.entered = !!(await H.waitEntered(15000));
    out.sbIsNull = await H.ev('window.OurgoalAppScope.scope.sb === null');
    out.afterEnter = await H.snap([MARK]); out.afterEnter.shot = await H.shot(tag + '-2-둘러보기진입');
    if (!out.entered) throw new Error('둘러보기로 앱에 들어가지 못했다: ' + JSON.stringify(out.afterEnter.screen) + ' ' + JSON.stringify(out.afterEnter.openLayers).slice(0, 200));
    await closeGreeting(); out.closedBefore = await H.closeModals();
    await H.setFile('#capturePhotoInput', photo);
    out.photoAttached = await H.waitFor('(function(){var S=window.OurgoalAppScope.scope;return S.pendingCapturePhoto?String(S.pendingCapturePhoto).length:null;})()', 8000);
    await H.type('#captureInput', MARK); out.click = await H.click('#captureSave'); await H.sleep(9000);
    out.afterSave = await H.snap([MARK]); out.closedAfter = await H.closeModals(); await goRecords();
    out.cardAfterSave = JSON.parse(await H.ev('(' + cardFn.toString() + ')(' + JSON.stringify(MARK) + ')')); await H.sleep(300); out.cardAfterSave.shot = await H.shot(tag + '-3-저장직후-기록카드');
    await H.reload(); out.reloadEntered = !!(await H.waitEntered(20000)); await H.sleep(3500); await closeGreeting().catch(() => null); await H.closeModals(); await goRecords();
    out.cardAfterReload = JSON.parse(await H.ev('(' + cardFn.toString() + ')(' + JSON.stringify(MARK) + ')')); await H.sleep(300); out.cardAfterReload.shot = await H.shot(tag + '-4-새로고침뒤-기록카드');
    out.afterReload = await H.snap([MARK]);
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 500); }
  out.requests = H.S.reqs.filter(r => !r.preflight).map(r => r.method + ' ' + r.kind + '/' + r.table + '→' + r.answered).filter((v, i, a) => a.indexOf(v) === i); out.exceptions = H.exc; out.console = H.con.slice(0, 12);
  const pick = s => s && s.profile && s.profile.recs.find(r => r.text.indexOf(MARK) >= 0);
  console.log(JSON.stringify({ file: h.save(tag, out), error: out.error, entered: out.entered, idKind: out.afterEnter && out.afterEnter.profile && out.afterEnter.profile.idKind, photoAttached: out.photoAttached, toasts: out.afterSave && out.afterSave.toasts.filter(t => t.show).map(t => t.text).slice(-3), cardAfterSave: out.cardAfterSave, reloadEntered: out.reloadEntered, cardAfterReload: out.cardAfterReload, stateAfterReload: pick(out.afterReload), ls: out.afterReload && out.afterReload.marks[MARK].inLocalStorage, requests: out.requests.slice(0, 12), sbIsNull: out.sbIsNull, console: out.console.slice(0, 4).map(c => c.text.slice(0, 90)), lsAfterSave: out.afterSave && Object.keys(out.afterSave.ls) }, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
