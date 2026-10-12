'use strict';
// #TASK-ES-695 — 작업자 측정 모음(판정 아님). 부품 시험 결과와 브라우저 재현의 원시 결과(고치기 전 · 뒤)에서 값을 뽑아 reports/TASK-ES-695/measurement.json 에 쓴다.
// 사용: node reports/TASK-ES-695/tools/measure.cjs --before <고치기 전 결과 폴더(raw/ 가 든 곳)> --after <고친 뒤 결과 폴더> [--base <고치기 전 커밋>]
// 못 읽은 값은 null 로 둔다(0 이나 false 로 채우지 않는다).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const argv = process.argv.slice(2), opt = k => (argv.indexOf(k) >= 0 ? argv[argv.indexOf(k) + 1] : null);
const ROOT = path.resolve(__dirname, '..', '..', '..'), OUT = path.join(ROOT, 'reports', 'TASK-ES-695', 'measurement.json');
const BEFORE = opt('--before'), AFTER = opt('--after');
const read = (dir, name) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'raw', name), 'utf8')); } catch (e) { return null; } };
const pick = (o, p) => { try { return p.split('.').reduce((a, k) => (a === null || a === undefined ? undefined : a[k]), o); } catch (e) { return undefined; } };
const val = v => (v === undefined ? null : v);
const MP = '재현P0사진기록', MU = '재현P0못올린기록', MG = '재현P0못올린목표';
function unit() {
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'tests', 'local-keep-p0.test.js'), '--json'], { encoding: 'utf8' });
  let j = null; try { j = JSON.parse(String(r.stdout).trim().split('\n').filter(l => l.charAt(0) === '{').pop()); } catch (e) { j = null; }
  return { file: 'tests/local-keep-p0.test.js', exitCode: r.status, total: j ? j.total : null, passed: j ? j.passed : null, failed: j ? j.failed : null, names: j ? j.results.map(x => (x.ok ? 'ok ' : 'FAIL ') + x.name) : null };
}
function records(dir, label) {
  const j = read(dir, '07-p0-records-' + label + '.json'); if (!j) return null;
  const rec = a => (a || []).filter(r => r.text.indexOf(MP) >= 0)[0] || null;
  const keptHas = a => (a === null || a === undefined ? null : a.filter(k => k.text.indexOf(MU) >= 0).length);
  const b = rec(pick(j, 'afterReload.device.backup'));
  return {
    error: val(j.error), moduleLoaded: val(pick(j, 'afterReload.device.hasModule')),
    beforeReopen: { photoCardHasImage: val(pick(j, 'beforeReload.cardPhoto.hasImg')), photoCardHasFeedback: val(pick(j, 'beforeReload.cardPhoto.hasFeedbackText')), unsentCardOnScreen: val(pick(j, 'beforeReload.cardUnsent.found')) },
    afterReopen: {
      photoCardHasImage: val(pick(j, 'afterReload.cardPhoto.hasImg')), photoCardHasFeedback: val(pick(j, 'afterReload.cardPhoto.hasFeedbackText')),
      screenRecord: val(pick(j, 'afterReload.statePhoto')), deviceBackupRecord: b ? { photo: b.photo, feedback: b.feedback, energy: b.energy, focus: b.focus, notionDb: b.notionDb, structured: b.structured, themeMetadata: b.themeMetadata } : null,
      unsentCardOnScreen: val(pick(j, 'afterReload.cardUnsent.found')), unsentInScreenData: pick(j, 'afterReload.stateUnsent') === undefined ? null : !!pick(j, 'afterReload.stateUnsent'),
      unsentInBackupKey: pick(j, 'afterReload.device.keys.backup') ? pick(j, 'afterReload.device.keys.backup.marks').indexOf(MU) >= 0 : null,
      unsentInKeptKey: keptHas(pick(j, 'afterReload.device.kept')), keptKeyExists: pick(j, 'afterReload.device.keys') ? pick(j, 'afterReload.device.keys.kept') !== null : null,
      prevKeyExists: pick(j, 'afterReload.device.keys') ? pick(j, 'afterReload.device.keys.prev') !== null : null, prevEqualsBackupBeforeReopen: val(pick(j, 'afterReload.prevEqualsBackupBeforeReload')),
      unsentOnServer: val(pick(j, 'afterReload.serverHasUnsent')), checkinUploadRows: (pick(j, 'afterReload.checkinUpserts') || []).map(u => u.rows), requestKinds: val(pick(j, 'afterReload.requestKinds')), commit: val(pick(j, 'afterReload.device.keepStatus.records.last'))
    },
    rollback: { available: val(pick(j, 'rollback.available')), ok: val(pick(j, 'rollback.result.ok')), backupEqualsBeforeReopen: val(pick(j, 'rollback.backupEqualsBeforeReload')), swappedBack: val(pick(j, 'rollback.swapBack.ok')) },
    afterNextSave: { savesIssued: val(pick(j, 'afterNextSave.savesIssued')), photoCardHasImage: val(pick(j, 'afterNextSave.cardPhoto.hasImg')), screenRecord: val(pick(j, 'afterNextSave.statePhoto')), deviceBackupPhoto: rec(pick(j, 'afterNextSave.device.backup')) ? rec(pick(j, 'afterNextSave.device.backup')).photo : null, unsentInKeptKey: keptHas(pick(j, 'afterNextSave.device.kept')), unsentOnServer: val(pick(j, 'afterNextSave.serverHasUnsent')) },
    afterManualSync: { clicked: val(j.manualSyncClick), photoCardHasImage: val(pick(j, 'afterManualSync.cardPhoto.hasImg')), photoCardHasFeedback: val(pick(j, 'afterManualSync.cardPhoto.hasFeedbackText')), screenRecord: val(pick(j, 'afterManualSync.statePhoto')), deviceBackupPhoto: rec(pick(j, 'afterManualSync.device.backup')) ? rec(pick(j, 'afterManualSync.device.backup')).photo : null, unsentCardOnScreen: val(pick(j, 'afterManualSync.cardUnsent.found')), unsentInKeptKey: keptHas(pick(j, 'afterManualSync.device.kept')), unsentOnServer: val(pick(j, 'afterManualSync.serverHasUnsent')), requestKinds: val(pick(j, 'afterManualSync.requestKinds')) },
    afterSecondReopen: { photoCardHasImage: val(pick(j, 'afterReload2.cardPhoto.hasImg')), photoCardHasFeedback: val(pick(j, 'afterReload2.cardPhoto.hasFeedbackText')), screenRecord: val(pick(j, 'afterReload2.statePhoto')), unsentInKeptKey: keptHas(pick(j, 'afterReload2.device.kept')) }
  };
}
function goal(dir, label) {
  const j = read(dir, '07-p0-goal-' + label + '.json'); if (!j) return null;
  const inKept = a => (a === null || a === undefined ? null : a.filter(k => k.title.indexOf(MG) >= 0).length);
  return { error: val(j.error), beforeReopen: { onScreen: val(pick(j, 'beforeReload.bodyHasGoal')), onServer: val(pick(j, 'beforeReload.serverHasGoal')), inBackup: (pick(j, 'beforeReload.device.gBackup') || []).some(t => t.indexOf(MG) >= 0) },
    afterReopen: { onScreen: val(pick(j, 'afterReload.bodyHasGoal')), inScreenData: (pick(j, 'afterReload.goalsInState') || []).some(t => t.indexOf(MG) >= 0), inBackup: (pick(j, 'afterReload.device.gBackup') || []).some(t => t.indexOf(MG) >= 0), inKeptKey: inKept(pick(j, 'afterReload.device.gKept')), prevEqualsBackupBeforeReopen: val(pick(j, 'afterReload.prevEqualsBackupBeforeReload')), onServer: val(pick(j, 'afterReload.serverHasGoal')), goalUploadRows: (pick(j, 'afterReload.goalUpserts') || []).map(u => u.rows) },
    afterNextSave: { inKeptKey: inKept(pick(j, 'afterNextSave.device.gKept')), onServer: val(pick(j, 'afterNextSave.serverHasGoal')) } };
}
function quota(dir, label, name) {
  const j = read(dir, name || ('07-p0-quota-' + label + '.json')); if (!j) return null;
  const keptN = a => (a === null || a === undefined ? null : a.filter(k => k.text.indexOf(MU) >= 0).length);
  return { error: val(j.error), fill: val(j.fill), firstRequestsOnReopen: val(pick(j, 'afterReloadFull.firstRequests')),
    reopenWhileFull: { commit: val(pick(j, 'afterReloadFull.device.keepStatus.records.last')), storageErrors: val(pick(j, 'afterReloadFull.device.keepStatus.notes')), consoleWarnings: val(pick(j, 'afterReloadFull.consoleWarns')), unsentStillInBackup: val(pick(j, 'afterReloadFull.backupStillHasUnsent')), backupBytesIdentical: val(pick(j, 'afterReloadFull.backupUnchanged')), unsentInScreenData: pick(j, 'afterReloadFull.stateUnsent') === undefined ? null : !!pick(j, 'afterReloadFull.stateUnsent'), unsentInKeptKey: keptN(pick(j, 'afterReloadFull.device.kept')), unsentOnServer: val(pick(j, 'afterReloadFull.serverHasUnsent')) },
    nextSaveWhileFull: { savesIssued: val(pick(j, 'afterNextSaveFull.savesIssued')), unsentStillInBackup: val(pick(j, 'afterNextSaveFull.backupStillHasUnsent')), unsentOnServer: val(pick(j, 'afterNextSaveFull.serverHasUnsent')) },
    reopenAfterFreed: { unsentInKeptKey: keptN(pick(j, 'afterReloadFreed.device.kept')), backupTexts: val(pick(j, 'afterReloadFreed.device.backup')) ? pick(j, 'afterReloadFreed.device.backup').map(r => r.text) : null, unsentInScreenData: pick(j, 'afterReloadFreed.stateUnsent') === undefined ? null : !!pick(j, 'afterReloadFreed.stateUnsent'), unsentOnServer: val(pick(j, 'afterReloadFreed.serverHasUnsent')) } };
}
function k03(dir) { // 조사 도구 03-k.cjs 2 (같은 탭 새로 고침)
  const j = read(dir, '03-K-사진-서버옛기록2.json'); if (!j) return null;
  const st = s => { const r = (pick(s, 'profile.recs') || []).filter(x => x.text.indexOf('재현K사진기록') >= 0)[0]; return r ? { photo: !!r.photo, feedback: !!r.feedback, energy: r.energy, focus: r.focus } : null; };
  const bk = s => { const r = (pick(s, 'backup.recs') || []).filter(x => x.text.indexOf('재현K사진기록') >= 0)[0]; return r ? { photo: r.photo, feedback: r.feedback, energy: r.energy, focus: r.focus } : null; };
  return { error: val(j.error), afterSave: { cardHasImage: val(pick(j, 'cardAfterSave.hasImg')), screenRecord: st(j.stateAfterSave), deviceBackupRecord: bk(j.stateAfterSave) }, afterRefresh: { cardHasImage: val(pick(j, 'reload.card.hasImg')), cardText: val(pick(j, 'reload.card.innerText')), screenRecord: st(pick(j, 'reload.state')), deviceBackupRecord: bk(pick(j, 'reload.state')) }, serverRowHasPhoto: val(pick(j, 'serverRowOfNew.0.hasPhotoAnywhere')), requestKindsOnRefresh: val(pick(j, 'reload.requests')) };
}
function home500(dir) { // 조사 도구 02-home.cjs 500 2 (같은 탭 새로 고침, 그 순간 서버는 정상)
  const j = read(dir, '02-home-나-500-서버옛기록2.json'); if (!j) return null;
  const M = j.marker, m = s => pick(s, 'marks.' + M);
  const ls = m(pick(j, 'reload.recordsTab')) ? Object.keys(m(pick(j, 'reload.recordsTab')).inLocalStorage) : null;
  return { error: val(j.error), toastAfterSave: (j.toastsAfterClick || []).filter(t => t.show).map(t => t.text)[0] || null, afterRefresh: { inScreenData: m(pick(j, 'reload.recordsTab')) ? m(pick(j, 'reload.recordsTab')).inStateRecords : null, cardsVisible: m(pick(j, 'reload.recordsTab')) ? m(pick(j, 'reload.recordsTab')).inCardsVisible : null, deviceKeysHoldingIt: ls, onServer: val(pick(j, 'reload.serverHasNew')), uploadRows: (pick(j, 'reload.checkinUpserts') || []).map(u => u.rows) } };
}
const side = (dir, label) => (dir ? { dir: path.basename(path.resolve(dir)), photoAndUnsentRecord: records(dir, label), unsentGoal: goal(dir, label), storageNearlyFull: quota(dir, label), storageBrim: quota(dir, label, '07-p0-quota-남김0-' + label + '.json'), surveyTool03k: k03(dir), surveyTool02home500: home500(dir) } : null);
let head = null; try { head = cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { head = null; }
const out = { task: 'TASK-ES-695', kind: '작업자 측정(판정 아님)', measuredAt: new Date().toISOString(), tool: 'reports/TASK-ES-695/tools/measure.cjs', baseCommit: opt('--base'), headWhenMeasured: head,
  limits: '브라우저 재현의 서버 답은 브라우저 안 가짜 서버가 흉내 낸 것이고 로그인은 가짜 세션이다. 실서버 · 실계정 · 실기기가 아니다. 부품 시험은 가짜 저장소 · 가짜 서버로 제품 파일을 그대로 돌린 것이다.',
  unit: unit(), browser: { before: side(BEFORE, 'before'), after: side(AFTER, 'after') } };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
const a = out.browser.after, b = out.browser.before;
console.log(JSON.stringify({ wrote: path.relative(ROOT, OUT), unit: out.unit.passed + '/' + out.unit.total, before: b && { photoImg: pick(b, 'photoAndUnsentRecord.afterReopen.photoCardHasImage'), unsentKept: pick(b, 'photoAndUnsentRecord.afterReopen.unsentInKeptKey'), goalKept: pick(b, 'unsentGoal.afterReopen.inKeptKey'), k03img: pick(b, 'surveyTool03k.afterRefresh.cardHasImage') }, after: a && { photoImg: pick(a, 'photoAndUnsentRecord.afterReopen.photoCardHasImage'), unsentKept: pick(a, 'photoAndUnsentRecord.afterReopen.unsentInKeptKey'), goalKept: pick(a, 'unsentGoal.afterReopen.inKeptKey'), k03img: pick(a, 'surveyTool03k.afterRefresh.cardHasImage'), quotaStage: pick(a, 'storageNearlyFull.reopenWhileFull.commit.stage') } }));
