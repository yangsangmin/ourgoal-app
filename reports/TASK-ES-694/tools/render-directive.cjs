#!/usr/bin/env node
'use strict';
// #TASK-ES-694 — 지시함(docs/directives/ACTIVE.md)의 「열린 지시」에 DIR-006 을 더하고 「결심 대기」 표의 머리 바로 아래에 줄을 더한다.
// **더하기만 한다.** 같은 때 따로 올라가 있는 PR #966(DIR-005)과 같은 줄을 건드리지 않게, 「(열린 지시 없음)」 줄은 그대로 두고 그 아래(칸 끝의 구분선 앞)에 넣는다.
//   - #966 이 먼저 병합되면 그 줄은 DIR-005 로 바뀌어 있고, 이 PR 은 그 아래에 DIR-006 을 더한다.
//   - 이 PR 이 먼저 병합되면 「(열린 지시 없음)」 줄이 DIR-006 위에 남는다. #966 이 병합되면 그 줄이 DIR-005 로 바뀐다. #966 이 닫히면 그 한 줄을 지우는 PR 을 따로 올려야 한다.
// 줄 번호·숫자는 글틀(reports/TASK-ES-694/text/*.md)에 손으로 적지 않고 표지 {{이름}} 로 두며, 측정값(measure.json — tools/measure.cjs 산출)에서 채운다.
// 여러 번 돌려도 같은 결과가 되게 한다(이미 넣은 DIR-006 과 줄은 갈아 끼운다).
// 사용: node reports/TASK-ES-694/tools/render-directive.cjs            지시함을 고치고 주장 파일을 만든다
//       node reports/TASK-ES-694/tools/render-directive.cjs --check    채우지 않은 표지가 남았는지 본다(남았으면 종료 1)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..'), DIR = path.resolve(__dirname, '..');
const A = path.join(ROOT, 'docs', 'directives', 'ACTIVE.md');
const M = JSON.parse(fs.readFileSync(path.join(DIR, 'measure.json'), 'utf8'));
const sp = M.saveProfile, pl = M.profileLoad, row = M.serverRow, o = M.other, h = o.homeHandler, rr = M.rerun, ev = M.evidence, dom = M.dom, rs = M.realServer;
const n = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const V = {
  'base': M.sinceSurvey.mainHead, 'survey.base': M.sinceSurvey.surveyBase, 'survey.changed': M.sinceSurvey.productFilesChangedOnMain, 'runs': ev.browserRepro.runs, 'conds': ev.browserRepro.conditions, 'ev.tools': ev.reproTools, 'ev.shots': ev.reproShots,
  'sp.a': sp.lines[0], 'sp.b': sp.lines[1], 'w.users': sp.serverWaitLines.users, 'd.goals': sp.deviceWriteLines.goalsBackup, 'd.full': sp.deviceWriteLines.fullCopy, 'd.rec': sp.deviceWriteLines.recordsBackup,
  'pl.rec': pl.recordsBackupOverwriteLine, 'pl.goal': pl.goalsBackupWriteLines[0], 'pl.reA': pl.reuploadWhenServerEmptyLines[0], 'pl.reB': pl.reuploadWhenServerEmptyLines[1],
  'row.n': row.keys.length, 'row.a': row.toCheckinRowLines[0], 'row.b': row.toCheckinRowLines[1], 'row.storage': row.storageUploadCalls,
  'h.a': h.lines[0], 'h.b': h.lines[1], 'h.goalcat': h.categoryFromGoalLines[0], 'h.recA': h.recordPushLines[0], 'h.recB': h.recordPushLines[1],
  'boot.line': o.serverClient.createLine, 'q.a': o.offlineQueue.syncOnlineLines[0], 'q.b': o.offlineQueue.syncOnlineLines[1], 'render.line': o.recordsRender.saveOnRenderLine,
  'trash.a': o.trash.softDeleteLines[0], 'trash.b': o.trash.softDeleteLines[1], 'resync.a': o.manualResync.syncLine, 'resync.b': o.manualResync.replaceLine,
  'paths.n': M.savePaths.length, 'calls.places': n(M.callSites.places), 'calls.files': M.callSites.files,
  'a11y.line': dom.a11yLiveAnnouncerLine, 'dom.hits': dom.newNamesAlreadyUsed.reduce((a, x) => a + x.hits, 0), 'prv.line': M.privacy.generatedInfoLine,
  // 운영 서버 읽기 조사(조사 담당의 요청 기록을 센 값)와 그 사실이 닿는 코드 줄
  'rs.total': rs.requests, 'rs.writes': rs.nonGetOnTables, 'rs.outside': rs.outsideAgreedScope.total, 'rs.anon': rs.outsideAgreedScope.anonTableCounts.length, 'rs.other': rs.outsideAgreedScope.otherTables.length, 'rs.embed': rs.outsideAgreedScope.embeds.length,
  'up.a': rs.code.upsertCheckinRowsLines[0], 'up.b': rs.code.upsertCheckinRowsLines[1], 'min.a': rs.code.minimalUserLines[0], 'min.b': rs.code.minimalUserLines[1],
};
// 지시가 기대는 사실이 지금 코드 · 근거와 맞는지 먼저 본다(틀리면 멈춘다)
const must = [
  [sp.throwLines.length === 0 && !sp.goalsResultUsed && !sp.checkinsResultUsed, '저장 함수가 예외를 던지지 않고 기록 · 목표 올리기의 응답을 쓰지 않는다'],
  [sp.serverWaitLines.users < sp.deviceWriteLines.goalsBackup && sp.deviceWriteLines.fullCopy < sp.serverWaitLines.goals && sp.deviceWriteLines.recordsBackup < sp.serverWaitLines.checkins, '첫 서버 요청이 기기 쓰기보다 앞이다'],
  [pl.recordsBackupOverwriteLine > 0 && /setItem\('ourgoal_records_backup_'/.test(pl.overwriteText) && pl.goalsBackupWriteLines.length === 1, '다시 열 때 기록 · 목표의 기기 백업을 덮는 줄이 하나씩 있다'],
  [!!pl.reuploadWhenServerEmptyLines && pl.reuploadWhenServerEmptyLines[1] > pl.reuploadWhenServerEmptyLines[0], '서버 기록이 0건일 때 기기 것을 다시 올리는 묶음이 있다'],
  [row.keys.length > 0 && !row.hasPhoto && !row.hasFeedback && !row.hasEnergy && !row.hasFocus && row.updatedAtOrVersionInRow === 0, '서버로 가는 기록의 칸에 사진 · 피드백 · 에너지 · 집중 · 수정 시각이 없다'],
  [row.storageUploadCalls === 0, '서버 저장소에 올리는 코드가 0곳이다'],
  [o.trash.softDeleteLines.length === 2 && o.trash.hardDeleteCalls === 0 && o.trash.resultUsed === false, '지움은 표식을 붙이는 수정 요청 둘(목표 · 기록)이고 결과를 보지 않으며 행을 지우는 호출은 0이다'],
  [o.serverClient.createLine > 0 && o.serverClient.hasOptionsArgument === false, '서버 연결을 옵션 없이 만든다'],
  [h.hasFailureBranch === false && h.inputClearedLine < h.saveCallLines[0] && h.lockLines.length >= 1 && h.goalIdInRecord === 0, '홈 저장 처리기에 실패 갈래가 없고, 입력을 저장 호출보다 먼저 비우며, 단추를 잠그고, 기록에 목표 연결을 넣지 않는다'],
  [!!o.offlineQueue.syncOnlineLines && o.offlineQueue.successToastLine > 0 && o.recordsRender.saveOnRenderLine > 0 && o.manualResync.syncLine > 0 && o.manualResync.replaceLine > o.manualResync.syncLine, '대기줄 함수 · 기록 탭을 그릴 때의 저장 · 수동 동기화의 줄이 있다'],
  [M.savePaths.length === 11 && M.savePaths.every(p => p.exists && p.saveProfileCalls > 0), '저장 경로 11개의 파일이 있고 저장 함수를 부른다'],
  [dom.a11yLiveAnnouncerLine > 0 && dom.newNamesAlreadyUsed.every(x => x.hits === 0), '읽어 주는 자리가 이미 있고 상태 표시의 새 이름 넷은 아직 쓰이지 않는다'],
  [Object.values(M.privacy.wordsInArticle1).every(v => v === false) && M.privacy.generatedInfoLine > 0, '개인정보처리방침의 수집 항목에 사진 · 에너지 · 집중 · AI 피드백이 낱말로 없다'],
  [rr.photo.afterSave.cardHasPhoto === true && rr.photo.afterSave.deviceBackup.photo === true && rr.photo.afterReload.cardFound === true && rr.photo.afterReload.cardHasPhoto === false && rr.photo.afterReload.deviceBackup.photo === false && rr.photo.afterReload.deviceBackup.feedback === false && rr.photo.afterReload.state.energy === null, '다시 돌린 결과: 사진 기록을 저장하고 새로 고침하면 기록 카드와 기기에서 사진 · 피드백 · 에너지 · 집중이 사라진다'],
  [rr.photo.sentCheckinKeys.length === row.keys.length && rr.photo.sentCheckinKeys.join(',') === row.keys.join(','), '다시 돌린 결과: 서버로 나간 기록의 칸이 코드에서 읽은 칸과 같다'],
  [rr.http500.toastTextsSame === true && rr.http500.checkinWriteAnswers.length > 0 && rr.http500.checkinWriteAnswers.every(a => a === 500) && rr.http500.consoleWarningsAboutSave === 0 && rr.http500.afterReload.inStateRecords === 0 && rr.http500.afterReload.inLocalStorageKeys === 0 && rr.success.afterReload.inStateRecords === 1, '다시 돌린 결과: 500 에도 알림 글이 성공과 같고, 새로 고침 뒤 그 기록이 화면 데이터와 기기에서 사라진다(성공일 때는 남는다)'],
  [ev.contract.blockCriteria === 8 && ev.contract.decisionItems === 6 && ev.contract.sections === 10, '계약 사본에 출시를 막는 기준 여덟 · 상민님께 올릴 것 여섯 · 절 열(0~9)이 있다'],
  [ev.browserRepro.runs > 0 && ev.browserRepro.conditions > 0 && ev.reproTools === 8 && ev.reproShots === 3, '조사 문서의 실행 횟수를 읽었고 재현 도구 여덟 · 핵심 사진 셋이 있다'],
  [rs.requests === 139 && rs.nonGetOnTables === 0 && rs.byMethod.GET === 133 && rs.byMethod.POST === 6 && rs.byKind['auth-login'] === 3 && rs.byKind['auth-logout'] === 3, '운영 서버 읽기 조사의 요청 기록: 139건 · 표에 대한 GET 아닌 요청 0 · 로그인 3 · 로그아웃 3'],
  [['checkins.deleted_at', 'goals.deleted_at', 'checkins.theme', 'checkins.sub_theme', 'checkins.theme_confidence', 'users.trash', 'users.companions', 'checkins.updated_at', 'checkins.version', 'goals.version', 'users.updated_at', 'users.version', 'checkins.is_bot'].every(k => rs.absent[k] === true), '요청 기록: 지움 표식 · 테마 세 칸 · trash · companions · 버전 칸 · (goals 밖의) 수정 시각 칸을 묻자 모두 「칸 없음」으로 답했다'],
  [rs.present['goals.updated_at'] === true && rs.present['checkins.meta'] === true && rs.present['users.saved_avatars'] === true, '요청 기록: goals.updated_at · checkins.meta · users.saved_avatars 는 있다'],
  [rs.idIsUuid.length === 3 && rs.idIsUuid.every(x => x.errorCode === '22P02' && x.saysUuid), '요청 기록: 세 표의 id 에 맞지 않는 글자를 넣자 uuid 형이라는 오류가 왔다'],
  [rs.outsideAgreedScope.total === 11 && rs.outsideAgreedScope.anonTableCounts.length === 3 && rs.outsideAgreedScope.otherTables.length === 6 && rs.outsideAgreedScope.embeds.length === 2, '요청 기록: 「자기 행만」을 넘긴 조회가 11건(3 · 6 · 2)이다'],
  [rs.code.softDeleteLines.length === 2 && rs.code.themeRetryInUpsert === true && rs.code.minimalUserKeys.join(',') === 'id,username,display_name,bio,avatar_url' && rs.code.deletedAtFilterLines.length === 2 && rs.sqlFilesInRepo.every(x => x.exists), '코드: 지움은 deleted_at 수정 둘 · 기록 올리기에 테마 재시도가 있다 · 사용자 재전송은 5칸 · 불러오기는 deleted_at 으로만 거른다 · 견준 SQL 파일이 저장소에 있다'],
  [fs.existsSync(path.join(DIR, 'evidence', 'after-contract-facts.md')) && fs.existsSync(path.join(DIR, 'evidence', 'real-server-read-survey.md')), '운영 서버 읽기 조사의 사본과 「확정본 뒤에 나온 사실」 글이 근거 폴더에 있다'],
  [M.sinceSurvey.productFilesChangedOnMain === 0 && M.sinceSurvey.productFilesChangedInThisBranch === 0, '조사 문서들의 기준 커밋 뒤로 주 가지에서도 이 가지에서도 제품 코드가 바뀌지 않았다'],
  [M.pointers.photoRow && M.pointers.syncStatusMockRow && M.pointers.dir005Open && !M.pointers.saysNoOpenDirective, '주 가지의 지시함에 DIR-005 가 열려 있고, 결심 대기 줄이 가리키는 두 줄(사진 등의 서버 보존 · 저장 상태 시안)이 있으며, 「(열린 지시 없음)」 줄이 없다'],
];
const broken = must.filter(m => !m[0]).map(m => m[1]);
if (broken.length) { console.error('지금 코드 · 근거가 지시의 전제와 다르다: ' + broken.join(' / ')); process.exit(1); }
const unknown = [];
const fill = t => t.replace(/\{\{([^}]+)\}\}/g, (m, k) => { if (!(k in V) || V[k] === undefined || V[k] === null) { unknown.push(k); return m; } return String(V[k]); });
const read = f => fs.readFileSync(path.join(DIR, 'text', f), 'utf8').replace(/\r\n/g, '\n').trim();
const dir6 = fill(read('dir-006.md')), rows = fill(read('decision-rows.md')).split('\n');
if (unknown.length) { console.error('채울 수 없는 표지: ' + [...new Set(unknown)].join(', ')); process.exit(1); }

