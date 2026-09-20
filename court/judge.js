#!/usr/bin/env node
'use strict';
// 법정(court) 본체 — 작업 커밋(head)을 기준 커밋(base)과 나란히 띄워 놓고 판정한다.
//   node court/judge.js --repo <저장소> [--head <rev>] [--base <rev>] [--out <폴더>] [--quick] [--json]
// 종료코드: 0 통과 · 3 확인 부족 · 1 돌려보냄 · 2 심사 못 함(통과가 아니다)
// 원칙: ① 작업자는 주장만 쓰고 판정은 법정이 낸다 ② 증거는 법정이 다시 실행해 만든다 ③ 못 잰 것은 "확인 못 함"이다(지어내지 않는다)
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const git = require('./lib/git');
const server = require('./lib/static-server');
const grade = require('./lib/grade');
const { loadConfig } = require('./lib/scenario');
const { checkVault, loadVault, matcher } = require('./vault-check');
const claimsLib = require('./claims');
const { probeBoot } = require('./probes/boot');
const { probeBaseTests } = require('./probes/base-tests');
const report = require('./report');

const EXIT = { '통과': 0, '확인 부족': 3, '돌려보냄': 1, '심사 못 함': 2, '심사 전': 0 };
const ENV_DETECT = /navigator\s*\.\s*webdriver|HeadlessChrome|court-probe|__court|isHeadless/;
const TEST_BYPASS = /process\s*\.\s*exit\s*\(\s*0\s*\)|process\s*\.\s*env\s*\.\s*(CI|GITHUB_ACTIONS|COURT)\b/;
const SCRIPT_EXT = /\.(js|mjs|cjs|sh|ps1|py|bat|cmd)$/i;

function parseArgs(argv) {
  const a = { repo: process.cwd(), head: 'HEAD', base: null, out: null, quick: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--quick') a.quick = true; else if (k === '--json') a.json = true;
    else if (['--repo', '--head', '--base', '--out'].includes(k)) a[k.slice(2)] = argv[++i];
    else throw new Error('알 수 없는 인자: ' + k);
  }
  return a;
}

