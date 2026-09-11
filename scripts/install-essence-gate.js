#!/usr/bin/env node
// 본질 게이트 설치: git 훅 경로 설정 + 자가 점검. 클로드 코드·안티그래비티·코덱스·사람 어느 클론에서든 한 번 실행.
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const run = (c) => execSync(c, { cwd: root, encoding: 'utf8' }).trim();
try { fs.chmodSync(path.join(root, '.githooks', 'commit-msg'), 0o755); fs.chmodSync(path.join(root, '.githooks', 'pre-commit'), 0o755); } catch (e) {}
run('git config core.hooksPath .githooks');
console.log('✔ core.hooksPath = .githooks');
console.log(run('node scripts/essence-gate.js --self-test'));
for (const f of ['AGENTS.md', 'GEMINI.md', '.agent/rules/essence-gate.md', 'docs/rules/ESSENCE_OURGOAL.md', 'docs/rules/rules.json', 'docs/rules/TICKETS.md', '.github/workflows/essence-gate.yml']) {
  console.log((fs.existsSync(path.join(root, f)) ? '✔ ' : '✖ 누락 ') + f);
}
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');
console.log(claude.includes('규칙 원본은 `AGENTS.md`') ? '✔ CLAUDE.md 포인터 있음' : '⚠ CLAUDE.md 맨 위에 CLAUDE.md.prepend.md 블록을 아직 넣지 않았다');
console.log('\n다음: main 브랜치 보호(상민님 계정 권한) —\n  gh api -X PUT repos/yangsangmin/ourgoal-app/branches/main/protection --input docs/rules/branch-protection.json');
