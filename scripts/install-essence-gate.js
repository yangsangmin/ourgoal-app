#!/usr/bin/env node
// 본질 게이트 설치: git 훅 경로 설정 + 자가 점검. 클로드 코드·안티그래비티·코덱스·사람 어느 클론에서든 한 번 실행.
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const run = (c) => execSync(c, { cwd: root, encoding: 'utf8' }).trim();
for (const hook of ['commit-msg', 'pre-commit', 'pre-push']) { try { fs.chmodSync(path.join(root, '.githooks', hook), 0o755); } catch (e) { /* 없는 훅은 건너뛴다 */ } }
run('git config core.hooksPath .githooks');
console.log('✔ core.hooksPath = .githooks');
console.log(run('node scripts/essence-gate.js --self-test'));
for (const f of ['AGENTS.md', 'GEMINI.md', '.agent/rules/essence-gate.md', 'docs/rules/ESSENCE_OURGOAL.md', 'docs/rules/rules.json', 'docs/rules/TICKETS.md', '.github/workflows/essence-gate.yml']) {
  console.log((fs.existsSync(path.join(root, f)) ? '✔ ' : '✖ 누락 ') + f);
}
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
console.log(claude.includes('규칙 원본은 `AGENTS.md`') ? '✔ CLAUDE.md 포인터 있음' : '⚠ CLAUDE.md 맨 위에 CLAUDE.md.prepend.md 블록을 아직 넣지 않았다');
console.log('\n다음: main 브랜치 보호(상민님 계정 권한, 규범 변경이므로 상민님 결심 뒤에만) —\n  gh api -X PUT repos/yangsangmin/ourgoal-app/branches/main/protection --input docs/rules/branch-protection.json\n  주의: 이 설정은 법정(court) 검사를 필수로 건다. court 워크플로가 main 에 올라가 실제로 한 번 돈 것을 확인한 뒤에 적용한다(그 전에 걸면 모든 PR 이 영원히 대기한다).');
