const fs = require('fs');

let content = fs.readFileSync('court/lib/preserve.js', 'utf8');

// replace uiData error
content = content.replace('stepsEvaluated: uiData.stepsEvaluated', 'stepsEvaluated: H.captures.length');

// make moduleLoad mandatory
content = content.replace('if (proof.proofs.moduleLoad) {', 'if (!proof.proofs.moduleLoad) return { ok: false, reason: "moduleLoad 증거가 누락되었습니다" };\n  if (proof.proofs.moduleLoad) {');

// make testSuiteCompare mandatory
content = content.replace('if (proof.proofs.testSuiteCompare) {', 'if (!proof.proofs.testSuiteCompare) return { ok: false, reason: "testSuiteCompare 증거가 누락되었습니다" };\n  if (proof.proofs.testSuiteCompare) {');

// make tabIsolatedWork mandatory
content = content.replace('if (proof.proofs.tabIsolatedWork || proof.proofs.tabCompare) {', 'if (!proof.proofs.tabIsolatedWork && !proof.proofs.tabCompare) return { ok: false, reason: "tabIsolatedWork 증거가 누락되었습니다" };\n  if (proof.proofs.tabIsolatedWork || proof.proofs.tabCompare) {');

// enforce H, B, B2 captures
content = content.replace('if (!H.captures || !B.captures || H.captures.length !== B.captures.length) {', 'if (!H.captures || !B.captures || !B2 || !B2.captures || H.captures.length === 0 || H.captures.length !== B.captures.length || H.captures.length !== B2.captures.length) {');

// Enforce B2 mismatch check properly
const b2Check = if (B2 && B2.captures && B2.captures.length === B.captures.length) {
    for (let i = 0; i < B.captures.length; i++) {
      if (B.captures[i].dom !== B2.captures[i].dom) {
         // 흔들림 감지
         // B와 B2가 다르면 H와 비교할 기준이 명확하지 않음.
      }
    }
  };
const b2Replace = if (B2 && B2.captures && B2.captures.length === B.captures.length) {
    for (let i = 0; i < B.captures.length; i++) {
      if (B.captures[i].dom !== B2.captures[i].dom) {
         return { ok: false, reason: 'B2 흔들림 감지' };
      }
    }
  };
content = content.replace(b2Check, b2Replace);

// enforce tokens logic to verify AST
// We won't parse it fully because we don't have the CFG inside ctx in all tests, but we'll reject if length is 0 and arrays are empty.
content = content.replace('if (!Array.isArray(tokenData.equiv) || tokenData.equiv.length === 0) {', 'if (!tokenData || !Array.isArray(tokenData.equiv) || tokenData.equiv.length === 0) {');

fs.writeFileSync('court/lib/preserve.js', content, 'utf8');
