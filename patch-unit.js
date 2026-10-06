const fs = require('fs');
let code = fs.readFileSync('court/selftest/unit-preserve.js', 'utf8');

const validProofUpdate = `const validProof = {
          schema: 'cell-split-proof/1',
          proofs: { 
             moduleLoad: 'moduleLoad.json',
             testSuiteCompare: 'testSuite.json',
             tabIsolatedWork: 'tab.json'
          },
          baseSha: '000000000000000000000000000000000000ba5e',
          headSha: '000000000000000000000000000000000000beef',
          mutatorSensitivity: { ok: true, detectedMutations: 5, inputSha: 'in123', executorSha: 'exec123', rawRejectionReason: 'something' },
        };`;

code = code.replace(/const validProof = \{[\s\S]*?mutatorSensitivity: \{ ok: true, detectedMutations: 5 \},\s*\};/, validProofUpdate);

const writeTreeRegex = /writeTree\(dir, \{ 'proof\.json': validProof, 'token\.json': validToken, 'moduleLoad\.json': \{ newRegressionCount: 0 \}, 'testSuite\.json': \{ tests: \{ regressionCount: 0 \} \}, 'tab\.json': \{ differingValues: 0 \} \}\);/g;

const newWriteTree = `writeTree(dir, { 
          'proof.json': validProof, 
          'token.json': validToken,
          'moduleLoad.json': { newRegressionCount: 0, inputSha: 'a', executorSha: 'b', baseRaw: 'c', headRaw: 'd' }, 
          'testSuite.json': { tests: { regressionCount: 0 }, inputSha: 'a', executorSha: 'b', baseRaw: 'c', headRaw: 'd' }, 
          'tab.json': { differingValues: 0, inputSha: 'a', executorSha: 'b', baseRaw: 'c', headRaw: 'd' } 
        });`;
code = code.replace(writeTreeRegex, newWriteTree);

fs.writeFileSync('court/selftest/unit-preserve.js', code);
console.log('patched unit test');
