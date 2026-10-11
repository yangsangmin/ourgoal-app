#!/usr/bin/env node
'use strict';
// 주장 파일(reports/TASK-ES-676/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다(손으로 옮기지 않는다). 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-676/';
const rj = f => JSON.parse(fs.readFileSync(path.join(WORK, R, f), 'utf8'));
const m = rj('measurement.json'), gap = rj('finalize-gap.json'), meta = rj('region-meta.json');
const CELLS = Object.keys(meta.files);
const claims = []; let n = 0;
const add = c => { c.id = 'C' + (++n); claims.push(c); };
for (const f of fs.readdirSync(path.join(WORK, R, 'scenarios')).filter(x => x.endsWith('.json')).sort()) { const sc = JSON.parse(fs.readFileSync(path.join(WORK, R, 'scenarios', f), 'utf8'));
  add({ req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior', statement: sc.title + ' 바뀐 파일은 생성기 설정(proof.json)을 기준 커밋에서 다시 돌린 결과와 바이트 단위로 같다.', touches: ['index.html'].concat(CELLS), scenario: 'scenarios/' + f, proof: 'proof.json' }); }
const st = (req, statement, file, p, eq) => add({ req, kind: 'static', domain: 'config', statement, touches: [R + file], check: { type: 'jsonPath', file: R + file, path: p, equals: eq } });
const M = 'measurement.json', P = 'prefix-only-check.json', G = 'finalize-gap.json';
// R2 글자
st('R2', '옮긴 줄을 기준과 줄 단위로 맞댔을 때 접두 L. 말고 다른 줄이 0줄이다.', P, 'totals.otherDiffLines', 0);
st('R2', '걷어 낸 접두 수가 생성기가 적은 바꿔 쓰기 수와 같다.', P, 'totals.strippedPrefixes', m.prefixOnly.totals.generatorEdits);
st('R2', '옮긴 구역 수.', P, 'totals.regions', m.prefixOnly.totals.regions);
st('R2', '옮긴 최상위 문 수.', P, 'totals.statements', m.prefixOnly.totals.statements);
st('R2', '서버 주소·공개 키 선언 줄은 옮기지 않았다 — 옮긴 줄 가운데 그 줄의 수.', P, 'serverKeyLines.movedLines', 0);
st('R2', '그 두 줄은 작업 index.html 에 기준 줄과 바이트 단위로 같게 남아 있다.', P, 'serverKeyLines.workIndexByteIdenticalToBase', true);
st('R2', '새 세포 파일 가운데 서버 주소·공개 키 이름이 나오는 파일 수.', P, 'serverKeyLines.cellFilesMentioningTheNames', 0);
st('R2', '되짚기: 기준 index.html 에서 구역 줄을 빼고 부르는 줄·머리 줄·script 태그 줄을 넣은 것이 작업 index.html 과 줄 단위로 같다.', P, 'replay.rebuiltEqualsWork', true);
st('R2', '머리에 더한 가져오기 줄이 설정의 이름·키트 변수로 만든 글자와 같다.', P, 'replay.headImportsEqualExpected', true);
st('R2', 'script 태그 줄에서 새 세포의 태그 글자를 빼면 기준 줄과 같다.', P, 'replay.tagLineIsBasePlusNewTags', true);
st('R2', '생성기가 index.html 머리에 단 통로 getter 의 이름 목록 — 구역 본문이 통로로 읽는 이름 가운데 index.html 에 getter 가 없던 것(등록 기관이 이미 통로에 내주는 이름이다. 재철거가 지웠던 getter 가 다시 생긴 것이고, 다음 재철거가 지운다).', M, 'generator.exposed', m.generator.exposed);
// R3 시점
st('R3', '부팅 동안의 사건 줄(상태 기관 정의 · 통로 노출 · window 대입)과 사건마다의 통로 이름 수가, 생성기가 다시 단 getter 를 통로에 다는 사건 하나를 빼면 기준과 작업에서 글자 그대로 같다.', M, 'order.sameAsBaseExceptNewGetterExpose', true);
st('R3', '작업 쪽에 더 있는 사건 수.', M, 'order.newGetterExpose.extraEvents', m.order.newGetterExpose.extraEvents);
st('R3', '그 사건 앞뒤로 통로에 달린 이름 수가 같다(이미 통로에 있던 이름을 다시 단다).', M, 'order.newGetterExpose.scopeNamesUnchanged', true);
st('R3', '기준에서 두 번 잰 사건 줄이 서로 같다(본질 변동 없음).', M, 'order.baseRepeatSame', true);
st('R3', '사건 수(기준 · 작업).', M, 'order.total', m.order.total);
st('R3', '가짜 연결 라이브러리 방식에서도 그 사건 하나를 빼면 사건 줄이 기준과 같다(연결 만들기가 불리는 자리 포함).', M, 'order.fake.sameAsBaseExceptNewGetterExpose', true);
st('R3', '가짜 연결 라이브러리 방식: 연결 만들기 사건의 자리(기준 · 작업).', M, 'order.fake.createClientIndex', m.order.fake.createClientIndex);
st('R3', '가짜 연결 라이브러리 방식: sb 정의 사건의 자리(기준 · 작업) — 연결 만들기 바로 다음이다(이 줄은 옮기지 않았다).', M, 'order.fake.defineSbIndex', m.order.fake.defineSbIndex);
st('R3', 'window 에 대입되는 이름의 차례가 작업 트리에서 이 목록이다(기준과 같다 — 위 사건 줄 비교에 포함).', M, 'order.windowSets.work', m.order.windowSets.work);
// R4 값
st('R4', '손잡이 탐침(서버 연결 객체 · 공유 함수 · 모임 목록 · 닫기 단추 · 템플릿 하위 탭 넷 · 피드 캐시)의 기록이 기준과 작업에서 통째로 같다(주인 표시·기관 종류·함수 이름 포함).', M, 'handles.sameAsBase', true);
st('R4', '손잡이 탐침을 기준에서 두 번 돌린 기록이 서로 같다.', M, 'handles.baseRepeatSame', true);
st('R4', '가짜 연결 라이브러리 방식의 손잡이 탐침 기록이 기준과 작업에서 통째로 같다.', M, 'handles.fakeClient.sameAsBase', true);
st('R4', '가짜 연결 라이브러리 방식(진짜 서버 아님): 작업 트리에서 연결 만들기가 한 번 불리고 그 객체가 통로 · window.sb · 템플릿 부품 초기화에 같은 것으로 닿는다.', M, 'handles.fakeClient.workOneCreateCallSameObjectEverywhere', true);
st('R4', '서버 연결 객체의 통로 접근자 종류(기준 · 작업).', M, 'handles.sb.accessor', ['get', 'get']);
st('R4', '법정·작업자 PC 의 브라우저에서 서버 연결 객체의 값(기준 · 작업).', M, 'handles.sb.valueKind', ['null', 'null']);
st('R4', '상태 탐침에서 통로 값 요약 · 접근자 · 주인 · window 복사 동일성 · 쓰기 왕복이 기준과 다른 이름은, 생성기가 getter 를 다시 단 이름 말고는 없다(기준을 두 번 재도 다른 이름은 뺐다).', M, 'stateProbe.differingBeyondRegrownGetter', []);
st('R4', 'getter 가 다시 달려 접근자 종류·주인 표시가 달라진 이름 목록(값 지문은 같다 — 아래 통로 값 지문 주장).', M, 'stateProbe.differingRegrownGetter', m.stateProbe.differingRegrownGetter);
st('R4', '상태 기관이 맡은 이름 목록이 기준과 같다.', M, 'stateProbe.organNamesSame', true);
st('R4', '통로 이름의 값 지문이 기준과 다른 이름이 없다.', M, 'fingerprints.scopeDiff', []);
st('R4', 'window 이름의 값 지문이 기준과 다른 이름이 없다.', M, 'fingerprints.windowDiff', []);
st('R4', '통로에서 사라진 이름이 없다.', M, 'fingerprints.scopeLost', []);
st('R4', '통로에 새로 생긴 이름이 없다.', M, 'fingerprints.scopeAdded', []);
// R5 증명 하한
st('R5', '모듈 로드 탐침의 새 회귀 수.', M, 'moduleLoad.regressions', 0);
st('R5', '새 세포 파일 둘이 단독으로 로드된다.', M, 'moduleLoad.newFilesLoadOneOk', true);
st('R5', 'npm test 가 기준 트리와 작업 트리에서 종료 코드 0 이고 검사 줄 수·요약 줄이 같다.', M, 'npmTest.same', true);
st('R5', '시험 스크립트와 tests/*.test.js 를 하나씩 돌린 결과(실패 집합·꼬리 글자)가 기준과 같다.', M, 'testsEach.sameAsBase', true);
st('R5', '작업 트리에서만 깨지는 시험 파일이 없다.', M, 'testsEach.onlyWork', []);
st('R5', '모듈 가드 종료 코드.', M, 'moduleGuard.exitCode', 0);
st('R5', '무결성 게이트 종료 코드.', M, 'integrityGate.exitCode', 0);
st('R5', '바뀐 제품 파일은 index.html 과 새 세포 파일 둘뿐이다.', M, 'changed.productFilesAreIndexAndNewCells', true);
st('R5', 'tests/ 아래 바뀐 파일이 없다.', M, 'changed.testsChanged', []);
st('R5', '금고 아래 바뀐 파일이 없다.', M, 'changed.vaultChanged', []);
st('R5', '생성기·검사기 파일 변경이 없다.', M, 'changed.generatorChanged', []);
st('R5', '생성 지도 3종 변경이 없다.', M, 'changed.mapsChanged', []);
st('R5', '상태 기관·통로·등록 기관 파일 변경이 없다.', M, 'changed.organChanged', []);
st('R5', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화.', M, 'metrics.delta', m.metrics.delta);
st('R5', '탭 간 직접 참조 수(기준 · 작업).', M, 'metrics.crossTabRefs', m.metrics.crossTabRefs);
st('R5', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다(module-guard --update 로 기록).', M, 'baseline.recordedEqualsMeasured', true);
// R6 남은 것
st('R6', 'finalize 전제를 막는 최상위 문 수(이 PR 을 반영한 index.html — 생성기 finalize 가 임시 사본에서 낸 수와 같다).', G, 'totals.blockingStatements', gap.totals.blockingStatements);
st('R6', '그 문들이 차지하는 줄 수.', G, 'totals.blockingLines', gap.totals.blockingLines);
st('R6', 'finalize 가 받는 문(손잡이 · 구역 함수 가져오기 · 구역 함수 호출문) 수.', G, 'totals.allowedStatements', gap.totals.allowedStatements);
st('R6', '생성기 finalize 를 임시 사본에 돌리면 전제 미충족으로 멈춘다(부팅 파일을 쓰지 않는다).', G, 'generator.wroteBootFile', false);
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(WORK, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.file + ' ' + c.check.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(c.check.equals) + ')'); process.exit(1); } }
const t = m.prefixOnly.totals;
const out = { task: 'TASK-ES-676', requirementsSource: 'docs/specs/REQ-TASK-ES-676-REGION-2.md',
  requirements: [
    { id: 'R1', text: 'index.html 인라인 IIFE 에 남은 로드 시점 문 ' + t.statements + '개(상태 기관 정의 줄 · window 대입 줄)를 생성기 region 으로 구역 함수 ' + t.regions + '개(새 세포 둘)로 옮기고 원래 자리에 부르는 한 줄씩 남긴다. 게스트 화면의 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '바꾸는 글자는 통로 접두 L. 뿐이다. 서버 주소·공개 키 선언과 서버 연결 객체 정의 줄은 옮기지 않는다(그 줄들은 index.html 에 바이트 그대로 남는다). index.html 은 구역 줄이 부르는 줄로 바뀌고 머리 가져오기 줄·script 태그가 더해진 것 말고 그대로다.' },
    { id: 'R3', text: '옮긴 문은 같은 자리·같은 순서로 돈다: 상태 기관에 이름이 맡겨지는 순간과 window 대입의 순간이 다른 모든 정의·노출·대입과의 앞뒤 관계에서 기준과 같다.' },
    { id: 'R4', text: '옮긴 이름의 값 · 접근자 종류 · 주인 · window 복사가 기준과 같고, 통로에서 사라지거나 새로 생긴 이름이 없다.' },
    { id: 'R5', text: '증명 하한: 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩 동일 · 모듈 가드·무결성 게이트 통과 · tests·금고·생성기·생성 지도·기관 파일 변경 0 · 기준선에 줄어든 인라인 줄 수 기록(DIR-003).' },
    { id: 'R6', text: 'finalize 전제까지 남은 것을 문 종류별 문 수·줄 수와 풀리는 조건으로 다시 재서 보고 파일로 남긴다.' } ],
  outOfScopeReports: [
    { text: '탐침(시점 · 손잡이 · 상태 · 대조)은 게스트로 띄운 임시 브라우저의 작업자 PC 측정이다. 법정이 그 탐침을 다시 돌린 것은 아니다. 로그인 뒤에만 도는 길(서버 피드가 피드 캐시를 채우는 것 · 구글 캘린더 연동 뒤 토큰 저장)은 재지 못했다 — 그 값을 맡기는 정의 줄과 window 대입 줄이 같은 때 같은 값으로 도는 것까지만 쟀다.', cannotBecause: 'out-of-scope-feature' },
    { text: '서버 주소 · 공개 키 선언과 서버 연결 객체(sb) 정의 줄은 옮기지 못했다. 공개 키 글자가 든 줄을 새 파일에 더하는 커밋을 금지 패턴 규칙(docs/rules/rules.json 의 HARDCODED_SECRET — 대상 파일 전부)이 막는다. 처음에는 셋을 한 구역(bootServerClient)으로 옮겨 측정까지 마쳤으나 커밋 훅이 막아 그 구역을 설정에서 빼고 전부 다시 쟀다. 규칙은 고치지 않았다(금고). 이 줄들을 index.html 밖으로 옮기려면 그 규칙의 예외나 키를 두는 자리에 대한 결심이 필요하다.', cannotBecause: 'out-of-scope-feature' },
    { text: '처음(3c9b9335)의 모의 적용에서 시험·가드에 붙잡혔던 두 문(닫기 단추 btnAvLvClose 정의 줄 · window.SHARED_GROUPS_LOADED 대입 줄)은 #944(시험 단언 넓히기) · #945(모듈 가드의 주인 규칙) 병합 뒤 f227a756 의 모의 적용에서 다시 재니 깨지는 시험·가드가 없어 옮겼다. 이 PR 은 시험·가드를 고치지 않았다.' },
    { text: 'window.saveGoogleToken 대입 블록은 옮겼다. tests/gcal-login-reconnect-fix.test.js 는 index.html 과 세포를 합친 글에서 그 배선을 찾으므로 깨지지 않았다(기준과 같은 결과). 이 대입은 등록 기관이 이미 window 에 다는 이름을 한 번 더 다는 줄이다 — 지우는 것은 이 PR 의 몫이 아니다.' },
    { text: '구역 본문의 앞 주석(다른 작업의 자리 표지 주석 · 구획 주석 둘 · 빈 줄)이 생성기 규칙(구역 안 주석은 따라간다)으로 세포 본문에 글자 그대로 함께 갔다.' },
    { text: '팀 개설 시나리오(r5)는 게스트가 이 브라우저 안에서만 팀을 만드는 조작이다(서버 연결 객체가 null 이라 서버로 가지 않는다).' },
    { text: 'state · _promptEncyclopediaOpen 선언은 이 PR 의 대상이 아니다(아직 var 선언이라 상태 이전이 먼저다 — 임시 사본에서 생성기 unstate 가 둘 다 받는 것까지만 확인했다).', cannotBecause: 'out-of-scope-feature' },
    { text: '알고 넘어가는 차이: 재철거 2차(#943)가 지운 통로 getter 하나(daysFromNow)를 생성기가 index.html 머리에 다시 달았다(expose 문 3줄 — 구역 본문이 통로로 읽는 이름인데 index.html 에 getter 가 없으면 단다). 값 지문은 같고 통로의 이름 수도 그대로지만, 그 이름의 접근자 종류(data → get)와 주인 표시(comm/sample-data → index.html)가 바뀐다. 다음 재철거가 지운다. 숨기지 않고 주장에 이름 목록으로 적었다.' } ],
  claims };
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
let errs = null; try { errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' }); } catch (e) { errs = '검증기 호출 실패: ' + (e && e.message); }
const by = {}; claims.forEach(c => { const k = c.req + ':' + c.kind; by[k] = (by[k] || 0) + 1; });
console.log('claims', claims.length, JSON.stringify(by), 'errors', JSON.stringify(errs));
