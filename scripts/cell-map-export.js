#!/usr/bin/env node
/**
 * 아워골 세포지도 데이터 생성기 (#TASK-ES-414)
 *
 * 사용:
 *   node scripts/cell-map-export.js            — docs/architecture/cell-map.json 을 다시 쓴다
 *   node scripts/cell-map-export.js --stdout   — 파일은 안 고치고 표준 출력에 JSON
 *   node scripts/cell-map-export.js --check    — 저장된 cell-map.json 이 지금 코드로 만든 것과 같은지 출력(종료 코드 0, 판정 아님)
 *                                               기준 커밋 도장(source.commit·short·committedAt·subject)은 비교에서 뺀다(#TASK-ES-424) —
 *                                               지도 갱신 PR 을 병합하면 병합 커밋이 도장을 바꿔 내용이 같아도 다시 「갱신 필요」가 되던 순환을 끊는다.
 *                                               병합 이력에서 나오는 칸(세포별 prs, 그 PR 들에서 온 tasks·reqs)도 비교에서 뺀다(#TASK-ES-427) —
 *                                               PR 번호는 병합 뒤에만 생겨 구조 PR 마다 후속 갱신이 생기던 것을 끊는다. 게시(cell-map-publish --root)는 게시 시점 이력으로 다시 계산해 싣는다.
 *
 * 입력(모두 저장소 안): docs/architecture/modules.json(세포 신고서) · docs/architecture/module-baseline.json(분열 이력)
 *   · docs/architecture/cell-descriptions.json(「이 세포가 하는 일」 한 줄) · js/** 실제 파일(줄 수·머리 주석·노출 이름·require)
 *   · index.html(누가 부르는지·스크립트 태그) · js/core/slots.js(꽂는 자리 15곳) · docs/specs/REQ-TASK-ES-*.md
 *   · git 이력(첫 부모 줄기의 병합 PR 번호·작업 번호·기준 커밋 — git 이 없으면 빈 값)
 * 결정적이다: git 이 추적하는 파일만 읽는다(#TASK-ES-417 — 미추적 파일 무시). 같은 커밋 → 어느 작업 폴더에서든 같은 바이트. 현재 시각을 쓰지 않는다(갱신 시각 = 기준 커밋 시각).
 * 화면: 세포지도 웹페이지(claude.ai artifact)와 노션 「아워골 세포지도 (실시간)」가 이 파일 하나를 읽는다. 절차: scripts/cell-map-sync.md
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const metrics = require('./module-metrics');

const OUT_PATH = path.join('docs', 'architecture', 'cell-map.json');
const SCHEMA = 'ourgoal.cell-map/1';
const BASIS_PATHS = ['js', 'index.html', 'docs/architecture/modules.json', 'docs/architecture/module-baseline.json'];

const TABS = [
  { key: 'home', name: '홈', desc: '앱을 열면 처음 보는 화면 — 오늘 체크인·아바타·히트맵' },
  { key: 'goals', name: '목표', desc: '개인·루틴·팀 목표와 마일스톤·할 일' },
  { key: 'records', name: '기록', desc: '체크인 기록·시간 기록·회고·통계' },
  { key: 'calendar', name: '일정', desc: '달력·하루 상세·사진 일기·AI 일정 비서' },
  { key: 'comm', name: '소통', desc: '피드·동반자·DM·크루' },
  { key: 'settings', name: '설정', desc: '프로필·화면·알림·보안·연동·데이터' }
];

// 여러 탭에 걸치는 하이브리드 세포의 기능 묶음(파일 이름으로 정한다) — 순서가 화면 순서
const FAMILIES = [
  { key: 'avatar', name: '아바타·EXP', desc: '내 아바타 만들기·도감·레벨', test: id => /^avatar/.test(id) || /^data\/avatar-personas\//.test(id) },
  { key: 'stats', name: '성취 통계', desc: '기록에서 지표를 뽑아 차트·리포트로', test: id => /^stats-/.test(id) || id === 'universal-stats' || id === 'records-stats' },
  { key: 'team', name: '팀·동반자·DM', desc: '팀 목표·팀원 점검·동반자·DM·공유', test: id => /^team-/.test(id) },
  { key: 'templates', name: '목표 템플릿', desc: '60가지 전문가 목표 견본과 복제 크레딧', test: id => /^goal-templates/.test(id) || /^data\/goal-templates\//.test(id) || id === 'template-credit' },
  { key: 'time', name: '시간 기록', desc: '전체화면 스톱워치·타이머', test: id => /^time-tracker/.test(id) },
  { key: 'social', name: '반응·스트릭·크레딧', desc: '응원·도움돼요 반응, 출석·배지, 크레딧', test: id => ['reactions', 'streaks', 'credits', 'helpful-reason', 'top-helpful'].includes(id) },
  { key: 'misc', name: '그 밖의 여러 탭 기능', desc: '공유·가이드·첨부·테마·성소·홈 구성', test: () => true }
];

const KIND_INFO = {
  organ: { name: '기관', desc: '몸 전체를 받치는 세포(신호망·상태·원장·보안·알림·공용 화면 부품) — 능력을 주는 쪽' },
  tab: { name: '탭 세포', desc: '탭의 기능. 큰 세포 = 탭 하나, 작은 세포 = 큰 세포 안의 한 책임' },
  hybrid: { name: '하이브리드', desc: '여러 탭·여러 자리에 걸치는 세포' },
  future: { name: '미래 세포', desc: '자리만 있는 세포(파일 없음)' }
};

function readJson(root, rel, fallback) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort();
}

function git(root, args) {
  const r = spawnSync('git', ['-C', root].concat(args), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 || r.error) return null;
  return r.stdout;
}

/** 파일 머리 주석의 내용 줄(구분선·빈 줄 제외) */
function headerLines(raw) {
  const m = /^\s*(?:(?:'use strict'|"use strict");?\s*)?\/\*\*?([\s\S]*?)\*\//.exec(raw);
  if (!m) return [];
  return m[1].split('\n')
    .map(l => l.replace(/^\s*\*\s?/, '').trim())
    .filter(l => l && !/^[=\-~*_]{4,}$/.test(l))
    .map(l => l.replace(/^@role\s+/, ''));
}

