'use strict';
// #TASK-ES-646 — 측정 결과 파일에서 수치를 읽어 REQ 7절 표와 PR 본문 초안을 쓴다(수치를 손으로 옮기지 않는다, GUARD_05).
// 사용: node reports/TASK-ES-646/tools/render-docs.cjs [--pr-body <저장소 밖 파일>]
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..'), ROOT = path.resolve(DIR, '..', '..');
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const has = f => fs.existsSync(path.join(DIR, f));
const m = rj('measurement.json'), v = rj('verify-inplace.json'), ctl = rj('control-group.json'), sc = rj('scenario-local.json'), fp = rj('name-fingerprints.json'), ml = rj('module-load.json'), npm = rj('npm-test-compare.json'), ta = rj('tests-all-compare.json'), csv = rj('csv-download.json');
const s1 = has('stage1-base-stability.json') ? rj('stage1-base-stability.json') : null;
const court = has('court-local.json') ? rj('court-local.json') : null;
const fnRows = Object.entries(v.after.functions).map(([n, f]) => '`' + n + '` ' + f.lines + '줄').join(' · ');
const scList = Object.keys(sc.scenarios).map(id => id.split('-')[0]).join(' · ');
const rows = [
  ['`inplace-split-meta.json`', '변환기가 한 일', '정리 전 ' + v.before.firstLine + '~' + v.before.lastLine + '행 ' + v.before.lines + '줄 → 함수 여섯(' + fnRows + ') · 가장 긴 것 ' + v.after.maxLines + '줄 · 고친 자리 ' + m.split.edits.read + '(읽기) + ' + m.split.edits.write + '(쓰기) + ' + m.split.edits.call + '(다른 조각의 함수 호출) + ' + m.split.edits.decl + '(선언) · 없앤 빈 줄 ' + m.split.droppedBlankLines],
  ['`verify-inplace.json`', '(a) 토큰열 (a′) 접두 기대 (b) 스코프 (c) 꾸러미 빠짐 (d) 저장 경로 · 함수 밖 글자', '`ok: ' + v.ok + '` · 토큰 ' + v.tokens.old + '개 대 ' + v.tokens.newLinearized + '개(편 것) — 허용 밖 차이 **' + v.tokens.outsideAllowed + '** · 접두 ' + v.tokens.allowed.ctxPrefixOnReference + '곳 · 선언 바꿈 ' + v.tokens.allowed.varDeclToCtx.length + ' · 더한 코드 토큰 ' + v.tokens.allowed.addedCodeTokens + ' · 주석 ' + v.comments.old + '개 같음(더한 주석 ' + v.comments.added + ') · 접두 기대 ' + v.prefixExpectation.sitesChecked + '곳 중 어긋남 **' + v.prefixExpectation.mismatches + '** · 경계를 넘는 맨이름 **' + v.scope.leaks.length + '** · 새 바깥 의존은 조각 함수 이름 ' + v.scope.newOuter.length + '개뿐 · 최상위 this/arguments ' + v.scope.topLevelThisArguments + ' · 저장 경로 토큰 ' + v.save.tokens.old + '개 같음(접두 ' + v.save.tokens.prefixInsertions + '곳) · 호출 ' + v.save.calls.old + '개 순서 같음 · 함수 밖 글자 같음 ' + v.restOfFileSame],
  ['`control-group.json`', '대조기가 가짜로 통과하지 않는가(일부러 망가뜨린 사본)', '망가뜨린 사본 ' + ctl.mustBeCaught + '개 중 잡은 것 **' + ctl.caught + '** · 놓친 것 ' + ctl.missed.length + ' · 망가뜨리지 않은 사본 통과 ' + ctl.cleanPasses],
  ['`scenarios/*.json`(' + sc.scenarioCount + '개) · `scenario-local.json`', '게스트 화면 시나리오 기준 2회 · 작업 1회(' + scList + ') + 단계별 화면 · 저장값 · 토스트 · 단계 결과 대조', '전부 통과 ' + sc.allPassed + ' · 행동 변화 단언 있음 ' + sc.allProveBehavior + ' · 기준 2회 일치 ' + sc.baseRunsAgree + ' · 맞댄 칸 ' + sc.totalFieldsCompared + ' 중 같은 칸 ' + sc.totalFieldsSame + ' · 차이 **' + sc.totalDiffs + '** · 기준끼리 달라 뺀 칸 ' + sc.totalIgnoredBecauseBaseDiffers + ' · 예외 ' + sc.totalExceptions],
];
if (s1) rows.push(['`stage1-base-stability.json`', '1단계: 시나리오가 기준 트리 2회에서 흔들리지 않는가', '시나리오 ' + s1.scenarioCount + '개 · 전부 통과 ' + s1.allPassed + ' · 기준 2회 일치 ' + s1.baseRunsAgree + ' · 맞댄 칸 ' + s1.totalFieldsCompared + ' 중 같은 칸 ' + s1.totalFieldsSame + ' · 기준끼리 달라 뺀 칸 ' + s1.totalIgnoredBecauseBaseDiffers + ' · 예외 ' + s1.totalExceptions]);
rows.push(
  ['`csv-download.json`', '「CSV 다운로드」 단추가 만든 파일(진짜 마우스 입력, 내려받은 파일을 읽음)', '파일 생김 기준 ' + csv.fileCreated.base + ' · 작업 ' + csv.fileCreated.work + ' · 이름·바이트 같음 **' + csv.sameFile + '**(' + (csv.work.download ? csv.work.download.bytes : '측정불가') + ' 바이트)'],
  ['`cell-registry-compare.base.json` · `cell-registry-compare.json` · `name-fingerprints.json`', '통로 · window 이름의 값 지문(기준 이름 목록 고정)', '통로 ' + fp.scope.names + '개 중 달라진 것 ' + fp.scope.diff + '(`' + fp.scope.diffNames.map(d => d.n).join('`, `') + '` — 본문을 고친 그 함수, 종류·이름·인자 수 같음 ' + fp.scope.changedSameKindNameArity + ') · 그 밖 ' + fp.scope.unexpectedDiff.length + ' · 사라진 이름 ' + fp.scopeLost.length + ' · 생긴 이름 ' + fp.scopeAdded.length + ' · window ' + fp.window.names + '개 차이 ' + fp.window.diff],
  ['`module-load.json`', '법정 모듈 로드 탐침 기준 대 작업', '회귀 ' + JSON.stringify(ml.regressions) + '(' + ml.counts.headOk + '/' + ml.counts.head + ' 대 기준 ' + ml.counts.baseOk + '/' + ml.counts.base + ')'],
  ['`raw/npm-test.{base,work}.{log,exit}` · `npm-test-compare.json`', 'npm test 전경 실행', '종료 코드 ' + npm.base.exit + ' · ' + npm.work.exit + ' · ✓ 줄 ' + npm.base.checkLines + ' · ' + npm.work.checkLines + ' · ok 줄 ' + npm.base.okLines + ' · ' + npm.work.okLines + ' · 검사 줄 글자 같음 ' + npm.same.checkAndOkLineText],
  ['`tests-all-compare.json`', '시험 파일 ' + ta.files + '개를 하나씩 실행', '기준과 다른 파일 **' + ta.differingCount + '** (종료 코드가 0 이 아닌 파일은 기준 ' + ta.nonZeroExit.base + ' · 작업 ' + ta.nonZeroExit.work + ' — 같은 파일, 이 PR 과 무관한 기존 상태)'],
  ['`measurement.json`', '지표 · 바뀐 파일', '인라인 스크립트 줄 수 ' + m.summary.inlineScriptLines.before + ' → ' + m.summary.inlineScriptLines.after + '(**+' + m.summary.inlineScriptLines.delta + '**) · index.html 함수 선언 수 ' + m.summary.indexFunctionDecls.before + ' → ' + m.summary.indexFunctionDecls.after + '(**+' + m.summary.indexFunctionDecls.delta + '**) · window 대입 ' + m.summary.windowAssignments.before + ' → ' + m.summary.windowAssignments.after + ' · index.html +' + m.summary.indexHtmlNumstat.added + ' −' + m.summary.indexHtmlNumstat.deleted + ' · 바뀐 제품 파일 ' + JSON.stringify(m.changedFiles.product) + ' · js ' + m.changedFiles.js.length + ' · 시험 ' + m.changedFiles.tests.length + ' · 금고 ' + m.changedFiles.vault.length + ' · 생성기 ' + m.changedFiles.generator.length + ' · 생성 지도 ' + m.changedFiles.generatedMaps.length + ' · 모듈 가드 종료 코드 ' + m.guard.exitCode + ' · 기준선 사유 기록 ' + m.baseline.reasonRecorded],
  ['`court-local.json`', '로컬 법정 전체 실행(작업자 PC 예비 점검 — 판정 아님)', court ? ('판정 줄 「' + court.verdict + '」 · ' + court.headline + ' · 종료 코드 ' + court.judgeExitCode + ' · 끝까지 돌았는가 ' + court.ranToEnd) : '커밋 뒤 기록']
);
const table = ['| 산출물 | 무엇을 쟀나 | 결과 |', '|---|---|---|'].concat(rows.map(r => '| ' + r.join(' | ') + ' |')).join('\n');
const reqFile = path.join(ROOT, 'docs', 'specs', 'REQ-TASK-ES-646-PRO-MODAL-INPLACE.md');
let req = fs.readFileSync(reqFile, 'utf8');
const BEGIN = '<!-- measure:begin (reports/TASK-ES-646/tools/render-docs.cjs 가 쓴다 — 손으로 고치지 않는다) -->', END = '<!-- measure:end -->';
const block = BEGIN + '\n' + '기준 ' + m.base.head.slice(0, 8) + ' · 측정 ' + m.measuredAt + '\n\n' + table + '\n' + END;
if (req.includes('MEASURE_TABLE')) req = req.replace('MEASURE_TABLE', block);
else { const a = req.indexOf(BEGIN), b = req.indexOf(END); if (a < 0 || b < 0) throw new Error('REQ 에 표 자리가 없다'); req = req.slice(0, a) + block + req.slice(b + END.length); }
fs.writeFileSync(reqFile, req, { encoding: 'utf8' });
console.log('REQ 7절 표 갱신 — 행 ' + rows.length);
const i = process.argv.indexOf('--pr-body');
if (i >= 0) {
  const lack = court && court.rollup ? court.rollup.reqs.map(r => r.id + ' ' + r.bucket + (r.note ? '(' + r.note + ')' : '')).join(' · ') : '측정불가(로컬 법정 실행 전)';
  const body = [
    '### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서',
    '* **PR 번호**: (생성 뒤 되읽기)',
    '* **Task ID**: TASK-ES-646',
    '',
    '#### [블록 1] 개요',
    '- **작업 내용**: 인라인 덩어리에 남은 944줄 함수 `openProTemplateRecordModal`(전문 템플릿 기록 창)을 세포로 옮기기 위한 1·2단계 — ① 지금 동작을 게스트 화면 시나리오 ' + sc.scenarioCount + '개로 고정(안전망) ② 덩어리 안에서 IIFE 최상위 함수 여섯(진입점 + 조각 다섯)으로 나누는 제자리 정리. **동작 변화 0 이 목표인 「고치기」 PR 이다**(생성기로 옮긴 것이 아니다 — 법정의 생성기 바이트 대조 대상이 아니다). 세포 이전(③)은 다음 PR.',
    '- **근거**: 지시함 DIR-004 (라)(PR #888, 상민님 병합 ce448f39) — 「944줄 함수 openProTemplateRecordModal(전문 템플릿 기록 창)은 A안으로 진행한다: ① 안전망 … ② 제자리 정리 … 이 단계는 옮기기가 아니라 고치기 PR 이므로 일반 개발 절차(헌법 MODE_4A · 화면 시나리오 주장 · 법정 판정)로 간다 — 생성기 바이트 대조(「동작 보존 확인」)의 대상이 아니다.」 상민님 채팅 원문은 「권장안대로 진행해.」. 착수할 때는 #888 이 열려 있었고 작업 도중 병합됐다(REQ 머리에 경위). 이 PR 은 빌더가 올렸고 병합하지 않는다.',
    '- **하지 않은 것**: 한 번에 다시 써서 옮기기 · 800줄 예외로 통째 이사 · 버그 수정(REQ 9절에 목록) · 시험·금고·생성기·js 세포 변경.',
    '',
    '#### [블록 2] REQ / PLAN 및 구체적 식별자',
    '- **구체적 식별자**: DOM `#proTable` · `#proTableBody` · `.pro-tpl-cell-input` · `#proTplSelect` · `#proTrendChartWrap` · `#swDisplay` · `#swStartPauseBtn` · `#proGeneralSaveBtn` · `#proCalendarSaveBtn` · `#proCancelBtn` 등(REQ 0절), 함수 `openProTemplateRecordModal` → + `bindProRecTable` · `bindProRecTools` · `bindProRecTrendChart` · `bindProRecStopwatch` · `bindProRecSave`, 파일 `index.html`(인라인 IIFE, 정리 전 ' + v.before.firstLine + '~' + v.before.lastLine + '행) · `docs/specs/REQ-TASK-ES-646-PRO-MODAL-INPLACE.md`',
    '- **PLAN 체크리스트**: [4단계: 심사 청구] 완료 상태(`.claude/plan-TASK-ES-646.md`)',
    '',
    '#### [블록 3] 핵심 변경사항',
    '- **수정 파일 목록**: `index.html` (+' + m.summary.indexHtmlNumstat.added + ' lines, -' + m.summary.indexHtmlNumstat.deleted + ' lines) — 제품 변경은 이것 하나. 그 밖은 `docs/architecture/module-baseline.json`(래칫 기록) · REQ · TICKETS · `reports/TASK-ES-646/**` · 작업계획서.',
    '- **소블록 자가분열 준수**: 바뀐 js 파일 0. 나눈 함수 줄 수 — ' + fnRows + ' (측정: `reports/TASK-ES-646/tools/verify-inplace.cjs` → `verify-inplace.json` `after.functions`). 다음 단계에서 세포 파일이 되어도 각각 800줄 이하다.',
    '- **세포 영향**: 바뀐 세포 없음(미분화 덩어리 `index.html` 안의 정리) · `node scripts/module-guard.js` 종료 코드 ' + m.guard.exitCode + ' · **기준선 `--update --reason` 으로 올림**: 인라인 스크립트 줄 수 ' + m.summary.inlineScriptLines.before + ' → ' + m.summary.inlineScriptLines.after + '(+' + m.summary.inlineScriptLines.delta + ') · 함수 선언 수 ' + m.summary.indexFunctionDecls.before + ' → ' + m.summary.indexFunctionDecls.after + '(+' + m.summary.indexFunctionDecls.delta + '). 사유(기준선에 적은 글자): 「' + m.baseline.reason + '」',
    '- **바꾼 글자 네 가지**: ① 이름 앞 `ctx.` ' + v.tokens.allowed.ctxPrefixOnReference + '곳(여러 조각이 함께 보는 값 ' + v.ctx.data.length + '개 · 다른 조각이 부르는 안쪽 함수 ' + v.ctx.functions.length + '개) ② 선언 `var X` → `ctx.X` ' + v.tokens.allowed.varDeclToCtx.length + '곳 ③ 꾸러미를 만드는 문 ④ 조각 함수 머리·닫는 괄호·부르는 줄. 문구·조건·순서·저장 키·서버 호출·DOM id·이벤트 연결·타이머 간격·예외 처리는 그대로(토큰열 대조 허용 밖 차이 ' + v.tokens.outsideAllowed + '). 「마켓」 단추 줄은 접두가 붙은 것 말고 글자가 같다.',
    '',
    '#### [블록 4] Claims (주장)',
    (() => { const c = rj('claims.json'); const n = k => c.claims.filter(x => x.kind === k).length; return '- `reports/TASK-ES-646/claims.json` 기록 완료 — 지시 항목 ' + c.requirements.length + '건 · 주장 ' + c.claims.length + '건(화면 동작 보존 ' + n('behavior') + ' · 측정 기록 글자 확인 ' + n('static') + ' · 법정 도구 한계 ' + n('unverified') + ').'; })(),
    '- **주장 항목**(전부 작업자 측정이며 판정이 아니다):',
    '  - 화면: 게스트 시나리오 ' + sc.scenarioCount + '개가 기준 2회 · 작업 1회 모두 통과(' + sc.allPassed + '), 단계별 화면·저장값·토스트·단계 결과 ' + sc.totalFieldsCompared + '칸 중 차이 ' + sc.totalDiffs + '(기준끼리 달라 뺀 칸 ' + sc.totalIgnoredBecauseBaseDiffers + '), 예외 ' + sc.totalExceptions + '. 저장 → 닫기 → 다시 열기 → 새로 고침 뒤에도 값이 남는다(s10 · s11).',
    '  - 글자: 정리 전후 토큰 ' + v.tokens.old + '개 대조 허용 밖 차이 ' + v.tokens.outsideAllowed + ' · 접두 기대 어긋남 ' + v.prefixExpectation.mismatches + ' · 조각 경계를 넘는 맨이름 ' + v.scope.leaks.length + ' · 저장 경로 토큰 같음 ' + v.save.tokens.same + ' · 호출 순서 같음 ' + v.save.calls.sameOrder + ' · 대조군 ' + ctl.caught + '/' + ctl.mustBeCaught + ' 잡음.',
    '  - 시험: npm test 종료 코드 ' + npm.base.exit + ' · ' + npm.work.exit + ', ✓ ' + npm.base.checkLines + ' · ' + npm.work.checkLines + ', ok ' + npm.base.okLines + ' · ' + npm.work.okLines + ' · 시험 파일 ' + ta.files + '개 개별 실행 차이 ' + ta.differingCount + ' · 모듈 로드 회귀 ' + ml.regressions.length + ' · 통로 ' + fp.scope.names + '개 중 지문 변화 ' + fp.scope.diff + '(그 함수) · window ' + fp.window.names + '개 차이 ' + fp.window.diff + ' · CSV 내려받기 파일 같음 ' + csv.sameFile + '.',
    '  - 화면으로 못 잰 것: 로그인 뒤 서버 동기화·구글 캘린더·Notion 자동 전송(needs-login) · 사진 첨부(file-attach) · 음성 인식(camera-mic-share). 지시로 실행하지 않은 것: 스마트워치 선택 · 마켓 복제 · Notion 전송 · AI 코치 적용.',
    '- **발견(고치지 않음, REQ 9절)**: 같은 템플릿 기록이 2건 이상이면 **기준(main)에서도** 이 창이 예외(`val is not defined`, `js/tabs/records/table-analytics-engine.js`)로 열리지 않는다 · 차트 점 툴팁이 보이지 않는다 · 도구 창이 기록 창을 덮어써 입력하던 표가 사라진다 외.',
    '',
    '#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)',
    '- 법정 심사 전 — 위는 전부 작업자 주장이다. 판정은 GitHub `court` 검사가 낸다(`node court/chat.js <PR번호>`).',
    '- 로컬 예비 점검(작업자 PC, 판정 아님 · `reports/TASK-ES-646/court-local.json`): ' + (court ? ('막힌 것 ' + court.findings.filter(f => f.severity === 'reject').length + '건 · 종료 코드 ' + court.judgeExitCode + ' · 지시 항목별: ' + lack) : '측정불가'),
    '- **예상 판정과 그 뜻**: 화면 동작 주장 12건은 선례의 동작 0 변경 PR 과 같은 꼴(`kind: behavior` · `change: new` · 「정리한 뒤에도 …」 — 선례 `reports/TASK-ES-461` · `466` · `474` · `476` 의 claims.json)로 걸었다. 법정이 시나리오를 기준·작업 양쪽에서 실제로 돌리고, 기준에서도 통과하므로 「고칠 게 없었음」을 낸다 — 이 작업이 화면 동작을 바꾸지 않았다는 뜻이다(경험칙 L005). 그래서 전체 판정은 「통과」가 아니라 「확인 부족」이 예상되고, 부족 목록은 「고칠 게 없었음」과 법정 도구 한계(로그인 뒤 화면 · 파일 첨부 · 마이크)뿐이어야 한다.',
    '- **법정이 다시 재지 않는 것**: 「글자가 같다」(정리 전후 토큰열 대조). 이것은 작업자 대조기·대조군과 병합 전 독립 검토에 기댄다. 생성기로 만든 것이 아니라 `change: preserve`(생성기 설정을 다시 돌려 바이트를 맞대는 길)에는 올리지 않았다 — 지시함 DIR-004 (라)도 이 단계를 그 대상이 아니라고 적었다.',
    '- **재현 방법(독립 검토용)**: 기준 트리 = merge-base(측정 때 `' + m.base.head.slice(0, 8) + '`)를 분리 HEAD 로 꺼낸 작업 폴더, 작업 트리 = 이 브랜치(`npm ci --ignore-scripts`, `export NODE_PATH=<작업 트리>/node_modules`). 전부 작업 트리에서 돌린다. 표 전체는 REQ 7.1절.',
    '```',
    'node reports/TASK-ES-646/tools/verify-inplace.cjs <기준>/index.html index.html <임시>/verify.json   # 종료 코드 0 · "ok": true · problems [] · tokens.old ' + v.tokens.old + ' · prefix ' + v.tokens.allowed.ctxPrefixOnReference + ' · expect.mismatches 0 · scope.leaks 0 · save.tokensSame true · sameOrder true · restSame true',
    'node reports/TASK-ES-646/tools/control-group.cjs <기준>/index.html index.html <임시>/control.json   # M0 통과 · M1~M14 잡음 · "caught":' + ctl.caught + ',"missed":[]',
    'node reports/TASK-ES-646/tools/inplace-split.cjs <기준> --out <임시>/index.html && cmp <임시>/index.html index.html   # 변환기를 기준에 다시 돌린 결과 = 이 브랜치의 index.html',
    'node reports/TASK-ES-646/tools/scenario-local.cjs <기준> . <임시>/scenario.json reports/TASK-ES-646/scenarios/*.json   # 약 8분 · 시나리오마다 base·base2·work true · 마지막 줄 allPassed true · diffs 0 · exceptions 0',
    'node reports/TASK-ES-646/tools/csv-download-probe.cjs <기준> . <임시>/csv.json   # "created":{"base":true,"work":true},"same":true',
    'sh reports/TASK-ES-646/tools/run-all.sh <기준> <저장소 밖 임시 폴더>   # 약 20분 · npm test·시험 파일 전부·지문·모듈 로드까지 한 벌 · 마지막 staticMismatch 0',
    '```',
    '저장 경로만 눈으로 보려면 `git diff -U0 <merge-base> -- index.html` 에서 `async function executeSave` 부터 닫는 괄호까지 — 바뀐 줄은 `ctx.` 가 붙은 줄뿐이다.',
    '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ].join('\n');
  fs.writeFileSync(process.argv[i + 1], body + '\n', { encoding: 'utf8' });
  console.log('PR 본문 초안 →', process.argv[i + 1]);
}
