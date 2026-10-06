const fs = require('fs');
const path = require('path');
const { recomputeSplit } = require('./court/lib/preserve-source.js');

const root = 'C:\\\\dev\\\\ourgoal-app\\\\scratch\\\\system-audit-20261007-root\\\\source-054-frozen-gu926h';

const dirs = [
  'normal',
  'extra-cell-outside-iife',
  'extra-html-outside-iife',
  'tagged-seam-executable'
];

for (const d of dirs) {
  const baseDir = path.join(root, d, 'base');
  const headDir = path.join(root, d, 'head');
  const config = JSON.parse(fs.readFileSync('C:\\\\dev\\\\ourgoal-app\\\\scratch\\\\system-audit-20261007-root\\\\pilot-app-head\\\\docs\\\\design\\\\harness\\\\module-split\\\\inline-record-detail585.json', 'utf8'));

  const changedFiles = ['index.html', ...config.cells.map(c => c.file)];

  const res = recomputeSplit({
    baseDir,
    headDir,
    config,
    changedFiles
  });

  console.log(`\n--- Case: ${d} ---`);
  console.log(`ok: ${res.ok}`);
  if (!res.ok) console.log(`reason: ${res.reason}`);
}
