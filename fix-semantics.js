const fs = require('fs');

// 1. Kernel (AGENTS.md)
let agents = fs.readFileSync('AGENTS.md', 'utf8');
// Fix Header
agents = agents.replace(/v2026\.10\.07-PRESERVATION[^\n]*/, 'v2026.10.07-PRESERVATION (v2026.10.06-SNOWBALL + 동작 보존 증명: CELL_SPLIT 기반 원문 이전 및 동작 무변경에 한정하여 기계적 토큰 검증, DOM/스토리지 일치, 부품 누수 없음을 필수로 요구하는 판정 도입. 발효 예정)');
// Fix MERGE_GATE
agents = agents.replace('1. 법정 판정이 "통과" 또는 "동작 보존 확인"이거나,', '1. 법정 판정이 "통과"(또는 CELL_SPLIT 분열 한정 "동작 보존 확인")이거나,');

if (!agents.includes('8.4')) {
    const clause8_4 = '\n        <clause id="8.4">제8조 제3항 9호 (동작 보존의 증명): CELL_SPLIT 기반의 원문 이전 및 동작 무변경(기존 버그 보존 포함)에 한정하여 동작 보존(preserve)을 주장할 수 있으며, 이때는 기계적인 토큰 검증, DOM/스토리지 일치, 부품 누수 없음을 검증하는 분할 증명서(CELL_SPLIT_PROOF)를 필수 제출하고 법정의 "동작 보존 확인" 판정을 받아야 한다. 일반 리팩터링이나 fix/new 등은 동작 보존 판정의 대상이 될 수 없다.</clause>\n      </article>';
    
    // Use regex to match the article end
    agents = agents.replace(/<\/article>\s*<article id="ARTICLE_09"/, clause8_4 + '\n\n      <article id="ARTICLE_09"');
}
fs.writeFileSync('AGENTS.md', agents, 'utf8');
fs.writeFileSync('CLAUDE.md', agents, 'utf8');
fs.writeFileSync('01_OURGOAL_SUPREME_CONSTITUTION_FULL.md', agents, 'utf8');

// 2. RULES
let rules = fs.readFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'utf8');

// Fix Kernel History
const ruleKernelUpdate = `- **현행 커널 버전**: \`v2026.10.07-PRESERVATION\` — 상민님 동작 보존 승인 한정(WIP). 개정 요약: CELL_SPLIT 분열에 한정해 동작 보존(preserve) 판정 도입, 원문 이전 및 동작 무변경(기존 버그 보존 포함) 시 분할 증명서(CELL_SPLIT_PROOF) 기반 기계적 토큰/DOM/누수 검증 의무화 (제8조 제3항 9호 신설, MERGE_GATE 반영). 일반 리팩터링/fix/new는 예외로 넓히지 않음. 상세는 \`docs/specs/REQ-COURT-PRESERVATION.md\`, 이력은 \`docs/rules/CONSTITUTION_VERSIONS.md\` (발효 예정).
- **직전 커널 버전**: \`v2026.10.06-SNOWBALL\` — PR #800 병합 기록(병합 커밋 \`1ce6c14\`, 2026-10-06 00:38 KST). 개정 요약: 작업참고 스노우볼(\`work_reference_snowball\` — 매 작업 전 최신 작업참고 읽기, 유형 분류 표준/이탈/탐색, 불변층 예외 없음, PR 병합마다 경험칙 반영, 질의는 코드 불변), \`step_0_session_start\` 0항·\`MODE_0\` 분류 단계·조문 12.7~12.8 추가. 삭제 조항 0. 상세는 \`docs/specs/REQ-TASK-ES-510-CONSTITUTION-SNOWBALL.md\`, 이력은 \`docs/rules/CONSTITUTION_VERSIONS.md\`.\n- **그 이전 버전**: \`v2026.10.05-CELL\``;

rules = rules.replace(/- \*\*현행 커널 버전\*\*: `v2026\.10\.07-PRESERVATION`[\s\S]*?- \*\*직전 커널 버전\*\*: `v2026\.10\.06-SNOWBALL`[^\n]+\n/, ruleKernelUpdate + '\n');

// Remove misplaced 10호
rules = rules.replace(/\n10\. \*\*10호 \(동작 보존의 증명\)\*\*:.*?\n/, '\n');

// Insert 9호
if (!rules.includes('9. **9호 (동작 보존의 증명)**')) {
    const clause9 = '\n9. **9호 (동작 보존의 증명)**: CELL_SPLIT 기반의 원문 이전 및 동작 무변경(기존 버그 보존 포함)에 한정하여 동작 보존(preserve)을 주장할 때는, 단순히 화면 시험을 통과하는 것에 그치지 않고 법정이 요구하는 동작 보존 증명(CELL_SPLIT_PROOF)을 제출해야 한다. 법정은 기준 커밋과 작업 커밋 사이의 토큰 비교, DOM/스토리지 일치, 부품 누수 여부를 기계적으로 검증하여 "동작 보존 확인"으로 판정한다. 일반 리팩터링이나 fix/new 등은 동작 보존 판정의 대상이 될 수 없으며, 증명이 부족하거나 변조된 경우 엄격히 거절한다.';
    
    rules = rules.replace('함께 기재해야 한다.', '함께 기재해야 한다.' + clause9);
}

fs.writeFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', rules, 'utf8');

// 3. VERSIONS
let versions = fs.readFileSync('docs/rules/CONSTITUTION_VERSIONS.md', 'utf8');
const versionEntry = `| **\`v2026.10.07-PRESERVATION\`** (커널) | 2026-10-06 | 상민님 | **동작 보존 판정 도입**: CELL_SPLIT 기반 원문 이전 및 동작 무변경 한정. 기존 동작 보존(preserve) 주장 시 화면 통과뿐 아니라 토큰/DOM/스토리지 일치 및 부품 누수 없음을 기계적으로 검증하는 분할 증명서(CELL_SPLIT_PROOF) 제출 의무화. (제8조 제3항 9호 신설, MERGE_GATE 보존 요건 반영). 삭제 조항 0 | 직전 커널: [\`AGENTS_KERNEL_v2026.10.06-SNOWBALL.md\`](archive/AGENTS_KERNEL_v2026.10.06-SNOWBALL.md) · REQ \`docs/specs/REQ-COURT-PRESERVATION.md\` | 상민님 "동작 보존 분열에 한정해 금고 변경 승인·헌법 개정 승인" (발효 예정) |`;
versions = versions.replace(/\| \*\*`v2026\.10\.07-PRESERVATION`\*\*[^\n]+/, versionEntry);
fs.writeFileSync('docs/rules/CONSTITUTION_VERSIONS.md', versions, 'utf8');

console.log('done');
