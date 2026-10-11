#!/usr/bin/env node
'use strict';
// 주장 파일 생성기(작업자 산출). 수치는 결과 파일에서 읽는다 — 손으로 옮긴 수치 0.
// 사용: node reports/TASK-ES-614/build-claims.cjs
const fs = require('fs'), path = require('path');
const D = __dirname, R = 'reports/TASK-ES-614/';
const rj = f => JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
const cmp = rj('cell-registry-compare.json'), mock = rj('cell-registry-compare.mock.json'), meas = rj('measurement.json'), plan = rj('unwire-plan.json'), pp = rj('provide-plan.json');
const M = R + 'measurement.json', C = R + 'cell-registry-compare.json', CM = R + 'cell-registry-compare.mock.json';
const st = (id, req, statement, file, p, equals, extra) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(extra || []), check: { type: 'jsonPath', file, path: p, equals } });
// 이 PR 이 바꾼 제품 파일: 등록 기관 · commit 파일 · index.html · windowOnly 칸이 붙은 세포 파일
const winOnlyFiles = [...new Set(pp.registered.filter(r => r.kinds === 'window').map(r => r.file))].sort();
const productFiles = ['index.html', 'js/core/cell-registry.js', 'js/core/cell-registry-commit.js'].concat(winOnlyFiles);
const out = {
  task: 'TASK-ES-614',
  requirementsSource: 'docs/specs/REQ-TASK-ES-614-CELL-REGISTRY-OWN.md',
  requirements: [
    { id: 'R1', text: '등록 기관이 세포가 등록한 이름을 직접 통로(OurgoalAppScope)와 window 에 내준다(own). 적용은 인라인 IIFE 바로 앞 한 번(commit)이며 앱 동작은 그대로다 — 모듈 로드 회귀 0, 새 전역 0, index.html 순증가 0.' },
    { id: 'R2', text: 'own 이 내주는 값이 옛 배선 값과 같다: 등록한 이름 전수 대조에서 own 수 > 0, 불일치 0, 초과 0, 이중 등록 0 이고, 기준 트리와 작업 트리의 이름별 값 지문 차이가 0 이다.' },
    { id: 'R3', text: '옛 배선이 없어도 own 만으로 충분함을 전 키트 모의 철거로 잰다: 저장소 밖 사본에서 현행 생성기 unwire 로 배선을 지운 뒤(시험이 배선 글자를 붙잡는 이름은 남김) 대조·시나리오·모듈 로드·시험이 기준과 같다. 저장소의 실제 철거는 0 이고, 철거 계획 파일을 남긴다.' },
    { id: 'R4', text: '증명 하한: tests/ 변경 0 · 금고 변경 0 · 생성기 gen-inline-hard.js 변경 0 · 800줄 상한 초과 0 · inlineScriptLines 불변 · npm test 검사 수 동일·폐기 0.' },
  ],
  outOfScopeReports: [
    { text: '실제 배선 철거는 이 PR 에 없다(B3 부터 — 철거 PR 은 index.html 만 바꾼다). 시험 소스에 배선 글자가 있는 이름 ' + plan.excludedBecauseTestsPinWiringText.count + '개는 철거 계획에서 뺐고 시험은 고치지 않았다(지시함 DIR-004 (다)). 생성기가 멈춘 이름(' + [...new Set(plan.stoppedByGenerator.map(d => d.name).filter(Boolean))].join('·') + ')과 kitVar 꼴 때문에 못 도는 손잡이(' + plan.notRunnableKitVars.map(k => k.kitVar).join('·') + ')는 생성기를 고치지 않고 계획 파일에 사유와 함께 남겼다(설계 5.2 X1·X3).', cannotBecause: 'out-of-scope-feature' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성(active)이 되고 앞 탭은 비활성이 되며 예외가 없다 — 등록 기관이 IIFE 바로 앞에서 이름을 먼저 내주기 전과 같다.',
      touches: productFiles, scenario: 'scenarios/b3a-guest-boot-six-tabs.json' },
    { id: 'C2', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '마크업의 인라인 처리기(onclick="closeAvatarGreetingPopup…" · "switchGoalsSubTab…" · "switchGoalStatPeriod…")가 window 이름으로 불려, 목표 탭에서 하위 탭(개인→루틴→성취통계→개인)과 통계 기간(주간→월간)을 누르면 누른 것이 활성이 되고 앞의 것은 비활성이 되며 예외가 없다 — own 적용 전과 같다.',
      touches: productFiles, scenario: 'scenarios/b3a-inline-handlers-goals.json' },
    st('C3', 'R1', '모듈 로드 탐침 결과에서 기준 대비 작업 트리의 새 회귀 목록이 비어 있다(js/ 바로 아래 부품 + 바뀐 js 파일·새 파일 단독 로드).', R + 'module-load.json', 'work.regressions', []),
    st('C4', 'R1', '바뀐 js 파일을 단독 로드했을 때 등록하는 전역 목록이 기준과 다른 파일이 0 이다(새 전역 0).', M, 'summary.newGlobals.changedFilesGlobalsDiffer', 0),
    st('C5', 'R1', '측정 기록의 index.html 순증가가 0 줄이다(commit 태그는 IIFE 바로 앞 태그 줄 끝에 같은 줄로 붙였다).', M, 'summary.changed.indexHtml.netLineGrowth', 0),
    st('C6', 'R1', 'commit 태그와 인라인 IIFE 사이에 다른 스크립트 태그가 0 개다.', M, 'summary.overlap.tagsBetweenCommitAndIife', 0),
    st('C7', 'R2', '대조 탐침 결과 파일이 게스트 부팅을 끝내고 report() 를 받아 쓰였다(ok true).', C, 'ok', true, ['scripts/probes/cell-registry-compare.js']),
    st('C8', 'R2', '등록 기관이 실제로 내준(own) 이름 수는 ' + cmp.counts.own + ' 이다(0 이 아니다).', C, 'counts.own', cmp.counts.own),
    st('C9', 'R2', '등록한 이름을 통로 값·window 값과 === 로 대조한 횟수는 ' + cmp.counts.checked + ' 이고 불일치는 0 이다.', C, 'counts.mismatches', 0),
    st('C10', 'R2', '초과(등록했는데 통로·window 어디에도 없던 이름)는 0 이다 — window 에만 나가던 이름을 통로에 새로 내주지 않는다.', C, 'counts.extra', 0),
    st('C11', 'R2', '이중 등록은 0 이다.', C, 'counts.conflicts', 0),
    st('C12', 'R2', '기준 트리와 작업 트리에서 통로 이름마다 잰 값 지문의 차이가 0 이다.', M, 'summary.fingerprints.baseVsWork.scope', 0),
    st('C13', 'R2', '기준 트리와 작업 트리에서 window 이름마다 잰 값 지문의 차이가 0 이다.', M, 'summary.fingerprints.baseVsWork.window', 0),
    st('C14', 'R3', '모의 철거 사본(옛 배선을 ' + plan.totals.expectedDeletedLines + '줄 지운 index.html)의 대조에서 불일치는 0 이다(이름 목록은 철거 전 결과로 고정).', CM, 'counts.mismatches', 0),
    st('C15', 'R3', '모의 철거 사본에서 통로에서 사라진 이름이 없다.', CM, 'namesFrom.scopeLost', []),
    st('C16', 'R3', '기준 트리와 모의 철거 사본에서 통로 이름마다 잰 값 지문의 차이가 0 이다.', M, 'summary.fingerprints.baseVsMock.scope', 0),
    st('C17', 'R3', '기준 트리와 모의 철거 사본에서 window 이름마다 잰 값 지문의 차이가 0 이다.', M, 'summary.fingerprints.baseVsMock.window', 0),
    st('C18', 'R3', '모의 철거 사본에서만 실패하는 시험 파일이 없다(tests/ 의 시험 파일을 기준 트리와 사본에서 하나씩 따로 실행해 종료 코드를 맞댐).', M, 'summary.mockUnwire.plan.testFiles.mockOnly', []),
    st('C19', 'R3', '대조군: 같은 모의 철거 사본에서 commit 태그만 빼면 게스트 부팅이 끝나지 않는다(own 적용이 실제로 이름을 내주고 있다).', M, 'summary.mockUnwire.withoutCommit.guestBootOk', false),
    st('C20', 'R3', '철거 계획 파일에 실행 ' + plan.totals.runs + '개가 이름 목록과 함께 있다(B3~B8 입력 — 실제 철거는 이 PR 에 없다).', R + 'unwire-plan.json', 'totals.runs', plan.totals.runs),
    st('C21', 'R4', '바뀐 세포 파일마다 등록 블록 앞 글자가 기준과 같고 블록 뒤에 글자가 없다(블록 안에서만 바뀜).', M, 'summary.cellBlocksOnly.allSame', true),
    st('C22', 'R4', '등록 블록 생성기를 다시 돌려도 바뀌는 파일이 0 이다(멱등).', M, 'summary.provideGenerator.idempotent', true, ['docs/design/harness/module-split/gen-cell-provide.js']),
    st('C23', 'R4', '800줄을 넘는 바뀐 js 파일이 없다.', M, 'summary.lines.over800', []),
    st('C24', 'R4', '인라인 스크립트 줄 수(module-metrics inlineScriptLines)가 기준과 같다(실제 철거 0).', M, 'summary.ratchet.inlineScriptLinesSame', true),
    st('C25', 'R4', 'npm test 를 기준 트리(origin/main)와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).', M, 'summary.npmTest.same', true),
    st('C26', 'R4', 'tests/ 아래 바뀐 파일이 없다.', M, 'summary.changed.testsChanged', []),
    st('C27', 'R4', '금고(court/** 등) 아래 바뀐 파일이 없다.', M, 'summary.changed.vaultChanged', []),
    st('C28', 'R4', '법정이 다시 돌리는 생성기 gen-inline-hard.js 를 바꾸지 않았다.', M, 'summary.changed.generatorInlineHardChanged', []),
  ],
};
fs.writeFileSync(path.join(D, 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', out.claims.length, '· 제품 파일', productFiles.length, '· own', cmp.counts.own, '· 모의 철거 불일치', mock.counts.mismatches, '· 계획 실행', plan.totals.runs, meas.summary.npmTest.same);
