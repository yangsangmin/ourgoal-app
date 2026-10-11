'use strict';
// #TASK-ES-672 주장 파일 조립기 — 작업자는 주장만 쓴다(판정은 법정). 사용: node reports/TASK-ES-672/tools/build-claims.cjs
// 옮기기(분열) PR: 화면 동작 주장은 behavior · preserve + 생성기 설정(proof.json) — 법정이 기준 커밋의 생성기를 다시 돌려 바이트를 맞댄다.
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..');
const R = 'reports/TASK-ES-672/';
const m = JSON.parse(fs.readFileSync(path.join(DIR, 'measurement.json'), 'utf8'));
const fpj = JSON.parse(fs.readFileSync(path.join(DIR, 'name-fingerprints.json'), 'utf8'));
const F = { modal: 'js/tabs/records/pro-record-modal.js', table: 'js/tabs/records/pro-record-table.js', tools: 'js/tabs/records/pro-record-tools.js', chart: 'js/tabs/records/pro-record-trend-chart.js', sw: 'js/tabs/records/pro-record-stopwatch.js', save: 'js/tabs/records/pro-record-save.js' };
const requirements = [
  { id: 'R1', text: '진입점 openProTemplateRecordModal(전문 템플릿 기록 창을 열고 조각 다섯을 정해진 순서로 부른다)을 생성기로 세포 ' + F.modal + ' 에 글자 그대로 옮긴다. 여는 길 셋과 닫는 길의 동작을 보존한다(손 편집 0).' },
  { id: 'R2', text: '표 편집 조각 bindProRecTable 을 생성기로 세포 ' + F.table + ' 에 글자 그대로 옮긴다. 행 추가 · 칸 입력 · 행 삭제의 동작을 보존한다.' },
  { id: 'R3', text: '도구 단추 조각 bindProRecTools 를 생성기로 세포 ' + F.tools + ' 에 글자 그대로 옮긴다. 템플릿 변경 · 지난 루틴 불러오기 · 창이 뜨는 단추들의 동작을 보존한다(「템플릿 마켓」 단추 연결 줄은 접두 말고 글자 0 변경).' },
  { id: 'R4', text: '성장 추이 차트 조각 bindProRecTrendChart 를 생성기로 세포 ' + F.chart + ' 에 글자 그대로 옮긴다. 기간 칩의 동작을 보존한다.' },
  { id: 'R5', text: '스톱워치·인터벌 타이머 조각 bindProRecStopwatch 를 생성기로 세포 ' + F.sw + ' 에 글자 그대로 옮긴다. 시작 · 랩 · 정지 · 리셋 · 모드 · 표 기입의 동작을 보존한다.' },
  { id: 'R6', text: '저장·닫기 조각 bindProRecSave 를 생성기로 세포 ' + F.save + ' 에 글자 그대로 옮긴다. 일반저장 · 일정연동저장 · 수정 저장을 보존하고, 저장한 뒤 닫았다 다시 열어도 · 새로 고침한 뒤에도 기록이 남는다.' },
  { id: 'R7', text: '증명 하한(헌법 CELL_SPLIT_PROOF): 옮긴 구간의 토큰 동일·누수 0 · 줄 단위로 접두 말고 다른 줄 0 · 모듈 단독 로드 새 회귀 0 · 통로·window 이름의 값 지문이 옮긴 함수 말고 같음 · 조각 호출 순서와 꾸러미 등록 의존 그대로 · npm test 검사 줄 동일 · tests·금고·생성기 변경 0.' },
  { id: 'R8', text: '기준선(docs/architecture/module-baseline.json)에 줄어든 인라인 스크립트 줄 수와 함수 선언 수를 기록한다(지시함 DIR-003).' },
  { id: 'R9', text: '로그인한 사용자의 저장 뒤 서버 동기화 · 구글 캘린더 자동 동기화 · Notion 자동 전송 경로가 이전 전과 같다.' },
  { id: 'R10', text: '사진 첨부(인증 사진 고르기)와 AI 사진 인식 결과를 표에 넣는 길이 이전 전과 같다.' },
];
const PROOF_TAIL = ' 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.';
const B = (id, req, scenarioId, file, statement) => ({ id, req, kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: statement + PROOF_TAIL, touches: ['index.html', file], scenario: 'scenarios/' + scenarioId + '.json', proof: 'proof.json' });
const S = (id, req, file, p, equals, statement) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals } });
const U = (id, req, cannotBecause, statement, who, how) => ({ id, req, kind: 'unverified', domain: 'ui-behavior', statement, touches: ['index.html', F.tools, F.save], unverified: { reason: 'tool-cannot-measure', cannotBecause, who, how } });
const claims = [
  B('C1', 'R1', 's01-open-close', F.modal, '게스트로 기록 탭 템플릿 카드의 여는 단추를 누르면 전문 템플릿 기록 창이 헬스 표 4행으로 열리고 「취소」를 누르면 닫히며, 빠른 칩 「공부」를 누르면 공부 표 2행으로 열린다.'),
  B('C2', 'R1', 's02-hub-entry-back', F.modal, '게스트로 일정 탭 날짜 허브의 「맞춤기록 작성」을 누르면 돌아가기 줄이 있는 창이 열리고, 「돌아가기」·「취소」·「일반저장」을 누르면 날짜 허브가 다시 보인다.'),
  B('C3', 'R2', 's03-table-edit', F.table, '창에서 「+ 행 추가」를 누르면 행이 늘고, 칸에 값을 입력하면 실시간 분석 띠의 합계가 바뀌며, 행의 삭제 단추를 누르면 행이 줄고 번호가 다시 매겨진다.'),
  B('C4', 'R2', 'x1-mid-row-delete-save-reopen', F.table, '창에서 행을 둘 추가해 값을 입력하고 가운데 행의 삭제 단추를 누른 뒤 저장하면, 수정으로 다시 연 창에 남은 행이 순서대로 나타나고 새로 고침한 뒤에도 그대로 저장되어 있다.'),
  B('C5', 'R3', 's04-template-change', F.tools, '창에서 템플릿을 「공부」·「영업」·「헬스」로 선택하면 이름표·표 머리·기본 행·추이 차트 제목이 그 템플릿의 것으로 바뀐다.'),
  B('C6', 'R3', 's05-tool-windows-a', F.tools, '창의 「AI 코치」·「Notion 연동」·「스마트워치」 단추를 누르면 각자의 창이 열리고 닫기를 누르면 닫히며, 「CSV 가져오기」 창에 글을 입력하고 「반영」을 누르면 창이 닫힌다.'),
  B('C7', 'R3', 's06-tool-windows-b', F.tools, '창의 「마켓」·「AI 사진 인식」 단추를 누르면 각자의 창이 열리고 닫기를 누르면 닫히며, 「표 속성 편집」에서 열을 더해 「표에 적용」을 누르면 닫히고, 「+ 새 템플릿」으로 저장한 템플릿이 다시 연 창의 목록에 보이며, 「음성 입력」을 누르면 음성 창이 열린다.'),
  B('C8', 'R3', 's07-quick-load', F.tools, '첫 행을 고쳐 「일반저장」한 뒤 새로 연 창에서 「루틴 불러오기」를 누르면 방금 저장한 행이 표에 나타난다.'),
  B('C9', 'R3', 'x4-voice-sim-chip-insert', F.tools, '창의 「음성 입력」을 눌러 음성 창을 열고 예시 칩을 누르면 「이 행 표에 추가하기」 단추가 보이고, 그 단추를 누르면 사라지며 예외가 없다.'),
  B('C10', 'R4', 's08-trend-chart', F.chart, '성장 추이 차트의 기간 칩을 누르면 그 칩이 선택 표시로 바뀌고, 템플릿을 선택해 차트가 다시 그려져도 고른 기간 칩의 선택 표시가 유지된다.'),
  B('C11', 'R5', 's09-stopwatch', F.sw, '스톱워치의 시작·랩·정지·리셋 단추와 모드 칩을 누르면 단추 글자와 표시가 그에 맞게 바뀌고, 칸을 누른 뒤 랩의 「기입」이나 「표에 시간 기입」을 누르면 그 칸에 시간이 저장되어 표를 다시 그려도 나타난다.'),
  B('C12', 'R5', 'x2-template-change-while-running', F.sw, '스톱워치를 시작한 채로 템플릿을 「공부」로 선택하면 표가 공부 기본 행으로 바뀌고, 정지·리셋 뒤 찍은 랩을 누른 칸에 기입해 저장하면 다시 연 창에 그 값이 저장되어 있다.'),
  B('C13', 'R5', 'x3-close-x-running-reopen', F.sw, '스톱워치를 시작한 채로 창을 닫고 다시 열면 새 창의 표시가 00:00.0 으로 나타나고 잠시 뒤에도 그대로이며, 새 창에서 시작·정지·리셋 단추를 누르면 단추 글자와 표시가 그에 맞게 바뀐다.'),
  B('C14', 'R6', 's10-save-reopen-reload', F.save, '칸과 메모를 입력해 「일반저장」을 누르면 창이 닫히고 기록 카드가 나타나며, 카드의 수정을 누르면 같은 값이 든 창이 열리고, 한 칸을 더 고쳐 저장해도 카드는 하나이며, 새로 고침한 뒤 다시 열어도 두 값과 메모가 저장되어 있다.'),
  B('C15', 'R6', 's11-calendar-save', F.save, '「일정연동저장」을 누르면 창이 닫히고 일정 탭 날짜 허브에 그 기록의 일정이 하나 나타나며, 그 기록을 수정해 다시 일정연동저장을 눌러도 일정은 하나이고, 새로 고침한 뒤에도 일정이 하나 저장되어 있다.'),
  S('C16', 'R7', 'verify-inline-hard.json', 'ok', true, '검사기(verify-inline-hard.js) 결과가 ok 다 — 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · this/arguments 0 · 이중 처리기 0 · 800줄 이하.'),
  S('C17', 'R7', 'prefix-only-check.json', 'totals.otherDiffLines', 0, '옮긴 줄을 기준과 줄 단위로 맞댔을 때 이름 접두 말고 다른 줄이 0 이다.'),
  S('C18', 'R7', 'prefix-only-check.json', 'marketLinesAllSame', true, '「템플릿 마켓」 단추를 연결하는 줄들은 이름 접두를 떼면 기준 줄과 글자가 같다.'),
  S('C19', 'R7', 'order-check.json', 'ok', true, '진입점이 조각을 부르는 순서와 꾸러미 등록 자리가 이전 전과 같고, 연결 중에 바로 부르는 꾸러미 함수는 행 삭제 연결 하나뿐이다.'),
  S('C20', 'R7', 'module-load.json', 'regressions', [], '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.'),
  S('C21', 'R7', 'accessor-probe.json', 'ok', true, '새 세포가 읽는 통로 이름이 모두 있고, 생성기가 새로 단 getter 가 상태 기관 이름과 겹치지 않는다.'),
  S('C22', 'R7', 'name-fingerprints.json', 'scope.unexpectedDiff', [], '통로 이름 가운데 이번에 본문을 옮긴 함수 말고 값 지문이 달라진 이름이 없다.'),
  S('C23', 'R7', 'name-fingerprints.json', 'scopeLost', [], '통로에서 사라진 이름이 없다.'),
  S('C24', 'R7', 'name-fingerprints.json', 'window.unexpectedDiff', [], 'window 이름 가운데 값 지문이 달라진 이름이 없다.'),
  S('C25', 'R7', 'scenario-local.json', 'totalDiffs', 0, '시나리오 단계마다 갈무리한 화면·저장값·토스트·단계 결과를 기준 2회가 같은 칸에 한해 작업과 맞댄 차이가 0 이다.'),
  S('C26', 'R7', 'photo-notion-probe.json', 'allSame', true, '사진 첨부 탐침과 Notion 자동 전송 본문 탐침의 관측값이 기준 트리와 작업 트리에서 같다.'),
  S('C27', 'R7', 'csv-download.json', 'sameFile', true, '「CSV 다운로드」 단추로 만들어진 파일의 이름과 바이트가 기준 트리와 작업 트리에서 같다.'),
  S('C28', 'R7', 'npm-test-compare.json', 'same.checkAndOkLineTextExceptModularFileCount', true, 'npm test 의 검사 줄(✓·ok) 글자가 세포 파일 수를 적는 줄의 숫자 말고는 기준 트리와 작업 트리에서 같다.'),
  S('C29', 'R7', 'tests-all-compare.json', 'differingCount', 0, '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.'),
  S('C30', 'R7', 'measurement.json', 'changedFiles.tests', [], '이 작업이 바꾼 파일 가운데 시험 파일이 없다.'),
  S('C31', 'R7', 'measurement.json', 'changedFiles.jsOutsideCells', [], '이 작업이 바꾼 js 파일은 새 세포 여섯뿐이다.'),
  S('C32', 'R7', 'measurement.json', 'newFilesMaxLines', m.newFilesMaxLines, '새 세포 파일 가운데 가장 긴 것이 ' + m.newFilesMaxLines + '줄이다(800줄 이하).'),
  S('C33', 'R8', 'measurement.json', 'summary.inlineScriptLines.delta', m.summary.inlineScriptLines.delta, '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 ' + m.summary.inlineScriptLines.delta + ' 다.'),
  S('C34', 'R8', 'measurement.json', 'summary.indexFunctionDecls.delta', m.summary.indexFunctionDecls.delta, '이 작업의 측정 기록에서 index.html 함수 선언 수 변화가 ' + m.summary.indexFunctionDecls.delta + ' 다.'),
  S('C35', 'R8', 'measurement.json', 'baseline.recordedEqualsMeasured', true, '기준선 마지막 기록의 인라인 스크립트 줄 수와 함수 선언 수가 측정값과 같다.'),
  U('C36', 'R9', 'needs-login', '로그인한 사용자가 저장하면 서버 동기화가 돌고, 설정에 따라 구글 캘린더 자동 동기화와 Notion 자동 전송이 이전 전과 같게 돈다.', '운영 테스트 계정으로 로그인할 수 있는 사람(실계정 하네스)', ['테스트 계정으로 로그인한다', '기록 탭에서 전문 템플릿 기록 창을 열어 한 칸을 고치고 일반저장을 누른다', '다른 기기나 새로 고침 뒤에도 그 기록이 보이는지 본다', '구글 캘린더 자동 동기화·Notion 자동 전송을 켠 계정이면 일정연동저장 뒤 캘린더 일정과 Notion 행이 생기는지 본다']),
  U('C37', 'R10', 'file-attach', '창에서 「사진 첨부」로 사진을 고르면 미리보기에 그 사진이 보이고 저장한 기록에 사진이 남으며, 「AI 사진 인식」에서 고른 사진의 분석 결과 행이 표에 들어간다.', 'PC 나 폰에서 앱을 여는 사람', ['전문 템플릿 기록 창을 연다', '사진 첨부를 눌러 사진을 고른다', '미리보기 칸에 사진이 보이는지 보고 저장한 뒤 기록 상세에 사진이 있는지 본다']),
];
const outOfScopeReports = [
  { text: '사진 첨부는 법정 시나리오 어휘로 파일을 고를 수 없어 「확인 못 함」(file-attach)으로 냈지만, 작업자 탐침(photo-notion-probe.json — 파일 입력에 8×8 그림을 넣어 미리보기·저장값의 사진·다시 열기·수정 저장을 기준과 맞댐)으로는 쟀다. 작업자 측정이며 법정이 다시 돌린 것이 아니다.' },
  { text: 'Notion 자동 전송은 게스트 설정에 가짜 키와 자동 전송을 심어, 저장할 때 같은 출처의 로컬 정적 서버로 나가는 요청 본문을 기준과 맞댔다(외부 통신은 막혀 있어 바깥으로 나간 것은 없다). 진짜 Notion 으로 가는 길과 로그인 뒤 서버 동기화 · 구글 캘린더 자동 동기화는 재지 못했다(needs-login).' },
  { text: '화면으로 재지 않은 것: 스마트워치 창의 세션 「선택」 · 마켓 창의 복제 · AI 코치 창의 적용 단추 · Notion 창의 전송 단추(바깥으로 나가거나 쓰기가 일어나는 실행은 넣지 않는다 — L101) · 성장 추이 차트의 점 설명(기준에서도 보이지 않는다) · 같은 템플릿 기록이 2건 이상인 상태(기준에서도 창이 예외로 열리지 않는다 — 고치지 않았다). 이 부분의 동일성은 생성기 재실행 대조(proof) · 토큰 대조 · 줄 단위 비교로 본다.' },
  { text: '60초 인터벌이 스스로 멈추는 시나리오(scenarios-local/s12-interval-finish.json)는 한 번에 70초가 걸려 법정의 주장 심사 시간을 아끼려고 주장에 걸지 않았다. 작업자 실행(scenario-local.json)에는 넣어 기준 2회 · 작업 1회로 쟀다.' },
  { text: '통로 이름 가운데 값 지문이 달라진 것은 이번에 본문이 세포로 옮겨진 함수 하나(openProTemplateRecordModal — 본문의 인라인 이름에 L. 접두가 붙어 함수 글자 해시만 다르다)다. 통로에 새로 생긴 이름은 ' + fpj.scopeAdded.length + '개다 — 조각 함수 다섯(진입점 세포가 L. 로 읽는다)과, 옮긴 코드가 읽는 인라인 이름 가운데 전에는 통로에 없던 것들이다(이름은 name-fingerprints.json scopeAdded).' },
  { text: '생성기가 옮긴 코드가 읽는 인라인 이름 ' + m.generator.newExposeGetters + '개의 통로 getter 를 index.html 머리에 새로 달았다(그 가운데 ' + fpj.newGetters.alreadyOnScopeInBase + '개는 기준에서도 통로에 있던 이름이다). 다시 단 getter 와 가져오기 줄 ' + m.generator.imports + '개의 재철거는 이 PR 의 범위가 아니다.' },
  { text: '시나리오 x1~x4 는 PR #936 독립 검토자가 쓴 추가 시나리오다. x4 는 사라지는 토스트를 보는 단언 둘을 빼고 가져왔다(L077).' },
];
const doc = { task: 'TASK-ES-672', requirementsSource: 'docs/specs/REQ-TASK-ES-672-PRO-MODAL-CELLS.md', requirements, outOfScopeReports, claims };
for (const c of claims) if (c.kind === 'behavior' && !fs.existsSync(path.join(DIR, c.scenario))) throw new Error('시나리오 없음: ' + c.scenario);
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(doc, null, 2) + '\n', { encoding: 'utf8' });
const claimsLib = require(path.resolve(DIR, '..', '..', 'court', 'claims.js'));
const errs = claimsLib.validateClaims(doc);
const fps = new Set(); let dupFp = 0;
const { scenarioFingerprint } = require(path.resolve(DIR, '..', '..', 'court', 'lib', 'scenario.js'));
for (const c of claims.filter(x => x.kind === 'behavior')) { const fp = scenarioFingerprint(JSON.parse(fs.readFileSync(path.join(DIR, c.scenario), 'utf8'))); if (fps.has(fp)) dupFp++; fps.add(fp); }
console.log('requirements', requirements.length, 'claims', claims.length, 'behavior', claims.filter(c => c.kind === 'behavior').length, 'static', claims.filter(c => c.kind === 'static').length, 'unverified', claims.filter(c => c.kind === 'unverified').length, 'formatErrors', errs.length, errs.slice(0, 5), 'duplicateScenarios', dupFp);
let bad = 0;
for (const c of claims.filter(x => x.kind === 'static')) { const j = JSON.parse(fs.readFileSync(path.resolve(DIR, '..', '..', c.check.file), 'utf8')); const v = c.check.path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), j); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { bad++; console.log('불일치', c.id, c.check.path, JSON.stringify(v), '≠', JSON.stringify(c.check.equals)); } }
console.log('staticMismatch', bad);
process.exit(errs.length || bad || dupFp ? 1 : 0);
