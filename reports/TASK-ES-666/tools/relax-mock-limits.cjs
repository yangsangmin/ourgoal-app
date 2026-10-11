#!/usr/bin/env node
'use strict';
// #TASK-ES-666 — 모의본 (나)의 「흉내의 한계」 두 가지를 모의본 안에서만 걷어 낸다(작업자 측정용, 판정 아님. 저장소 밖 모의 트리에만 쓴다).
//   한계 1: 모의본이 새로 만든 세포 파일 세 개에 신고서가 없다         → `node scripts/module-specs.js --write` 를 그 트리에서 돌리고, 종류가 안 정해진 js/app/boot.js 를 기관으로 적는다.
//   한계 2: (있을 때만) 모의본의 새 파일이 800줄을 넘는다(모듈 가드 ④) → 기준선 이력 끝에 사유를 단 판을 더하되 oversizeJsFiles 칸만 지금 잰 값으로 맞춘다.
// 기준선의 다른 칸(① ② ③ ⑤)은 건드리지 않는다 — 특히 ⑤(탭 간 직접 참조)는 0 그대로 둔다. 그래서 이 뒤에도 가드가 실패하면 그것은 한계가 아닌 진짜 사유다.
// 실제 작업에서는 이렇게 하지 않는다(실제 함수 이전은 800줄 아래로 나누고 신고서를 쓴다). 여기서는 「남은 실패가 한계 때문인지 규칙 때문인지」를 가르려는 것뿐이다.
// 사용: NODE_PATH=… node relax-mock-limits.cjs <모의 트리> <out.json>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const DIR = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]);
const NL = String.fromCharCode(10);
const run = args => { const r = cp.spawnSync(process.execPath, args, { cwd: DIR, encoding: 'utf8', env: process.env }); return { status: r.status, lines: String(r.stdout + r.stderr).trim().split(NL).map(l => l.replace(/\r$/, '')) }; };
// 가드 출력에서 「✖ 모듈 가드 실패」 줄 아래의 사유 줄만 뽑는다(「기준선을 낮출 수 있다」 아래 줄은 실패가 아니다)
const failuresOf = r => { const i = r.lines.findIndex(l => l.indexOf('모듈 가드 실패') >= 0); return i < 0 ? [] : r.lines.slice(i + 1).filter(l => /^\s+- /.test(l)).map(l => l.trim()); };
const guardBefore = run(['scripts/module-guard.js']);
const specs = run(['scripts/module-specs.js', '--write']);
const metrics = require(path.join(DIR, 'scripts', 'module-metrics.js'));
const cur = metrics.measure(DIR).ratchet;
const bf = path.join(DIR, 'docs', 'architecture', 'module-baseline.json');
const base = JSON.parse(fs.readFileSync(bf, 'utf8'));
const prev = base.history[base.history.length - 1];
const beforeOversize = JSON.parse(JSON.stringify(prev.metrics.oversizeJsFiles));
// 기준선은 이력 끝에 사유를 단 새 판을 더해 올린다(가드의 이력 검사 규칙 그대로). 앞 판의 값을 그대로 옮기고 oversizeJsFiles 칸만 지금 잰 값으로 바꾼다.
const last = { date: prev.date, commit: 'mock', reason: '모의본 한계(새 파일의 800줄 초과가 있으면 그것)만 걷어 내는 측정용 기준선 — 저장소 밖 모의 트리 전용', metrics: JSON.parse(JSON.stringify(prev.metrics)) };
last.metrics.oversizeJsFiles = { count: cur.oversizeJsFiles.count, files: Object.assign({}, cur.oversizeJsFiles.files) };
base.history.push(last);
fs.writeFileSync(bf, JSON.stringify(base, null, 2) + NL, { encoding: 'utf8' });
// 신고서: 모의본이 만든 세포 가운데 종류가 정해지지 않은 것(js/app/boot.js — app 층은 도구가 종류를 정하지 못한다)을 기관으로 적는다.
const mf = path.join(DIR, 'docs', 'architecture', 'modules.json');
const mraw = fs.readFileSync(mf, 'utf8'), mods = JSON.parse(mraw);
const kindSet = [];
(function walk(x) {
  if (Array.isArray(x)) return x.forEach(walk);
  if (x && typeof x === 'object') {
    if (x.kind === 'unclassified' && typeof x.file === 'string' && (x.file === 'js/app/boot.js' || x.file.indexOf('zz-mock-') >= 0)) { x.kind = 'organ'; kindSet.push(x.file); }
    Object.keys(x).forEach(k => walk(x[k]));
  }
})(mods);
fs.writeFileSync(mf, JSON.stringify(mods, null, 2) + (mraw.endsWith(NL) ? NL : ''), { encoding: 'utf8' });
const guardAfter = run(['scripts/module-guard.js']);
const out = {
  tool: 'reports/TASK-ES-666/tools/relax-mock-limits.cjs', type: '작업자 측정, 판정 아님', tree: DIR,
  measured: cur,
  baselineCrossTabRefs: last.metrics.crossTabRefs, baselineOversizeBefore: beforeOversize, baselineOversizeAfter: last.metrics.oversizeJsFiles,
  specsWriteExit: specs.status, specKindSetToOrgan: kindSet,
  guardBeforeRelax: { exit: guardBefore.status, failures: failuresOf(guardBefore) },
  guardAfterRelax: { exit: guardAfter.status, failures: failuresOf(guardAfter), lastLine: guardAfter.lines[guardAfter.lines.length - 1] },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + NL, { encoding: 'utf8' });
console.log('한계를 걷어 내기 전 가드 종료 ' + out.guardBeforeRelax.exit + '(사유 ' + out.guardBeforeRelax.failures.length + '건) → 걷어 낸 뒤 종료 ' + out.guardAfterRelax.exit + '(사유 ' + out.guardAfterRelax.failures.length + '건) · ⑤ 측정 ' + cur.crossTabRefs + ' · 기준선 ⑤ ' + last.metrics.crossTabRefs);
for (const l of out.guardAfterRelax.failures) console.log('  ' + l);
