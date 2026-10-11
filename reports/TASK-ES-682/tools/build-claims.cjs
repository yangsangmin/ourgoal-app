#!/usr/bin/env node
'use strict';
// 주장 파일(reports/TASK-ES-682/claims.json)을 만든다. 값은 측정 파일의 경로로만 건다(손으로 옮기지 않는다). 사용: node build-claims.cjs <작업 트리>
const fs = require('fs'), path = require('path');
const WORK = path.resolve(process.argv[2] || '.');
const R = 'reports/TASK-ES-682/';
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
st('R2', '되짚기: 기준 index.html 에서 구역 줄을 빼고 부르는 줄·머리 줄·script 태그 줄을 넣은 것이 작업 index.html 과 줄 단위로 같다.', P, 'replay.rebuiltEqualsWork', true);
st('R2', '머리에 더한 가져오기 줄이 설정의 이름·키트 변수로 만든 글자와 같다.', P, 'replay.headImportsEqualExpected', true);
st('R2', 'script 태그 줄에서 새 세포의 태그 글자를 빼면 기준 줄과 같다.', P, 'replay.tagLineIsBasePlusNewTags', true);
st('R2', '생성기가 index.html 머리에 단 통로 getter 의 이름 목록 — 구역 본문이 통로로 읽는 이름 가운데 index.html 에 getter 가 없던 것(등록 기관이 이미 통로에 내주는 이름이다. 다음 재철거가 지운다).', M, 'generator.exposed', m.generator.exposed);
// R3 시점
st('R3', '부팅 동안의 사건 줄(상태 기관 정의 · 통로 노출 · window 대입)과 사건마다의 통로 이름 수가, 생성기가 다시 단 getter 를 통로에 다는 사건을 빼면 기준과 작업에서 글자 그대로 같다.', M, 'order.sameAsBaseExceptNewGetterExpose', true);
st('R3', '기준에서 두 번 잰 사건 줄이 서로 같다(본질 변동 없음).', M, 'order.baseRepeatSame', true);
st('R3', '작업 쪽에 더 있는 사건 수.', M, 'order.newGetterExpose.extraEvents', m.order.newGetterExpose.extraEvents);
st('R3', '작업 트리에서 state 정의 사건의 자리(0부터).', M, 'order.indexOf.work.state', m.order.indexOf.work.state);
st('R3', '작업 트리에서 window.state 대입 사건의 자리(0부터) — state 정의(와 그 정의가 통로에 다는 사건) 바로 뒤다.', M, 'order.indexOf.work.windowState', m.order.indexOf.work.windowState);
// R4 값
st('R4', '상태 객체 탐침(앱 상태 객체의 동일성 · 통째 대입 왕복 · 템플릿 부품의 getState · 프롬프트 서랍 접힘 값을 읽고 쓰는 세포 함수)의 기록이 기준과 작업에서 통째로 같다(주인 표시·기관 종류 포함).', M, 'stateObject.sameAsBase', true);
st('R4', '상태 객체 탐침을 기준에서 두 번 돌린 기록이 서로 같다.', M, 'stateObject.baseRepeatSame', true);
st('R4', '작업 트리에서 통로의 state · window.state · 템플릿 부품의 getState() 가 같은 객체다.', M, 'stateObject.state.sameObjectEverywhereWork', true);
st('R4', '작업 트리에서 state 를 통째로 다시 대입하는 왕복이 된다(통로·getState 는 새 객체, window.state 는 예전 객체, 되돌림).', M, 'stateObject.state.reassignWorkOk', true);
st('R4', '작업 트리에서 프롬프트 서랍 접힘 값이 처음에 false 이고, 읽는 그리기 함수와 쓰는 단추 처리기가 돈다.', M, 'stateObject.promptOpen.workOk', true);
st('R4', '상태 탐침에서 통로 값 요약 · 접근자 · 주인 · window 복사 동일성 · 쓰기 왕복이 기준과 다른 이름은, 생성기가 getter 를 다시 단 이름 말고는 없다(기준을 두 번 재도 다른 이름은 뺐다).', M, 'stateProbe.differingBeyondRegrownGetter', []);
st('R4', 'getter 가 다시 달려 접근자 종류·주인 표시가 달라진 이름 목록(상태 탐침에 넣은 이름 가운데).', M, 'stateProbe.differingRegrownGetter', m.stateProbe.differingRegrownGetter);
st('R4', '상태 기관이 맡은 이름 목록이 기준과 같다.', M, 'stateProbe.organNamesSame', true);
st('R4', '통로 이름의 값 지문이 기준과 다른 이름이 없다.', M, 'fingerprints.scopeDiff', []);
st('R4', 'window 이름의 값 지문이 기준과 다른 이름이 없다.', M, 'fingerprints.windowDiff', []);
st('R4', '통로에서 사라진 이름이 없다.', M, 'fingerprints.scopeLost', []);
st('R4', '통로에 새로 생긴 이름이 없다.', M, 'fingerprints.scopeAdded', []);
// R5 증명 하한
st('R5', '모듈 로드 탐침의 새 회귀 수.', M, 'moduleLoad.regressions', 0);
st('R5', '새 세포 파일이 단독으로 로드된다.', M, 'moduleLoad.newFilesLoadOneOk', true);
st('R5', 'npm test 가 기준 트리와 작업 트리에서 종료 코드 0 이고 검사 줄 수·요약 줄이 같다.', M, 'npmTest.same', true);
st('R5', '시험 스크립트와 tests/*.test.js 를 하나씩 돌린 결과(실패 집합·꼬리 글자)가 기준과 같다.', M, 'testsEach.sameAsBase', true);
st('R5', '모듈 가드 종료 코드.', M, 'moduleGuard.exitCode', 0);
st('R5', '무결성 게이트 종료 코드(프롬프트 서랍 접힘 값의 정의 줄이 세포로 간 뒤).', M, 'integrityGate.exitCode', 0);
st('R5', '바뀐 제품 파일은 index.html 과 새 세포 파일뿐이다.', M, 'changed.productFilesAreIndexAndNewCells', true);
st('R5', 'tests/ 아래 바뀐 파일이 없다.', M, 'changed.testsChanged', []);
st('R5', '금고 아래 바뀐 파일이 없다.', M, 'changed.vaultChanged', []);
st('R5', '생성기·검사기 파일 변경이 없다.', M, 'changed.generatorChanged', []);
st('R5', '생성 지도 3종 변경이 없다.', M, 'changed.mapsChanged', []);
st('R5', '상태 기관·통로·등록 기관 파일 변경이 없다.', M, 'changed.organChanged', []);
st('R5', '이 작업의 측정 기록에서 인라인 스크립트 줄 수 변화(늘었다 — 한 줄짜리 문이 부르는 줄 + 가져오기 줄로 바뀌고 getter 가 다시 달려서다. 사유를 적어 기준선에 올렸다).', M, 'metrics.delta', m.metrics.delta);
st('R5', '기준선 마지막 기록의 인라인 스크립트 줄 수가 측정값과 같다(module-guard --update --reason 으로 기록).', M, 'baseline.recordedEqualsMeasured', true);
// R6 남은 것
st('R6', 'finalize 전제를 막는 최상위 문 수(이 PR 을 반영한 index.html — 생성기 finalize 가 임시 사본에서 낸 수와 같다).', G, 'totals.blockingStatements', gap.totals.blockingStatements);
st('R6', '그 문들이 차지하는 줄 수.', G, 'totals.blockingLines', gap.totals.blockingLines);
st('R6', 'finalize 가 받는 문(손잡이 · 구역 함수 가져오기 · 구역 함수 호출문) 수.', G, 'totals.allowedStatements', gap.totals.allowedStatements);
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
for (const c of claims) { if (c.kind !== 'static') continue; const v = getPath(JSON.parse(fs.readFileSync(path.join(WORK, c.check.file), 'utf8')), c.check.path); if (JSON.stringify(v) !== JSON.stringify(c.check.equals)) { console.error(c.id + ' 값 불일치: ' + c.check.file + ' ' + c.check.path + ' = ' + JSON.stringify(v) + ' (기대 ' + JSON.stringify(c.check.equals) + ')'); process.exit(1); } }
const t = m.prefixOnly.totals;
const out = { task: 'TASK-ES-682', requirementsSource: 'docs/specs/REQ-TASK-ES-682-REGION-3.md',
  requirements: [
    { id: 'R1', text: '상태 이전 4차가 남긴 상태 기관 정의 줄 ' + t.statements + '개(state · _promptEncyclopediaOpen)를 생성기 region 으로 구역 함수 ' + t.regions + '개(새 세포 하나)로 옮기고 원래 자리에 부르는 한 줄씩 남긴다. 게스트 화면의 동작을 보존한다(손 편집 0).' },
    { id: 'R2', text: '바꾸는 글자는 통로 접두 L. 뿐이다. index.html 은 구역 줄이 부르는 줄로 바뀌고 머리 가져오기 줄·script 태그·(생성기가 다는) 통로 getter 가 더해진 것 말고 그대로다.' },
    { id: 'R3', text: '옮긴 문은 같은 자리·같은 순서로 돈다: state 가 상태 기관에 맡겨지는 순간과 바로 다음 window.state 대입의 순서가 기준과 같다.' },
    { id: 'R4', text: '옮긴 이름의 값 · 접근자 종류 · 주인 · window 복사가 기준과 같고, 통로에서 사라지거나 새로 생긴 이름이 없다.' },
    { id: 'R5', text: '증명 하한: 모듈 로드 새 회귀 0 · npm test 와 시험 하나씩 동일 · 모듈 가드·무결성 게이트 통과 · tests·금고·생성기·생성 지도·기관 파일 변경 0 · 기준선 기록.' },
    { id: 'R6', text: 'finalize 전제까지 남은 것을 문 종류별 문 수·줄 수와 풀리는 조건으로 다시 재서 보고 파일로 남긴다.' } ],
  outOfScopeReports: [
    { text: '탐침(시점 · 상태 객체 · 상태 · 대조)은 게스트로 띄운 임시 브라우저의 작업자 PC 측정이다. 법정이 그 탐침을 다시 돌린 것은 아니다. 로그인 뒤 화면은 재지 못했다.', cannotBecause: 'out-of-scope-feature' },
    { text: '알고 넘어가는 차이 ①: 이 PR 은 인라인 스크립트 줄 수를 줄이지 않고 늘린다. 한 줄짜리 정의 문은 부르는 줄 + 가져오기 줄이 되고, 구역 본문이 통로로 읽는 이름의 getter(expose 문 3줄)가 다시 달린다. 대신 finalize 가 받지 않는 문(상태 정의 줄)이 받는 문(구역 함수 가져오기·호출)으로 바뀐다. 기준선은 사유를 적어 올렸다(module-guard --update --reason).' },
    { text: '알고 넘어가는 차이 ②: 재철거가 지운 통로 getter 를 생성기가 index.html 머리에 다시 달았다(이름은 주장의 목록). 값 지문은 같고 통로의 이름 수도 그대로지만 그 이름의 접근자 종류와 주인 표시가 바뀐다. 다음 재철거가 지운다.' },
    { text: 'sweep 적용 조사(reports/TASK-ES-682/sweep-survey.json)는 저장소 밖 모의본에서 한 조사다. 이 PR 은 sweep 을 하지 않는다.' },
    { text: '서버 주소·공개 키 선언과 sb 정의 줄은 이 PR 의 대상이 아니다(결심 대기).', cannotBecause: 'out-of-scope-feature' } ],
  claims };
fs.writeFileSync(path.join(WORK, R, 'claims.json'), JSON.stringify(out, null, 2) + '\n', { encoding: 'utf8' });
let errs = null; try { errs = require(path.join(WORK, 'court', 'claims.js')).validateClaims(out, { claimsFile: R + 'claims.json' }); } catch (e) { errs = '검증기 호출 실패: ' + (e && e.message); }
const by = {}; claims.forEach(c => { const k = c.req + ':' + c.kind; by[k] = (by[k] || 0) + 1; });
console.log('claims', claims.length, JSON.stringify(by), 'errors', JSON.stringify(errs));
