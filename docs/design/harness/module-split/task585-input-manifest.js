'use strict';
/**
 * task585-input-manifest.js
 * 완전한 git archive 기준선 사본과 작업판 간의 모든 실제 로드 입력 파일의 존재 및 SHA256 자동 측정
 * 사용: node docs/design/harness/module-split/task585-input-manifest.js <baselineRoot> <appRoot> <outJson>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [baseArg, appArg, outArg] = process.argv.slice(2);
if (!baseArg || !appArg || !outArg) {
  console.error('Usage: node task585-input-manifest.js <baselineRoot> <appRoot> <outJson>');
  process.exit(1);
}

const baseRoot = path.resolve(baseArg);
const appRoot = path.resolve(appArg);
const outPath = path.resolve(outArg);

function sha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

// Key runtime inputs that browser loads
const coreRuntimeFiles = [
  'index.html',
  'ui.css',
  'manifest.json',
  'sw.js',
  'capacitor.config.json',
  'package.json'
];

// JS files
const baseJsFiles = getAllFiles(path.join(baseRoot, 'js'), baseRoot);
const appJsFiles = getAllFiles(path.join(appRoot, 'js'), appRoot);
const allJsFiles = Array.from(new Set([...baseJsFiles, ...appJsFiles])).sort();

// Court files
const baseCourtFiles = getAllFiles(path.join(baseRoot, 'court'), baseRoot);
const appCourtFiles = getAllFiles(path.join(appRoot, 'court'), appRoot);
const allCourtFiles = Array.from(new Set([...baseCourtFiles, ...appCourtFiles])).sort();

const allRelevantFiles = Array.from(new Set([...coreRuntimeFiles, ...allJsFiles, ...allCourtFiles])).sort();

const comparison = {
  task: 'TASK-ES-585',
  baselineRoot: baseRoot,
  appRoot: appRoot,
  generatedAt: new Date().toISOString(),
  counts: {
    totalChecked: allRelevantFiles.length,
    identical: 0,
    modified: 0,
    addedInApp: 0,
    removedInApp: 0
  },
  differences: [],
  files: {}
};

for (const rel of allRelevantFiles) {
  const baseFile = path.join(baseRoot, rel);
  const appFile = path.join(appRoot, rel);

  const baseExists = fs.existsSync(baseFile);
  const appExists = fs.existsSync(appFile);
  const baseSha = sha256(baseFile);
  const appSha = sha256(appFile);

  let status = 'identical';
  if (!baseExists && appExists) {
    status = 'added_in_app';
    comparison.counts.addedInApp++;
    comparison.differences.push({ file: rel, status, appSha });
  } else if (baseExists && !appExists) {
    status = 'removed_in_app';
    comparison.counts.removedInApp++;
    comparison.differences.push({ file: rel, status, baseSha });
  } else if (baseSha !== appSha) {
    status = 'modified';
    comparison.counts.modified++;
    comparison.differences.push({ file: rel, status, baseSha, appSha });
  } else {
    comparison.counts.identical++;
  }

  comparison.files[rel] = {
    baseExists,
    appExists,
    baseSha,
    appSha,
    status
  };
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(comparison, null, 2), 'utf8');

console.log(`[Input Manifest] Checked ${comparison.counts.totalChecked} files:`);
console.log(`  Identical: ${comparison.counts.identical}`);
console.log(`  Modified: ${comparison.counts.modified}`);
console.log(`  Added: ${comparison.counts.addedInApp}`);
console.log(`  Removed: ${comparison.counts.removedInApp}`);
console.log(`Differences:`, comparison.differences);
console.log(`Saved manifest to: ${outPath}`);