let doc = fs.readFileSync(A, 'utf8'); const crlf = /\r\n/.test(doc); doc = doc.replace(/\r\n/g, '\n');
if (process.argv.includes('--check')) { const tokens = (doc.match(/\{\{[^}]+\}\}/g) || []); console.log(JSON.stringify({ tokens: tokens.length, hasDir006: doc.indexOf('### DIR-006') >= 0 }, null, 1)); process.exit(tokens.length ? 1 : 0); }

// ① 열린 지시 — 칸 끝의 구분선 앞에 더한다(다른 지시와 「(열린 지시 없음)」 줄은 건드리지 않는다)
const a = doc.indexOf('## 열린 지시\n'), b = doc.indexOf('\n---\n\n## 결심 대기');
if (a < 0 || b < 0 || b < a) { console.error('「열린 지시」 칸을 찾지 못했다'); process.exit(1); }
let open = doc.slice(a, b);
const at = open.indexOf('### DIR-006');
if (at >= 0) { const next = open.indexOf('\n### DIR-', at + 5); open = (open.slice(0, at) + (next >= 0 ? open.slice(next + 1) : '')).replace(/\n+$/, ''); }
doc = doc.slice(0, a) + open.replace(/\n+$/, '') + '\n\n' + dir6 + '\n' + doc.slice(b);
// ② 결심 대기 표 — 머리 구분 줄 바로 아래에 더한다(표 끝에는 다른 PR 이 줄을 더한다)
const L = doc.split('\n'); const head = L.findIndex(l => l.indexOf('## 결심 대기') === 0);
const sep = L.findIndex((l, i) => i > head && /^\|\s*-{3,}\s*\|/.test(l));
if (head < 0 || sep < 0) { console.error('「결심 대기」 표를 찾지 못했다'); process.exit(1); }
let end = sep + 1; while (end < L.length && L[end].indexOf('|') === 0) end++;
const keyOf = l => l.split('|')[1].trim().slice(0, 24); const keys = rows.map(keyOf); let replaced = 0;
for (let i = end - 1; i > sep; i--) { if (keys.indexOf(keyOf(L[i])) >= 0) { L.splice(i, 1); replaced++; } }
L.splice(sep + 1, 0, ...rows); doc = L.join('\n');
fs.writeFileSync(A, crlf ? doc.replace(/\n/g, '\r\n') : doc, { encoding: 'utf8' });

