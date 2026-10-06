const fs = require('fs');
const path = require('path');
const { recomputeSplit } = require('./court/lib/preserve-source.js');

const rootDir = 'C:/dev/ourgoal-app/scratch/system-audit-20261007-root/source-054-frozen-gu926h';
const baseDir = path.join(rootDir, 'base');

const configAbs = 'C:/dev/ourgoal-app/scratch/system-audit-20261007-root/pilot-app-head/docs/design/harness/module-split/inline-record-detail585.json';
const config = JSON.parse(fs.readFileSync(configAbs, 'utf8'));

const cases = ['normal', 'extra-cell-outside-iife', 'extra-html-outside-iife', 'tagged-seam-executable'];

const repoDir = 'C:/dev/ourgoal-app';
const baseSha = '66ce3a630d1c7dfc81550901f6356b2c0fb8b6b9';
const headSha = '09fbd1e1d4c30ec48cc25b0d9699f8db18c079d0';

for (const c of cases) {
  console.log(`\n--- Case: ${c} ---`);
  const headDir = path.join(rootDir, c);
  const result = recomputeSplit({
    repoDir,
    baseSha,
    headSha,
    mockOverrides: { baseDir, headDir },
    config,
    changedFiles: ['index.html', 'js/tabs/records/template-record-detail.js']
  });
  
  console.log(`ok: ${result.ok}`);
  if (result.reason) console.log(`reason: ${result.reason}`);
}
