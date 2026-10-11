'use strict';
// #TASK-ES-646 주장 파일 조립기 — 작업자는 주장만 쓴다(판정은 법정). 사용: node reports/TASK-ES-646/tools/build-claims.cjs
// 화면 파일(index.html)의 동작 주장은 게스트 화면 시나리오로 건다(L001).
// change 칸: 선례(동작 0 변경 PR — reports/TASK-ES-461 · 466 · 474 · 476 의 claims.json, 「옮긴 뒤에도 …」)와 같이 new 로 건다. 법정은 시나리오를 기준·작업 양쪽에서 돌리고,
//   기준에서도 통과하면 「고칠 게 없었음」을 낸다(경험칙 L005). preserve 는 생성기 설정(proof)을 다시 돌려 바이트를 맞대는 길이고, 지시함 DIR-004 (라)가 이 PR 을 그 대상이 아니라고 적었다.
//   새 동작을 만들었다는 뜻이 아니다 — 주장 문장마다 「정리한 뒤에도 … 정리 전후가 같다」고 적는다.
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '..');
const R = 'reports/TASK-ES-646/';
const sc = id => JSON.parse(fs.readFileSync(path.join(DIR, 'scenarios', id + '.json'), 'utf8'));
const m = JSON.parse(fs.readFileSync(path.join(DIR, 'measurement.json'), 'utf8'));
const requirements = [
  { id: 'R1', text: '전문 템플릿 기록 창(openProTemplateRecordModal)의 창 틀 — 여는 길 셋(기록 탭 템플릿 카드의 여는 단추 · 빠른 칩 · 일정 탭 날짜 허브)과 닫는 길(취소 · 돌아가기 · 저장 뒤 날짜 허브로 복귀)이 제자리 정리 전과 같다.' },
  { id: 'R2', text: '표 편집 — 행 추가 · 칸 입력에 따른 실시간 분석 띠 갱신 · 행 삭제와 번호 다시 매기기 · 마지막 행 비우기가 제자리 정리 전과 같다.' },
  { id: 'R3', text: '도구 단추 — 템플릿 변경 · 지난 루틴 불러오기 · 창이 뜨는 단추들(AI 코치 · Notion 연동 · CSV 가져오기 · 스마트워치 · 마켓 · AI 사진 인식 · 음성 입력 · 표 속성 편집 · 새 템플릿)의 열기·닫기와 로컬 반영이 제자리 정리 전과 같다(전송·연동·복제·AI 호출은 실행하지 않는다).' },
  { id: 'R4', text: '성장 추이 차트 — 기간 칩 선택과, 템플릿을 바꿔 다시 그려도 고른 기간이 유지되는 것이 제자리 정리 전과 같다.' },
  { id: 'R5', text: '스톱워치·인터벌 타이머 — 시작 · 랩 · 정지 · 리셋 · 모드 전환 · 랩과 지금 시간을 표 칸에 기입 · 정해 둔 시간이 다 되면 스스로 멈춤이 제자리 정리 전과 같다.' },
  { id: 'R6', text: '저장 — 일반저장 · 일정연동저장 · 수정 저장이 제자리 정리 전과 같고, 저장한 뒤 창을 닫았다 다시 열어도, 새로 고침한 뒤에도 기록(과 연동 일정)이 남는다.' },
  { id: 'R7', text: '제자리 정리의 글자 대조 — 정리 전후 토큰열이 「이름 앞 ctx. · 선언의 var → ctx. · 꾸러미를 만드는 문 · 조각 함수 머리·부르는 줄」 말고는 같고(문자열·주석 포함), 조각 경계를 넘어 맨이름으로 새는 지역 이름이 없으며, 저장 경로(executeSave)의 토큰·호출 순서가 같다. 이 함수 구간 밖의 index.html 글자, js 파일, 시험, 금고는 바꾸지 않는다.' },
  { id: 'R8', text: '함수를 IIFE 최상위 함수 여러 개(진입점 + 책임 단위 조각 다섯)로 나눈다 — 각각 800줄 이하이고 최상위 this/arguments 가 없어, 다음 단계에서 생성기가 조각별로 세포에 글자 그대로 옮길 수 있는 꼴이다. 진입점의 이름·인자는 그대로다.' },
  { id: 'R9', text: '모듈 가드 래칫이 일시적으로 늘어난 값(인라인 줄 수 · 함수 선언 수)을 헌법 절차대로 사유와 함께 기준선에 기록한다.' },
  { id: 'R10', text: '로그인한 사용자의 저장 뒤 서버 동기화 · 구글 캘린더 자동 동기화 · Notion 자동 전송 경로가 제자리 정리 전과 같다.' },
  { id: 'R11', text: '사진 첨부(인증 사진 고르기)와 AI 사진 인식 결과를 표에 넣는 길이 제자리 정리 전과 같다.' },
  { id: 'R12', text: '음성으로 말한 행을 표에 넣는 길이 제자리 정리 전과 같다.' },
];
const B = (id, req, scenarioId, statement) => ({ id, req, kind: 'behavior', change: 'new', domain: 'ui-behavior', statement: '정리한 뒤에도 ' + statement, touches: ['index.html'], scenario: 'scenarios/' + scenarioId + '.json' });
const S = (id, req, file, p, equals, statement) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals } });
const U = (id, req, cannotBecause, statement, who, how) => ({ id, req, kind: 'unverified', domain: 'ui-behavior', statement, touches: ['index.html'], unverified: { reason: 'tool-cannot-measure', cannotBecause, who, how } });
const claims = [
  B('C1', 'R1', 's01-open-close', '게스트로 기록 탭 템플릿 카드의 여는 단추를 누르면 전문 템플릿 기록 창이 헬스 표 4행으로 열리고 「취소」를 누르면 닫히며, 빠른 칩 「공부」를 누르면 공부 표 2행으로 열린다. 제자리 정리 전후가 같다.'),
  B('C2', 'R1', 's02-hub-entry-back', '게스트로 일정 탭 날짜 허브의 「맞춤기록 작성」을 누르면 돌아가기 줄이 있는 창이 열리고, 「돌아가기」·「취소」·「일반저장」을 누르면 날짜 허브가 다시 보인다. 제자리 정리 전후가 같다.'),
  B('C3', 'R2', 's03-table-edit', '창에서 「+ 행 추가」를 누르면 행이 늘고, 칸에 값을 입력하면 실시간 분석 띠의 합계가 바뀌며, 행의 삭제 단추를 누르면 행이 줄고 번호가 다시 매겨진다. 제자리 정리 전후가 같다.'),
  B('C4', 'R3', 's04-template-change', '창에서 템플릿을 「공부」·「영업」·「헬스」로 선택하면 이름표·표 머리·기본 행·추이 차트 제목이 그 템플릿의 것으로 바뀐다. 제자리 정리 전후가 같다.'),
  B('C5', 'R3', 's05-tool-windows-a', '창의 「AI 코치」·「Notion 연동」·「스마트워치」 단추를 누르면 각자의 창이 열리고 닫기를 누르면 닫히며, 「CSV 가져오기」 창에 글을 입력하고 「반영」을 누르면 창이 닫힌다. 제자리 정리 전후가 같다.'),
  B('C6', 'R3', 's06-tool-windows-b', '창의 「마켓」·「AI 사진 인식」 단추를 누르면 각자의 창이 열리고 닫기를 누르면 닫히며, 「표 속성 편집」에서 열을 더해 「표에 적용」을 누르면 닫히고, 「+ 새 템플릿」으로 저장한 템플릿이 다시 연 창의 목록에 보이며, 「음성 입력」을 누르면 음성 창이 열린다. 제자리 정리 전후가 같다.'),
  B('C7', 'R3', 's07-quick-load', '첫 행을 고쳐 「일반저장」한 뒤 새로 연 창에서 「루틴 불러오기」를 누르면 방금 저장한 행이 표에 나타난다. 제자리 정리 전후가 같다.'),
  B('C8', 'R4', 's08-trend-chart', '성장 추이 차트의 기간 칩을 누르면 그 칩이 선택 표시로 바뀌고, 템플릿을 선택해 차트가 다시 그려져도 고른 기간 칩의 선택 표시가 유지된다. 제자리 정리 전후가 같다.'),
  B('C9', 'R5', 's09-stopwatch', '스톱워치의 시작·랩·정지·리셋 단추와 모드 칩을 누르면 단추 글자와 표시가 그에 맞게 바뀌고, 칸을 누른 뒤 랩의 「기입」이나 「표에 시간 기입」을 누르면 그 칸에 시간이 저장되어 표를 다시 그려도 나타난다. 제자리 정리 전후가 같다.'),
  B('C10', 'R5', 's12-interval-finish', '모드 칩 「60초 휴식」을 선택하고 시작을 누르면 60초 뒤 단추가 「▶ 시작」으로 바뀌고 표시가 00:00.0 으로 바뀐다. 제자리 정리 전후가 같다.'),
  B('C11', 'R6', 's10-save-reopen-reload', '칸과 메모를 입력해 「일반저장」을 누르면 창이 닫히고 기록 카드가 나타나며, 카드의 수정을 누르면 같은 값이 든 창이 열리고, 한 칸을 더 고쳐 저장해도 카드는 하나이며, 새로 고침한 뒤 다시 열어도 두 값과 메모가 저장되어 있다. 제자리 정리 전후가 같다.'),
  B('C12', 'R6', 's11-calendar-save', '「일정연동저장」을 누르면 창이 닫히고 일정 탭 날짜 허브에 그 기록의 일정이 하나 나타나며, 그 기록을 수정해 다시 일정연동저장을 눌러도 일정은 하나이고, 새로 고침한 뒤에도 일정이 하나 저장되어 있다. 제자리 정리 전후가 같다.'),
  S('C13', 'R7', 'verify-inplace.json', 'ok', true, '대조기(verify-inplace.cjs) 결과가 ok 다 — 토큰열·주석·접두 기대·스코프·꾸러미 빠짐·저장 경로·함수 밖 글자 검사에서 문제 0.'),
  S('C14', 'R7', 'verify-inplace.json', 'tokens.outsideAllowed', 0, '정리 전후 토큰열에서 허용한 네 가지 밖의 차이가 0 이다.'),
  S('C15', 'R7', 'verify-inplace.json', 'prefixExpectation.mismatches', 0, '정리 전 스코프 분석으로 따로 계산한 「ctx. 가 붙어야 하는 자리」와 실제가 어긋난 곳이 0 이다.'),
  S('C16', 'R7', 'verify-inplace.json', 'scope.leaks', [], '정리 전 함수의 지역 이름이 새 함수에서 맨이름으로 함수 밖을 가리키는 곳이 없다.'),
  S('C17', 'R7', 'verify-inplace.json', 'save.tokens.same', true, '저장 경로(executeSave)의 토큰열이 ctx. 접두 말고는 같다.'),
  S('C18', 'R7', 'verify-inplace.json', 'save.calls.sameOrder', true, '저장 경로(executeSave)의 호출 순서가 같다.'),
  S('C19', 'R7', 'verify-inplace.json', 'restOfFileSame', true, '이 함수 구간 밖의 index.html 글자가 그대로다.'),
  S('C20', 'R7', 'control-group.json', 'missed', [], '일부러 망가뜨린 사본(대조군)을 대조기가 하나도 놓치지 않았다.'),
  S('C21', 'R7', 'scenario-local.json', 'totalDiffs', 0, '시나리오 단계마다 갈무리한 화면·저장값·토스트·단계 결과를 기준 2회가 같은 칸에 한해 작업과 맞댄 차이가 0 이다.'),
  S('C22', 'R7', 'name-fingerprints.json', 'scope.unexpectedDiff', [], '통로 이름 가운데 본문을 고친 함수 하나 말고 값 지문이 달라진 이름이 없다.'),
  S('C23', 'R7', 'name-fingerprints.json', 'window.diff', 0, 'window 이름의 값 지문 차이가 0 이다.'),
  S('C24', 'R7', 'module-load.json', 'regressions', [], '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.'),
  S('C25', 'R7', 'npm-test-compare.json', 'same.checkAndOkLineText', true, 'npm test 의 검사 줄(✓·ok) 글자가 기준 트리와 작업 트리에서 같다.'),
  S('C26', 'R7', 'tests-all-compare.json', 'differingCount', 0, '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.'),
  S('C27', 'R7', 'measurement.json', 'changedFiles.product', ['index.html'], '이 작업이 바꾼 제품 파일은 index.html 하나다.'),
  S('C28', 'R7', 'measurement.json', 'changedFiles.tests', [], '이 작업이 바꾼 파일 가운데 시험 파일이 없다.'),
  S('C29', 'R7', 'csv-download.json', 'sameFile', true, '「CSV 다운로드」 단추로 만들어진 파일의 이름과 바이트가 기준 트리와 작업 트리에서 같다.'),
  S('C30', 'R8', 'measurement.json', 'verify.maxLines', m.verify.maxLines, '새 함수 여섯 가운데 가장 긴 것이 ' + m.verify.maxLines + '줄이다(800줄 이하).'),
  S('C31', 'R8', 'measurement.json', 'verify.topLevelThisArguments', 0, '새 함수 여섯의 최상위 this/arguments 가 0 이다.'),
  S('C32', 'R8', 'verify-inplace.json', 'topLevelFunctionDecls.added', ['bindProRecTable', 'bindProRecTools', 'bindProRecTrendChart', 'bindProRecStopwatch', 'bindProRecSave'], 'IIFE 최상위에 새로 생긴 함수 선언은 조각 다섯뿐이다.'),
  S('C33', 'R9', 'measurement.json', 'baseline.reasonRecorded', true, '기준선 마지막 기록에 20자 이상의 사유가 있다.'),
  S('C34', 'R9', 'measurement.json', 'summary.inlineScriptLines.delta', m.summary.inlineScriptLines.delta, '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 +' + m.summary.inlineScriptLines.delta + ' 다.'),
  S('C35', 'R9', 'measurement.json', 'summary.indexFunctionDecls.delta', m.summary.indexFunctionDecls.delta, '이 작업의 측정 기록에서 index.html 함수 선언 수 변화가 +' + m.summary.indexFunctionDecls.delta + ' 다.'),
  U('C36', 'R10', 'needs-login', '로그인한 사용자가 저장하면 서버 동기화가 돌고, 설정에 따라 구글 캘린더 자동 동기화와 Notion 자동 전송이 정리 전과 같게 돈다.', '운영 테스트 계정으로 로그인할 수 있는 사람(실계정 하네스)', ['테스트 계정으로 로그인한다', '기록 탭에서 전문 템플릿 기록 창을 열어 한 칸을 고치고 일반저장을 누른다', '다른 기기나 새로 고침 뒤에도 그 기록이 보이는지 본다', '구글 캘린더 자동 동기화·Notion 자동 전송을 켠 계정이면 일정연동저장 뒤 캘린더 일정과 Notion 행이 생기는지 본다']),
  U('C37', 'R11', 'file-attach', '창에서 「사진 첨부」로 사진을 고르면 미리보기에 그 사진이 보이고 저장한 기록에 사진이 남으며, 「AI 사진 인식」에서 고른 사진의 분석 결과 행이 표에 들어간다.', 'PC 나 폰에서 앱을 여는 사람', ['전문 템플릿 기록 창을 연다', '사진 첨부를 눌러 사진을 고른다', '미리보기 칸에 사진이 보이는지 보고 저장한 뒤 기록 상세에 사진이 있는지 본다']),
  U('C38', 'R12', 'camera-mic-share', '창에서 「음성 입력」으로 말한 내용이 새 행으로 표에 추가된다.', '마이크가 있는 PC 나 폰에서 앱을 여는 사람', ['전문 템플릿 기록 창을 연다', '음성 입력을 눌러 마이크를 허용하고 한 행을 말한다', '이 행 표에 추가하기를 누른 뒤 다시 연 표에 그 행이 있는지 본다']),
];
const outOfScopeReports = [
  { text: '이 PR 은 동작을 바꾸지 않는 「고치기」(제자리 정리)다. 화면 동작 주장은 선례의 동작 0 변경 PR 과 같은 꼴(change: new, 「…한 뒤에도 …」)로 걸었다 — 새 동작을 만들었다는 뜻이 아니며, 법정이 시나리오를 기준·작업 양쪽에서 돌려 기준에서도 통과하면 「고칠 게 없었음」을 낸다(이 작업이 화면 동작을 바꾸지 않았다는 뜻). 생성기로 만든 것이 아니라 생성기 설정(proof)이 없고, 지시함 DIR-004 (라)도 이 단계를 생성기 바이트 대조(「동작 보존 확인」)의 대상이 아니라고 적었다. 그래서 「글자가 같다」는 법정이 다시 재지 않는다 — 작업자 대조기(verify-inplace.json)·대조군(control-group.json)과 병합 전 독립 검토에 기댄다(작업자 측정이며 판정이 아니다).' },
  { text: '화면으로 재지 않은 것(넣지 않은 이유): 스마트워치 창의 세션 「선택」 · 마켓 창의 복제 · AI 코치 창의 적용 단추 · Notion 창의 전송(바깥으로 나가거나 크레딧·결제에 닿을 수 있는 실행은 하지 않는다는 지시) · 성장 추이 차트의 점 설명(툴팁 — 기준에서도 보이지 않는다, REQ 발견 2) · 같은 템플릿 기록이 2건 이상인 상태(기준에서도 창이 예외로 열리지 않는다, REQ 발견 1). 이 부분의 동일성은 토큰열 대조로만 말한다.' },
  { text: '새 기록을 저장하면 AI 피드백 요청(requestAIFeedback)이 자동으로 이어진다(정리 전과 같은 동작). 법정·작업자 실행기 모두 외부 통신을 막고 돌려 바깥으로 나간 요청은 없다. 응답이 온 뒤의 처리(피드백 카드 갱신 · 목표 갱신 제안)는 화면으로 재지 않았다.' },
  { text: '시나리오 단계별 화면·저장값 대조에서 실행마다 달라지는 값(난수 ID · 시각 · 스스로 사라지는 색종이 조각 · 돌아가는 스톱워치 표시와 그때 찍은 랩 시간·랩 토스트 글자 · 토스트 보임 표시)과 index.html 파일 크기에 따라 달라지는 「임시 캐시 및 데이터 — 약 N KB」 글자, 인라인 <script> 요소의 소스 글자는 비교에서 뺐다(목록과 사유는 scenario-local.json 의 normalize, REQ 4절).' },
  { text: '발견한 결함은 고치지 않았다(옮기기·정리는 고치기가 아니다). 목록은 REQ 9절.' },
];
const doc = { task: 'TASK-ES-646', requirementsSource: 'docs/specs/REQ-TASK-ES-646-PRO-MODAL-INPLACE.md', requirements, outOfScopeReports, claims };
for (const c of claims) if (c.kind === 'behavior') { const s = sc(path.basename(c.scenario, '.json')); if (!s.steps.length) throw new Error(c.id); }
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(doc, null, 2) + '\n', { encoding: 'utf8' });
// 형식 검사(법정 함수를 읽기만 써서)
const claimsLib = require(path.resolve(DIR, '..', '..', 'court', 'claims.js'));
const errs = claimsLib.validateClaims(doc);
console.log('requirements', requirements.length, 'claims', claims.length, 'behavior', claims.filter(c => c.kind === 'behavior').length, 'static', claims.filter(c => c.kind === 'static').length, 'unverified', claims.filter(c => c.kind === 'unverified').length, 'formatErrors', errs.length, errs.slice(0, 5));
// static 주장 값 미리 대조(작업자 확인 — 판정 아님)
let bad = 0;
for (const c of claims.filter(x => x.kind === 'static')) { const j = JSON.parse(fs.readFileSync(path.resolve(DIR, '..', '..', c.check.file), 'utf8')); const v = c.check.path.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), j); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { bad++; console.log('불일치', c.id, c.check.path, JSON.stringify(v), '≠', JSON.stringify(c.check.equals)); } }
console.log('staticMismatch', bad);
process.exit(errs.length || bad ? 1 : 0);
