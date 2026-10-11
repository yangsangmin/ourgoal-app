'use strict';
// #TASK-ES-672 — 측정 결과 파일에서 수치를 읽어 REQ 의 표·수치 칸과 PR 본문 초안을 쓴다(수치를 손으로 옮기지 않는다, GUARD_05).
// 사용: node reports/TASK-ES-672/tools/render-docs.cjs [--pr-body <저장소 밖 파일>]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const DIR = path.resolve(__dirname, '..'), ROOT = path.resolve(DIR, '..', '..');
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const has = f => fs.existsSync(path.join(DIR, f));
const m = rj('measurement.json'), meta = rj('gen-inline-hard-meta.json'), proof = rj('proof.json'), pf = rj('prefix-only-check.json'), oc = rj('order-check.json'), sc = rj('scenario-local.json'), fp = rj('name-fingerprints.json'), ml = rj('module-load.json'), npm = rj('npm-test-compare.json'), ta = rj('tests-all-compare.json'), csv = rj('csv-download.json'), pn = rj('photo-notion-probe.json'), ew = rj('expose-window.json'), claims = rj('claims.json');
const ap = rj('accessor-probe.json');
const court = has('court-local.json') ? rj('court-local.json') : null;
const tick = s => '`' + s + '`';
// IIFE 최상위에 남은 함수 선언 수(작업 트리의 인라인 스크립트를 파싱해 센다)
const parser = require('@babel/parser');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split('\n').map(l => l.replace(/\r$/, ''));
let s0 = -1, e0 = -1; for (let i = 0; i < html.length; i++) if (html[i].trim() === '<script>' && (html[i + 1] || '').trim() === '(function(){' && (html[i + 2] || '').includes('"use strict"')) { s0 = i + 1; break; }
for (let i = s0; i < html.length; i++) if (html[i].startsWith('</script>')) { e0 = i; break; }
const iifeAst = parser.parse(html.slice(s0, e0).join('\n'), { sourceType: 'script' });
const iifeBody = iifeAst.program.body[0].expression.callee ? iifeAst.program.body[0].expression.callee.body.body : iifeAst.program.body[0].expression.argument.callee.body.body;
const topFnDecls = iifeBody.filter(n => n.type === 'FunctionDeclaration').map(n => n.id.name);
const baseHeadMsg = cp.execFileSync('git', ['log', '-1', '--format=%s', m.base.head], { cwd: ROOT, encoding: 'utf8' }).trim();
const cellRows = proof.cells.map(c => { const p = meta.plan.find(x => x.cell === c.key && x.action === 'move'); return '| ' + tick(c.file) + ' | ' + tick(p.names[0]) + ' | ' + c.title.replace(/^.*\(기록 — /, '').replace(/\)$/, '') + ' | ' + m.newFiles[c.file].lines + ' |'; }).join('\n');
const planLines = meta.plan.filter(p => p.action === 'move').map(p => tick(p.names[0]) + ' ' + p.segment[0] + '~' + p.segment[1] + '행(' + (p.segment[1] - p.segment[0] + 1) + '줄)').join(' · ');
const rows = [
  ['`proof.json` · `gen-inline-hard-meta.json` · `verify-inline-hard.json`', '생성기 설정 · 생성기 메타 · 검사기 보고', '옮김 ' + m.generator.moves + ' · 감싸기 ' + m.generator.wraps + ' · 남김 ' + m.generator.keeps + ' · 가져오기 줄 ' + m.generator.imports + ' · 새 통로 getter ' + m.generator.newExposeGetters + ' · 바꿔 쓰기(접두) ' + m.generator.edits + ' · 검사기 `ok: ' + m.verify.ok + '` · this/arguments ' + JSON.stringify(m.verify.thisArgs) + ' · 미노출 ' + JSON.stringify(m.verify.notExposed) + ' · 남은 글자 동일 ' + m.verify.restSame],
  ['`prefix-only-check.json`', '옮긴 줄 전부의 줄 단위 바이트 비교(생성기·검사기와 따로)', '옮긴 줄 ' + pf.totals.lines + ' · 바이트 동일 ' + pf.totals.identicalLines + ' · 접두만 다른 줄 ' + pf.totals.prefixOnlyLines + ' · 그 밖의 차이 **' + pf.totals.otherDiffLines + '** · 지운 접두 ' + pf.totals.strippedPrefixes + ' = 생성기 바꿔 쓰기 ' + pf.generatorEdits + ' · 「템플릿 마켓」 단추 줄 ' + pf.marketLines.length + '줄 접두 떼면 동일 **' + pf.marketLinesAllSame + '** · 돈 관련 낱말 줄 ' + pf.moneyLines.base + ' · 옮긴 구간 밖 돈 관련 줄 ' + pf.moneyWordsOutsideMovedLines.length],
  ['`order-check.json`', '진입점의 조각 호출 순서 · 꾸러미 등록 자리 · 연결 중 바로 부르는 꾸러미 함수', '`ok: ' + oc.ok + '` · 순서 그대로 ' + oc.orderSame + '(' + oc.entryCallOrder.join(' → ') + ') · 연결 중 바로 부르는 것 ' + oc.immediateCalls.map(x => x.call).join(', ')],
  ['`expose-window.json` · `accessor-probe.json`', '새 getter 줄과 값이 정해지는 줄의 순서 · 새 세포가 읽는 통로 이름 · 상태 기관 겹침', '새 getter ' + ew.names + '개 중 값이 먼저 정해진 것 ' + ew.definedBeforeExpose + ' · 뒤에 정해지는 것 ' + ew.definedAfterExpose.length + '(그 사이 실행되는 문이 있는 이름 ' + m.exposeWindow.withExecutingStatementsBetween.length + ') · 접근자 `ok: ' + m.accessor.ok + '` · 새 세포가 읽는 이름 ' + ap.static.readNames + '개 중 통로에 없는 이름 ' + JSON.stringify(ap.dynamic.missingOnScope) + ' · 값이 정해지지 않은 이름 ' + JSON.stringify(ap.dynamic.undefinedValue) + ' · 상태 기관 이름 ' + ap.static.organNames + '개와 겹치는 것: 읽는 이름 ' + JSON.stringify(ap.static.readNamesOwnedByOrgan) + ' · 새 getter ' + JSON.stringify(ap.static.newGettersOverlappingOrgan)],
  ['`cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json`', '통로 · window 이름의 값 지문(기준 이름 목록 고정)', '통로 ' + fp.scope.names + '개 중 달라진 것 ' + fp.scope.diff + '(' + fp.scope.diffNames.map(d => tick(d.n)).join(', ') + ') · 그 밖 ' + fp.scope.unexpectedDiff.length + ' · 사라진 이름 ' + fp.scopeLost.length + ' · 새로 생긴 이름 ' + fp.scopeAdded.length + '(' + fp.scopeAdded.map(tick).join(', ') + ') · window ' + fp.window.names + '개 차이 ' + fp.window.diff],
  ['`module-load.json`', '법정 모듈 로드 탐침 기준 대 작업 · 새 파일 단독 로드', '회귀 ' + JSON.stringify(ml.regressions) + ' · 새 파일 여섯 단독 로드 ok ' + m.moduleLoad.newFilesLoadOneOk],
  ['`scenarios/*.json`(' + claims.claims.filter(c => c.kind === 'behavior').length + '개) · `scenarios-local/*.json`(1개) · `scenario-local.json`', '게스트 화면 시나리오 기준 2회 · 작업 1회 + 단계별 화면 · 저장값 · 토스트 · 단계 결과 대조', '시나리오 ' + sc.scenarioCount + '개 전부 통과 ' + sc.allPassed + ' · 행동 변화 단언 있음 ' + sc.allProveBehavior + ' · 기준 2회 일치 ' + sc.baseRunsAgree + ' · 맞댄 칸 ' + sc.totalFieldsCompared + ' 중 같은 칸 ' + sc.totalFieldsSame + ' · 차이 **' + sc.totalDiffs + '** · 기준끼리 달라 뺀 칸 ' + sc.totalIgnoredBecauseBaseDiffers + ' · 예외 ' + sc.totalExceptions],
  ['`photo-notion-probe.json`', '사진 첨부(파일 입력에 그림을 넣음) · Notion 자동 전송 요청 본문(같은 출처의 로컬 서버로 나가는 것)', '사진 첨부 기준과 같음 ' + m.photoNotion.photoSame + ' · Notion 본문 기준과 같음 ' + m.photoNotion.notionSame + '(요청 ' + m.photoNotion.notionRequests + '건) · 오류 ' + JSON.stringify(m.photoNotion.errors)],
  ['`csv-download.json`', '「CSV 다운로드」 단추가 만든 파일', '파일 생김 기준 ' + csv.fileCreated.base + ' · 작업 ' + csv.fileCreated.work + ' · 이름·바이트 같음 ' + csv.sameFile],
  ['`raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json`', 'npm test 전경 실행', '종료 코드 ' + npm.base.exit + ' · ' + npm.work.exit + ' · ✓ 줄 ' + npm.base.checkLines + ' · ' + npm.work.checkLines + ' · ok 줄 ' + npm.base.okLines + ' · ' + npm.work.okLines + ' · 글자가 갈린 검사 줄 ' + npm.same.textDiffLineCount + '(세포 파일 수를 적는 줄 — ' + npm.modularFileCount.base + ' → ' + npm.modularFileCount.work + ') · 그 숫자를 가리면 같음 ' + npm.same.checkAndOkLineTextExceptModularFileCount],
  ['`tests-all-compare.json`', '시험 파일 ' + ta.files + '개를 하나씩 실행', '기준과 다른 파일 **' + ta.differingCount + '** (종료 코드가 0 이 아닌 파일은 기준 ' + ta.nonZeroExit.base + ' · 작업 ' + ta.nonZeroExit.work + ' — 같은 파일, 이 PR 과 무관한 기존 상태)'],
  ['`measurement.json`', '지표 · 새 파일 줄 수 · 바뀐 파일', '인라인 스크립트 줄 수 ' + m.summary.inlineScriptLines.before + ' → ' + m.summary.inlineScriptLines.after + '(**' + m.summary.inlineScriptLines.delta + '**) · index.html 함수 선언 수 ' + m.summary.indexFunctionDecls.before + ' → ' + m.summary.indexFunctionDecls.after + '(' + m.summary.indexFunctionDecls.delta + ') · index.html ' + m.summary.indexHtmlLines.before + ' → ' + m.summary.indexHtmlLines.after + '줄 · window 대입 ' + m.summary.windowAssignments.before + ' → ' + m.summary.windowAssignments.after + ' · 새 파일 최장 ' + m.newFilesMaxLines + '줄 · 세포 밖 js 변경 ' + m.changedFiles.jsOutsideCells.length + ' · 시험 ' + m.changedFiles.tests.length + ' · 금고 ' + m.changedFiles.vault.length + ' · 생성기 ' + m.changedFiles.generator.length + ' · 생성 지도 ' + m.changedFiles.generatedMaps.length + ' · 모듈 가드 종료 코드 ' + m.guard.exitCode],
  ['`court-local.json`', '로컬 `recomputeSplit` 직접 호출 · 로컬 법정 전체 실행(작업자 PC 예비 점검 — 판정 아님)', court ? ('recomputeSplit `ok: ' + (court.recomputeSplitDirect ? court.recomputeSplitDirect.ok : '측정불가') + '` · 판정 줄 「' + court.verdict + '」 · ' + court.headline + ' · 종료 코드 ' + court.judgeExitCode + ' · 끝까지 돌았는가 ' + court.ranToEnd) : '커밋 뒤 기록'],
];
const table = '기준 ' + m.base.head.slice(0, 8) + ' · 측정 ' + m.measuredAt + '\n\n' + ['| 산출물 | 무엇을 쟀나 | 결과 |', '|---|---|---|'].concat(rows.map(r => '| ' + r.join(' | ') + ' |')).join('\n');
const lStateCount = proof.cells.reduce((a, c) => a + fs.readFileSync(path.join(ROOT, c.file), 'utf8').split('L.state').filter((seg, i) => i > 0 && !/^[A-Za-z0-9_$]/.test(seg)).length, 0);
const totalNew = Object.values(m.newFiles).reduce((a, f) => a + f.lines, 0);
const summaryLine = '인라인 스크립트 줄 수 ' + m.summary.inlineScriptLines.before + ' → ' + m.summary.inlineScriptLines.after + '(' + m.summary.inlineScriptLines.delta + ') · index.html 함수 선언 수 ' + m.summary.indexFunctionDecls.before + ' → ' + m.summary.indexFunctionDecls.after + ' · index.html ' + m.summary.indexHtmlLines.before + ' → ' + m.summary.indexHtmlLines.after + '줄 · 새 세포 여섯 합 ' + totalNew + '줄(최장 ' + m.newFilesMaxLines + '줄)(출처 `measurement.json`). 기준선 ' + m.baseline.historyLength + '번째 기록.';
const nextLine = '이 PR 뒤 IIFE 최상위 함수 선언은 ' + topFnDecls.length + '개다' + (topFnDecls.length ? '(' + topFnDecls.map(tick).join(' · ') + ')' : '') + '(작업 트리의 인라인 스크립트를 파싱해 센 값). 남은 것은 생성기가 다시 단 통로 getter 와 가져오기 줄의 재철거, 남은 구역 이전, 마지막 정리(finalize)다 — 모두 다른 작업 몫이다. 조각이 세포로 가면서 ' + tick('state') + ' 의 맨이름 참조가 ' + tick('L.state') + ' 로 바뀌었다(새 세포 여섯에 ' + lStateCount + '곳 — 세포 파일에서 센 값). 그래서 ' + tick('state') + ' 의 상태 기관 이전이 풀린다(다른 작업 몫).';
const fills = { BASE_HEAD_LINE: m.base.head.slice(0, 8) + '(' + baseHeadMsg.replace(/^Merge pull request (#\d+) from .*$/, '$1 병합 뒤') + ').', PLAN_LINES: planLines, CELL_TABLE: cellRows, MEASURE_TABLE: table, SUMMARY_LINE: summaryLine, NEXT_LINE: nextLine };
const reqFile = path.join(ROOT, 'docs', 'specs', 'REQ-TASK-ES-672-PRO-MODAL-CELLS.md');
let req = fs.readFileSync(reqFile, 'utf8');
for (const [k, v] of Object.entries(fills)) {
  const open = '<!--' + k + '-->', close = '<!--/' + k + '-->';
  const block = (k === 'CELL_TABLE' || k === 'MEASURE_TABLE') ? open + '\n' + v + '\n' + close : open + v + close;
  if (req.includes(open)) { const a = req.indexOf(open), b = req.indexOf(close); req = req.slice(0, a) + block + req.slice(b + close.length); }
  else if (req.includes(k)) req = req.replace(k, block);
  else throw new Error('REQ 에 자리 없음: ' + k);
}
fs.writeFileSync(reqFile, req, { encoding: 'utf8' });
console.log('REQ 갱신 — 표 ' + rows.length + '행 · IIFE 최상위 함수 선언 ' + topFnDecls.length);
const i = process.argv.indexOf('--pr-body');
if (i >= 0) {
  const n = k => claims.claims.filter(x => x.kind === k).length;
  const fileList = proof.cells.map(c => tick(c.file) + ' ' + m.newFiles[c.file].lines + '줄').join(' · ');
  const lack = court && court.rollup ? court.rollup.reqs.map(r => r.id + ' ' + r.bucket + (r.note ? '(' + r.note + ')' : '')).join(' · ') : '측정불가(로컬 법정 실행 전)';
  const body = [
    '### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서',
    '* **PR 번호**: (생성 뒤 되읽기)',
    '* **Task ID**: TASK-ES-672',
    '',
    '#### [블록 1] 개요',
    '- **작업 내용**: 전문 템플릿 기록 창(' + tick('openProTemplateRecordModal') + ')의 조각 여섯을 생성기(' + tick('gen-inline-hard.js') + ' 일반 모드, 한 번 실행)로 세포 여섯에 **글자 그대로** 옮겼다 — 944줄 함수 A안의 3단계(지시함 DIR-004 (라) ③). 「옮기기」 PR 이다: 바뀐 글자는 덩어리 이름 앞의 `L.` 뿐이고 손으로 옮긴 글자는 0 이다. ①②(안전망 · 제자리 정리)는 PR #936.',
    '- **하지 않은 것**: 버그 수정(REQ 9절 — 같은 템플릿 기록 2건이면 창이 안 열리는 기존 결함 등은 그대로 옮김) · 들여쓰기 정돈 · 다시 단 getter 의 재철거 · 시험·금고·생성기 변경.',
    '',
    '#### [블록 2] REQ / PLAN 및 구체적 식별자',
    '- **구체적 식별자**: 함수 ' + meta.plan.filter(p => p.action === 'move').map(p => tick(p.names[0])).join(' · ') + ' · 파일 `index.html`(구획 「템플릿 마켓 · 복제 · 전문 템플릿 기록 (TASK-ES-013)」) → ' + proof.cells.map(c => tick(c.file)).join(' · ') + ' · DOM `#proTable` · `.pro-tpl-cell-input` · `#proTplSelect` · `#swStartPauseBtn` · `#proGeneralSaveBtn` · `#proCalendarSaveBtn` 등(REQ 0절) · `docs/specs/REQ-TASK-ES-672-PRO-MODAL-CELLS.md`',
    '- **PLAN 체크리스트**: [4단계: 심사 청구] — `.claude/plan-TASK-ES-672.md` 의 1~9 는 측정 뒤 완료 표시, 10(push · PR · 되읽기)은 push 뒤에야 확인되므로 파일에는 [ ] 로 남겼다(표시만을 위한 추가 push 를 하지 않는다 — 배포 한도).',
    '',
    '#### [블록 3] 핵심 변경사항',
    '- **수정 파일 목록**: `index.html` (+' + m.summary.indexHtmlNumstat.added + ' lines, -' + m.summary.indexHtmlNumstat.deleted + ' lines) · 새 세포 여섯 · `docs/architecture/modules.json`(신고서 6칸) · `cell-descriptions.json`(설명 6개) · `module-baseline.json`(낮아진 값 기록) · REQ · TICKETS · `reports/TASK-ES-672/**`.',
    '- **소블록 자가분열 준수**: ' + fileList + ' — 모두 800줄 이하(측정: `measurement.json` `newFiles`). 책임 단위로 나눴고 줄 수로 자르지 않았다.',
    '- **세포 영향**: 새 세포 `records/pro-record-modal` · `pro-record-table` · `pro-record-tools` · `pro-record-trend-chart` · `pro-record-stopwatch` · `pro-record-save`(키트 `OurgoalRecordsKit`, 새 window 전역 0) · `node scripts/module-guard.js` 종료 코드 ' + m.guard.exitCode + ' · 기준선 `--update`(사유 없이 낮아진 값): 인라인 스크립트 줄 수 **' + m.summary.inlineScriptLines.before + ' → ' + m.summary.inlineScriptLines.after + '(' + m.summary.inlineScriptLines.delta + ')** · 함수 선언 수 **' + m.summary.indexFunctionDecls.before + ' → ' + m.summary.indexFunctionDecls.after + '** · index.html ' + m.summary.indexHtmlLines.before + ' → ' + m.summary.indexHtmlLines.after + '줄.',
    '- **조각 호출 순서(주의)**: 진입점이 조각을 부르는 순서(' + oc.entryCallOrder.join(' → ') + ')는 이전 전과 같다. 도구 조각의 처리기가 차트 조각이 등록하는 `ctx.updateTrendChart` 를 부르므로 이 순서를 바꾸면 안 된다 — 진입점 세포 머리 설명과 REQ 4절에 적었다(`order-check.json`).',
    '',
    '#### [블록 4] Claims (주장)',
    '- `reports/TASK-ES-672/claims.json` 기록 완료 — 지시 항목 ' + claims.requirements.length + '건 · 주장 ' + claims.claims.length + '건(화면 동작 보존 ' + n('behavior') + ' · 측정 기록 글자 확인 ' + n('static') + ' · 법정 도구 한계 ' + n('unverified') + '). 화면 주장은 `behavior` · `preserve` + `proof.json`.',
    '- **주장 항목**(전부 작업자 측정이며 판정이 아니다):',
    '  - 글자: 검사기 ok ' + m.verify.ok + ' · 옮긴 줄 ' + pf.totals.lines + '줄 중 접두 말고 다른 줄 ' + pf.totals.otherDiffLines + '(바이트 동일 ' + pf.totals.identicalLines + ' · 접두만 ' + pf.totals.prefixOnlyLines + ') · 「템플릿 마켓」 단추 줄 ' + pf.marketLines.length + '줄 접두 떼면 동일 ' + pf.marketLinesAllSame + ' · 조각 호출 순서 점검 ok ' + oc.ok + '.',
    '  - 화면: 게스트 시나리오 ' + sc.scenarioCount + '개(#936 의 12개 + 독립 검토자의 추가 4개)가 기준 2회 · 작업 1회 모두 통과(' + sc.allPassed + '), 단계별 화면·저장값 ' + sc.totalFieldsCompared + '칸 중 차이 ' + sc.totalDiffs + '(기준끼리 달라 뺀 칸 ' + sc.totalIgnoredBecauseBaseDiffers + '), 예외 ' + sc.totalExceptions + '. 저장 → 다시 열기 → 새로 고침 유지 포함(s10 · s11 · x1). 주장에는 ' + n('behavior') + '개를 걸었다(70초짜리 인터벌 종료 시나리오는 작업자 실행에만).',
    '  - 탐침: 사진 첨부 기준과 같음 ' + m.photoNotion.photoSame + ' · Notion 자동 전송 본문 기준과 같음 ' + m.photoNotion.notionSame + ' · CSV 내려받기 파일 같음 ' + csv.sameFile + '.',
    '  - 시험: npm test 종료 코드 ' + npm.base.exit + ' · ' + npm.work.exit + ', ✓ ' + npm.base.checkLines + ' · ' + npm.work.checkLines + ', ok ' + npm.base.okLines + ' · ' + npm.work.okLines + ' · 시험 파일 ' + ta.files + '개 개별 실행 차이 ' + ta.differingCount + ' · 모듈 로드 회귀 ' + ml.regressions.length + ' · 통로 ' + fp.scope.names + '개 중 지문 변화 ' + fp.scope.diff + '(옮긴 진입점) · window ' + fp.window.names + '개 차이 ' + fp.window.diff + '.',
    '  - 법정 도구 한계로 낸 것: 로그인 뒤 서버 동기화·구글 캘린더·진짜 Notion(needs-login) · 사진 고르기(file-attach — 작업자 탐침으로는 잼). 음성 행 넣기는 시뮬레이션 칩으로 화면 주장에 걸었다(x4).',
    '',
    '#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)',
    '- 법정 심사 전 — 위는 전부 작업자 주장이다. 판정은 GitHub `court` 검사가 낸다(`node court/chat.js <PR번호>`).',
    '- 로컬 예비 점검(작업자 PC, 판정 아님 · `reports/TASK-ES-672/court-local.json`): ' + (court ? ('recomputeSplit ok ' + (court.recomputeSplitDirect ? court.recomputeSplitDirect.ok : '측정불가') + ' · 막힌 것 ' + court.findings.filter(f => f.severity === 'reject').length + '건 · 종료 코드 ' + court.judgeExitCode + ' · 지시 항목별: ' + lack) : '측정불가'),
    '- 재현 방법은 REQ 7.1절.',
    '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ].join('\n');
  fs.writeFileSync(process.argv[i + 1], body + '\n', { encoding: 'utf8' });
  console.log('PR 본문 초안 →', process.argv[i + 1]);
}