function allMatches(text, re) {
  const out = [];
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m;
  while ((m = g.exec(text))) out.push(m[1]);
  return out;
}

function exposedNames(code) {
  return uniqSorted(allMatches(code, /\b(?:global|window|globalThis|win|root)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/));
}

function tasksIn(text) {
  return uniqSorted(allMatches(text, /TASK-ES-(\d{2,4})\b/i).map(n => 'TASK-ES-' + String(Number(n)).padStart(3, '0')));
}

/** 첫 부모 줄기의 병합 PR 목록: [{ number, task, title, date, files[] }] (새 것 먼저) */
function mergedPrs(root) {
  const out = git(root, ['log', '--first-parent', '--diff-merges=first-parent', '--name-only', '--format=%x1e%h%x1f%cs%x1f%s%x1f%b%x1f', 'HEAD', '--', 'js']);
  if (!out) return [];
  const prs = [];
  for (const chunk of out.split('\x1e')) {
    if (!chunk.trim()) continue;
    const [, date, subject, body, rest] = chunk.split('\x1f');
    const m = /^Merge pull request #(\d+) from \S+?\/(\S+)/.exec(subject || '');
    if (!m) continue;
    const task = /task-es-(\d{2,4})/i.exec(m[2]);
    prs.push({
      number: Number(m[1]),
      task: task ? 'TASK-ES-' + String(Number(task[1])).padStart(3, '0') : null,
      title: String(body || '').split('\n').map(s => s.trim()).find(Boolean) || m[2],
      date,
      files: String(rest || '').split('\n').map(s => s.trim()).filter(f => /^js\/.*\.js$/.test(f))
    });
  }
  return prs;
}

