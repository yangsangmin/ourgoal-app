'use strict';
// 물음 4(K): 사진이 달린 기록을 저장(서버 성공)하고 새로 고침하면 기록 카드에 사진 · AI 피드백이 남는가, 기기에는 남는가.
// 사용: node tools/03-k.cjs [서버의 옛 기록 수 2|0]
const fs = require('fs'), path = require('path');
const h = require('./h.cjs');
const NOLD = Number(process.argv[2] || 2), MARK = '재현K사진기록', tag = '03-K-사진-서버옛기록' + NOLD;
const cardFn = function (MARK) { var cards = Array.prototype.slice.call(document.querySelectorAll('.rec-card[data-recid]')).filter(function (c) { return (c.textContent || '').indexOf(MARK) >= 0; }); var c = cards[0]; if (!c) return JSON.stringify({ found: false }); c.scrollIntoView({ block: 'center' }); var img = c.querySelector('img'); var r = c.getBoundingClientRect(); return JSON.stringify({ found: true, n: cards.length, visible: r.width > 0 && r.height > 0, hasImg: !!img, imgSrcKind: img ? String(img.getAttribute('src')).slice(0, 22) : null, imgNatural: img ? img.naturalWidth + 'x' + img.naturalHeight : null, innerText: (c.innerText || '').replace(/\s+/g, ' ').slice(0, 300), htmlLen: c.innerHTML.length }); };
(async () => {
  const photo = path.join(h.OUT, 'lib', 'photo.png');
  fs.writeFileSync(photo, h.png(96, 96, [200, 60, 40]), { encoding: 'utf8' }); // 내용은 Buffer(PNG) — 인코딩 값은 Buffer 에는 쓰이지 않는다
  const H = await h.open({ lib: path.join(h.OUT, 'lib', 'supabase-js-cdn-at2.js') });
  H.S.tables.users = [h.userRow()]; H.S.tables.checkins = h.oldRows(NOLD);
  const out = { tool: 'tools/03-k.cjs', serverOldRecords: NOLD, marker: MARK, lib: h.libInfo(H.libPath), chrome: H.chrome, startedAt: new Date().toISOString(), note: '서버는 내내 정상(모든 저장이 201). 사진은 숨은 파일 입력칸에 진짜 PNG(96x96)를 넣었다. 에너지·집중은 슬라이더 값을 60·40으로 바꾸고 input 사건을 냈다(끌기 대신).' };
  const closeGreeting = async () => { const v = await H.ev('(function(){var m=document.getElementById("avatarGreetingModal");return !!m&&getComputedStyle(m).display!=="none";})()'); if (v) { await H.click('#btnAvatarGreetClose'); await H.sleep(300); } return v; };
  const goRecords = async () => { const c = await H.click('.navbtn[data-tab="records"]'); if (!c.ok || !c.hitSelf) await H.ev('(function(){var b=document.querySelector(\'.navbtn[data-tab="records"]\');if(b)b.click();})()'); await H.sleep(1300); };
  try {
    await H.nav(); out.entered = !!(await H.waitEntered(25000)); await H.sleep(3000); await closeGreeting(); await H.dropSeed();
    await H.setFile('#capturePhotoInput', photo);
    out.photoAttached = await H.waitFor('(function(){var S=window.OurgoalAppScope.scope;return S.pendingCapturePhoto?String(S.pendingCapturePhoto).slice(0,22)+"…("+String(S.pendingCapturePhoto).length+"자)":null;})()', 8000);
    out.sliders = await H.ev('(function(){var o={};[["sliderEnergy",60],["sliderFocus",40]].forEach(function(p){var el=document.getElementById(p[0]);if(!el){o[p[0]]=null;return;}el.value=p[1];el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));o[p[0]]=el.value;});return JSON.stringify(o);})()').then(JSON.parse);
    await H.type('#captureInput', MARK);
    out.beforeSave = await H.snap([MARK]); out.beforeSave.shot = await H.shot(tag + '-1-저장전-사진첨부');
    const mark0 = H.S.seq; out.click = await H.click('#captureSave'); const tClick = Date.now();
    await H.sleep(2500); out.after2s = await H.snap([MARK]); out.after2s.shot = await H.shot(tag + '-2-저장2.5초뒤');
    await H.sleep(7000); out.after9s = await H.snap([MARK]);
    out.toastsAfterClick = out.after9s.toasts.filter(t => t.at >= tClick - 50 && t.show).map(t => t.text);
    out.aiSheetShot = await H.shot(tag + '-2b-저장9초뒤-AI코칭창'); out.aiSheetWasOpen = await H.closeModals();
    await goRecords();
    out.cardAfterSave = JSON.parse(await H.ev('(' + cardFn.toString() + ')(' + JSON.stringify(MARK) + ')')); await H.sleep(400);
    out.cardAfterSave.shot = await H.shot(tag + '-3-저장직후-기록카드');
    out.stateAfterSave = await H.snap([MARK]);
    out.requestsDuringSave = H.reqsSince(mark0).filter(r => r.rw === 'write');
    out.serverRowOfNew = (H.S.tables.checkins || []).filter(r => String(r.text).indexOf(MARK) >= 0).map(r => ({ keys: Object.keys(r), meta: r.meta, hasPhotoAnywhere: JSON.stringify(r).indexOf('data:image') >= 0, hasFeedbackAnywhere: /verdict|fact_insight|feedback/.test(JSON.stringify(r)) }));
    out.serverAnyTableHasPhoto = Object.keys(H.S.tables).filter(k => JSON.stringify(H.S.tables[k]).indexOf('data:image') >= 0);
    // ----- 새로 고침 -----
    const mark1 = H.S.seq; await H.reload(); out.reload = { entered: !!(await H.waitEntered(25000)) }; await H.sleep(3500); await closeGreeting().catch(() => null);
    out.reload.home = await H.snap([MARK]); out.reload.home.shot = await H.shot(tag + '-4-새로고침뒤-홈');
    await goRecords();
    out.reload.card = JSON.parse(await H.ev('(' + cardFn.toString() + ')(' + JSON.stringify(MARK) + ')')); await H.sleep(400);
    out.reload.card.shot = await H.shot(tag + '-5-새로고침뒤-기록카드');
    out.reload.state = await H.snap([MARK]);
    out.reload.otherStorageWithPhoto = await H.ev('(function(){var o=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);var v=localStorage.getItem(k)||"";if(v.indexOf("data:image")>=0)o.push(k.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/,"<uid>")+":"+v.length);}return o;})()');
    out.reload.requests = H.reqsSince(mark1).filter(r => r.kind !== 'auth').map(r => r.method + ' ' + r.kind + '/' + r.table).filter((v, i, a) => a.indexOf(v) === i);
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 600); }
  out.exceptions = H.exc; out.console = H.con.slice(0, 20);
  const pick = s => s && s.profile && s.profile.recs.find(r => r.text.indexOf(MARK) >= 0);
  const bk = s => s && s.backup && s.backup.recs && s.backup.recs.find(r => r.text.indexOf(MARK) >= 0);
  const fc = s => s && s.fullCopy && s.fullCopy.recs && s.fullCopy.recs.find(r => r.text.indexOf(MARK) >= 0);
  console.log(JSON.stringify({ file: h.save(tag, out), error: out.error, photoAttached: out.photoAttached, sliders: out.sliders, toasts: out.toastsAfterClick, layers9s: out.after9s && out.after9s.openLayers,
    afterSave: { card: out.cardAfterSave, state: pick(out.stateAfterSave), backup: bk(out.stateAfterSave), fullCopy: fc(out.stateAfterSave) }, serverRow: out.serverRowOfNew, serverAnyTableHasPhoto: out.serverAnyTableHasPhoto,
    afterReload: out.reload && { entered: out.reload.entered, card: out.reload.card, state: pick(out.reload.state), backup: bk(out.reload.state), fullCopy: fc(out.reload.state), otherStorageWithPhoto: out.reload.otherStorageWithPhoto, requests: out.reload.requests }, exceptions: out.exceptions.slice(0, 3) }, null, 1));
  await H.close(); process.exit(0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
