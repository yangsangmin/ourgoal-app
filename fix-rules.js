const fs = require('fs');
let rules = fs.readFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'utf8');

const rulesKernelUpdate = `- **현행 커널 버전**: \`v2026.10.07-PRESERVATION\` — 상민님 동작 보존 승인 한정(WIP). 개정 요약: 동작 보존(preserve) 판정 도입, 분할 증명서(CELL_SPLIT_PROOF) 기반 기계적 토큰/DOM/누수 검증 의무화 (제8조 제10항 신설, MERGE_GATE 반영). 상세는 \`docs/specs/REQ-COURT-PRESERVATION.md\`, 이력은 \`docs/rules/CONSTITUTION_VERSIONS.md\`.\n- **직전 커널 버전**: \`v2026.10.06-SNOWBALL\``;

rules = rules.replace(/- \*\*현행 커널 버전\*\*: `v2026\.10\.07-PRESERVATION`[^\n]+\n- \*\*직전 커널 버전\*\*: `v2026\.10\.05-CELL`/, rulesKernelUpdate);

fs.writeFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', rules, 'utf8');