// 주장 파일
const F = 'docs/directives/ACTIVE.md', C = 'docs/specs/SAVE-SYNC-CONTRACT-2026-10-12.md', E = 'reports/TASK-ES-694/evidence/', P = 'reports/TASK-ES-694/repro/';
const has = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeContains', file, text } });
const not = (id, req, statement, file, text) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file], check: { type: 'codeNotContains', file, text } });
const cell = i => rows[i].split('|')[1].trim();
const claims = [
  has('C1', 'R1', 'DIR-006 이 열린 지시에 있다', F, '### DIR-006 — 저장 안정화: 기록 · 목표 · 사진이 사라지지 않게 하고, 저장의 실제 상태를 알린다'),
  has('C2', 'R1', '저장 처리 파일은 담당 하나가 순서대로 고친다고 적혀 있다', F, '**저장 처리 파일은 이 담당 하나가 순서대로 고친다.**'),
  has('C3', 'R2', '사진이 사라지는 사실이 덮어쓰는 줄과 함께 적혀 있다', F, '지우는 자리는 `js/core/profile-load.js` ' + pl.recordsBackupOverwriteLine + '행이다'),
  has('C4', 'R2', '사진 사실의 확인 방식과 누가 보았는지 적혀 있다', F, '(화면 확인 — 조사 담당. 이 지시를 쓴 작업자도 저장소에 넣은 도구로 한 번 다시 돌려 같은 것을 보았다)'),
  has('C5', 'R2', '서버로 가는 기록의 칸 수가 측정값대로 적혀 있다', F, '서버로 가는 기록의 칸은 ' + row.keys.length + '개이고(`js/record-ledger.js` ' + row.toCheckinRowLines[0] + '~' + row.toCheckinRowLines[1] + '행)'),
  has('C6', 'R2', '500 · 통신 거절에도 성공 알림이 같다는 사실이 적혀 있다', F, '**서버가 500 이나 통신 거절로 답해도 성공 알림이 글자까지 같다**'),
  has('C7', 'R2', '올리지 못한 기록 · 목표가 다시 열 때 사라진다는 사실이 적혀 있다', F, '**올리지 못한 기록 · 목표는 다시 열 때 사라진다**'),
  has('C8', 'R2', '응답 없음이면 기기에도 쓰이지 않는다는 사실이 줄 번호와 함께 적혀 있다', F, '기기 쓰기(' + sp.deviceWriteLines.goalsBackup + ' · ' + sp.deviceWriteLines.fullCopy + ' · ' + sp.deviceWriteLines.recordsBackup + '행)가 첫 서버 요청(' + sp.serverWaitLines.users + '행) 뒤에 있고'),
  has('C9', 'R2', '여러 번 누르면 겹친다는 사실이 적혀 있다', F, '기록 창과 기록 도우미는 같은 id 의 기록 3건(도우미는 경험치도 겹침), 목표 만들기는 목표 3개'),
  has('C10', 'R2', '한계(운영 서버는 읽기만 · 실기기 미측정)가 적혀 있다', F, '**한계**: 운영 서버는 읽기만 했다 — 쓰기 · 접근 규칙의 글 · 표 정의(기본 키 · 기본값) · 한 번 조회의 상한은 재지 않았다.'),
  has('C11', 'R3', '묶음마다 PR 을 따로 낸다고 적혀 있다', F, '**묶음마다 PR 을 따로 낸다.**'),
  has('C12', 'R3', '묶음 P0 가 부수지 않는 것만이라고 적혀 있다', F, '**묶음 P0 — 부수지 않는 것만**(계약 1절)'),
  has('C13', 'R3', 'P0 의 보관이 지우지 않고 올리지 않는 것이라고 적혀 있다', F, '**지우지 않고 보관 열쇠로 옮긴다** — 올리지 않는다.'),
  has('C14', 'R3', 'P0 의 되읽어 확인 조건이 적혀 있다', F, '보관과 사본 쓰기를 **되읽어 확인한 뒤에만** 원래 백업을 바꾼다.'),
  has('C15', 'R3', '실서버 조사가 묶음 B 보다 먼저라고 적혀 있다', F, '**실서버 조사 — 묶음 B 보다 먼저**(계약 8절)'),
  has('C16', 'R3', '실서버 쓰기 시험이 묶음 B 보다 먼저이고 승인된 범위 안에서만 한다고 적혀 있다', F, '**실서버 쓰기 시험은 묶음 B 보다 먼저이고, 상민님이 승인하신 범위 안에서만 한다.**'),
  has('C17', 'R3', '묶음 A 의 내용이 적혀 있다', F, '**묶음 A — 저장 함수가 결과를 돌려주고, 기기에 먼저 쓴다**(계약 2절)'),
  has('C18', 'R3', 'A 만으로는 출시 가능 표시가 없다고 적혀 있다', F, '**A 만으로는 「출시 가능」이라고 표시하지 않는다.**'),
  has('C19', 'R3', '묶음 B 가 적혀 있다', F, '**묶음 B — 미확정 변경 목록**'),
  has('C20', 'R3', '묶음 C 와 저장 경로의 수가 적혀 있다', F, '저장 경로 ' + M.savePaths.length + '개(조사 문서의 표 — 홈 오늘 기록 · 빠른 체크인 · 기록 창 · 기록 도우미 · 전문 템플릿 · 시간 기록 · 뽀모도로 · 목표 만들기 · 일정 · 설정 · 오프라인 대기줄 복귀)'),
  has('C21', 'R3', '종단간 회귀와 계수기가 적혀 있다', F, '**종단간 회귀와 계수기**(계약 8절)'),
  has('C22', 'R4', '지시가 계약 사본을 가리킨다', F, '**저장 · 동기화 계약** — `docs/specs/SAVE-SYNC-CONTRACT-2026-10-12.md`'),
  has('C23', 'R4', '계약 사본의 머리에 사본이라고 적혀 있다', C, '- **이 파일은 사본이다.** 정본은 볼트 `C:/dev/vault/에이전트 토론장/2026-10-12 회의 03 — 저장 · 동기화 계약 검토/확정본 — 저장 · 동기화 계약.md` 이다.'),
  has('C24', 'R4', '계약 사본에 출시를 막는 기준이 글자 그대로 있다', C, '기기 쓰기가 확인된 기록 · 목표 · 사진이 그 뒤 화면이나 기기에서 사라진다 / 기기 쓰기가 확인되지 않았는데 입력이 비워져 어디에도 남지 않는다 / 실패가 성공으로 보인다 / 다른 계정으로 쓰인다 / 지운 것이 되살아난다 / 경험치가 겹쳐 들어간다 / 저장이나 로그인이 안 되는 상태에 갇힌다 / 영영 미확정으로 남는다.'),
  has('C25', 'R4', '조사 문서(코드 읽기와 함수 재현)의 사본이 있다', E + 'save-failure-investigation.md', '# 근거 — 기록 저장이 실패했을 때 무슨 일이 일어나는가'),
  has('C26', 'R4', '조사 문서(브라우저 재현)의 사본이 있다', E + 'save-failure-browser-repro.md', '브라우저 실행 ' + ev.browserRepro.runs + '회, 조건 ' + ev.browserRepro.conditions + '개.'),
  has('C27', 'R4', '조사 문서(읽기 조사 셋)의 사본이 있다', E + 'read-survey-three.md', '# 읽기 조사 셋(작업 0-2) — 시험 서버 · 서버가 받는 칸 · 추천 칩의 태그'),
  has('C28', 'R4', '재현 도구의 공용 틀이 있다', P + 'tools/h.cjs', '저장 실패 조사 — 브라우저 재현 공용 틀'),
  has('C29', 'R4', '재현 폴더에 넣은 것과 넣지 않은 것 · 한계가 적혀 있다', P + '읽어두기.md', '## 넣지 않은 것'),
  has('C30', 'R4', '이 작업자가 다시 돌린 원시 결과가 있다', P + 'rerun-TASK-ES-694/03-K-사진-서버옛기록2.json', '"tool": "tools/03-k.cjs"'),
  has('C31', 'R5', '출시를 막는 기준 여덟이 완료 기준에 있다', F, '(1) 기기 쓰기가 확인된 기록 · 목표 · 사진이 그 뒤 화면이나 기기에서 사라진다 (2) 기기 쓰기가 확인되지 않았는데 입력이 비워져 어디에도 남지 않는다 (3) 실패가 성공으로 보인다 (4) 다른 계정으로 쓰인다 (5) 지운 것이 되살아난다 (6) 경험치가 겹쳐 들어간다 (7) 저장이나 로그인이 안 되는 상태에 갇힌다 (8) 영영 미확정으로 남는다.'),
  has('C32', 'R5', '검증표가 완료 기준에 있다', F, '변경 종류(새로 · 고침 · 지움 · 되살림) × 조건(성공 · 500 · 401 · 403 · 429 · 통신 거절 · 응답 없음 · 오프라인 · 탭 강제 종료 · 새로 고침 · 계정 전환 · 두 탭 · 여러 번 누르기 · 사진 · 용량 초과) × 확인 방식(함수 · 브라우저 · 실서버 · 실기기)'),
  has('C33', 'R5', '숨긴 보관은 저장 안전 완료가 아니라고 적혀 있다', F, '**숨긴 보관은 「저장 안전 완료」가 아니다**'),
  has('C34', 'R5', 'A 만으로는 출시 가능 표시가 없다고 완료 기준에 적혀 있다', F, '**A 만으로는 「출시 가능」 표시가 없다**'),
  has('C35', 'R5', '확인한 범위와 못 잰 것을 따로 적으라고 되어 있다', F, '(10) 「확인한 범위」와 「못 잰 것」이 따로 적혀 있다'),
  has('C36', 'R5', '고치기 전후를 재현 도구로 견준 증거를 PR 마다 붙이라고 되어 있다', F, 'PR 마다 `reports/TASK-ES-694/repro/tools/` 의 브라우저 재현 도구로 **고치기 전후를 견준 증거**를 붙인다.'),
  has('C37', 'R6', '확인 담당의 이름이 적혀 있다', F, '저장 쪽 독립 확인 = 코덱스 「10만 아워골 로드맵 제작」 세션(격리 사본에서 읽고 시험을 돌린다. 실행할 수 있는 범위는 착수 때 확인하고 못 한 것은 미측정으로 적는다). 화면 = 「양비스웹/시스템 개선계획」 세션의 시안과 판정서. **판정의 정본은 GitHub 의 법정이다.**'),
  has('C38', 'R7', '디자인 지시의 기록 창 묶음이 묶음 A 뒤라고 적혀 있다', F, '(홈 「오늘 기록하기」 창의 꼴)는 이 지시의 묶음 A 가 끝난 뒤에 시작한다.'),
  has('C39', 'R7', '상태 표시의 뼈대 이름 넷이 적혀 있다', F, '`#captureSyncStatus`, 상태는 속성 `data-sync-state`(confirmed · sending · local · reauth · rejected · failed), 까닭은 `data-sync-reason`, 단추는 많아야 하나 `#captureSyncAction`'),
  has('C40', 'R8', '결심 대기에 서버가 도와야 되는 보장 줄이 있다', F, cell(0).slice(0, 50)),
  has('C41', 'R8', '결심 대기에 운영 안 시험 계정의 쓰기 시험 줄이 있다', F, cell(1).slice(0, 50)),
  has('C42', 'R8', '결심 대기에 일정 · 설정의 서버 보존 줄이 있다', F, cell(3).slice(0, 40)),
  has('C43', 'R8', '결심 대기에 보관함을 지우는 규칙 줄이 있다', F, cell(4).slice(0, 40)),
  has('C44', 'R8', '결심 대기에 홈 기록의 목표 연결 줄이 줄 번호와 함께 있다', F, '(`js/tabs/records/checkin-capture.js` ' + h.categoryFromGoalLines[0] + '행 · ' + h.recordPushLines[0] + '~' + h.recordPushLines[1] + '행)'),
  has('C45', 'R8', '결심 대기에 새 화면 글 줄이 있다', F, cell(6).slice(0, 40)),
  has('C46', 'R11', '결심 대기의 쓰기 시험 줄의 상태가 승인됨이다', F, '| 운영 서버에 쓰기 | 승인됨(2026-10-12) — 시험 계정으로 자기 행만, 아홉 가지. 결과는 따로 올린다 |'),
  has('C47', 'R8', '결심 대기 칸의 머리말과 앞선 줄은 그대로다', F, '## 결심 대기 (상민님만 결정한다 — AI 는 이 칸을 스스로 진행하지 않는다)'),
  has('C48', 'R8', '앞서 있던 줄이 그대로 있다', F, '| Google Play 개발자 계정 등록($25 결제·신분 확인) | 돈 |'),
  has('C49', 'R9', '상민님 원문이 글자 그대로 있다', F, '「작업을 시작하기 전에 3 세션의 의견을 조율해서 최상안을 만들고 각 작업을 시작해. 각 세션마다 발언권은 기본 5회 조율이 제대로 이뤄지지 않을시 최대 10회까지 진행해. 그래야 작업한 뒤에 허점이 생겨서 다시 작업하는 일이 줄어서 좋을 것 같아. 대화내용과, 협의결과, 작업결과는 쌓아서 계속 활용되도록 하고」'),
  has('C50', 'R9', '저장 안정화를 시키신 원문이 없고 병합이 착수의 승인이라고 적혀 있다', F, '**저장 안정화를 시키신 말씀의 원문은 이 지시에 없다. 이 지시를 병합하시는 것이 저장 안정화 착수의 승인이다.**'),
  has('C51', 'R9', '회의 02 · 03 이 세션 간 합의이지 승인이 아니라고 적혀 있다', F, '의 합의이지 상민님 승인이 아니다. 이 지시의 묶음과 순서 · 완료 기준 · 확인 담당은 그 합의를 옮긴 것이다.'),
  has('C52', 'R9', '작성자가 채팅을 보지 못했다고 적었다', F, '이 지시를 쓴 작업자는 상민님과의 채팅을 직접 보지 못했다.'),
  has('C53', 'R1', '완료된 지시 DIR-004 는 그대로 있다', F, '### DIR-004 — 미분화 덩어리 해체 범위 확대 (종결)'),
  not('C54', 'R1', '채우지 않은 표지가 지시함에 남아 있지 않다', F, '{{base}}'),
  has('C55', 'R1', '티켓 대장에 ES-694 한 줄이 있다', 'docs/rules/TICKETS.md', '- #TASK-ES-694 | INFRA | 지시함 DIR-006 등록 — 저장 안정화'),
  has('C56', 'R4', '측정값 파일이 있다', 'reports/TASK-ES-694/measure.json', '"recordsBackupOverwriteLine"'),
  has('C57', 'R5', '서버가 도와야 되는 보장이 미측정이라고 완료 기준에 적혀 있다', F, '해결하거나, 닿는 길을 좁히거나, 위험을 적은 별도 결정이 있기 전에는 「저장 안전 완료」로 표시하지 않는다.'),
  has('C58', 'R10', '운영 표에 지움 표식 칸이 없다는 사실이 표시와 함께 적혀 있다', F, '운영의 `checkins` · `goals` 에 지움 표식 칸(`deleted_at`)이 없다[확인].'),
  has('C59', 'R10', '지움이 서버에 반영될 수 없다는 것이 추론이라고 적혀 있다', F, '지움이 서버에 반영될 수 없고 다시 열면 서버 행이 그대로 온다[추론 — 쓰기 시험과 화면 확인 전].'),
  has('C60', 'R10', 'id 가 uuid 형이라는 사실과 모르는 것이 적혀 있다', F, '`checkins.id` · `goals.id` 는 uuid 형이다[확인].'),
  has('C61', 'R10', '테마 칸 · trash · companions 가 없다는 사실과 그 추론이 줄 번호와 함께 적혀 있다', F, '(`js/core/home-cockpit.js` ' + rs.code.minimalUserLines[0] + '~' + rs.code.minimalUserLines[1] + '행)[추론]'),
  has('C62', 'R10', '저장소의 SQL 일부가 운영에 실행되지 않은 상태로 보인다고 적혀 있다', F, '저장소의 SQL 일부가 운영에 실행되지 않은 상태로 보인다.'),
  has('C63', 'R10', '읽기 조사를 병합 전에 했고 따로 여쭙지 않았다고 적혀 있다', F, '**이 조사는 이 지시가 병합되기 전에 했다** — 세 세션의 합의(계약 8절)가 「이미 허락된 시험 계정으로 자기 행만 읽는 부수지 않는 조사라 새 승인을 따로 구하지 않는다」고 본 데 따른 것이고, 상민님께 따로 여쭙지 않았다.'),
  has('C64', 'R10', '범위를 넘긴 조회의 건수가 요청 기록대로 적혀 있다', F, '「자기 행만」을 넘긴 조회가 ' + rs.outsideAgreedScope.total + '건 있었다(로그인 없이 공개 키만으로 세 표의 개수 조회 ' + rs.outsideAgreedScope.anonTableCounts.length + '건 · 다른 표 `team_pings` · `team_ping_replies` 의 자기 행 개수 ' + rs.outsideAgreedScope.otherTables.length + '건 · `users` 에 기록과 목표를 끼워 넣는 조회 ' + rs.outsideAgreedScope.embeds.length + '건'),
  has('C65', 'R10', '쓰기 시험으로만 알 수 있는 아홉 가지가 보고서의 글 그대로 있다', F, '9. 지운 뒤 다시 열면 되살아나는가(화면 · 운영): 사실 2번의 확정.」'),
  has('C66', 'R11', '쓰기 시험의 승인이 이 지시의 병합이 아니라 상민님 말씀이라고 적혀 있다', F, '승인은 2026-10-12 의 말씀이다(결심 기록의 원문 2 — 이 지시의 병합이 아니다).'),
  has('C67', 'R10', '묶음 B 의 지움 처리는 운영 표의 사실이 확인된 뒤에 설계한다고 적혀 있다', F, '**다만 지움의 처리는 운영 표의 사실이 확인된 뒤에 설계한다**'),
  has('C68', 'R10', 'P0 에는 운영 표의 사실이 닿지 않는다고 적혀 있다', F, '운영 표의 사실(「왜」 ⑦)은 이 묶음에 닿지 않는다 — 서버에 더 묻지 않는 묶음이기 때문이다.'),
  has('C69', 'R8', '결심 대기에 운영에 실행되지 않은 것으로 보이는 SQL 줄이 있다', F, cell(2).slice(0, 50)),
  has('C70', 'R8', 'SQL 실행은 대시보드에서 사람 손이 필요하다고 적혀 있다', F, '실행은 대시보드에서 사람 손이 필요하다. 지움 표식 칸이 없으면 앱의 지움이 서버에 남지 않는다[추론 — 쓰기 시험과 화면 확인 전].'),
  has('C71', 'R8', '서버가 도와야 되는 보장 줄에 버전 칸 · 수정 시각 칸의 사실이 붙어 있다', F, '운영 표에 버전 칸이 없고 수정 시각 칸은 `goals` 에만 있다[확인 — 운영 서버 읽기 조사].'),
  has('C72', 'R4', '운영 서버 읽기 조사의 사본이 근거 폴더에 있다', E + 'real-server-read-survey.md', '# 아워골 운영 서버 「읽기만」 조사 보고서 (회의 03 확정본 8절의 읽기 조사)'),
  has('C73', 'R10', '「확정본 뒤에 나온 사실」 글에 계약 사본을 고치지 않았다고 적혀 있다', E + 'after-contract-facts.md', '은 **고치지 않았다**'),
  has('C74', 'R10', '「확정본 뒤에 나온 사실」 글에 범위를 넘긴 조회가 적혀 있다', E + 'after-contract-facts.md', '## 2. 조사가 그 범위를 넘긴 조회'),
  has('C75', 'R4', '운영 서버 읽기 조사의 요청 기록이 있다', 'reports/TASK-ES-694/real-server-read/requests.jsonl', '"kind":"auth-login"'),
  not('C76', 'R10', '계약 사본에는 뒤에 나온 사실을 적어 넣지 않았다', C, '운영 서버 읽기 조사'),
  has('C77', 'R11', '상민님 원문 2 가 글자 그대로 있다', F, '**상민님 원문 2**(2026-10-12 저녁): 「2. 운영서버 쓰기 시험 승인」'),
  has('C78', 'R11', '물은 글이 그대로 있다', F, '지휘 세션이 물은 글: 「전용 시험 계정으로 자기 행만 쓰고 지우는 시험 아홉 가지」'),
  has('C79', 'R11', '결심 기록의 범위 밖이 글자 그대로 있다', F, '「2 는 시험 계정 밖의 행 · 다른 사용자 자료 · 운영 표의 구조를 바꾸는 SQL · 함수 호출과 발송을 허락하지 않는다. 운영에 SQL 을 실행하는 일은 여기 없다.」'),
  has('C80', 'R11', '운영에 SQL 을 실행하는 일은 승인에 없다고 적혀 있다', F, '**운영에 SQL 을 실행하는 일은 승인에 없다**'),
  has('C81', 'R12', '합친 지시함에 DIR-005 가 그대로 있다', F, '### DIR-005 — 디자인 개편 1단계: 공용 꾸밈(유전자) 최소 조정과 홈 「오늘 기록하기」 창 시범'),
  not('C82', 'R12', '합친 지시함에 「(열린 지시 없음)」 줄이 없다', F, '(열린 지시 없음)'),
  has('C83', 'R12', '결심 대기 줄이 가리키는 사진 등의 서버 보존 줄이 있다', F, '| 사진 · AI 피드백 · 에너지 · 집중 값을 서버에도 보존할지'),
  has('C84', 'R12', '결심 대기 줄이 가리키는 저장 상태 시안 줄이 있다', F, '| 저장 상태를 화면이 말하는 시안의 방향 확인'),
  has('C85', 'R12', 'DIR-005 와 함께 올라온 추천 칩 줄은 그대로다', F, '| 고정 추천 칩 줄의 동작 — 뼈대의 `#smartRecommendChips`'),
  has('C86', 'R12', '티켓 대장에 ES-693 줄이 그대로 있다', 'docs/rules/TICKETS.md', '- #TASK-ES-693 | INFRA | 지시함 DIR-005 등록 — 디자인 개편 1단계'),
];
const out = { task: 'TASK-ES-694', requirementsSource: 'docs/specs/REQ-TASK-ES-694-DIR-006-SAVE-STABILIZATION.md',
  requirements: [
    { id: 'R1', text: '지시함 「열린 지시」에 DIR-006(저장 안정화)을 올린다. 줄을 더하기만 하고, 줄 번호와 숫자는 지금 코드에서 다시 읽는다.' },
    { id: 'R2', text: '왜 — 조사에서 확인된 사실을 확인 방식(화면 확인 · 함수 재현 · 코드 읽기)과 누가 보았는지를 갈라 적고, 한계(실서버 · 실기기 미측정)를 적는다.' },
    { id: 'R3', text: '묶음과 순서를 계약 1절대로 적는다 — P0(부수지 않는 것만) → 실서버 조사(B 보다 먼저 — 읽기는 한 번 했고, 쓰기 시험은 상민님이 승인하신 범위 안에서만) → A → B → C → 종단간 회귀. 묶음마다 PR 을 따로.' },
    { id: 'R4', text: '계약 확정본과 조사 문서 넷을 저장소에 사본으로 넣고(머리에 사본 · 정본의 자리), 재현 도구와 결과 요약, 운영 서버 읽기 조사의 스크립트와 요청 기록을 넣는다.' },
    { id: 'R5', text: '완료 기준에 계약 8절의 출시를 막는 기준 여덟과 검증표를 그대로 적고, 묶음마다 확인한 범위와 못 잰 것을 따로 적게 한다.' },
    { id: 'R6', text: '확인 담당을 이름으로 적는다(구현 · 저장 쪽 독립 확인 · 화면 · 판정 정본).' },
    { id: 'R7', text: '디자인 지시(DIR-005)와의 이음 — 그 지시의 기록 창 묶음은 이 지시의 A 뒤, 상태 표시의 뼈대 이름을 함께 쓴다.' },
    { id: 'R8', text: '「결심 대기」 표에 일곱 줄을 올린다(계약 9절의 여섯 + 운영에 실행되지 않은 것으로 보이는 SQL). 줄을 더하기만 하고 칸 머리말과 앞선 줄은 그대로 둔다.' },
    { id: 'R9', text: '결심 기록에 상민님 원문을 글자 그대로 적고, 회의 02 · 03 을 세션 간 합의(승인 아님)로 가른다. 이 지시의 병합이 착수의 승인이라고 적는다.' },
    { id: 'R10', text: '계약이 굳은 뒤에 나온 운영 서버 읽기 조사의 사실을 확인 · 추론 · 모름으로 갈라 지시와 근거 글에 적는다. 계약 사본은 고치지 않는다. 조사를 병합 전에 한 것과 범위를 넘긴 조회를 사실대로 적는다.' },
    { id: 'R11', text: '상민님이 운영 서버 쓰기 시험을 승인하신 말씀(2026-10-12)을 결심 기록에 원문 · 물은 글 · 범위 밖과 함께 적고, 결심 대기의 쓰기 시험 줄을 「승인됨」으로 고친다. 운영에 SQL 을 실행하는 일은 승인에 없다고 적는다.' },
    { id: 'R12', text: 'PR #966 이 병합된 주 가지를 이 가지에 합친다(합침 커밋 — 다시 쓰기 · 강제 올리기 없음). 합친 지시함은 DIR-005 다음에 DIR-006 이고 「(열린 지시 없음)」 줄이 없으며, DIR-005 와 함께 올라온 줄은 건드리지 않는다.' },
  ],
  outOfScopeReports: [ { text: '이 PR 은 지시를 올리기만 한다. 저장 함수 · 불러오기 · 화면을 고치는 일은 이 지시가 병합된 뒤 묶음마다 새 작업번호로 한다.', cannotBecause: 'out-of-scope-feature' } ],
  claims };
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const bad = claims.filter(c => { const p = path.join(ROOT, c.check.file); const s = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; return (c.check.type === 'codeContains') !== s.includes(c.check.text); }).map(c => c.id);
console.log(JSON.stringify({ dir006: true, dir005Before006: doc.indexOf('### DIR-005') >= 0 && doc.indexOf('### DIR-005') < doc.indexOf('### DIR-006'), stillSaysNoOpenDirective: doc.indexOf('(열린 지시 없음)') >= 0, rowsInserted: rows.length, rowsReplaced: replaced, must: must.length, claims: claims.length, shortTexts: claims.filter(c => c.check.text.length < 4).map(c => c.id), notTrueNow: bad }));
