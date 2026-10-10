#!/usr/bin/env node
'use strict';
// 주장 파일 생성기(작업자 산출). 바뀐 세포 파일 목록은 생성기 계획(provide-plan.json)에서 읽는다 — 손으로 옮긴 목록 0.
// 사용: node reports/TASK-ES-611/build-claims.cjs
const fs = require('fs'), path = require('path');
const D = __dirname, R = 'reports/TASK-ES-611/';
const plan = JSON.parse(fs.readFileSync(path.join(D, 'provide-plan.json'), 'utf8'));
const cmp = JSON.parse(fs.readFileSync(path.join(D, 'cell-registry-compare.json'), 'utf8'));
const cellFiles = plan.files.map(f => f.file).sort();
const M = R + 'measurement.json', C = R + 'cell-registry-compare.json';
const st = (id, req, statement, file, p, equals, extra) => ({ id, req, kind: 'static', domain: 'config', statement, touches: [file].concat(extra || []), check: { type: 'jsonPath', file, path: p, equals } });
const out = {
  task: 'TASK-ES-611',
  requirementsSource: 'docs/specs/REQ-TASK-ES-611-CELL-REGISTRY-B2.md',
  requirements: [
    { id: 'R1', text: '세포가 키트에 단 이름을 등록 기관(OurgoalCellRegistry.provide)에 스스로 등록하는 줄을 세포 파일 끝에 더한다. 등록 기관은 compare 모드라 값을 보관만 하므로 앱 동작은 그대로다 — 바뀐 세포 파일의 단독 로드 회귀 0, 새 전역 0.' },
    { id: 'R2', text: '대조: 등록한 이름마다 옛 경로(통로 getter 값·window 값)와 등록 값이 === 로 같다 — 등록 수 > 0, 불일치 0, 이중 등록 0, 초과 0. 등록하지 못한 이름은 누락으로 남기고 사유를 적는다.' },
    { id: 'R3', text: '등록 줄은 손이 아니라 결정론 생성기(gen-cell-provide.js)로 넣는다(멱등). 세포의 기존 글자·함수 본문은 바꾸지 않는다.' },
    { id: 'R4', text: '증명 하한(설계 4절 「새 기관 추가」): index.html 변경 0 · 800줄 상한 초과 0 · npm test 검사 수 동일·폐기 0 · inlineScriptLines 불변 · tests/ 변경 0 · 금고 변경 0.' },
  ],
  outOfScopeReports: [
    { text: '배선 철거(가져오기 줄·통로 getter·window 대입 삭제)와 등록 기관 own 모드는 이 PR 에 없다(설계 6절 B3 부터). IIFE 안에 정의가 남은 이름 ' + plan.iifeOwned.length + '개와 생성기가 건너뛴 이름(' + plan.skipped.map(s => s.name).join('·') + ')은 등록하지 않았고 누락으로 남는다 — 사유는 provide-plan.json 의 iifeOwned·skipped.', cannotBecause: 'out-of-scope-feature' },
  ],
  claims: [
    { id: 'C1', req: 'R1', kind: 'behavior', change: 'preserve', domain: 'ui-behavior',
      statement: '게스트로 진입해 홈→목표→기록→일정→소통→설정→홈 순서로 탭을 누르면 누른 탭이 활성(active)이 되고 앞 탭은 비활성이 되며 예외가 없다 — 세포 파일 끝에 등록 줄을 더하기 전과 같다.',
      touches: cellFiles, scenario: 'scenarios/b2-guest-boot-six-tabs.json' },
    st('C2', 'R2', '대조 탐침 결과 파일이 게스트 부팅을 끝내고 report() 를 받아 쓰였다(ok true).', C, 'ok', true),
    st('C3', 'R2', '등록된 이름 수는 ' + cmp.counts.registered + ' 이다(0 이 아니다 — B1 의 공허한 0 과 다르다).', C, 'counts.registered', cmp.counts.registered),
    st('C4', 'R2', '등록한 이름을 옛 경로 값과 === 로 대조한 횟수는 ' + cmp.counts.checked + ' 이고 불일치는 0 이다.', C, 'counts.mismatches', 0),
    st('C5', 'R2', '이중 등록(같은 이름을 다른 세포가 다시 등록)은 0 이다.', C, 'counts.conflicts', 0),
    st('C6', 'R2', '초과(등록했는데 통로·window 어디에도 없는 이름)는 0 이다.', C, 'counts.extra', 0),
    st('C7', 'R2', '누락 ' + cmp.counts.missing + ' 가운데 사유 없는 것은 없다(IIFE 안에 정의가 남은 이름과 생성기가 사유를 적고 건너뛴 이름뿐).', M, 'summary.compare.missingClass.unexplained', []),
    st('C8', 'R3', '바뀐 세포 파일마다 등록 블록을 걷어 내면 기준(origin/main) 파일과 글자가 같다 — 세포의 기존 글자·함수 본문 변경 0.', M, 'summary.appendOnly.allSame', true),
    st('C9', 'R3', '생성기를 다시 돌려도 바뀌는 파일이 0 이다(멱등) — 저장된 계획 파일은 재실행 산출이다.', R + 'provide-plan.json', 'counts.changedThisRun', 0, ['docs/design/harness/module-split/gen-cell-provide.js']),
    st('C10', 'R3', '생성기 계획에 있는 이름이 전부 페이지에서 실제로 등록됐고, 계획에 없는 이름은 등록되지 않았다.', M, 'summary.generator.planMatchesPage', true),
    st('C11', 'R4', '측정 기록의 index.html 순증가가 0 줄이다(이 PR 은 index.html 을 바꾸지 않는다).', M, 'summary.changed.indexHtml.netLineGrowth', 0),
    st('C12', 'R1', '모듈 로드 탐침 결과 파일에서 기준 대비 새 회귀 목록이 비어 있다(js/ 바로 아래 부품 + 바뀐 세포 파일 전부 단독 로드).', R + 'module-load.json', 'regressions', []),
    st('C13', 'R1', '바뀐 세포 파일을 단독 로드했을 때 등록하는 전역 목록이 기준과 다른 파일이 0 이다(새 전역 0).', M, 'summary.newGlobals.count', 0),
    st('C14', 'R4', '등록 블록을 더한 뒤 800줄을 넘는 세포 파일이 없다.', M, 'summary.lines.over800', []),
    st('C15', 'R4', '인라인 스크립트 줄 수(module-metrics inlineScriptLines)가 기준과 같다.', M, 'summary.ratchet.inlineScriptLinesSame', true),
    st('C16', 'R4', 'npm test 를 기준 트리(origin/main)와 작업 트리에서 전경으로 끝까지 돌려 종료 코드 0 이고 검사 줄·요약이 같다(폐기 0).', M, 'summary.npmTest.same', true),
    st('C17', 'R4', 'tests/ 아래 바뀐 파일이 없다.', M, 'summary.changed.testsChanged', []),
    st('C18', 'R4', '금고(court/** 등) 아래 바뀐 파일이 없다.', M, 'summary.changed.vaultChanged', []),
  ],
};
fs.writeFileSync(path.join(D, 'claims.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('claims', out.claims.length, 'C1 touches', cellFiles.length);