function basisCommit(root) {
  const out = git(root, ['log', '-1', '--first-parent', '--format=%H%x1f%h%x1f%cI%x1f%s', 'HEAD', '--'].concat(BASIS_PATHS));
  if (!out || !out.trim()) return { commit: null, short: null, committedAt: null, subject: null };
  const [commit, short, committedAt, subject] = out.trim().split('\x1f');
  return { commit, short, committedAt, subject };
}

function reqFiles(root) {
  const dir = path.join(root, 'docs', 'specs');
  const map = {};
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir).sort()) {
    const m = /^REQ-TASK-ES-(\d{2,4})\b.*\.md$/i.exec(f);
    if (!m) continue;
    const key = 'TASK-ES-' + String(Number(m[1])).padStart(3, '0');
    (map[key] = map[key] || []).push('docs/specs/' + f);
  }
  return map;
}

/** 구조도 이름표: 손으로 쓴 짧은 이름 → 「하는 일」 첫 구절(— 앞, 20자 이하) → 세포 id */
function shortName(hand, does, id) {
  if (hand && String(hand).trim()) return String(hand).trim();
  const head = String(does || '').split(' — ')[0].trim();
  if (head && head !== does && head.length <= 20) return head;
  return id;
}

function areaOf(cell) {
  if (cell.kind === 'tab') return cell.tab;
  if (cell.kind === 'organ') return /^core\//.test(cell.id) ? 'organ-core' : 'organ-body';
  if (cell.kind === 'future') return 'future';
  return 'family-' + FAMILIES.find(f => f.test(cell.id)).key;
}