// PR 코드(부품)를 실제로 실행하는 탐침은 자식 프로세스에서, 가능하면 권한 제한(파일 쓰기·프로세스 실행 금지)을 걸고 돌린다.
function runModuleProbe(baseDir, headDir) {
  const script = path.join(__dirname, 'probes', 'module-load.js');
  const flags = [];
  const allowed = process.allowedNodeEnvironmentFlags;
  const perm = allowed.has('--permission') ? '--permission' : (allowed.has('--experimental-permission') ? '--experimental-permission' : null);
  if (perm) { flags.push(perm); for (const d of [path.resolve(__dirname), baseDir, headDir]) flags.push('--allow-fs-read=' + d); } // 쉼표 구분은 최신 Node 에서 폐지됐다 — 경로마다 따로 준다
  const r = spawnSync(process.execPath, [...flags, script, baseDir, headDir], { encoding: 'utf8', env: { PATH: process.env.PATH || '' }, timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || (r.status !== 0 && r.status !== 1)) return { toolError: '부품 로드 탐침 실행 실패: ' + ((r.error && r.error.message) || r.stderr || 'exit ' + r.status).slice(0, 300) };
  try {
    const j = JSON.parse(r.stdout); j.isolated = !!perm;
    // 탐침이 "아무것도 안 봤는데 문제없음"을 내는 것이 가장 위험하다. 부품을 하나도 못 읽었으면 통과가 아니라 도구 오류다.
    if (!j.counts || j.counts.head === 0 || j.counts.base === 0) return { toolError: '부품 로드 탐침이 부품을 하나도 읽지 못했다(기준 ' + (j.counts ? j.counts.base : '?') + '개, 작업 ' + (j.counts ? j.counts.head : '?') + '개) — 점검하지 않은 것을 점검했다고 할 수 없다' };
    return j;
  } catch (e) { return { toolError: '부품 로드 탐침 출력 해석 실패: ' + String(r.stdout).slice(0, 120) }; }
}

function addedLines(repo, base, head, file) {
  return git.fileDiff(repo, base, head, file).split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
}

function findClaimsFiles(changed) { return changed.filter(f => /^reports\/[A-Za-z0-9_-]+\/claims\.json$/.test(f.path) && f.status !== 'D').map(f => f.path); }

// 커밋 이력에 있던 주장 id 가 마지막 판에서 말없이 사라졌는지 본다(돌려보내진 주장을 지우고 재심하는 길을 막는다).
function silentlyRemovedClaims(repo, base, head, claimsPath, headDoc) {
  const seen = new Map();
  const commits = git.tryGit(repo, ['log', '--format=%H', base + '..' + head, '--', claimsPath]);
  const revs = (commits.ok && commits.out ? commits.out.split('\n') : []).concat([base]);
  for (const rev of revs) {
    const src = git.fileAt(repo, rev, claimsPath); if (!src) continue;
    try { for (const c of JSON.parse(src).claims || []) if (c && c.id && !seen.has(c.id)) seen.set(c.id, rev.slice(0, 7)); } catch (_) { /* 깨진 중간판은 건너뛴다 */ }
  }
  const now = new Set((headDoc.claims || []).map(c => c.id));
  return [...seen.entries()].filter(([id]) => !now.has(id)).map(([id, rev]) => ({ id, lastSeen: rev }));
}

async function judge(opts) {
  const t0 = Date.now();
  const cfg = loadConfig();
  const floors = grade.loadFloors();
  const vault = loadVault();
  const repo = path.resolve(opts.repo);
  const v = {
    schema: 'court-verdict/1', task: null, verdict: null, verdictId: null, headline: '', todo: '',
    where: process.env.GITHUB_ACTIONS === 'true' ? 'ci' : 'local', whereText: '', quick: !!opts.quick,
    base: { rev: opts.base, sha: null }, head: { rev: opts.head, sha: null }, baseSource: opts.base ? 'manual' : 'merge-base',
    facts: null, findings: [], vault: null, modules: null, boot: null, claims: [], claimsFile: null, rollup: null, coverage: null,
    tool: { node: process.version, chromeVersion: null, startedAt: new Date(t0).toISOString(), finishedAt: null, durationMs: 0 },
  };
  v.whereText = v.where === 'ci' ? 'GitHub 에서 법정이 직접 실행(작업자 PC 밖)' : '작업자 PC 에서 실행한 예비 점검';
  const reject = (title, text) => v.findings.push({ severity: 'reject', title, text });
  const warn = (title, text) => v.findings.push({ severity: 'warn', title, text });
  const toolErrors = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'court-judge-'));
  const outDir = opts.out ? path.resolve(opts.out) : path.join(tmp, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  let baseSrv = null, headSrv = null;
  try {
    v.head.sha = git.revParse(repo, opts.head);
    if (!v.head.sha) { toolErrors.push('작업 커밋을 찾을 수 없다: ' + opts.head + ' — 없는 브랜치·커밋이다'); throw new Error('no head'); }
    const remoteMainSha = git.revParse(repo, cfg.remoteMain || 'origin/main');
    v.base.sha = opts.base ? git.revParse(repo, opts.base) : (remoteMainSha ? git.mergeBase(repo, remoteMainSha, v.head.sha) : null);
    if (!v.base.sha) { toolErrors.push('기준 커밋을 정할 수 없다(' + (opts.base || cfg.remoteMain) + ')'); throw new Error('no base'); }
    v.facts = git.headFacts(repo, v.head.sha, cfg.remoteMain);
    if (v.base.sha === v.head.sha) warn('바뀐 것이 없음', '작업 커밋과 기준 커밋이 같다. 심사할 변경이 없다.');

    // 1) 금고
    v.vault = checkVault({ repo, base: v.base.sha, head: v.head.sha, vault });
    for (const x of v.vault.violations) {
      if (x.severity === 'block') reject(x.id === 'VAULT_MIXED' ? '채점 기준을 같이 고침' : (x.id === 'ASSERTION_REMOVED' ? '있던 검사 기준을 지우거나 고침' : '테스트 파일 삭제'), x.message + ' [' + x.files.join(', ') + ']');
      else if (x.severity === 'decision') warn('채점 기준(금고) 변경', x.message + ' [' + x.files.slice(0, 12).join(', ') + (x.files.length > 12 ? ' 외 ' + (x.files.length - 12) + '개' : '') + ']');
      else warn('자기가 낸 시험', x.message + ' [' + x.files.join(', ') + ']');
    }
    const changed = git.changedFiles(repo, v.base.sha, v.head.sha);
    const isProduct = matcher(vault.product), isAppendOnly = matcher(vault.baseTests), isFrozen = matcher(vault.frozen);
    // 2) 추가된 줄 검사: 검증 환경 감지 분기, 테스트 건너뛰기
    for (const f of changed) {
      if (f.status === 'D') continue;
      if (isProduct(f.path)) { const hit = addedLines(repo, v.base.sha, v.head.sha, f.path).find(l => ENV_DETECT.test(l)); if (hit) reject('검증 환경을 알아채는 코드', f.path + ' 에 법정(자동 브라우저)에서만 다르게 동작할 수 있는 분기가 추가됐다: ' + hit.trim().slice(0, 140)); }
      if (isAppendOnly(f.path)) { const hit = addedLines(repo, v.base.sha, v.head.sha, f.path).find(l => TEST_BYPASS.test(l)); if (hit) reject('테스트를 건너뛰게 하는 줄 추가', f.path + ': ' + hit.trim().slice(0, 140)); }
      if (/^reports\/.*\/(verdict\.json|REPORT\.md)$/i.test(f.path)) reject('성적표를 저장소에 넣음', f.path + ' — 판정서는 법정이 만드는 것이며 저장소에 커밋할 수 없다(손으로 고친 성적표를 막는다)');
    }
    const ownScripts = changed.filter(f => f.status === 'A' && SCRIPT_EXT.test(f.path) && !isProduct(f.path) && !isAppendOnly(f.path) && !isFrozen(f.path)).map(f => f.path);
    if (ownScripts.length && v.vault.productChanged.length) warn('이 작업이 만든 검사 스크립트 ' + ownScripts.length + '개', '그 출력은 증거로 인정하지 않는다: ' + ownScripts.slice(0, 10).join(', '));

    // 3) 두 커밋을 나란히 푼다
    const baseSnap = git.snapshot(repo, v.base.sha, path.join(tmp, 'base'));
    const headSnap = git.snapshot(repo, v.head.sha, path.join(tmp, 'head'));

    // 4) 주장 파일을 먼저 읽는다(기존 검사 폐기 신청 retire 가 기준 시험지 채점에 필요하다)
    const claimFiles = findClaimsFiles(changed);
    let doc = null, docOk = false;
    if (claimFiles.length) {
      if (claimFiles.length > 1) warn('주장 파일이 여러 개', claimFiles.join(', ') + ' — 첫 번째만 심사했다');
      v.claimsFile = claimFiles[0];
      try { doc = JSON.parse(fs.readFileSync(path.join(headSnap.dir, v.claimsFile), 'utf8')); } catch (e) { reject('주장 파일을 읽을 수 없음', v.claimsFile + ' JSON 파싱 실패'); }
      if (doc) {
        // 작업번호는 형식이 맞을 때만 판정서에 싣는다. 작업자가 이 칸에 줄바꿈과 "판정: 통과" 같은 글자를 넣어 판정서 맨 위에 가짜 줄을 찍는 길을 막는다.
        v.task = typeof doc.task === 'string' && /^[A-Za-z0-9_-]{3,40}$/.test(doc.task) ? doc.task : null;
        const errs = claimsLib.validateClaims(doc);
        if (errs.length) reject('주장 파일 형식 오류', errs.slice(0, 8).join(' / ')); else docOk = true;
      }
    } else if (v.vault.productChanged.length) {
      reject('주장 없음', '제품 코드 ' + v.vault.productChanged.length + '개 파일을 바꿨는데 이번 변경에 reports/<작업번호>/claims.json 이 없다. 무엇을 했는지 주장하지 않으면 법정은 회귀만 볼 수 있을 뿐 "됐다"를 확인해 줄 수 없다.');
    }

    // 5) 부품 로드 탐침
    const mod = runModuleProbe(baseSnap.dir, headSnap.dir);
    if (mod.toolError) toolErrors.push(mod.toolError); else {
      v.modules = mod;
      for (const r of mod.regressions) reject('되던 부품이 고장 남', r.file + ' — ' + r.detail);
    }

    // 6) 기준 시험지 채점: 기준 커밋의 테스트로 작업 커밋의 제품을 채점한다(작업자가 고친 테스트는 판정에 쓰지 않는다)
    const nodeModules = [path.join(repo, 'node_modules'), path.join(__dirname, '..', 'node_modules')].find(d => fs.existsSync(d)) || null;
    v.baseTests = probeBaseTests({ baseDir: baseSnap.dir, headDir: headSnap.dir, vault, nodeModules });
    toolErrors.push(...v.baseTests.toolErrors);
    const retire = docOk && Array.isArray(doc.retire) ? doc.retire : [];
    const retireKey = r => r.file + ' :: ' + r.check;
    const declared = new Map(retire.map(r => [retireKey(r), r]));
    for (const b of v.baseTests.newlyBroken) {
      const d = declared.get(retireKey(b));
      if (!d) reject('있던 검사가 깨졌는데 말이 없음', b.file + ' 의 “' + b.check + '” 가 기준 커밋에서는 통과했는데 작업 커밋에서는 실패한다. 의도한 변경이라면 주장 파일의 retire 에 사유를 적어야 한다.');
      else if (b.kind === 'text-pin') warn('기존 글자 검사 폐기', '“' + b.check + '” — 사유: ' + d.reason + ' (글자가 있는지만 보던 검사라 결심 사항은 아니다)');
      else { v.retireNeedsDecision = (v.retireNeedsDecision || 0) + 1; warn('기존 실행 검사 폐기 신청', '“' + b.check + '” — 사유: ' + d.reason + ' (제품 함수를 실제로 돌리던 검사다. 폐기는 상민님 결심 사항이다)'); }
      declared.delete(retireKey(b));
    }
    // 테스트 파일에서 있던 단언 줄이 사라지거나 바뀐 경우. 기준 시험지 채점은 "깨진 검사"는 잡지만 "여전히 통과하는 검사를 슬쩍 지운 것"은 못 잡는다.
    // 그대로 두면 2단 공격이 된다: 먼저 테스트만 약화시킨 PR 을 넣고(제품 변경 없음 → 조용히 통과), 다음 PR 에서 제품을 깨뜨린다(약해진 시험지가 기준이 된다).
    const assertChanged = v.vault.violations.filter(x => x.id === 'ASSERTION_CHANGED');
    for (const x of assertChanged) {
      const file = x.files[0];
      const reasons = retire.filter(r => r.file === file);
      const execLines = x.removed.filter(r => !/\.includes\(|\.test\(|\.match\(|\.indexOf\(|\.search\(/.test(r.line));
      const sample = x.removed.slice(0, 2).map(r => r.line.slice(0, 90)).join(' / ');
      if (!reasons.length) {
        if (v.vault.productChanged.length) reject('있던 검사 기준을 고쳤는데 사유가 없음', file + ' 에서 단언 ' + x.removedCount + '줄이 사라지거나 바뀌었다(' + sample + '). 의도한 변경이면 주장 파일의 retire 에 이 파일과 사유를 적어야 한다.');
        else { v.retireNeedsDecision = (v.retireNeedsDecision || 0) + x.removedCount; warn('테스트만 약화', file + ' 에서 단언 ' + x.removedCount + '줄이 사라지거나 바뀌었는데 제품 코드는 그대로다(' + sample + '). 시험지만 약하게 만드는 변경은 상민님 결심 사항이다.'); }
      } else if (execLines.length) {
        v.retireNeedsDecision = (v.retireNeedsDecision || 0) + execLines.length;
        warn('기존 실행 검사 수정', file + ' 에서 제품 함수를 실제로 돌리던 단언 ' + execLines.length + '줄이 바뀌었다 — 사유: ' + reasons.map(r => r.reason).join(' / ') + ' (상민님 결심 사항이다)');
      } else warn('기존 글자 검사 수정', file + ' 단언 ' + x.removedCount + '줄 — 사유: ' + reasons.map(r => r.reason).join(' / '));
    }
    const lineChangeFiles = new Set(assertChanged.map(x => x.files[0]));
    for (const r of declared.values()) if (!lineChangeFiles.has(r.file)) warn('폐기 신청했지만 깨지지 않은 검사', '“' + r.check + '” 는 작업 커밋에서도 통과한다 — retire 에서 빼야 한다');

    // 7) 화면 점검(부팅·표준 시나리오·주장). 제품 코드가 안 바뀌었으면 화면을 띄울 이유가 없다(금고만 바꾸는 PR 이 고장 난 화면 탐침 때문에 교착에 빠지는 것도 막는다).
    v.browserSkipped = opts.quick ? '빠른 점검' : (v.vault.productChanged.length === 0 ? '제품 코드 변경 없음' : null);
    if (!v.browserSkipped) {
      baseSrv = await server.start(baseSnap.dir, cfg.denyServePrefixes);
      headSrv = await server.start(headSnap.dir, cfg.denyServePrefixes);
      // 앱은 법정 전용 호스트 이름으로 연다(127.0.0.1 로 열면 앱이 개발용 지름길로 빠진다 — lib/chrome.js 참고).
      const siteUrl = srv => 'http://' + (cfg.siteHost || '127.0.0.1') + ':' + srv.port;
      const base = { dir: baseSnap.dir, url: siteUrl(baseSrv), sha: v.base.sha, server: baseSrv };
      const head = { dir: headSnap.dir, url: siteUrl(headSrv), sha: v.head.sha, server: headSrv };
      v.boot = await probeBoot({ base, head, config: cfg, outDir: path.join(outDir, 'evidence') });
      v.tool.chromeVersion = v.boot.boot ? v.boot.boot.chromeVersion : null;
      toolErrors.push(...v.boot.toolErrors);
      for (const r of v.boot.regressions) reject('되던 기능이 고장 남', r.detail);
      for (const n of v.boot.insufficient) warn('표준 점검 사용 불가', n);

      if (docOk) {
        const ctx = { claimsDir: path.join(headSnap.dir, path.dirname(v.claimsFile)), base, head, floors, config: cfg };
        for (const c of doc.claims) v.claims.push(await claimsLib.judgeClaim({ ...ctx, outDir: path.join(outDir, 'evidence', 'claim-' + c.id) }, c));
        v.rollup = claimsLib.rollup(doc, v.claims);
        for (const c of v.claims) {
          if (c.outcome === claimsLib.OUTCOME.BROKE) reject('되던 기능이 고장 남', c.id + ' ' + c.statement + ' — ' + (c.notes[0] || ''));
          if (c.outcome === claimsLib.OUTCOME.NOT_WORKING) reject('됐다고 했지만 아직 안 됨', c.id + ' ' + c.statement + ' — ' + (c.notes[0] || (c.evidence && c.evidence.detail) || ''));
          if (c.outcome === claimsLib.OUTCOME.UNSTABLE) warn('시험이 흔들림', c.id + ' — 같은 시험을 여러 번 돌렸더니 결과가 갈렸다. 확인된 것으로 세지 않는다.');
          if (c.outcome === claimsLib.OUTCOME.CANNOT_JUDGE) toolErrors.push('주장 ' + c.id + ' 심사 중 도구 오류');
        }
        for (const r of silentlyRemovedClaims(repo, v.base.sha, v.head.sha, v.claimsFile, doc)) reject('말없이 삭제된 주장', '주장 ' + r.id + ' 가 커밋 ' + r.lastSeen + ' 에는 있었는데 마지막 판에서 사라졌다. 거두려면 지우지 말고 철회(withdrawn)로 표시하고 사유를 적어야 한다.');
        const touched = new Set(doc.claims.flatMap(c => c.touches || []));
        const unclaimed = v.vault.productChanged.filter(p => !touched.has(p));
        v.coverage = { productFiles: v.vault.productChanged.length, claimed: v.vault.productChanged.length - unclaimed.length, unclaimed };
        if (unclaimed.length) warn('주장 없는 변경 ' + unclaimed.length + '곳', '바꿨지만 어떤 주장도 걸려 있지 않은 제품 파일: ' + unclaimed.slice(0, 8).join(', '));
      }
    }
  } catch (e) {
    if (!toolErrors.length) toolErrors.push('법정 실행 중 오류: ' + String((e && e.message) || e));
  } finally {
    if (baseSrv) await baseSrv.close(); if (headSrv) await headSrv.close();
  }

  // 7) 전체 판정
  const rejects = v.findings.filter(f => f.severity === 'reject');
  // "고칠 게 없었음"은 위반은 아니지만 확인된 것도 아니다(작업자가 말한 결함이 고치기 전에도 없었다 = 이 변경이 무엇을 했는지 확인된 바 없다). 통과로 세지 않는다.
  const lacking = v.rollup ? v.rollup.reqs.filter(r => !['화면에서 눌러 확인', '글자만 확인(이 종류는 그걸로 충분)'].includes(r.bucket)) : [];
  if (toolErrors.length) {
    v.verdict = '심사 못 함'; v.headline = toolErrors[0]; v.todo = '없음. 법정 도구를 고친 뒤 다시 심사합니다. 통과가 아니므로 배포를 결정하실 단계가 아닙니다.';
    for (const t of toolErrors) v.findings.push({ severity: 'warn', title: '도구 오류', text: t });
  } else if (rejects.length) {
    const broke = rejects.filter(f => /고장/.test(f.title)).length;
    v.verdict = '돌려보냄';
    v.headline = broke ? '되던 기능 ' + broke + '개가 고장 났습니다' + (rejects.length > broke ? ' (그 밖의 사유 ' + (rejects.length - broke) + '건)' : '') : rejects[0].title + (rejects.length > 1 ? ' 외 ' + (rejects.length - 1) + '건' : '');
    v.todo = '없음. 작업자가 고쳐서 다시 심사받아야 합니다. 지금은 “1”을 눌러 배포할 상태가 아닙니다.';
  } else if (opts.quick) {
    v.verdict = '심사 전'; v.headline = '빠른 점검에서는 막을 이유가 없었습니다(화면 점검은 하지 않음)'; v.todo = '없음. 심사는 GitHub 에 올린 뒤 법정이 합니다.';
  } else if (v.vault && v.vault.needsDecision) {
    v.verdict = '확인 부족'; v.headline = '채점 기준(금고) 변경입니다 — 상민님 결심이 있어야 합니다';
    v.todo = '내용을 보시고 승인하시려면 “금고 변경 승인” 또는 “헌법 개정 승인”이라고 말씀해 주십시오. “1”·“진행”으로는 승인되지 않습니다.';
  } else if (v.retireNeedsDecision) {
    v.verdict = '확인 부족'; v.headline = '제품 함수를 실제로 돌리던 기존 검사 ' + v.retireNeedsDecision + '개를 폐기하겠다는 신청이 있습니다 — 상민님 결심이 있어야 합니다';
    v.todo = '“알아 두실 것”의 폐기 사유를 보시고 승인하시려면 “금고 변경 승인”이라고 말씀해 주십시오. “1”·“진행”으로는 승인되지 않습니다.';
  } else if (!v.rollup) {
    // 제품 코드가 안 바뀐 변경(문서 등). 주장 심사 대상이 아니다.
    v.verdict = '통과'; v.headline = '제품 코드 변경이 없고, 기존 검사도 깨지지 않았습니다'; v.todo = '병합하셔도 됩니다(제품 코드 변경 없음).';
  } else if (lacking.length) {
    v.verdict = '확인 부족';
    v.headline = '지시 ' + v.rollup.total + '건 중 ' + lacking.length + '건은 필요한 수준까지 확인하지 못했습니다';
    v.todo = '배포를 결정하실 수 있습니다. 다만 확인 못 한 채 나가는 것이 ' + lacking.length + '건 있습니다: ' + lacking.slice(0, 3).map(r => r.id + ' ' + r.text.slice(0, 30) + '(' + r.bucket + ')').join(' / ');
  } else {
    v.verdict = '통과'; v.headline = '지시 ' + v.rollup.total + '건 모두 필요한 수준으로 확인했고, 고장 난 것이 없습니다'; v.todo = '“1”이라고 하시면 배포합니다.';
  }
  v.tool.finishedAt = new Date().toISOString(); v.tool.durationMs = Date.now() - t0;
  v.verdictId = crypto.createHash('sha256').update(JSON.stringify({ h: v.head.sha, b: v.base.sha, v: v.verdict, f: v.findings.map(f => f.title + f.text), c: v.claims.map(c => [c.id, c.outcome, c.achieved]) })).digest('hex').slice(0, 8).toUpperCase();
  fs.writeFileSync(path.join(outDir, 'verdict.json'), JSON.stringify(v, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, 'REPORT.md'), report.render(v), 'utf8');
  v.outDir = outDir;
  try { fs.rmSync(path.join(tmp, 'base'), { recursive: true, force: true }); fs.rmSync(path.join(tmp, 'head'), { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 무시 */ }
  return v;
}

module.exports = { judge, parseArgs, EXIT };

if (require.main === module) {
  let args; try { args = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  judge(args).then(v => {
    if (args.json) console.log(JSON.stringify(v, null, 2));
    else { for (const l of report.firstLines(v)) console.log(l); console.log('판정서: ' + path.join(v.outDir, 'REPORT.md')); }
    process.exit(EXIT[v.verdict] === undefined ? 2 : EXIT[v.verdict]);
  }).catch(e => { console.error('법정 실행 실패: ' + (e && e.stack || e)); process.exit(2); });
}
