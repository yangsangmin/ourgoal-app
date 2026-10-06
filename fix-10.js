const fs = require('fs');

let rules = fs.readFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', 'utf8');

rules = rules.replace('9. **9호 (동작 보존의 증명)**', '10. **10호 (동작 보존의 증명)**');

// fix the 개정 요약 text from 9호 to 10호
rules = rules.replace('제8조 제3항 9호 신설', '제8조 제3항 10호 신설');

fs.writeFileSync('docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md', rules, 'utf8');

// Also fix in AGENTS.md
let agents = fs.readFileSync('AGENTS.md', 'utf8');
agents = agents.replace('제8조 제3항 9호 (동작 보존의 증명)', '제8조 제3항 10호 (동작 보존의 증명)');
fs.writeFileSync('AGENTS.md', agents, 'utf8');
fs.writeFileSync('CLAUDE.md', agents, 'utf8');
fs.writeFileSync('01_OURGOAL_SUPREME_CONSTITUTION_FULL.md', agents, 'utf8');

// Also fix VERSIONS
let versions = fs.readFileSync('docs/rules/CONSTITUTION_VERSIONS.md', 'utf8');
versions = versions.replace('제8조 제3항 9호 신설', '제8조 제3항 10호 신설');
fs.writeFileSync('docs/rules/CONSTITUTION_VERSIONS.md', versions, 'utf8');
console.log('fixed');
