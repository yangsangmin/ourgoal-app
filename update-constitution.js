const fs = require('fs');

// Restore SNOWBALL to AGENTS to archive it correctly first
// Actually AGENTS is already SNOWBALL before running this, since it hasn't been modified!
// So let's archive it BEFORE modifying
fs.copyFileSync('AGENTS.md', 'docs/rules/archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md');

// 1. Update Kernel (AGENTS.md)
let agents = fs.readFileSync('AGENTS.md', 'utf8');

// Version replacement
agents = agents.replace(/v2026\.10\.06-SNOWBALL/g, 'v2026.10.07-PRESERVATION');
agents = agents.replace(/v2026\.10\.05-CELL \+ [^\)]+\)/, 'v2026.10.06-SNOWBALL + 동작 보존 증명: 리팩토링·모듈 분할 시 기계적 토큰 검증, DOM/스토리지 일치, 부품 누수 없음을 요구하는 동작 보존(preserve) 판정 추가)');

// MERGE_GATE update
agents = agents.replace(
  '1. 법정 판정이 "통과"이거나, "확인 부족"이면',
  '1. 법정 판정이 "통과" 또는 "동작 보존 확인"이거나, "확인 부족"이면'
);

// ARTICLE_08 update
const clause8_10 = '\n        <clause id="8.10">제8조 제10항 (동작 보존의 증명): 리팩토링이나 모듈 분리 등 기존 동작 보존을 주장할 때는 화면 시험뿐 아니라 기계적인 토큰 검증, DOM/스토리지 일치, 부품 누수 없음을 입증하는 분할 증명서(CELL_SPLIT_PROOF)를 필수 제출하고 법정의 "동작 보존 확인" 판정을 받아야 한다.</clause>';
agents = agents.replace('</article>\n\n    <article id="ARTICLE_09"', clause8_10 + '\n      </article>\n\n    <article id="ARTICLE_09"');

fs.writeFileSync('AGENTS.md', agents, 'utf8');
fs.writeFileSync('CLAUDE.md', agents, 'utf8');
fs.writeFileSync('docs/rules/01_OURGOAL_SUPREME_CONSTITUTION_FULL.md', agents, 'utf8');

// 2. Update OURGOAL_ABSOLUTE_INTEGRITY_RULES.md
let rules = fs.readFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'utf8');
rules = rules.replace(/v2026\.10\.06-SNOWBALL/g, 'v2026.10.07-PRESERVATION');

// Update Kernel version summary in rules
const rulesKernelUpdate = `- **현행 커널 버전**: \`v2026.10.07-PRESERVATION\` — 상민님 동작 보존 승인 한정(WIP). 개정 요약: 동작 보존(preserve) 판정 도입, 분할 증명서(CELL_SPLIT_PROOF) 기반 기계적 토큰/DOM/누수 검증 의무화 (제8조 제10항 신설, MERGE_GATE 반영). 상세는 \`docs/specs/REQ-COURT-PRESERVATION.md\`, 이력은 \`docs/rules/CONSTITUTION_VERSIONS.md\`.\n- **직전 커널 버전**: \`v2026.10.06-SNOWBALL\``;
rules = rules.replace(/- \*\*현행 커널 버전\*\*: `v2026\.10\.06-SNOWBALL`[^\n]+\n- \*\*직전 커널 버전\*\*: `v2026\.10\.05-CELL`/, rulesKernelUpdate);

const rule8_10 = `\n10. **10호 (동작 보존의 증명)**: 리팩토링이나 모듈 분리 등 기존 기능의 동작 보존을 주장(preserve)할 때는, 단순히 화면 시험을 통과하는 것에 그치지 않고 법정이 요구하는 동작 보존 증명(CELL_SPLIT_PROOF)을 제출해야 한다. 법정은 기준 커밋과 작업 커밋 사이의 토큰 비교, DOM/스토리지 일치, 부품 누수 여부를 기계적으로 검증하여 "동작 보존 확인"으로 판정한다. 증명이 부족하거나 변조된 경우 엄격히 거절한다.`;
rules = rules.replace(/## 제9조/g, rule8_10 + '\n\n## 제9조');

fs.writeFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', rules, 'utf8');

// 3. Update CONSTITUTION_VERSIONS.md
let versions = fs.readFileSync('docs/rules/CONSTITUTION_VERSIONS.md', 'utf8');
const versionEntry = `| **\`v2026.10.07-PRESERVATION\`** (커널) | 2026-10-06 | 상민님 | **동작 보존 판정 도입**: 기존 동작 보존(preserve) 주장 시 화면 통과뿐 아니라 토큰/DOM/스토리지 일치 및 부품 누수 없음을 기계적으로 검증하는 분할 증명서(CELL_SPLIT_PROOF) 제출 의무화. (제8조 제10항 신설, MERGE_GATE 보존 요건 반영). 삭제 조항 0 | 직전 커널: [\`AGENTS_KERNEL_v2026.10.06-SNOWBALL.md\`](archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md) · REQ \`docs/specs/REQ-COURT-PRESERVATION.md\` | 상민님 "동작 보존 분열에 한정해 금고 변경 승인·헌법 개정 승인" (WIP) |
| **\`v2026.10.06-SNOWBALL\`**`;
versions = versions.replace(/\| \*\*`v2026\.10\.06-SNOWBALL`\*\*/, versionEntry);
fs.writeFileSync('docs/rules/CONSTITUTION_VERSIONS.md', versions, 'utf8');

console.log('updated');
