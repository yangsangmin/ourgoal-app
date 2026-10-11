'use strict';
// 주장 파일(reports/TASK-ES-645/claims.json)을 만든다. 값은 적지 않고 측정 파일의 경로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = process.argv[2];
const R = 'reports/TASK-ES-645/';
const out = {
  task: 'TASK-ES-645',
  requirementsSource: 'docs/specs/REQ-TASK-ES-645-TEMPLATE-MARKET-MOVE.md',
  requirements: [
    { id: 'R1', text: 'executeDirectTemplateClone(템플릿 복제 본체) · openTemplateMarketModal(템플릿 마켓 창)을 생성기(gen-inline-hard.js)로 세포 js/tabs/records/template-market.js 에 글자 그대로 옮긴다. 앱 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '한도 준수(지시함 DIR-004 (나) — 내용을 한 글자도 바꾸지 않고 자리만 옮긴다): 옮긴 구간에서 바뀐 글자는 생성기가 붙인 L. 접두뿐이고, 돈 관련 낱말이 든 줄은 수와 글자가 그대로다.' },
    { id: 'R3', text: '증명 하한(헌법 CELL_SPLIT_PROOF): 옮긴 구간의 토큰 동일·누수 0 · 모듈 단독 로드 새 회귀 0 · 통로·window 이름의 값 지문이 옮긴 함수 말고 같음 · npm test 검사 줄 수 동일 · tests·금고·생성기 변경 0.' },
    { id: 'R4', text: '기준선(docs/architecture/module-baseline.json)에 줄어든 인라인 스크립트 줄 수를 기록한다(지시함 DIR-003).' },
  ],
  outOfScopeReports: [
    { text: '복제 실행은 화면으로 재지 않았다. 복제를 누르면 내 템플릿 저장과 서버 복제 기록 호출이 일어나므로 쓰기가 일어나는 조작을 시나리오에 넣지 않았다. 복제 본체(executeDirectTemplateClone)의 동일성은 생성기 재실행 대조(proof) · 토큰 대조 · 줄 단위 바이트 비교로 본다.', cannotBecause: 'out-of-scope-feature' },
    { text: '복제 수 표시(fillCounts)는 서버 응답이 필요해 재지 않았다. 마켓 창의 「미리보기」 단추는 기준 커밋에서도 예외(Cannot set properties of null — #mktPreviewTableBox 요소가 창 마크업에 없다)로 죽어 시나리오에 넣지 않았고, 옮기기 PR 이라 그대로 옮겼다(결함 보고).', cannotBecause: 'out-of-scope-feature' },
    { text: '통로 이름 가운데 openTemplateMarketModal 하나는 값 지문의 함수 글자 해시가 달라졌다(본문의 인라인 이름에 L. 접두). 종류·이름·인자 수는 같고 그 밖에 달라진 이름은 0 이다. 생성기가 새로 단 통로 getter 는 saveLocalSettings(등록 기관이 이미 내주던 이름)와 CURATED_MARKET_TEMPLATES(마켓 템플릿 목록 상수, 통로에 처음 생김) 둘이다.' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 일정 탭 오늘 날짜의 일정 관리 창에서 맞춤기록 창을 열고 「마켓」을 누르면 템플릿 마켓 창이 열리며, 분류 알약 「공부/수험」을 누르면 크로스핏 템플릿이 목록에서 빠지고 「전체」를 누르면 다시 나오며, 검색어로도 목록이 걸러지고 예외가 없다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', 'js/tabs/records/template-market.js'], scenario: 'scenarios/s1-template-market-browse.json', proof: 'proof.json' },
  ],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
out.claims.push({ id: 'C16', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
  statement: '게스트로 기록 탭에서 템플릿 카드를 펼치고 「템플릿 마켓」 칩을 누르면 템플릿 마켓 창이 열려 템플릿 목록과 복제하기 단추가 보이며 예외가 없다(복제는 누르지 않는다). 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
  touches: ['index.html', 'js/tabs/records/template-market.js'], scenario: 'scenarios/s2-records-market-chip.json', proof: 'proof.json' });
st('C2', 'R2', '옮긴 구간을 기준과 줄 단위로 맞댔을 때 L. 접두 말고 다른 줄이 0줄이다.', 'prefix-only-check.json', 'totals.otherDiffLines', 0);
st('C3', 'R2', '한도 실측 결과가 ok 다 — 지운 접두 수가 생성기의 바꿔 쓰기 수와 같고, 돈 관련 낱말이 든 줄의 수와 글자(접두 제외)가 기준과 같다.', 'prefix-only-check.json', 'ok', true);
st('C4', 'R2', '세포 파일의 옮긴 구간 밖(머리 설명·껍데기)에 돈 관련 낱말이 든 줄이 없다.', 'prefix-only-check.json', 'moneyWordsOutsideMovedLines', []);
st('C5', 'R3', '검사기(verify-inline-hard.js) 결과가 ok 다 — 토큰 동일(접두 제외) · 줄 동일 · 남은 글자 동일 · 누수 0 · 미노출 0 · setter 빠짐 0 · this/arguments 0 · 이중 처리기 0 · 800줄 이하.', 'verify-inline-hard.json', 'ok', true);
st('C6', 'R3', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', 'module-load.json', 'regressions', []);
st('C7', 'R3', '통로 이름 가운데 이번에 본문을 옮긴 함수 말고 값 지문이 달라진 이름이 없다.', 'name-fingerprints.json', 'scope.unexpectedDiff', []);
st('C8', 'R3', '통로에서 사라진 이름이 없다.', 'name-fingerprints.json', 'scopeLost', []);
st('C9', 'R3', 'window 이름의 값 지문 차이가 0 이다.', 'name-fingerprints.json', 'window.diff', 0);
st('C10', 'R3', '상태 기관 이름과 겹치는 새 getter 가 없고, 새 세포가 읽는 통로 이름이 모두 있다.', 'accessor-probe.json', 'ok', true);
st('C11', 'R3', 'npm test 의 검사 줄(✓) 수가 기준 트리와 작업 트리에서 같다.', 'npm-test-compare.json', 'same.checkLines', true);
st('C12', 'R3', '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.', 'tests-all-compare.json', 'differingCount', 0);
st('C13', 'R3', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changedFiles.tests', []);
st('C14', 'R4', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 -223 이다.', 'measurement.json', 'summary.inlineScriptLines.delta', -223);
st('C15', 'R4', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다.', 'measurement.json', 'baseline.recordedEqualsMeasured', true);
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
const errs = require(path.resolve(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'errors', JSON.stringify(errs));
