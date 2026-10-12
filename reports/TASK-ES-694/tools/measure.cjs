#!/usr/bin/env node
'use strict';
// #TASK-ES-694 — 지시(DIR-006 저장 안정화)에 적는 줄 번호와 숫자를 지금 코드에서 다시 읽는다(작업자 측정 도구, 판정 아님). 읽기만 한다.
// 조사 문서(reports/TASK-ES-694/evidence/)가 가리킨 줄 가운데 지시에 옮겨 적는 것만 대조한다. 함수 재현 · 브라우저 재현은 여기서 돌리지 않는다.
// 이 작업자가 저장소에 넣은 재현 도구로 한 번 다시 돌린 결과(repro/rerun-TASK-ES-694/)는 그 원시 파일에서 읽어 요약한다.
// 사용: node reports/TASK-ES-694/tools/measure.cjs   → reports/TASK-ES-694/measure.json
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..', '..'), DIR = path.resolve(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const lines = f => rd(f).split('\n');
const git = a => cp.execFileSync('git', ['-C', ROOT].concat(a), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const ls = a => git(['ls-files', '--'].concat(a)).split('\n').filter(Boolean);
const find = (L, re, from) => { for (let i = from || 0; i < L.length; i++) if (re.test(L[i])) return i + 1; return 0; };
const all = (L, re) => L.map((l, i) => re.test(l) ? i + 1 : 0).filter(Boolean);
const block = (L, startLine) => { if (!startLine) return null; let d = 0, started = false; for (let i = startLine - 1; i < L.length; i++) { for (const ch of L[i]) { if (ch === '{') { d++; started = true; } else if (ch === '}') d--; } if (started && d === 0) return [startLine, i + 1]; } return null; };

// ── 저장 함수(saveProfile)
const cockpit = 'js/core/home-cockpit.js', KL = lines(cockpit);
const sp = block(KL, find(KL, /(async\s+)?function\s+saveProfile\s*\(/));
const inSp = re => all(KL, re).filter(n => sp && n >= sp[0] && n <= sp[1]);
const saveProfile = { file: cockpit, lines: sp,
  serverWaitLines: { users: inSp(/await L\.sb\.from\('users'\)\.upsert\(userUpsertObj\)/)[0] || null, goals: inSp(/await L\.sb\.from\('goals'\)\.upsert\(/)[0] || null, checkins: inSp(/await window\.OurgoalRecordLedger\.upsertCheckinRows\(/)[0] || null },
  deviceWriteLines: { goalsBackup: inSp(/setItem\('ourgoal_goals_backup_'/)[0] || null, fullCopy: inSp(/setItem\('ourgoal_guest_profile'/)[0] || null, recordsBackup: inSp(/setItem\('ourgoal_records_backup_'/)[0] || null },
  throwLines: inSp(/\bthrow\b/), returnsValue: inSp(/\breturn\s+[^;\s]/).length > 0, warnLines: inSp(/console\.warn\(/),
  goalsResultUsed: inSp(/=\s*await L\.sb\.from\('goals'\)\.upsert\(/).length > 0, checkinsResultUsed: inSp(/=\s*await window\.OurgoalRecordLedger\.upsertCheckinRows\(/).length > 0 };

// ── 다시 열 때 불러오기(loadProfile) — 기기 백업을 서버 것으로 덮는 줄과, 서버 기록이 0건일 때 기기 것을 다시 올리는 묶음
const plJs = 'js/core/profile-load.js', PL = lines(plJs);
const reStart = find(PL, /if\(\(!records \|\| records\.length === 0\) && localCachedRecords/);
const elseIf = find(PL, /\} else if\(records && records\.length > 0\)\{/, reStart);
const profileLoad = { file: plJs, loadProfileLine: find(PL, /function\s+loadProfile\s*\(/),
  recordsBackupOverwriteLine: elseIf ? elseIf + 1 : 0, overwriteText: elseIf ? PL[elseIf].trim().slice(0, 120) : null,
  reuploadWhenServerEmptyLines: reStart && elseIf ? [reStart, elseIf - 1] : null,
  goalsBackupWriteLines: all(PL, /setItem\('ourgoal_goals_backup_'/), deletedAtFilterLines: all(PL, /deleted_at/) };

// ── 서버로 가는 기록의 칸
const ledger = 'js/record-ledger.js', RL = lines(ledger);
const tcr = block(RL, find(RL, /function\s+toCheckinRow\s*\(/));
const rowKeys = tcr ? RL.slice(tcr[0] - 1, tcr[1]).map(l => (/^\s{6}([a-z_]+):/.exec(l) || [])[1]).filter(Boolean) : [];
const jsApi = ls(['js', 'api', 'ui.js']).filter(f => /\.js$/.test(f));
const countIn = (files, re) => files.reduce((n, f) => n + (rd(f).match(re) || []).length, 0);
const serverRow = { file: ledger, toCheckinRowLines: tcr, keys: rowKeys, hasPhoto: rowKeys.indexOf('photo') >= 0, hasFeedback: rowKeys.indexOf('feedback') >= 0, hasEnergy: rowKeys.indexOf('energy') >= 0, hasFocus: rowKeys.indexOf('focus') >= 0, hasCreatedAt: rowKeys.indexOf('created_at') >= 0,
  storageUploadCalls: countIn(jsApi, /storage\.from\(|\.upload\(|getPublicUrl/g), onConflictUses: countIn(jsApi, /onConflict/g),
  updatedAtOrVersionInRow: rowKeys.filter(k => /updated_at|version/.test(k)).length };

// ── 지움 · 서버 연결 · 홈 저장 처리기 · 대기줄 · 기록 탭 그리기 · 수동 동기화
const trashJs = 'js/core/trash-bin.js', TL = lines(trashJs);
const bootJs = 'js/app/boot.js', BL = lines(bootJs);
const capJs = 'js/tabs/records/checkin-capture.js', CL = lines(capJs);
const vuJs = 'js/core/virtual-user-helpers.js', VL = lines(vuJs);
const renJs = 'js/tabs/records/render.js', NL = lines(renJs);
const accJs = 'js/tabs/settings/account-actions.js', AL = lines(accJs);
const handler = block(CL, find(CL, /getElementById\('captureSave'\)\.addEventListener\('click'/));
const inH = re => all(CL, re).filter(n => handler && n >= handler[0] && n <= handler[1]);
const other = {
  trash: { file: trashJs, softDeleteLines: all(TL, /\.update\(\{ deleted_at: new Date\(\)\.toISOString\(\) \}\)/), restoreLines: all(TL, /\.update\(\{ deleted_at: null \}\)/), hardDeleteCalls: (rd(trashJs).match(/\.delete\(\)/g) || []).length, resultUsed: all(TL, /=\s*await L\.sb\.from\('(goals|checkins)'\)\.update\(/).length > 0 },
  serverClient: { file: bootJs, createLine: find(BL, /supabase\.createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\)/), hasOptionsArgument: BL.some(l => /createClient\(SUPABASE_URL, SUPABASE_ANON_KEY\s*,/.test(l)) },
  homeHandler: { file: capJs, lines: handler, lockLines: inH(/saveBtn\.disabled = true/), savingTextLine: inH(/saveBtn\.textContent = '기록 중…'/)[0] || null, inputClearedLine: inH(/t\.value = '';/)[0] || null, saveCallLines: inH(/await L\.saveProfile\(\)/), toastLine: inH(/L\.toast\(checkinToastMsg/)[0] || null,
    offlineOnlyLine: inH(/!navigator\.onLine/)[0] || null, enqueueLine: inH(/OfflineSyncManager\.enqueue\(/)[0] || null, hasFailureBranch: handler ? CL.slice(handler[0] - 1, handler[1]).some(l => /실패|못했|다시 시도/.test(l)) : null,
    goalIdInRecord: handler ? CL.slice(handler[0] - 1, handler[1]).filter(l => /goalId/.test(l)).length : null, categoryFromGoalLines: inH(/var cat = goal \? goal\.category : null/), recordPushLines: (() => { const a = inH(/L\.state\.profile\.records\.unshift\(\{/)[0]; const b = a ? find(CL, /^\s*\}\);/, a) : 0; return a && b ? [a, b] : null; })() },
  offlineQueue: { file: vuJs, syncOnlineLines: block(VL, find(VL, /syncOnline\s*:\s*async function/)), successToastLine: find(VL, /동기화했어요/) },
  recordsRender: { file: renJs, saveOnRenderLine: find(NL, /if\(needsSave\)\{ L\.saveProfile\(\); \}/) },
  manualResync: { file: accJs, syncLine: find(AL, /await L\.syncServerRecords\(true\)/), loadLine: find(AL, /var refreshed = await L\.loadProfile\(/), replaceLine: find(AL, /L\.state\.profile = refreshed;/) } };

// ── 저장 경로 11개(조사 문서 2절의 표) — 파일이 있고 그 안에서 저장 함수를 부르는가
const P = (name, file) => { const ex = fs.existsSync(path.join(ROOT, file)); const s = ex ? rd(file) : ''; return { name, file, exists: ex, saveProfileCalls: (s.match(/saveProfile\s*\(/g) || []).length }; };
const savePaths = [P('홈 오늘 기록', capJs), P('빠른 체크인', 'js/tabs/records/quick-checkin.js'), P('기록 탭 기록 창', 'js/tabs/records/weekly-recap.js'), P('기록 도우미 창', 'js/tabs/records/record-assistant.js'), P('전문 템플릿 기록 창', 'js/tabs/records/pro-record-save.js'),
  P('시간 기록', 'js/time-tracker-review.js'), P('뽀모도로', 'js/sanctuary-focus-timer.js'), P('목표 만들기', 'js/tabs/goals/new-goal-modal.js'), P('일정 추가·수정', 'js/tabs/calendar/manual-edit-modal.js'), P('설정', 'js/tabs/settings/sub-profile.js'), P('오프라인 대기줄 복귀', vuJs)];
const jsFiles = ls(['js']).filter(f => /\.js$/.test(f));
const callSites = { note: 'js/ 아래 「saveProfile(」 글자가 든 줄 수(정의와 주석 포함)', places: jsFiles.reduce((n, f) => n + rd(f).split('\n').filter(l => l.indexOf('saveProfile(') >= 0).length, 0), files: jsFiles.filter(f => rd(f).indexOf('saveProfile(') >= 0).length };

// ── 상태 표시의 뼈대(계약 7절) — 지금 있는 것과 없는 것
const html = rd('index.html'), HL = html.split('\n'), css = rd('ui.css');
const dom = { a11yLiveAnnouncerLine: find(HL, /id="a11yLiveAnnouncer"/), captureCardBoxLine: find(HL, /id="captureCardBox"/), captureSaveLine: find(HL, /id="captureSave"/),
  newNamesAlreadyUsed: ['captureSyncStatus', 'data-sync-state', 'data-sync-reason', 'captureSyncAction'].map(n => ({ name: n, hits: (html.split(n).length - 1) + (css.split(n).length - 1) + countIn(jsFiles, new RegExp(n, 'g')) })) };

// ── 개인정보처리방침의 수집 항목(결심 대기 줄에 붙는 사실)
const prv = 'docs/legal/privacy.md', VPL = lines(prv);
const itemLine = find(VPL, /서비스 이용 과정에서 생성되는 정보/), art1 = find(VPL, /제1조 \(수집하는 개인정보 항목/), art2 = find(VPL, /^### 제2조/, art1);
const art1Text = art1 && art2 ? VPL.slice(art1 - 1, art2 - 1).join('\n') : '';
const privacy = { file: prv, article1Lines: art1 && art2 ? [art1, art2 - 1] : null, generatedInfoLine: itemLine, generatedInfoText: itemLine ? VPL[itemLine - 1].trim() : null,
  wordsInArticle1: { '사진': /사진/.test(art1Text.replace(/프로필 사진 URL/g, '')), '에너지': /에너지/.test(art1Text), '집중': /집중/.test(art1Text), 'AI 피드백': /AI 피드백|피드백 내용/.test(art1Text) }, note: '「프로필 사진 URL」은 소셜 로그인의 항목이라 뺐다' };

// ── 이 작업자가 저장소에 넣은 도구로 다시 돌린 결과(브라우저, 가짜 서버). 원시 파일에서 읽는다.
const RR = 'reports/TASK-ES-694/repro/rerun-TASK-ES-694';
const J = f => JSON.parse(rd(RR + '/' + f));
const k = J('03-K-사진-서버옛기록2.json'), ok = J('02-home-가-성공-서버옛기록2.json'), e5 = J('02-home-나-500-서버옛기록2.json');
const kNew = st => (st.profile.recs || []).find(r => r.text === k.marker) || {};
const kBk = st => ((st.backup || {}).recs || []).find(r => r.text === k.marker) || {};
const writes = j => (j.requestsDuringSave || []).filter(r => r.table === 'checkins' && r.rw === 'write');
const toastTexts = j => (j.toastsAfterClick || []).filter(t => t.show).map(t => t.text);
const marks = j => { const h = (j.reload || {}).home || {}; const m = (h.marks || {})[j.marker] || {}; return { inStateRecords: m.inStateRecords, inCards: m.inCards, inLocalStorageKeys: Object.keys(m.inLocalStorage || {}).length }; };
const rerun = { note: '이 작업자가 2026-10-12 에 origin/main 작업 폴더에서 repro/tools 로 다시 돌린 것. 서버 답은 브라우저 안의 가짜 서버가 흉내 낸 것이고 실서버 · 실계정과 통신하지 않았다. 연결 라이브러리는 저장소에 든 판을 썼다',
  lib: k.lib && { versionInFile: k.lib.versionInFile, sha256: k.lib.sha256 },
  photo: { tool: k.tool, serverOldRecords: k.serverOldRecords,
    afterSave: { cardHasPhoto: k.cardAfterSave.hasImg, state: { photo: !!kNew(k.stateAfterSave).photo, feedback: !!kNew(k.stateAfterSave).feedback, energy: kNew(k.stateAfterSave).energy, focus: kNew(k.stateAfterSave).focus }, deviceBackup: { photo: kBk(k.stateAfterSave).photo, feedback: kBk(k.stateAfterSave).feedback } },
    afterReload: { cardFound: k.reload.card.found, cardHasPhoto: k.reload.card.hasImg, state: { photo: !!kNew(k.reload.state).photo, feedback: !!kNew(k.reload.state).feedback, energy: kNew(k.reload.state).energy, focus: kNew(k.reload.state).focus }, deviceBackup: { photo: kBk(k.reload.home).photo, feedback: kBk(k.reload.home).feedback }, otherStorageWithPhoto: (k.reload.otherStorageWithPhoto || []).length },
    sentCheckinKeys: (writes(k)[0] || {}).keys ? writes(k)[0].keys.split(',') : null, serverAnyTableHasPhoto: (k.serverAnyTableHasPhoto || []).length },
  http500: { tool: e5.tool, serverOldRecords: e5.serverOldRecords, checkinWriteAnswers: writes(e5).map(r => r.answered), successToasts: toastTexts(ok), http500Toasts: toastTexts(e5), toastTextsSame: JSON.stringify(toastTexts(ok)) === JSON.stringify(toastTexts(e5)),
    consoleWarningsAboutSave: (e5.consoleDuringSave || []).filter(c => /Supabase sync failed/.test(c.text || '')).length, serverHasNewAfterSave: e5.serverHasNew, afterReload: marks(e5) },
  success: { checkinWriteAnswers: writes(ok).map(r => r.answered), serverHasNewAfterSave: ok.serverHasNew, afterReload: marks(ok) } };

// ── 저장소에 넣은 사본과 조사 문서에서 인용하는 숫자
const contract = 'docs/specs/SAVE-SYNC-CONTRACT-2026-10-12.md', CT = lines(contract);
const blockLine = CT.find(l => l.indexOf('**출시를 막는 기준**') >= 0) || '';
const blockItems = blockLine.split('막는다 — ')[1] ? blockLine.split('막는다 — ')[1].split('. 「브라우저 재현에서')[0].split(' / ') : [];
const browserDoc = rd('reports/TASK-ES-694/evidence/save-failure-browser-repro.md');
const runs = /브라우저 실행 (\d+)회, 조건 (\d+)개/.exec(browserDoc) || [];
const evidence = { contract: { file: contract, lines: CT.length - 1, sections: CT.filter(l => /^## \d+\. /.test(l)).length, blockCriteria: blockItems.length, blockCriteriaText: blockItems, decisionItems: (() => { const a = CT.findIndex(l => /^## 9\. /.test(l)); return a < 0 ? 0 : CT.slice(a).filter(l => /^\d+\. /.test(l)).length; })() },
  browserRepro: { runs: Number(runs[1]) || null, conditions: Number(runs[2]) || null },
  files: ls(['reports/TASK-ES-694']).length + git(['ls-files', '--others', '--exclude-standard', '--', 'reports/TASK-ES-694']).split('\n').filter(Boolean).length,
  reproTools: fs.readdirSync(path.join(DIR, 'repro', 'tools')).filter(f => /\.cjs$/.test(f)).length, reproShots: fs.readdirSync(path.join(DIR, 'repro', 'shots')).length };

// ── 운영 서버 읽기 조사(조사 담당이 한 것)의 요청 기록을 세어 조사 문서의 숫자와 견준다. 이 도구는 서버에 접속하지 않는다.
const RS = 'reports/TASK-ES-694/real-server-read';
const reqs = [].concat(...['requests.jsonl', 'requests-2.jsonl'].map(f => rd(RS + '/' + f).split('\n').filter(Boolean).map(l => JSON.parse(l))));
const tally = fn => reqs.reduce((o, r) => { const v = String(fn(r)); o[v] = (o[v] || 0) + 1; return o; }, {});
const colAsk = (t, c) => reqs.filter(r => r.target === 'rest:' + t && new RegExp('(^|&)select=' + c + '(&|$)').test(r.query || '')).map(r => ({ seq: r.seq, status: r.status, errorCode: r.errorCode }));
const absent = (t, c) => { const a = colAsk(t, c); return a.length > 0 && a.every(x => x.errorCode === '42703'); };
const present = (t, c) => { const a = colAsk(t, c); return a.length > 0 && a.every(x => x.status === 200 || x.status === 206); };
const bySeq = n => reqs.find(r => r.seq === n) || {};
const uuidProbe = n => ({ seq: n, target: bySeq(n).target, errorCode: bySeq(n).errorCode, saysUuid: /type uuid/.test(bySeq(n).errorMessage || '') });
const minA = find(KL, /var minimalUser = \{/), minB = find(KL, /await L\.sb\.from\('users'\)\.upsert\(minimalUser\)/);
const upFn = block(RL, find(RL, /async function upsertCheckinRows\s*\(/));
const sqlFiles = ['2026-09-06-checkins-category.sql', '2026-10-04-checkins-meta.sql', '2026-09-17-users-saved-avatars-column.sql', '2026-09-10-checkins-theme.sql', 'goals-checkins-softdelete.sql', '2026-09-12-count-same-theme-checkins.sql', 'migration_20260917_recycle_bin.sql', '2026-09-16-users-companions-column.sql'];
const realServer = { note: '조사 담당의 요청 기록(본문 없음)을 센 값이다. 응답 자체를 이 작업자가 받은 것은 아니다',
  requests: reqs.length, firstAt: reqs[0].at, lastAt: reqs[reqs.length - 1].at, byMethod: tally(r => r.method), byKind: tally(r => r.kind), byStatus: tally(r => r.status), byErrorCode: tally(r => r.errorCode), byTarget: tally(r => r.target),
  nonGetOnTables: reqs.filter(r => /^rest/.test(r.target) && r.method !== 'GET').length,
  absent: { 'checkins.deleted_at': absent('checkins', 'deleted_at'), 'goals.deleted_at': absent('goals', 'deleted_at'), 'checkins.theme': absent('checkins', 'theme'), 'checkins.sub_theme': absent('checkins', 'sub_theme'), 'checkins.theme_confidence': absent('checkins', 'theme_confidence'), 'users.trash': absent('users', 'trash'), 'users.companions': absent('users', 'companions'), 'checkins.updated_at': absent('checkins', 'updated_at'), 'checkins.version': absent('checkins', 'version'), 'goals.version': absent('goals', 'version'), 'users.updated_at': absent('users', 'updated_at'), 'users.version': absent('users', 'version'), 'checkins.is_bot': absent('checkins', 'is_bot') },
  present: { 'goals.updated_at': present('goals', 'updated_at'), 'checkins.category': present('checkins', 'category'), 'checkins.meta': present('checkins', 'meta'), 'users.saved_avatars': present('users', 'saved_avatars') },
  seqOf: { 'checkins.deleted_at': colAsk('checkins', 'deleted_at').map(x => x.seq), 'goals.deleted_at': colAsk('goals', 'deleted_at').map(x => x.seq), 'checkins.theme': colAsk('checkins', 'theme').map(x => x.seq), 'users.trash': colAsk('users', 'trash').map(x => x.seq), 'users.companions': colAsk('users', 'companions').map(x => x.seq), 'goals.updated_at': colAsk('goals', 'updated_at').map(x => x.seq) },
  idIsUuid: [uuidProbe(102), uuidProbe(113), uuidProbe(123)],
  outsideAgreedScope: { anonTableCounts: reqs.filter(r => r.as === 'anon' && /^rest:(checkins|goals|users)$/.test(r.target)).map(r => r.seq), otherTables: reqs.filter(r => /^rest:team_/.test(r.target)).map(r => r.seq), embeds: reqs.filter(r => /checkins\(|goals\(/.test(r.query || '')).map(r => r.seq), docRoot: reqs.filter(r => r.target === 'rest:').map(r => ({ seq: r.seq, as: r.as, status: r.status })) },
  code: { softDeleteLines: all(TL, /\.update\(\{ deleted_at: new Date\(\)\.toISOString\(\) \}\)/), minimalUserLines: minA && minB ? [minA - 1, minB] : null, minimalUserKeys: minA ? KL.slice(minA, minB).join(' ').split('}')[0].match(/\b[a-z_]+(?=:)/g) : null, upsertCheckinRowsLines: upFn, themeRetryInUpsert: upFn ? RL.slice(upFn[0] - 1, upFn[1]).some(l => /dropTheme/.test(l)) : null, loadSelectLines: [find(PL, /from\('goals'\)\.select\('\*'\)/), find(PL, /from\('checkins'\)\.select\('\*'\)/)], deletedAtFilterLines: all(PL, /deleted_at/) },
  sqlFilesInRepo: sqlFiles.map(f => ({ file: 'docs/sql/' + f, exists: fs.existsSync(path.join(ROOT, 'docs', 'sql', f)) })) };
realServer.outsideAgreedScope.total = realServer.outsideAgreedScope.anonTableCounts.length + realServer.outsideAgreedScope.otherTables.length + realServer.outsideAgreedScope.embeds.length;

const head = git(['rev-parse', 'HEAD']).trim(), base =(() => { try { return git(['merge-base', 'HEAD', 'origin/main']).trim(); } catch (e) { return null; } })();
// 지금의 주 가지와, 조사 문서들의 기준 커밋 뒤로 제품 코드가 바뀌었는가
const SURVEY = '9f019754';
const mainHead = git(['rev-parse', 'origin/main']).trim().slice(0, 8);
const productChanged = git(['diff', '--name-only', SURVEY, 'origin/main', '--', 'js', 'api', 'index.html', 'ui.css', 'ui.js', 'sw.js', 'launch.html', 'manifest.json']).split('\n').filter(Boolean);
const workingTreeProductChanged = git(['diff', '--name-only', 'origin/main', '--', 'js', 'api', 'index.html', 'ui.css', 'ui.js', 'sw.js', 'launch.html', 'manifest.json']).split('\n').filter(Boolean);
const sinceSurvey = { surveyBase: SURVEY, mainHead, productFilesChangedOnMain: productChanged.length, productFilesChangedInThisBranch: workingTreeProductChanged.length };
// 결심 대기 줄이 가리키는, DIR-005 와 함께 올라온 줄이 주 가지의 지시함에 있는가
const mainActive = git(['show', 'origin/main:docs/directives/ACTIVE.md']);
const pointers = { photoRow: mainActive.indexOf('| 사진 · AI 피드백 · 에너지 · 집중 값을 서버에도 보존할지') >= 0, syncStatusMockRow: mainActive.indexOf('| 저장 상태를 화면이 말하는 시안의 방향 확인') >= 0, dir005Open: mainActive.indexOf('### DIR-005 — ') >= 0, saysNoOpenDirective: mainActive.indexOf('(열린 지시 없음)') >= 0 };
const out = { tool: 'reports/TASK-ES-694/tools/measure.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), head: head.slice(0, 8), mainBase: base && base.slice(0, 8), sinceSurvey, pointers, saveProfile, profileLoad, serverRow, other, savePaths, callSites, dom, privacy, rerun, realServer, evidence };
fs.writeFileSync(path.join(DIR, 'measure.json'), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ sp: sp, waits: saveProfile.serverWaitLines, dev: saveProfile.deviceWriteLines, pl: [profileLoad.recordsBackupOverwriteLine, profileLoad.reuploadWhenServerEmptyLines, profileLoad.goalsBackupWriteLines], keys: rowKeys.length, storage: serverRow.storageUploadCalls, trash: other.trash, client: other.serverClient, handler: other.homeHandler, queue: other.offlineQueue, render: other.recordsRender, resync: other.manualResync, paths: savePaths.map(p => p.exists + ':' + p.saveProfileCalls).join(' '), calls: callSites, dom, privacy, rerun, evidence }, null, 1));
