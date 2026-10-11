#!/usr/bin/env node
'use strict';
// #TASK-ES-620 주장 파일 생성기 — reports/TASK-ES-620/claims.json 을 측정 파일에서 만든다(값을 손으로 옮기지 않는다).
//   글자 확인 주장: 바뀐 시험 파일마다 하나(그 파일의 넓힌 호출 글자) + 새 도우미 · 도우미 자체 시험 · npm test 경로에 넣은 줄
//   기록 주장: 측정 파일의 값(config 분야 — 경험칙 L051). 값은 그 파일에서 읽어 equals 에 넣는다.
//   retire: 법정이 기준 시험지로 삼는 파일(scripts/smoke-test.js · scripts/test-calendar-attachments.js)의 바뀐 검사를 검사 제목별로(폐기가 아니라 넓힘 — court/README.md 5절 「지우거나 고친 검사」)
// 사용: node reports/TASK-ES-620/build-claims.cjs <작업 폴더>
const fs = require('fs'), path = require('path');
const WT = path.resolve(process.argv[2] || '.'), TASK = 'TASK-ES-620', DIR = path.join(WT, 'reports', TASK), REL = 'reports/' + TASK + '/';
const REQ = 'docs/specs/REQ-TASK-ES-620-WIRING-TEXT-TESTS.md';
const rj = f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const CH = rj('changed-assertions.json'), M = rj('measurement.json'), BR = rj('broken-assertions.json'), CG = rj('control-group.json'), WS = rj('window-text-scan.json');
const APPROVAL = '상민님 2026-10-11 「2. 철거 2차 사전 승인, 금고 변경 승인」(원문은 ' + REQ + ' 0절)';
const get = (o, p) => p.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o);

