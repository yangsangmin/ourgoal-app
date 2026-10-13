#!/usr/bin/env node
/**
 * 모듈 가드 — 모듈화 부채 래칫 (#TASK-ES-356 · 노션 CORE-08)
 *
 * 상민님 원문(2026-10-04): "향후 개발 및 개선작업 지속시 우상향적이고 시너지를 내면서 확장하고 개발될 수 있는 청사진"
 * → 부채 지표가 기준선보다 늘면 실패, 줄면 통과하고 "기준선을 낮출 수 있다"고 알린다. 기준선은 줄어드는 방향으로만 고친다.
 *
 * 사용:
 *   node scripts/module-guard.js                       — 검사(npm test 가 scripts/test-shipyard-modular.js 를 거쳐 부른다)
 *   node scripts/module-guard.js --update              — 지금 값이 기준선 이하일 때만 기준선을 지금 값으로 낮춘다
 *   node scripts/module-guard.js --update --reason "…" — 늘어난 값을 기준선에 올린다(사유 20자 이상 필수, 이력에 남는다)
 *   공통 선택: --root <저장소> --baseline <기준선.json> --quiet
 *
 * 재는 것: scripts/module-metrics.js measure() 의 ratchet 다섯 가지
 *   ① inlineScriptLines ② indexFunctionDecls ③ windowAssignments ④ oversizeJsFiles(수 + 파일별 줄 수) ⑤ crossTabRefs
 * 기준선 파일: docs/architecture/module-baseline.json — { history: [{ date, commit, reason?, metrics }] }, 마지막 항목이 현재 기준선.
 *   이력의 앞 항목보다 값이 커진 항목은 reason(20자 이상)이 있어야 한다. 없으면 가드가 실패한다(손으로 올리는 것 차단).
 * 덧붙여 세포 신고서(docs/architecture/modules.json)를 검증한다: 신고서 없는 새 세포·필요한 능력(requires)을 아무도 주지 않음·
 *   데이터 주인(owns) 둘·능력 주인 둘 → 실패, 신고서와 코드의 신호(emits·listens) 불일치 → 경고.
 *
 * 종료 코드: 0 통과 · 1 실패(늘어남 또는 기준선 이력 위반) · 2 사용법/파일 오류
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { measure } = require('./module-metrics');

const DEFAULT_BASELINE = path.join('docs', 'architecture', 'module-baseline.json');
const SCALAR_KEYS = ['inlineScriptLines', 'indexFunctionDecls', 'windowAssignments', 'crossTabRefs'];
const LABEL = {
  inlineScriptLines: '① index.html 인라인 스크립트 줄 수',
  indexFunctionDecls: '② index.html 함수 선언 수',
  windowAssignments: '③ window 전역 직접 대입 수',
  oversizeJsFiles: '④ 800줄 초과 js 파일 수',
  crossTabRefs: '⑤ 탭 간 직접 참조 수'
};
const MIN_REASON = 20;

function parseArgs(argv) {
  const a = { root: path.join(__dirname, '..'), baseline: null, update: false, reason: null, quiet: false, noSpecs: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--root') a.root = path.resolve(argv[++i]);
    else if (k === '--baseline') a.baseline = path.resolve(argv[++i]);
    else if (k === '--update') a.update = true;
    else if (k === '--reason') a.reason = String(argv[++i] || '');
    else if (k === '--quiet') a.quiet = true;
    else if (k === '--no-specs') a.noSpecs = true;
  }
  if (!a.baseline) a.baseline = path.join(a.root, DEFAULT_BASELINE);
  return a;
}

// measure() 결과에서 기준선에 적는 값만
function snapshot(m) {
  return {
    inlineScriptLines: m.ratchet.inlineScriptLines,
    indexFunctionDecls: m.ratchet.indexFunctionDecls,
    windowAssignments: m.ratchet.windowAssignments,
    oversizeJsFiles: { count: m.ratchet.oversizeJsFiles.count, files: Object.assign({}, m.ratchet.oversizeJsFiles.files) },
    crossTabRefs: m.ratchet.crossTabRefs
  };
}

/**
 * 기준선(base) 대비 지금(cur) 견주기.
 * @returns {{ failures: string[], lowerable: string[] }}
 */
function compareToBaseline(base, cur) {
  const failures = [];
  const lowerable = [];
  for (const k of SCALAR_KEYS) {
    const b = base[k];
    const c = cur[k];
    if (typeof b !== 'number') { failures.push(`${LABEL[k]}: 기준선 값 없음`); continue; }
    if (c > b) failures.push(`${LABEL[k]}: ${b} → ${c} (+${c - b}) — 늘었다`);
    else if (c < b) lowerable.push(`${LABEL[k]}: ${b} → ${c} (-${b - c})`);
  }
  const bo = base.oversizeJsFiles || { count: 0, files: {} };
  const co = cur.oversizeJsFiles;
  if (co.count > bo.count) failures.push(`${LABEL.oversizeJsFiles}: ${bo.count} → ${co.count} (+${co.count - bo.count}) — 늘었다`);
  else if (co.count < bo.count) lowerable.push(`${LABEL.oversizeJsFiles}: ${bo.count} → ${co.count}`);
  for (const f of Object.keys(co.files)) {
    const bl = bo.files[f];
    if (bl === undefined) failures.push(`④ ${f}: 새로 800줄을 넘었다(${co.files[f]}줄) — 책임 단위로 나눈다`);
    else if (co.files[f] > bl) failures.push(`④ ${f}: ${bl} → ${co.files[f]}줄 (+${co.files[f] - bl}) — 이미 800줄을 넘는 파일이 더 길어졌다`);
    else if (co.files[f] < bl) lowerable.push(`④ ${f}: ${bl} → ${co.files[f]}줄`);
  }
  for (const f of Object.keys(bo.files)) if (co.files[f] === undefined) lowerable.push(`④ ${f}: 800줄 이하가 됐거나 없어졌다(기준선 ${bo.files[f]}줄)`);
  return { failures, lowerable };
}

