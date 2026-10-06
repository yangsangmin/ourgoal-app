'use strict';
/**
 * TASK-ES-585 법정 module-load 탐침 및 단독 로드 검증
 * 사용: node docs/design/harness/module-split/task585-module-load.js <baseDir> <headDir> <outPath>
 */
const fs = require('fs');
const path = require('path');

const [baseDirArg, headDirArg, outPathArg] = process.argv.slice(2);
const baseDir = path.resolve(baseDirArg || '.');
const headDir = path.resolve(headDirArg || '.');
const outPath = path.resolve(outPathArg || 'reports/TASK-ES-585/module-load.json');

const { probeModules, compare, loadOne } = require(path.join(headDir, 'court/probes/module-load.js'));

console.log(`Running module-load probe: base=${baseDir}, head=${headDir}`);

const baseRes = probeModules(baseDir);
const headRes = probeModules(headDir);

let headIndexHtml = null;
try {
  headIndexHtml = fs.readFileSync(path.join(headDir, 'index.html'), 'utf8');
} catch (_) {}

const comparison = compare(baseRes, headRes, headIndexHtml);

// Isolated probe on newly created cell
const cellRel = 'js/tabs/records/template-record-detail.js';
const cellAbs = path.join(headDir, cellRel);
const cellProbe = fs.existsSync(cellAbs) ? loadOne(cellAbs) : { ok: false, error: 'FILE_NOT_FOUND', globals: [] };

const report = {
  task: 'TASK-ES-585',
  timestamp: new Date().toISOString(),
  baseDir,
  headDir,
  totalProbed: Object.keys(headRes).length,
  standardProbeOk: Object.values(headRes).filter(x => x.ok).length,
  standardProbeFailed: Object.entries(headRes).filter(([_, v]) => !v.ok).map(([k, v]) => ({ file: k, error: v.error })),
  regressions: comparison.regressions,
  insufficient: comparison.insufficient,
  fixed: comparison.fixed,
  removed: comparison.removed,
  counts: comparison.counts,
  cellIsolated: {
    [cellRel]: cellProbe
  },
  ok: comparison.regressions.length === 0 && cellProbe.ok
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`module-load report written to: ${outPath} (regressions: ${comparison.regressions.length}, cellOk: ${cellProbe.ok})`);

if (!report.ok) {
  process.exit(1);
}