const requirements = [
  { id: 'R1', text: '시험이 옛 배선 글자(window.X = X;)를 붙잡는 단언을 측정으로 전수 조사한다 — 배선을 전부 지운 저장소 밖 사본에서 실제로 깨지는 단언을 파일·줄·단언 글자·붙잡는 이름 단위로.' },
  { id: 'R2', text: '깨지는 단언을 「그 이름이 실제로 노출된다」는 원래 목적 그대로, 옛 배선 글자와 새 등록 방식(OurgoalCellRegistry.provide) 둘 다 받아들이게 넓힌다. 검사 수는 줄이지 않고 폐기는 0 이다(상민님 「금고 변경 승인」).' },
  { id: 'R3', text: '넓힌 단언이 가짜로 통과하지 않음을 보인다 — 공용 도우미 자체 시험과, 등록을 일부러 깨뜨린 대조군.' },
  { id: 'R4', text: '현재 main 과 모의 철거 사본에서 고치기 전·후 시험지의 종료 코드·검사 수를 재서 싣는다(작업자 측정, 판정 아님).' },
  { id: 'R5', text: '제품 코드·생성기·법정·헌법·지시함은 바꾸지 않고, 금고 파일(scripts/verify-integrity-gate.js)은 별도 PR(TASK-ES-623)로 올리며, 고치지 않고 남긴 단언(정의 글자·미등록 이름)은 목록으로 보고한다.' },
];
const claims = [];
let n = 0;
const add = (req, statement, touches, check) => claims.push({ id: 'C' + (++n), req, kind: 'static', domain: 'config', statement, touches, check });
const text = (file, t) => { const src = fs.readFileSync(path.join(WT, file), 'utf8'); if (!src.includes(t)) throw new Error('글자 없음: ' + file + ' :: ' + t); return { type: 'codeContains', file, text: t }; };
const json = (f, p) => { const v = get(rj(f), p); if (v === undefined) throw new Error('값 없음: ' + f + ' ' + p); return { type: 'jsonPath', file: REL + f, path: p, equals: v }; };
const CALL = /((?:WIRING|require\((['"])\.{1,2}\/(?:tests\/)?helpers\/wiring-exposed\2\))\.(?:windowExposed|exposureEnd)\([^)]*\))/;

// 바뀐 시험 파일마다: 그 파일의 첫 넓힌 호출 글자
const byFile = {};
for (const r of CH.changed) (byFile[r.file] = byFile[r.file] || []).push(r);
for (const file of Object.keys(byFile).sort()) {
  const rows = byFile[file], m = CALL.exec(rows[0].after);
  if (!m) throw new Error('넓힌 호출을 읽지 못함: ' + file);
  const names = [...new Set(rows.map(r => r.name))];
  add('R2', file + ' 의 배선 글자 단언 ' + rows.length + '줄이 도우미(옛 배선 글자 또는 등록)를 거친다 — 붙잡는 이름 ' + names.join(' · '), [file], text(file, m[1]));
}
add('R2', '공용 도우미 tests/helpers/wiring-exposed.js 의 window 판정은 「옛 배선 글자가 있다 또는 등록으로 window 에 나간다」 한 식이다.', ['tests/helpers/wiring-exposed.js'], text('tests/helpers/wiring-exposed.js', 'return String(source).includes(legacyText) || registeredOnWindow(w.name, w.from, root);'));
add('R2', '도우미는 등록 블록을 파서로 읽는다(글자 긁기 아님).', ['tests/helpers/wiring-exposed.js'], text('tests/helpers/wiring-exposed.js', "parserMod = require('@babel/parser');"));
add('R3', '도우미 자체 시험 tests/wiring-exposed.test.js 가 「배선도 등록도 없는 이름은 거짓」을 잰다.', ['tests/wiring-exposed.test.js'], text('tests/wiring-exposed.test.js', "t('배선도 등록도 없는 이름은 거짓'"));
add('R3', '도우미 자체 시험이 「값은 등록됐는데 window 목록에 없으면 거짓」을 잰다.', ['tests/wiring-exposed.test.js'], text('tests/wiring-exposed.test.js', "t('값은 등록됐는데 window 목록에 없으면 window 단언은 거짓'"));
add('R3', '도우미 자체 시험이 「index.html 이 읽지 않는 세포 파일의 등록은 등록이 아니다」를 잰다.', ['tests/wiring-exposed.test.js'], text('tests/wiring-exposed.test.js', "t('엉뚱한 세포 파일: index.html 이 읽지 않는 파일의 등록은 등록이 아니다'"));
add('R3', '도우미 자체 시험이 npm test 경로(scripts/test-shipyard-modular.js)에서 돈다.', ['scripts/test-shipyard-modular.js'], text('scripts/test-shipyard-modular.js', "runNode('tests/wiring-exposed.test.js');"));

// 기록 주장(측정 파일의 값)
const rec = (req, statement, f, p) => add(req, statement, [REL + f], json(f, p));
rec('R1', '조사 기록: 고치기 전 시험지로 모의 철거 사본에서만 실패하는 단언 줄 수가 적혀 있다.', 'broken-assertions.json', 'summary.brokenAssertLines');
rec('R1', '조사 기록: 그 단언들이 붙잡는 이름 수가 적혀 있다.', 'broken-assertions.json', 'summary.nameCount');
rec('R1', '조사 기록: 단언 꼴별 수(문자열 includes · indexOf · 정규식)가 적혀 있다.', 'broken-assertions.json', 'summary.byForm');
rec('R1', '조사 기록: 붙잡는 이름을 읽지 못한 단언 줄 수가 적혀 있다.', 'broken-assertions.json', 'summary.unread');
rec('R1', '조사 기록: 모의 철거 뒤 등록됐는데 배선이 남은 이름 수가 적혀 있다.', 'measurement.json', 'summary.mock-unwire-all.registeredStillWired');
rec('R2', '변경 기록: 바꾼 시험 줄 수가 적혀 있다.', 'changed-assertions.json', 'summary.changedLines');
rec('R2', '변경 기록: 지우기만 한 시험 줄 수가 적혀 있다.', 'changed-assertions.json', 'summary.removedOnly');
rec('R2', '변경 기록: 바꾼 줄마다 옛 배선 글자가 그대로 남아 있는지가 적혀 있다.', 'changed-assertions.json', 'summary.legacyTextKeptAll');
rec('R3', '대조군 기록: 다섯 변형 모두 새로 실패한 줄이 기대한 줄과 같은지가 적혀 있다.', 'control-group.json', 'summary.allAsExpected');
rec('R3', '대조군 기록: 변형 수가 적혀 있다.', 'control-group.json', 'summary.variants');
rec('R4', '측정 기록: 현재 main · 고치기 전 시험지의 npm test 종료 코드.', 'measurement.json', 'summary.compare.mainNpmTestExitBefore');
rec('R4', '측정 기록: 현재 main · 고친 시험지의 npm test 종료 코드.', 'measurement.json', 'summary.compare.mainNpmTestExitAfter');
rec('R4', '측정 기록: 현재 main · 고치기 전 시험지의 npm test ✓ 줄 수.', 'measurement.json', 'summary.compare.mainCheckLinesBefore');
rec('R4', '측정 기록: 현재 main · 고친 시험지의 npm test ✓ 줄 수.', 'measurement.json', 'summary.compare.mainCheckLinesAfter');
rec('R4', '측정 기록: 현재 main 에서 고친 시험지로 새로 실패한 시험 파일 목록.', 'measurement.json', 'summary.compare.mainTestFilesNewlyFailedAfter');
rec('R4', '측정 기록: 모의 철거 사본 · 고치기 전 시험지의 smoke-test 실패 검사 수.', 'measurement.json', 'summary.compare.mockSmokeFailsBefore');
rec('R4', '측정 기록: 모의 철거 사본 · 고친 시험지의 smoke-test 실패 검사 수.', 'measurement.json', 'summary.compare.mockSmokeFailsAfter');
rec('R4', '측정 기록: 모의 철거 사본 · 고친 시험지의 smoke-test ✓ 줄 수.', 'measurement.json', 'summary.compare.mockSmokeCheckLinesAfter');
rec('R4', '측정 기록: 모의 철거 사본에서 고친 시험지로 실패한 시험 파일 목록이 현재 main 과 같은지.', 'measurement.json', 'summary.compare.mockAfterFailedTestFilesSameAsMainAfter');
rec('R4', '측정 기록: 고친 시험지에서 모의 철거 사본에서만 실패하는 단언 줄 수(남은 것 — 짝 PR 의 금고 파일 줄).', 'measurement.json', 'summary.remaining.main-after__mock-after');
rec('R4', '측정 기록: 두 PR 을 다 얹은 트리에서 모의 철거 사본에서만 실패하는 단언 줄 수.', 'measurement.json', 'summary.remaining.main-both__mock-both');
rec('R4', '측정 기록: 두 PR 을 다 얹은 모의 철거 사본의 npm test 종료 코드.', 'measurement.json', 'summary.compare.bothMockNpmTestExit');
rec('R4', '측정 기록: 법정의 격리 실행 함수로 돌린 smoke-test 의 실패 제목이 「모의 철거 · 고친 시험지」와 「현재 main · 고치기 전」에서 같은지.', 'measurement.json', 'summary.courtSandboxSmokeFailedTitlesSame.mockAfterVsMainBefore');
rec('R5', '남긴 것 기록: 시험 소스의 window 대입 글자 분류별 수가 적혀 있다.', 'window-text-scan.json', 'summary.byClass');
rec('R5', '남긴 것 기록: 미등록 이름 목록이 적혀 있다.', 'window-text-scan.json', 'summary.unregisteredNames');
rec('R5', '범위 기록: 이 변경이 바꾼 제품 파일(index.html · js/) 목록이 적혀 있다.', 'measurement.json', 'changedScope.product');
rec('R5', '범위 기록: 이 변경이 바꾼 금고·법정·헌법·지시함·생성기 파일 목록이 적혀 있다.', 'measurement.json', 'changedScope.vaultCourtConstitutionDirectivesGenerator');

// retire — 검사 제목별(scripts/smoke-test.js), 파일 단위(scripts/test-calendar-attachments.js — check 제목이 없는 시험지)
const retire = [];
const smoke = byFile['scripts/smoke-test.js'] || [];
for (const title of [...new Set(smoke.map(r => r.check))]) {
  const rows = smoke.filter(r => r.check === title);
  retire.push({ file: 'scripts/smoke-test.js', check: title,
    reason: '폐기가 아니라 넓힘이다(검사 수·단언 수 그대로). 이 검사 안의 「index.html 에 옛 배선 글자가 있다」 단언 ' + rows.length + '줄(' + [...new Set(rows.map(r => r.legacyText.trim()))].join(' / ') + ')을 「그 글자가 있거나, 같은 이름·같은 값이 세포의 등록 블록(OurgoalCellRegistry.provide)으로 window 에 나간다」로 넓혔다(tests/helpers/wiring-exposed.js). 옛 글자 갈래는 고치기 전과 같은 식이다. 승인: ' + APPROVAL });
}
const cal = byFile['scripts/test-calendar-attachments.js'] || [];
if (cal.length) retire.push({ file: 'scripts/test-calendar-attachments.js', check: '참고자료 첨부 window 바인딩 단언 ' + cal.length + '줄(이 시험지에는 check 제목이 없다)',
  reason: '폐기가 아니라 넓힘이다(단언 수 그대로). ' + [...new Set(cal.map(r => r.legacyText.trim()))].join(' / ') + ' 글자를 찾던 단언을 「그 글자가 있거나, 같은 이름·같은 값이 세포의 등록 블록으로 window 에 나간다」로 넓혔다(tests/helpers/wiring-exposed.js). 승인: ' + APPROVAL });

// 문장이 법정의 낱말 하한(court/grade-floors.json keywordFloors)에 걸리지 않는지 미리 본다(걸리면 분야가 올라가 글자 확인으로는 부족해진다)
const floors = JSON.parse(fs.readFileSync(path.join(WT, 'court', 'grade-floors.json'), 'utf8'));
for (const c of claims) for (const k of floors.keywordFloors || []) if (new RegExp(k.pattern, 'i').test(c.statement)) throw new Error('문장이 낱말 하한에 걸린다(' + k.label + '): ' + c.id + ' ' + c.statement);

const doc = { task: TASK, requirementsSource: REQ, requirements,
  outOfScopeReports: [
    { text: '금고 파일 scripts/verify-integrity-gate.js 의 같은 꼴 단언 1줄(window.promptNewGoal = promptNewGoal;)은 금고만 담은 별도 PR(TASK-ES-623)로 냈다. 그 PR 이 병합되기 전에는 모의 철거 사본에서 그 한 줄이 계속 실패한다(측정 summary.remaining.main-after__mock-after).' },
    { text: '함수 정의 글자를 붙잡는 단언과, 등록 기관에 등록되지 않은 이름의 배선 글자를 붙잡는 단언은 고치지 않았다(배선 철거가 지우는 줄이 아니다). 목록은 reports/TASK-ES-620/window-text-scan.json.' },
  ],
  claims, retire };
fs.writeFileSync(path.join(DIR, 'claims.json'), JSON.stringify(doc, null, 1) + '\n', 'utf8');
console.log('claims', claims.length, '· retire', retire.length, '· requirements', requirements.length);
