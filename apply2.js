const fs = require('fs');

let chatJs = fs.readFileSync('court/chat.js', 'utf8');
chatJs = chatJs.replace("function cleared(how, bucket) { return bucket === BUCKET_CONFIRMED || (how === 's' && bucket === BUCKET_TEXT_ENOUGH); }", "function cleared(how, bucket) { return bucket === BUCKET_CONFIRMED || bucket === BUCKET_PRESERVED || (how === 's' && bucket === BUCKET_TEXT_ENOUGH); }");
fs.writeFileSync('court/chat.js', chatJs, 'utf8');

let unitJs = fs.readFileSync('court/selftest/unit-preserve.js', 'utf8');
unitJs = unitJs.replace("proofs: { tokenResidualLeak: 'token.json' },", "proofs: { tokenResidualLeak: 'token.json', moduleLoad: 'moduleLoad.json', testSuiteCompare: 'testSuite.json', tabIsolatedWork: 'tab.json' },");
unitJs = unitJs.replace("baseSha: '000000000000000000000000000000000000base',", "baseSha: '000000000000000000000000000000000000ba5e',\n          headSha: '000000000000000000000000000000000000beef',");
unitJs = unitJs.replace("headSha: '000000000000000000000000000000000000head',", "");
unitJs = unitJs.replace("base: { sha: '000000000000000000000000000000000000base' }, head: { sha: '000000000000000000000000000000000000head' }", "base: { sha: '000000000000000000000000000000000000ba5e' }, head: { sha: '000000000000000000000000000000000000beef' }");
unitJs = unitJs.replace("writeTree(dir, { 'proof.json': validProof, 'token.json': validToken });", "writeTree(dir, { 'proof.json': validProof, 'token.json': validToken, 'moduleLoad.json': {}, 'testSuite.json': {}, 'tab.json': {} });");
fs.writeFileSync('court/selftest/unit-preserve.js', unitJs, 'utf8');

let pJs = fs.readFileSync('court/lib/preserve.js', 'utf8');
const pLogic = "const babelParser = require('C:/dev/ourgoal-app/node_modules/@babel/parser');\nfunction getTokens(file) {\n  if (!file || !fs.existsSync(file)) return null;\n  try {\n    const src = fs.readFileSync(file, 'utf8');\n    const ast = babelParser.parse(src, { sourceType: 'script', tokens: true, ranges: true, allowReturnOutsideFunction: true });\n    return ast.tokens.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label)).filter(v => !(v === 'L' || v === 'K' || v === '.'));\n  } catch(e) { return null; }\n}";
pJs = pJs.replace("const path = require('node:path');", "const path = require('node:path');\n" + pLogic);
pJs = pJs.replace("if (!Array.isArray(tokenData.equiv) || tokenData.equiv.length === 0) {", "if (!tokenData || !Array.isArray(tokenData.equiv) || tokenData.equiv.length === 0) {");

const tokenCheckOld = "if (!item.tokensOrigArray || !item.tokensNewArray) {";
const tokenCheckNew = "if (!item.tokensOrigArray || !item.tokensNewArray) {\n      return { ok: false, reason: '토큰 원시 배열 누락' };\n    }\n    if (ctx.base && ctx.base.dir) {\n      const bFile = path.join(ctx.base.dir, 'index.html');\n      const bToks = getTokens(bFile);\n      if (bToks && JSON.stringify(bToks) !== JSON.stringify(item.tokensOrigArray)) return { ok: false, reason: 'base.dir 토큰 변조 감지' };\n    }\n    if (ctx.head && ctx.head.dir) {\n      const hFile = path.join(ctx.head.dir, (item.name || 'index') + '.js');\n      const hToks = getTokens(hFile);\n      if (hToks && JSON.stringify(hToks) !== JSON.stringify(item.tokensNewArray)) return { ok: false, reason: 'head.dir 토큰 변조 감지' };\n    }\n    if (false) {";
pJs = pJs.replace(tokenCheckOld, tokenCheckNew);

const restCheckOld = "if (!tokenData.tokens.origRestArray || !tokenData.tokens.newRestArray) {";
const restCheckNew = "if (!tokenData.tokens.origRestArray || !tokenData.tokens.newRestArray) {\n    return { ok: false, reason: '잔여 토큰 원시 배열 누락' };\n  }\n  if (ctx.base && ctx.base.dir) {\n    const bFile = path.join(ctx.base.dir, 'index.html');\n    const bToks = getTokens(bFile);\n    if (bToks && JSON.stringify(bToks) !== JSON.stringify(tokenData.tokens.origRestArray)) return { ok: false, reason: 'base.dir 잔여 토큰 변조 감지' };\n  }\n  if (ctx.head && ctx.head.dir) {\n    const hFile = path.join(ctx.head.dir, 'index.js');\n    const hToks = getTokens(hFile);\n    if (hToks && JSON.stringify(hToks) !== JSON.stringify(tokenData.tokens.newRestArray)) return { ok: false, reason: 'head.dir 잔여 토큰 변조 감지' };\n  }\n  if (false) {";
pJs = pJs.replace(restCheckOld, restCheckNew);

pJs = pJs.replace("if (!H.captures || !B.captures || H.captures.length !== B.captures.length) {", "if (!H.captures || !B.captures || !B2 || !B2.captures || H.captures.length === 0 || H.captures.length !== B.captures.length || H.captures.length !== B2.captures.length) {");

const b2Check = "if (B2 && B2.captures && B2.captures.length === B.captures.length) {\n    for (let i = 0; i < B.captures.length; i++) {\n      if (B.captures[i].dom !== B2.captures[i].dom) {\n         // 흔들림 감지\n         // B와 B2가 다르면 H와 비교할 기준이 명확하지 않음.\n      }\n    }\n  }";
const b2Replace = "if (B2 && B2.captures && B2.captures.length === B.captures.length) {\n    for (let i = 0; i < B.captures.length; i++) {\n      if (B.captures[i].dom !== B2.captures[i].dom) {\n         return { ok: false, reason: 'B2 흔들림 감지' };\n      }\n    }\n  }";
pJs = pJs.replace(b2Check, b2Replace);

pJs = pJs.replace("const mutatorPassed = proof.mutatorSensitivityPassed === true || (proof.mutatorSensitivity && proof.mutatorSensitivity.ok === true);", "const mutatorPassed = typeof proof.mutatorSensitivity === 'object' && proof.mutatorSensitivity.ok === true && typeof proof.mutatorSensitivity.detectedMutations === 'number' && proof.mutatorSensitivity.detectedMutations > 0;");

pJs = pJs.replace("if (proof.proofs.moduleLoad) {", "if (!proof.proofs.moduleLoad) return { ok: false, reason: 'moduleLoad 증거 누락' };\n  if (proof.proofs.moduleLoad) {");
pJs = pJs.replace("if (proof.proofs.testSuiteCompare) {", "if (!proof.proofs.testSuiteCompare) return { ok: false, reason: 'testSuiteCompare 증거 누락' };\n  if (proof.proofs.testSuiteCompare) {");
pJs = pJs.replace("if (proof.proofs.tabIsolatedWork || proof.proofs.tabCompare) {", "if (!proof.proofs.tabIsolatedWork && !proof.proofs.tabCompare) return { ok: false, reason: 'tabIsolatedWork 증거 누락' };\n  if (proof.proofs.tabIsolatedWork || proof.proofs.tabCompare) {");
pJs = pJs.replace("stepsEvaluated: uiData.stepsEvaluated,", "stepsEvaluated: H.captures.length,");

fs.writeFileSync('court/lib/preserve.js', pJs, 'utf8');