function resolveRequire(fromFile, spec) {
  if (!/^\.\.?\//.test(spec)) return null;
  let p = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  if (!/\.js$/.test(p)) p += '.js';
  return p;
}

/** 분열 이력: 기준선 첫 기록의 800줄 초과 파일 → 지금 줄 수 · 줄 수가 바뀐 순간들 · 떼어 낸 부품 */
function splitHistory(baseline, cells, linesByFile) {
  const hist = (baseline && baseline.history) || [];
  if (!hist.length) return { first: null, items: [] };
  const first = hist[0];
  const firstFiles = first.metrics.oversizeJsFiles.files;
  const items = Object.keys(firstFiles).sort((a, b) => firstFiles[b] - firstFiles[a]).map(file => {
    const steps = [];
    let prev = null;
    for (const h of hist) {
      const v = h.metrics.oversizeJsFiles.files[file];
      const val = v === undefined ? '≤800' : v;
      if (val !== prev) steps.push({ date: h.date, commit: h.commit, lines: val });
      prev = val;
    }
    const base = path.posix.basename(file);
    const parts = cells.filter(c => c.file && c.file !== file && c.headerAll.some(l => l.includes(file) && l.includes('옮')))
      .map(c => ({ id: c.id, file: c.file, lines: c.lines }));
    const now = Object.prototype.hasOwnProperty.call(linesByFile, file) ? linesByFile[file] : null;
    return {
      file, name: base, firstLines: firstFiles[file], nowLines: now,
      over800Now: now !== null && now > metrics.MAX_LINES,
      steps, parts: parts.sort((a, b) => a.id < b.id ? -1 : 1)
    };
  });
  return { first: { date: first.date, commit: first.commit, count: first.metrics.oversizeJsFiles.count }, items };
}

function buildFrom(root, gitRoot) {
  const spec = readJson(root, 'docs/architecture/modules.json', { cells: [] });
  const baseline = readJson(root, 'docs/architecture/module-baseline.json', { history: [] });
  const descDoc = readJson(root, 'docs/architecture/cell-descriptions.json', { cells: {} });
  const desc = descDoc.cells || {};
  const shortNames = descDoc.names || {};
  const indexHtml = fs.existsSync(path.join(root, 'index.html')) ? fs.readFileSync(path.join(root, 'index.html'), 'utf8') : '';
  const indexScriptCode = metrics.blankCommentOnlyLines(metrics.inlineScripts(indexHtml).map(s => s.body).join('\n'));
  const loadedByIndex = new Set(allMatches(indexHtml, /<script[^>]*\bsrc="([^"?#]+)/).map(s => s.replace(/^\.\//, '')));
  const slotsMod = require(path.join(root, 'js', 'core', 'slots.js'));
  const prs = mergedPrs(gitRoot);
  const reqs = reqFiles(root);
  const m = metrics.measure(root);

  // 1차: 파일에서 읽는 칸
  const cells = spec.cells.map(c => {
    const raw = c.file && fs.existsSync(path.join(root, c.file)) ? fs.readFileSync(path.join(root, c.file), 'utf8') : '';
    const code = metrics.blankCommentOnlyLines(raw);
    const head = headerLines(raw);
    return {
      src: c, id: c.id, file: c.file || null, kind: c.kind, size: c.size || null,
      lines: c.file ? metrics.countLines(raw) : null,
      headerAll: head,
      exposes: exposedNames(code),
      requires: uniqSorted((c.dependsOn || []).filter(d => /^require:/.test(d)).map(d => resolveRequire(c.file, d.slice(8))).filter(Boolean)),
      readsGlobals: uniqSorted((c.dependsOn || []).filter(d => !/^require:/.test(d))),
      headTasks: tasksIn(head.join('\n'))
    };
  });
  const byFile = new Map(cells.filter(c => c.file).map(c => [c.file, c]));
  // 이름 → 그 이름을 다는 세포들(여러 부품이 같이 채우는 키트는 모두). index.html 도 다는 이름은 미분화 덩어리 쪽으로 센다
  const indexDefined = new Set(exposedNames(indexScriptCode));
  const exposer = new Map();
  cells.forEach(c => c.exposes.forEach(n => { if (!indexDefined.has(n)) (exposer.get(n) || exposer.set(n, []).get(n)).push(c.id); }));
  const linesByFile = {};
  cells.forEach(c => { if (c.file) linesByFile[c.file] = c.lines; });

  // 2차: 누구를 부르고 누가 부르는지
  const calls = new Map(cells.map(c => [c.id, new Set()]));
  cells.forEach(c => {
    c.requires.forEach(f => { const t = byFile.get(f); if (t && t.id !== c.id) calls.get(c.id).add(t.id); });
    c.readsGlobals.forEach(n => (exposer.get(n) || []).forEach(t => { if (t !== c.id) calls.get(c.id).add(t); }));
  });
  const calledBy = new Map(cells.map(c => [c.id, new Set()]));
  calls.forEach((set, from) => set.forEach(to => calledBy.get(to).add(from)));

  const prsByFile = {};
  prs.forEach(p => p.files.forEach(f => { (prsByFile[f] = prsByFile[f] || []).push(p); }));

  const outCells = cells.map(c => {
    const s = c.src;
    const filePrs = (prsByFile[c.file] || []).slice(0, 8).map(p => ({ number: p.number, task: p.task, title: p.title, date: p.date }));
    const tasks = uniqSorted(c.headTasks.concat(filePrs.map(p => p.task).filter(Boolean)));
    const reqList = uniqSorted([].concat(...tasks.map(t => reqs[t] || [])));
    const hand = desc[c.id];
    const fallback = c.headerAll[0] || s.role || c.id;
    const tabs = s.kind === 'tab' ? [s.tab] : (s.spans || []);
    return {
      id: c.id,
      file: c.file,
      kind: c.kind,
      kindName: (KIND_INFO[c.kind] || { name: c.kind }).name + (c.size === 'large' ? '(큰 세포)' : c.size === 'small' ? '(작은 세포)' : ''),
      size: c.size,
      area: areaOf(s),
      tabs,
      name: shortName(shortNames[c.id], hand || fallback, c.id),
      nameSource: shortNames[c.id] ? 'hand' : 'derived',
      does: hand || fallback,
      doesSource: hand ? 'hand' : 'header',
      header: c.headerAll.slice(0, 4),
      lines: c.lines,
      over800: c.lines !== null && c.lines > metrics.MAX_LINES,
      exposes: c.exposes,
      calls: Array.from(calls.get(c.id)).sort(),
      calledBy: Array.from(calledBy.get(c.id)).sort(),
      readsFromIndexHtml: c.readsGlobals.filter(n => indexDefined.has(n)),
      loadedByIndexHtml: c.file ? loadedByIndex.has(c.file) : false,
      usedByIndexHtml: c.exposes.filter(n => new RegExp('\\b' + n.replace(/\$/g, '\\$') + '\\b').test(indexScriptCode)),
      emits: s.emits || [],
      listens: s.listens || [],
      provides: s.provides || [],
      requiresAbilities: s.requires || [],
      contributes: s.contributes || [],
      planned: s.planned || { provides: [], contributes: [] },
      tasks,
      reqs: reqList,
      prs: filePrs
    };
  });

  const areas = [];
  TABS.forEach(t => areas.push({ key: t.key, group: 'tab', name: t.name + ' 탭', desc: t.desc }));
  FAMILIES.forEach(f => areas.push({ key: 'family-' + f.key, group: 'hybrid', name: f.name, desc: f.desc }));
  areas.push({ key: 'organ-core', group: 'organ', name: '골격(core)', desc: '신호망·등록부·상태·능력·꽂는 자리·공용 통로' });
  areas.push({ key: 'organ-body', group: 'organ', name: '몸 전체 기관', desc: '계정 보안·원장·알림·검열·공용 화면 부품' });
  areas.push({ key: 'future', group: 'future', name: '미래 세포', desc: '아직 파일이 없는 자리' });
  areas.forEach(a => {
    const list = outCells.filter(c => c.area === a.key);
    a.cells = list.map(c => c.id);
    a.lines = list.reduce((s, c) => s + (c.lines || 0), 0);
    a.over800 = list.filter(c => c.over800).length;
  });
  // 탭 큰 세포를 탭 영역 맨 앞에
  areas.filter(a => a.group === 'tab').forEach(a => {
    a.cells.sort((x, y) => (/\/index$/.test(y) ? 1 : 0) - (/\/index$/.test(x) ? 1 : 0) || (x < y ? -1 : 1));
  });
  const nonEmptyAreas = areas.filter(a => a.cells.length);

  const kinds = Object.keys(KIND_INFO).map(k => ({
    key: k, name: KIND_INFO[k].name, desc: KIND_INFO[k].desc,
    count: outCells.filter(c => c.kind === k).length,
    large: k === 'tab' ? outCells.filter(c => c.kind === 'tab' && c.size === 'large').length : undefined,
    small: k === 'tab' ? outCells.filter(c => c.kind === 'tab' && c.size === 'small').length : undefined
  }));

  const slots = slotsMod.DEFAULT_SLOTS.map(sl => ({
    key: sl.name, label: sl.description, host: sl.host, future: !!sl.future,
    contributors: outCells.filter(c => c.contributes.includes(sl.name)).map(c => c.id),
    planned: outCells.filter(c => (c.planned.contributes || []).includes(sl.name)).map(c => c.id)
  }));

  const splits = splitHistory(baseline, cells, linesByFile);
  const oversizeNow = m.ratchet.oversizeJsFiles.files;

  return {
    schema: SCHEMA,
    source: Object.assign({ repo: 'yangsangmin/ourgoal-app', generator: 'scripts/cell-map-export.js', basisPaths: BASIS_PATHS }, basisCommit(gitRoot)),
    summary: {
      cells: outCells.length,
      files: outCells.filter(c => c.file).length,
      jsLines: outCells.reduce((s, c) => s + (c.lines || 0), 0),
      kinds: kinds.reduce((o, k) => { o[k.key] = k.count; return o; }, {}),
      descriptionsHand: outCells.filter(c => c.doesSource === 'hand').length,
      descriptionsPending: outCells.filter(c => c.doesSource !== 'hand').map(c => c.id),
      oversize: {
        limit: metrics.MAX_LINES,
        first: splits.first ? splits.first.count : null,
        firstDate: splits.first ? splits.first.date : null,
        firstCommit: splits.first ? splits.first.commit : null,
        now: Object.keys(oversizeNow).length,
        nowFiles: Object.keys(oversizeNow).map(f => ({ file: f, lines: oversizeNow[f] }))
      },
      undifferentiated: {
        file: 'index.html',
        role: '미분화 덩어리 — 아직 세포로 나뉘지 않은 index.html 안 스크립트. 여기서 세포를 하나씩 떼어 낸다',
        inlineScriptLines: m.ratchet.inlineScriptLines,
        functionDecls: m.ratchet.indexFunctionDecls
      },
      health: {
        undifferentiatedLines: m.health.undifferentiatedLines,
        globalLinks: m.health.globalLinks,
        oversizeCells: m.health.oversizeCells,
        drawingSmallCells: m.health.drawingSmallCells,
        duplicateCells: m.health.duplicateCells,
        dataDuplicates: m.health.dataDuplicates,
        crossTabRefs: m.ratchet.crossTabRefs
      }
    },
    kinds,
    areas: nonEmptyAreas,
    slots,
    splits: splits.items,
    cells: outCells
  };
}

/** 생성기가 읽는 경로(모두 이 아래만 읽는다) — module-metrics 가 재는 js/**·index.html·ui.js·docs/specs 원장 설계서 포함 */
const INPUT_PATHS = ['js', 'index.html', 'ui.js', 'docs/architecture', 'docs/specs'];

/** git 이 추적하는 입력 파일 목록(작업 트리에 실제로 있는 것만). git 이 없으면 null */
function trackedInputs(root) {
  const out = git(root, ['ls-files', '-z', '--'].concat(INPUT_PATHS));
  if (out === null) return null;
  return out.split('\0').filter(Boolean).filter(f => fs.existsSync(path.join(root, f))).sort();
}

/**
 * 저장소 root 의 세포지도. 추적 파일만 임시 폴더에 옮겨 놓고 거기서 읽는다 —
 * 다른 세션이 남긴 미추적 문서·코드는 출력에 들어가지 않는다(같은 커밋·같은 추적 파일 내용 → 같은 바이트).
 * git 이 없으면 작업 트리를 그대로 읽는다.
 */
function build(root) {
  const files = trackedInputs(root);
  if (files === null) return buildFrom(root, root);
  const snap = fs.mkdtempSync(path.join(os.tmpdir(), 'cell-map-'));
  try {
    for (const f of files) {
      const dest = path.join(snap, f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(root, f), dest);
    }
    return buildFrom(snap, root);
  } finally {
    fs.rmSync(snap, { recursive: true, force: true });
  }
}

function serialize(doc) {
  return JSON.stringify(doc, null, 1) + '\n';
}

/** 기준 커밋 도장 칸 — 어느 커밋에서 만들었는지 적는 칸이라 내용 비교에서 뺀다(#TASK-ES-424) */
const STAMP_FIELDS = ['commit', 'short', 'committedAt', 'subject'];

/** 도장을 뺀 내용 */
function withoutStamp(doc) {
  const copy = JSON.parse(JSON.stringify(doc));
  if (copy && copy.source) STAMP_FIELDS.forEach(k => { delete copy.source[k]; });
  return copy;
}

/** 병합 이력에서 나오는 세포 칸(#TASK-ES-427) — PR 번호는 병합 뒤에만 생기므로 내용 비교에서 뺀다 */
const HISTORY_FIELDS = ['prs'];

/**
 * 두 지도에서 병합 이력으로 생긴 부분을 같은 방식으로 걷어 낸다.
 * 세포마다 prs 를 지우고, 양쪽 어느 한쪽의 prs 에서 온 작업 번호(tasks)와 그 REQ(reqs)를 양쪽 모두에서 지운다.
 * (머리 주석에서 온 작업 번호도 같은 번호면 같이 지워지지만, 머리 주석이 바뀌면 header 칸이 달라져 여전히 잡힌다.)
 */
function withoutHistoryPair(savedDoc, builtDoc) {
  const a = JSON.parse(JSON.stringify(savedDoc));
  const b = JSON.parse(JSON.stringify(builtDoc));
  const prTasks = new Map();
  for (const d of [a, b]) {
    for (const c of d.cells || []) {
      const set = prTasks.get(c.id) || new Set();
      (c.prs || []).forEach(p => { if (p && p.task) set.add(p.task); });
      prTasks.set(c.id, set);
    }
  }
  const reqOf = t => new RegExp('REQ-' + t.replace(/[-]/g, '\\-') + '\\b');
  for (const d of [a, b]) {
    for (const c of d.cells || []) {
      const drop = prTasks.get(c.id) || new Set();
      HISTORY_FIELDS.forEach(k => { delete c[k]; });
      if (Array.isArray(c.tasks)) c.tasks = c.tasks.filter(t => !drop.has(t));
      if (Array.isArray(c.reqs)) c.reqs = c.reqs.filter(r => ![...drop].some(t => reqOf(t).test(r)));
    }
  }
  return { saved: a, built: b };
}

/**
 * 저장본이 지금 코드로 만든 것과 같은가.
 * 도장(source.commit·short·committedAt·subject, #TASK-ES-424)과 병합 이력 칸(prs 와 거기서 온 tasks·reqs, #TASK-ES-427)만 다르면 같다고 본다.
 * 돌려주는 값: { fresh, stampOnly } — stampOnly 는 도장·이력 칸만 다를 때 true. 이력 칸(prs 등)이 다를 때만 historyOnly: true 가 붙는다
 */
function compareSaved(savedText, builtText) {
  if (savedText === null || savedText === undefined) return { fresh: false, stampOnly: false };
  const a = String(savedText).replace(/\r\n/g, '\n');
  if (a === builtText) return { fresh: true, stampOnly: false };
  let saved;
  try { saved = JSON.parse(a); } catch (e) { return { fresh: false, stampOnly: false }; }
  const built = JSON.parse(builtText);
  if (serialize(withoutStamp(saved)) === serialize(withoutStamp(built))) return { fresh: true, stampOnly: true };
  const pair = withoutHistoryPair(withoutStamp(saved), withoutStamp(built));
  const same = serialize(pair.saved) === serialize(pair.built);
  return same ? { fresh: true, stampOnly: true, historyOnly: true } : { fresh: false, stampOnly: false };
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const ri = argv.indexOf('--root');
  const root = ri >= 0 ? path.resolve(argv[ri + 1]) : path.join(__dirname, '..');
  const text = serialize(build(root));
  if (argv.includes('--stdout')) {
    process.stdout.write(text);
  } else if (argv.includes('--check')) {
    const p = path.join(root, OUT_PATH);
    const saved = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    const r = compareSaved(saved, text);
    if (r.fresh && r.stampOnly) {
      const was = JSON.parse(saved.replace(/\r\n/g, '\n')).source || {};
      const what = r.historyOnly ? '기준 커밋 도장·병합 이력(PR 목록)만 다름' : '기준 커밋 도장만 다름';
      console.log(`세포지도 최신: 내용이 같다(${what}: 저장본 ${was.short} · 지금 ${JSON.parse(text).source.short} — 다시 만들 필요 없음, 게시는 cell-map-publish --root 로 이력을 새로 계산)`);
    } else {
      console.log(r.fresh ? '세포지도 최신: 저장본과 지금 코드로 만든 것이 같다' : '세포지도 갱신 필요: node scripts/cell-map-export.js 를 실행한다');
    }
  } else {
    const p = path.join(root, OUT_PATH);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text, 'utf8');
    const doc = JSON.parse(text);
    console.log(`cell-map.json 갱신: 세포 ${doc.summary.cells} · 영역 ${doc.areas.length} · 800줄 초과 처음 ${doc.summary.oversize.first} → 지금 ${doc.summary.oversize.now} · 기준 커밋 ${doc.source.short} (${doc.source.committedAt}) · ${Buffer.byteLength(text)}바이트`);
  }
}

module.exports = { build, buildFrom, shortName, compareSaved, withoutStamp, withoutHistoryPair, STAMP_FIELDS, HISTORY_FIELDS, trackedInputs, INPUT_PATHS, serialize, headerLines, OUT_PATH, SCHEMA, TABS, FAMILIES };