// 이력 검사: 앞 항목보다 커진 값은 reason 이 있어야 한다
function validateHistory(doc) {
  const errs = [];
  const h = doc && Array.isArray(doc.history) ? doc.history : null;
  if (!h || !h.length) return ['기준선 파일에 history 가 없다'];
  for (let i = 1; i < h.length; i++) {
    const prev = h[i - 1].metrics;
    const cur = h[i].metrics;
    const r = compareToBaseline(prev, cur);
    if (r.failures.length && !(typeof h[i].reason === 'string' && h[i].reason.trim().length >= MIN_REASON)) {
      errs.push(`기준선 이력 ${i}번(${h[i].date})이 사유 없이 값을 올렸다: ${r.failures.join(' / ')}`);
    }
  }
  return errs;
}

function readBaseline(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function gitHead(root) {
  try {
    return require('child_process').execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return null;
  }
}

// 세포 신고서 검증(docs/architecture/modules.json): 실패 = 신고서 없는 새 세포·requires 미제공·owns 주인 둘 등, 경고 = 신호 불일치 등
function cellCheck(root) {
  try {
    const specs = require('./module-specs');
    return specs.validate(root, specs.readDeclared(root));
  } catch (e) {
    return { failures: ['세포 신고서 검증 실패: ' + e.message], warnings: [] };
  }
}

/**
 * 검사 본체. 돌려주는 값: { ok, failures, lowerable, warnings, current }
 */
function run(opts) {
  const o = Object.assign({ root: path.join(__dirname, '..') }, opts || {});
  const baselinePath = o.baseline || path.join(o.root, DEFAULT_BASELINE);
  const doc = readBaseline(baselinePath);
  const current = snapshot(measure(o.root));
  if (!doc) return { ok: false, failures: [`기준선 파일 없음: ${baselinePath}`], lowerable: [], warnings: [], current };
  const histErrs = validateHistory(doc);
  const base = doc.history[doc.history.length - 1].metrics;
  const r = compareToBaseline(base, current);
  const cells = o.noSpecs ? { failures: [], warnings: [] } : cellCheck(o.root);
  const warnings = cells.warnings;
  const failures = histErrs.concat(r.failures, cells.failures.map(f => '신고서: ' + f));
  return { ok: failures.length === 0, failures, lowerable: r.lowerable, warnings, current, base };
}

/**
 * 기준선 갱신. 늘어난 값이 있으면 reason(20자 이상) 없이는 거부한다.
 */
function update(opts) {
  const o = Object.assign({ root: path.join(__dirname, '..') }, opts || {});
  const baselinePath = o.baseline || path.join(o.root, DEFAULT_BASELINE);
  const doc = readBaseline(baselinePath) || { schema: 'ourgoal.module-baseline/1', history: [] };
  const current = snapshot(measure(o.root));
  const entry = { date: o.date || new Date().toISOString().slice(0, 10), commit: gitHead(o.root), metrics: current };
  if (doc.history.length) {
    const base = doc.history[doc.history.length - 1].metrics;
    const r = compareToBaseline(base, current);
    if (r.failures.length) {
      if (!(typeof o.reason === 'string' && o.reason.trim().length >= MIN_REASON)) {
        return { ok: false, message: `기준선 올리기 거부 — 사유(--reason, ${MIN_REASON}자 이상) 필요: ${r.failures.join(' / ')}` };
      }
      entry.reason = o.reason.trim();
    } else if (!r.lowerable.length) {
      return { ok: true, message: '기준선과 같다 — 고칠 것 없음', unchanged: true };
    }
  } else if (o.reason) {
    entry.reason = o.reason.trim();
  }
  doc.history.push(entry);
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  return { ok: true, message: `기준선 갱신(${doc.history.length}번째): ${baselinePath}` };
}

if (require.main === module) {
  const a = parseArgs(process.argv.slice(2));
  if (a.update) {
    const r = update({ root: a.root, baseline: a.baseline, reason: a.reason });
    console.log((r.ok ? '✓ ' : '✖ ') + r.message);
    process.exit(r.ok ? 0 : 1);
  }
  let r;
  try {
    r = run({ root: a.root, baseline: a.baseline, noSpecs: a.noSpecs });
  } catch (e) {
    console.error('✖ 모듈 가드 실행 오류: ' + e.message);
    process.exit(2);
  }
  const c = r.current;
  if (!a.quiet) {
    console.log(`[모듈 가드] ① ${c.inlineScriptLines} · ② ${c.indexFunctionDecls} · ③ ${c.windowAssignments} · ④ ${c.oversizeJsFiles.count} · ⑤ ${c.crossTabRefs}`);
    r.warnings.forEach(w => console.log('  ⚠ 신고서: ' + w));
    if (r.lowerable.length) {
      console.log('  ↓ 기준선을 낮출 수 있다(node scripts/module-guard.js --update):');
      r.lowerable.forEach(l => console.log('    - ' + l));
    }
  }
  if (!r.ok) {
    console.error('✖ 모듈 가드 실패 — 모듈화 부채가 기준선(docs/architecture/module-baseline.json)보다 늘었다:');
    r.failures.forEach(f => console.error('  - ' + f));
    console.error('  규칙: docs/architecture/MODULE-BLUEPRINT.md 「래칫」. 꼭 늘려야 하면 --update --reason "<20자 이상 사유>"');
    process.exit(1);
  }
  console.log('✓ 모듈 가드 통과');
}

module.exports = { run, update, compareToBaseline, validateHistory, snapshot, MIN_REASON };
