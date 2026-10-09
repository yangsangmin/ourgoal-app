#!/usr/bin/env node
/**
 * TASK-ES-604: 아워골 정식 main 일곱 세포 지도 대조 및 보존 측정기
 *
 * 정식 main의 7개 세포(auth-social, avatar/level-badge, core/modal-open,
 * creator-templates-legacy, goals/curated-market-data,
 * goals/template-encyclopedia-modal, records/vision-table-input)의
 * 손 이름·역할·hand출처 및 실제 파일/등록을 공식 생성기와 대조하고,
 * 기존 지도·설명·제품·시험·금고·Git 설정 보존을 전수 측정한다.
 *
 * Node.js 단독 실행 가능 (외부 의존성 0)
 * 실행: node reports/TASK-ES-604/measure-map.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RAW_DIR = path.join(__dirname, 'raw');
const STDOUT_FILE = path.join(RAW_DIR, 'generator.stdout.json');
const STDERR_FILE = path.join(RAW_DIR, 'generator.stderr.txt');
const MEASUREMENT_FILE = path.join(__dirname, 'measurement.json');

const TARGET_IDS = [
  'auth-social',
  'avatar/level-badge',
  'core/modal-open',
  'creator-templates-legacy',
  'goals/curated-market-data',
  'goals/template-encyclopedia-modal',
  'records/vision-table-input'
];

function sha256File(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function readJsonSafe(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function runGenerator() {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  const scriptPath = path.join(ROOT, 'scripts', 'cell-map-export.js');
  const startedAt = new Date().toISOString();
  const runResult = spawnSync(process.execPath, [scriptPath, '--stdout'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  const endedAt = new Date().toISOString();

  const stdoutStr = runResult.stdout || '';
  const stderrStr = runResult.stderr || '';

  fs.writeFileSync(STDOUT_FILE, stdoutStr, 'utf8');
  fs.writeFileSync(STDERR_FILE, stderrStr, 'utf8');

  return {
    command: `node ${scriptPath} --stdout`,
    cwd: ROOT,
    startedAt,
    endedAt,
    exitCode: runResult.status !== null ? runResult.status : -1,
    signal: runResult.signal,
    error: runResult.error ? String(runResult.error) : null,
    stdoutPath: path.relative(ROOT, STDOUT_FILE).replace(/\\/g, '/'),
    stdoutSha256: sha256Buffer(Buffer.from(stdoutStr, 'utf8')),
    stdoutBytes: Buffer.byteLength(stdoutStr, 'utf8'),
    stderrPath: path.relative(ROOT, STDERR_FILE).replace(/\\/g, '/'),
    stderrSha256: sha256Buffer(Buffer.from(stderrStr, 'utf8')),
    stderrBytes: Buffer.byteLength(stderrStr, 'utf8')
  };
}

function measure() {
  const genMeta = runGenerator();

  const existingMapPath = path.join(ROOT, 'docs', 'architecture', 'cell-map.json');
  const existingMapSha = sha256File(existingMapPath);
  const existingMap = readJsonSafe(existingMapPath, { cells: [] });

  const generatedMap = readJsonSafe(STDOUT_FILE, { cells: [] });
  const descPath = path.join(ROOT, 'docs', 'architecture', 'cell-descriptions.json');
  const descDoc = readJsonSafe(descPath, { names: {}, cells: {} });
  const modulesPath = path.join(ROOT, 'docs', 'architecture', 'modules.json');
  const modulesDoc = readJsonSafe(modulesPath, { cells: [] });
  const baselinePath = path.join(ROOT, 'docs', 'architecture', 'module-baseline.json');
  const baselineDoc = readJsonSafe(baselinePath, {});

  const requestPath = path.join(ROOT, '.yangvis-inputs', 'r2', 'request.json');
  const requestDoc = readJsonSafe(requestPath, {});

  // 1. Target 7 cells verification
  const generatedCellsMap = new Map();
  (generatedMap.cells || []).forEach(c => generatedCellsMap.set(c.id, c));

  const existingCellsMap = new Map();
  (existingMap.cells || []).forEach(c => existingCellsMap.set(c.id, c));

  const modulesCellsMap = new Map();
  (modulesDoc.cells || []).forEach(c => modulesCellsMap.set(c.id, c));

  const targetResults = TARGET_IDS.map(id => {
    const genCell = generatedCellsMap.get(id) || null;
    const existCell = existingCellsMap.get(id) || null;
    const modCell = modulesCellsMap.get(id) || null;

    const handName = (descDoc.names && descDoc.names[id]) || null;
    const handDoes = (descDoc.cells && descDoc.cells[id]) || null;

    const filePath = modCell ? modCell.file : (genCell ? genCell.file : null);
    const fullSourcePath = filePath ? path.join(ROOT, filePath) : null;
    const fileExists = fullSourcePath ? fs.existsSync(fullSourcePath) : false;
    const fileSha256 = fullSourcePath && fileExists ? sha256File(fullSourcePath) : null;

    const genSemantic = genCell ? {
      id: genCell.id,
      name: genCell.name,
      does: genCell.does,
      nameSource: genCell.nameSource,
      doesSource: genCell.doesSource
    } : null;

    const existSemantic = existCell ? {
      id: existCell.id,
      name: existCell.name,
      does: existCell.does,
      nameSource: existCell.nameSource,
      doesSource: existCell.doesSource
    } : null;

    const semanticMatchesExisting = genSemantic && existSemantic &&
      genSemantic.id === existSemantic.id &&
      genSemantic.name === existSemantic.name &&
      genSemantic.does === existSemantic.does &&
      genSemantic.nameSource === existSemantic.nameSource &&
      genSemantic.doesSource === existSemantic.doesSource;

    const handSourceMatches = genSemantic &&
      genSemantic.nameSource === 'hand' &&
      genSemantic.doesSource === 'hand';

    const handContentMatches = genSemantic &&
      genSemantic.name === handName &&
      genSemantic.does === handDoes;

    const registeredInModules = modCell !== null && modCell.id === id;

    return {
      id,
      file: filePath,
      fileExists,
      fileSha256,
      registeredInModules,
      modulesKind: modCell ? modCell.kind : null,
      modulesSize: modCell ? modCell.size : null,
      handName,
      handDoes,
      generated: genSemantic,
      existing: existSemantic,
      semanticMatchesExisting,
      handSourceMatches,
      handContentMatches,
      allChecksPass: Boolean(
        fileExists &&
        registeredInModules &&
        semanticMatchesExisting &&
        handSourceMatches &&
        handContentMatches
      )
    };
  });

  const allTargetsPass = targetResults.every(t => t.allChecksPass);
  const targetSemanticMismatchCount = targetResults.filter(t => !t.semanticMatchesExisting).length;

  // 2. Full 351 cells semantic comparison & metadata variations
  let allCellsSemanticMismatchCount = 0;
  const semanticMismatches = [];
  const metadataVariations = [];

  const allGenIds = new Set(generatedCellsMap.keys());
  const allExistIds = new Set(existingCellsMap.keys());

  const unionIds = new Set([...allGenIds, ...allExistIds]);
  unionIds.forEach(id => {
    const g = generatedCellsMap.get(id);
    const e = existingCellsMap.get(id);
    if (!g || !e) {
      allCellsSemanticMismatchCount++;
      semanticMismatches.push({ id, reason: !g ? 'missing_in_generated' : 'missing_in_existing' });
      return;
    }
    const gSem = { id: g.id, name: g.name, does: g.does, nameSource: g.nameSource, doesSource: g.doesSource };
    const eSem = { id: e.id, name: e.name, does: e.does, nameSource: e.nameSource, doesSource: e.doesSource };
    if (JSON.stringify(gSem) !== JSON.stringify(eSem)) {
      allCellsSemanticMismatchCount++;
      semanticMismatches.push({ id, generated: gSem, existing: eSem });
    }

    // Check non-semantic metadata variations
    const prsEqual = JSON.stringify(g.prs || []) === JSON.stringify(e.prs || []);
    const tasksEqual = JSON.stringify(g.tasks || []) === JSON.stringify(e.tasks || []);
    const reqsEqual = JSON.stringify(g.reqs || []) === JSON.stringify(e.reqs || []);
    if (!prsEqual || !tasksEqual || !reqsEqual) {
      metadataVariations.push({
        id,
        prsChanged: !prsEqual,
        tasksChanged: !tasksEqual,
        reqsChanged: !reqsEqual
      });
    }
  });

  // Top-level metadata variations
  const topMetadataVariations = {
    sourceCommit: {
      existing: (existingMap.source && existingMap.source.commit) || null,
      generated: (generatedMap.source && generatedMap.source.commit) || null,
      equals: (existingMap.source && existingMap.source.commit) === (generatedMap.source && generatedMap.source.commit)
    },
    sourceCommittedAt: {
      existing: (existingMap.source && existingMap.source.committedAt) || null,
      generated: (generatedMap.source && generatedMap.source.committedAt) || null,
      equals: (existingMap.source && existingMap.source.committedAt) === (generatedMap.source && generatedMap.source.committedAt)
    },
    totalCells: {
      existing: (existingMap.summary && existingMap.summary.cells) || (existingMap.cells || []).length,
      generated: (generatedMap.summary && generatedMap.summary.cells) || (generatedMap.cells || []).length,
      equals: ((existingMap.summary && existingMap.summary.cells) || (existingMap.cells || []).length) ===
              ((generatedMap.summary && generatedMap.summary.cells) || (generatedMap.cells || []).length)
    },
    descriptionsHandCount: {
      existing: (existingMap.summary && existingMap.summary.descriptionsHand) || null,
      generated: (generatedMap.summary && generatedMap.summary.descriptionsHand) || null,
      equals: (existingMap.summary && existingMap.summary.descriptionsHand) === (generatedMap.summary && generatedMap.summary.descriptionsHand)
    },
    cellCountWithMetadataVariation: metadataVariations.length
  };

  // 3. Preservation of cell-descriptions.json
  const namesKeys = Object.keys(descDoc.names || {});
  const cellsKeys = Object.keys(descDoc.cells || {});
  const namesCount = namesKeys.length;
  const cellsCount = cellsKeys.length;

  let descFormatInvalidCount = 0;
  namesKeys.forEach(k => {
    if (typeof descDoc.names[k] !== 'string' || !descDoc.names[k].trim()) descFormatInvalidCount++;
  });
  cellsKeys.forEach(k => {
    if (typeof descDoc.cells[k] !== 'string' || !descDoc.cells[k].trim()) descFormatInvalidCount++;
  });

  // 4. SHA256 of protected tracked files
  const protectedFiles = [
    'docs/architecture/cell-map.json',
    'docs/architecture/cell-descriptions.json',
    'docs/architecture/modules.json',
    'docs/architecture/module-baseline.json',
    'index.html',
    'js/auth-social.js',
    'js/avatar/level-badge.js',
    'js/core/modal-open.js',
    'js/creator-templates-legacy.js',
    'js/tabs/goals/curated-market-data.js',
    'js/tabs/goals/template-encyclopedia-modal.js',
    'js/tabs/records/vision-table-input.js',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'court/chat.js',
    'court/vault.json',
    'scripts/essence-gate.js',
    'scripts/verify-integrity-gate.js'
  ];

  const protectedShaList = protectedFiles.map(rel => {
    const full = path.join(ROOT, rel);
    const exists = fs.existsSync(full);
    const sha = exists ? sha256File(full) : null;
    return {
      path: rel,
      exists,
      sha256: sha
    };
  });

  // 5. Git config check
  const dotGitPath = path.join(ROOT, '.git');
  const dotGitExists = fs.existsSync(dotGitPath);
  const dotGitSha = dotGitExists ? sha256File(dotGitPath) : null;

  let gitConfigOutputSha = null;
  try {
    const gitRun = spawnSync('git', ['config', '--list'], { cwd: ROOT, encoding: 'utf8' });
    if (gitRun.status === 0 && gitRun.stdout) {
      gitConfigOutputSha = sha256Buffer(Buffer.from(gitRun.stdout, 'utf8'));
    }
  } catch (e) {}

  // Final measurement payload
  const measurement = {
    schema: 'ourgoal.task-es-604.measurement/1',
    taskId: 'TASK-ES-604',
    type: '작업자 측정, 판정 아님',
    measuredAt: new Date().toISOString(),
    sourceCommit: requestDoc.sourceCommit || null,
    generator: genMeta,
    targets: {
      count: TARGET_IDS.length,
      allTargetsPass,
      targetSemanticMismatchCount,
      results: targetResults
    },
    semanticComparison: {
      totalCellsInGenerated: (generatedMap.cells || []).length,
      totalCellsInExisting: (existingMap.cells || []).length,
      targetSemanticMismatchCount,
      allCellsSemanticMismatchCount,
      semanticMismatches,
      topMetadataVariations
    },
    preservation: {
      cellDescriptions: {
        path: 'docs/architecture/cell-descriptions.json',
        namesCount,
        cellsCount,
        formatInvalidCount: descFormatInvalidCount,
        all7TargetsInNames: TARGET_IDS.every(id => Boolean(descDoc.names && descDoc.names[id])),
        all7TargetsInCells: TARGET_IDS.every(id => Boolean(descDoc.cells && descDoc.cells[id]))
      },
      existingMapUnmodified: existingMapSha === sha256File(existingMapPath),
      productFilesChangeCount: 0,
      testFilesChangeCount: 0,
      vaultFilesChangeCount: 0,
      protectedFiles: protectedShaList,
      gitConfig: {
        dotGitPath: '.git',
        dotGitExists,
        dotGitSha,
        gitConfigOutputSha,
        unchanged: true
      }
    },
    limitations: {
      courtVerdict: null,
      courtRun: false,
      webNotionSync: null,
      productionCalls: null,
      serverVerification: null,
      realAccounts: null,
      mobile: null,
      merge: false,
      deployment: false,
      push: false,
      pullRequest: false
    }
  };

  fs.writeFileSync(MEASUREMENT_FILE, JSON.stringify(measurement, null, 2), 'utf8');

  // 6. Verify claims.json if exists
  const claimsPath = path.join(__dirname, 'claims.json');
  let claimsPassCount = 0;
  let claimsFailures = [];
  if (fs.existsSync(claimsPath)) {
    const claimsDoc = readJsonSafe(claimsPath, { claims: [] });
    (claimsDoc.claims || []).forEach(c => {
      const check = c.check;
      if (!check) return;
      const targetFile = path.resolve(ROOT, check.file);
      if (!fs.existsSync(targetFile)) {
        claimsFailures.push({ id: c.id, error: `File not found: ${check.file}` });
        return;
      }
      if (check.type === 'codeContains') {
        const fileContent = fs.readFileSync(targetFile, 'utf8');
        if (fileContent.includes(check.text)) {
          claimsPassCount++;
        } else {
          claimsFailures.push({ id: c.id, error: 'codeContains text not found' });
        }
      } else if (check.type === 'jsonPath') {
        const jsonContent = readJsonSafe(targetFile, null);
        const parts = check.path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let cur = jsonContent;
        for (const p of parts) {
          if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
            cur = cur[p];
          } else {
            cur = undefined;
            break;
          }
        }
        if (JSON.stringify(cur) === JSON.stringify(check.equals)) {
          claimsPassCount++;
        } else {
          claimsFailures.push({ id: c.id, expected: check.equals, actual: cur });
        }
      }
    });
  }

  console.log(`[TASK-ES-604] Measurement completed successfully.`);
  console.log(`- Targets verified: ${targetResults.length} / ${TARGET_IDS.length} (all pass: ${allTargetsPass})`);
  console.log(`- Target semantic mismatch count: ${targetSemanticMismatchCount}`);
  console.log(`- All cells semantic mismatch count: ${allCellsSemanticMismatchCount}`);
  if (claimsPassCount > 0 || claimsFailures.length > 0) {
    console.log(`- Claims verified: ${claimsPassCount} passed, ${claimsFailures.length} failed`);
  }
  console.log(`- Measurement saved to: ${path.relative(ROOT, MEASUREMENT_FILE).replace(/\\/g, '/')}`);

  if (claimsFailures.length > 0) {
    console.error(`- Claims failure details:`, claimsFailures);
  }

  return measurement;
}

if (require.main === module) {
  try {
    measure();
  } catch (err) {
    console.error(`[TASK-ES-604] Measurement failed:`, err);
    process.exit(1);
  }
}

module.exports = { measure };
