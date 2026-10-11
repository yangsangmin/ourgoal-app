'use strict';
// 주장 파일(reports/TASK-ES-671/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다. 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2]);
const R = 'reports/TASK-ES-671/';
const m = JSON.parse(fs.readFileSync(path.join(WORK, R, 'measurement.json'), 'utf8')); // 주장 문장에 적을 수(측정 파일에서 읽는다 — 손으로 옮기지 않는다)
const delta = m.metrics.delta;
const CELL = 'js/core/boot-app-handles.js';
const out = {
  task: 'TASK-ES-671',
  requirementsSource: 'docs/specs/REQ-TASK-ES-671-BOOT-APP-HANDLES.md',
  requirements: [
    { id: 'R1', text: '앱 환경설정 객체(OURGOAL_CONFIG 선언과 window 복사 블록)와 템플릿 부품 초기화 블록을 생성기 region 으로 세포 js/core/boot-app-handles.js 의 구역 함수 둘로 옮긴다. 게스트 화면의 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '한도: 접두(L.) 말고는 한 글자도 바꾸지 않는다. 금액·조건·문구·광고·구독·결제 관련 줄을 만들거나 지우지 않는다. 세포 파일 이름·머리 설명에 돈 관련 낱말을 쓰지 않는다.' },
    { id: 'R3', text: '옮긴 뒤에도 window.OURGOAL_CONFIG 가 같은 시점에 같은 꼴로 달리고, 초기화가 같은 값(서버 연결 · 앱 상태 읽기 · 알림 글)으로 한 번 불린다.' },
    { id: 'R4', text: '실서버에 연결된 상태에서 템플릿 부품이 건네받은 서버 연결로 하는 일(템플릿 복제 기록 · 복제 수 표시)이 이전 전과 같다.' },
    { id: 'R5', text: '증명 하한: 상태 탐침·이름 값 지문 동일 · 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩 동일 · tests·금고·생성기 변경 0 · 기준선에 줄어든 인라인 줄 수 기록(DIR-003).' },
  ],
  outOfScopeReports: [
    { text: '승인 근거(상민님 2026-10-11 「결심 1 : 승인, 금고 변경 승인, 결심 2 : 승인」 가운데 결심 2)는 오케스트레이터가 전한 글자다. 이 작업자는 그 채팅을 직접 보지 못했다.' },
    { text: '실행 탐침은 게스트로 띄운 임시 브라우저의 작업자 PC 측정이다. 법정 브라우저가 외부 통신을 막아 서버 연결 객체(sb)는 null 이었다(기준과 작업이 같다). 법정이 그 탐침을 다시 돌린 것은 아니다.' },
    { text: '앱 환경설정 객체의 구획 주석 두 줄(「템플릿 복제 광고 설정 4개는 … 지웠다. 크레딧 원장 플래그만 남는다」)이 생성기 규칙(구역 안 주석은 따라간다)으로 세포 본문에 함께 갔다. 글자는 그대로다. 그래서 돈 관련 낱말이 든 줄은 세포 본문에 있고 세포 머리 설명에는 없다.' },
    { text: '상태 이전 미리 보기(저장소 밖 사본): 이 이전 뒤 sb 는 생성기 unstate 가 옮길 수 있게 되고, state 는 944줄 함수가 맨이름으로 읽어 여전히 멈춘다. 이 PR 은 상태 이전을 하지 않는다.' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 아바타 인사 팝업을 닫고 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성이 되고 예외가 없다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', CELL], scenario: 'scenarios/s1-guest-boot-six-tabs.json', proof: 'proof.json' },
    { id: 'C2', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 목표 탭의 템플릿 백과사전에 들어가 분류 칩·검색어·종류·영역을 바꾸면 고른 단추가 강조되고 돌아왔을 때 고른 분류가 남아 있다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', CELL], scenario: 'scenarios/s2-template-subtab-filters.json', proof: 'proof.json' },
    { id: 'C3', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 소통 탭의 피드 하위 탭을 누르면 피드 머리 문구가 보이고 예외가 없다. 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.',
      touches: ['index.html', CELL], scenario: 'scenarios/s3-comm-feed-opens.json', proof: 'proof.json' },
    { id: 'C4', req: 'R4', kind: 'unverified', domain: 'server-api',
      statement: '실계정으로 로그인해 템플릿을 복제하면 복제가 서버에 기록되고 템플릿 카드의 복제 수 표시가 채워진다 — 이전 전과 같다.',
      touches: [CELL],
      unverified: { reason: 'needs-live-server',
        who: '실서버에 실계정으로 로그인할 수 있는 사람 — 법정은 외부 통신을 막아 서버 연결 객체가 null 이고, 템플릿 부품의 서버 호출은 일어나지 않는다',
        how: ['실계정으로 로그인한다', '목표 탭 → 템플릿 백과사전에서 템플릿 하나를 복제한다', '복제 뒤 그 템플릿 카드의 복제 수 표시가 늘었는지(또는 다시 열었을 때 표시가 채워지는지) 본다', '기준 커밋과 작업 커밋에서 같은 순서로 해 보고 결과를 맞댄다'] } },
  ],
};
const st = (id, req, statement, file, p, eq) => out.claims.push({ id, req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
st('C5', 'R2', '옮긴 줄을 기준과 줄 단위로 맞댔을 때 접두 L. 말고 다른 줄이 0줄이다.', 'prefix-only-check.json', 'totals.otherDiffLines', 0);
st('C6', 'R2', '걷어 낸 접두 수가 생성기가 적은 바꿔 쓰기 수와 같다.', 'prefix-only-check.json', 'totals.strippedPrefixes', m.prefixOnly.totals.generatorEdits);
st('C7', 'R2', '돈 관련 낱말이 든 옮긴 줄은 접두 말고 글자가 그대로다.', 'prefix-only-check.json', 'moneyLines.allSameAfterStrip', true);
st('C8', 'R2', '돈 관련 낱말이 든 줄 수가 index.html + 세포 합계로 전후 같다(만들거나 지운 줄 0).', 'prefix-only-check.json', 'moneyLines.totalSame', true);
st('C9', 'R2', '세포 머리 설명에 돈 관련 낱말이 든 줄이 0줄이다.', 'prefix-only-check.json', 'moneyLines.cellHeaderLines', 0);
st('C10', 'R2', '글자 대조 전체가 기대대로다.', 'prefix-only-check.json', 'ok', true);
st('C11', 'R3', '실행 탐침 결과가 기준과 작업에서 통째로 같다(환경설정 객체가 달리는 사건과 초기화 호출의 수·순서 · 건넨 값 · 객체의 꼴).', 'guarded-probe.json', 'sameAsBase', true);
st('C12', 'R3', '작업 트리에서 window.OURGOAL_CONFIG 는 빈 객체로 한 번 달리고 다시 읽어도 같은 객체다.', 'guarded-probe.json', 'expected.configIsPlainEmptyObject', true);
st('C13', 'R3', '작업 트리에서 초기화는 한 번 불리고 건넨 sb · getState() · toast 가 통로의 값과 같은 것이다.', 'guarded-probe.json', 'expected.initGetsScopeValues', true);
st('C14', 'R3', '작업 트리에서 환경설정 객체가 달린 뒤에 초기화가 불린다(기준과 같은 순서).', 'guarded-probe.json', 'expected.configBeforePartInit', true);
st('C15', 'R5', '상태 탐침에서 통로 값 요약 · 접근자 · 주인 · window 복사 동일성 · 쓰기 왕복이 기준과 다른 이름이 없다(기준을 두 번 재도 다른 이름은 뺐다).', 'measurement.json', 'stateProbe.differing', []);
st('C16', 'R5', '통로 이름의 값 지문이 기준과 다른 이름이 없다.', 'measurement.json', 'fingerprints.scopeDiff', []);
st('C17', 'R5', 'window 이름의 값 지문이 기준과 다른 이름이 없다.', 'measurement.json', 'fingerprints.windowDiff', []);
st('C18', 'R5', '통로에서 사라진 이름이 없다.', 'measurement.json', 'fingerprints.scopeLost', []);
st('C19', 'R5', '세포가 읽는 통로 이름(sb · state · toast)이 모두 통로에 있고 생성기가 새로 단 getter 가 없다.', 'accessor-probe.json', 'ok', true);
st('C20', 'R5', '모듈 로드 탐침 결과에서 기준 대비 새 회귀 목록이 비어 있다.', 'measurement.json', 'moduleLoad.regressions', []);
st('C21', 'R5', '새 세포 파일이 단독으로 로드된다.', 'measurement.json', 'moduleLoad.newFilesLoadOneOk', true);
st('C22', 'R5', 'npm test 의 종료 코드·검사 줄 수·요약 줄이 기준 트리와 작업 트리에서 같다.', 'measurement.json', 'npmTest.allSame', true);
st('C23', 'R5', '시험 파일을 하나씩 돌렸을 때 종료 코드나 ok 줄 수가 기준과 다른 파일이 0개다.', 'measurement.json', 'testsAll.differingCount', 0);
st('C24', 'R5', '이 작업이 바꾼 파일 가운데 tests/ 아래 파일이 없다.', 'measurement.json', 'changed.testsChanged', []);
st('C25', 'R5', '이 작업이 바꾼 파일 가운데 금고 파일이 없다.', 'measurement.json', 'changed.vaultChanged', []);
st('C26', 'R5', '이 작업이 바꾼 파일 가운데 생성기·검사기 파일이 없다.', 'measurement.json', 'changed.generatorChanged', []);
st('C27', 'R5', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화가 ' + delta + ' 이다.', 'measurement.json', 'metrics.delta', delta);
st('C28', 'R5', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다.', 'measurement.json', 'baseline.recordedEqualsMeasured', true);
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
const errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' });
console.log('claims', out.claims.length, 'delta', delta, 'errors', JSON.stringify(errs));
