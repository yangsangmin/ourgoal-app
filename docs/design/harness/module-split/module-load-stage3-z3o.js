'use strict';
// #TASK-ES-536·#TASK-ES-537 원본 단독 로드 — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서 기준 트리·작업 트리에 돌리고 맞댄다(court/** 변경 0).
// module-load-inline-split-2.js(#TASK-ES-432)와 같은 측정을, 새 세포 파일을 인자로 받게 넓혔다. 새 파일과 그 키트 파일·app-scope.js 를 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다.
// 사용: node module-load-stage3-z3o.js <기준 트리> <작업 트리> <out.json> <새 파일...> -- <함께 볼 기존 파일...>
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, ...rest] = process.argv.slice(2);
const sep = rest.indexOf('--');
const NEW = sep < 0 ? rest : rest.slice(0, sep);
const TOUCHED = sep < 0 ? ['js/core/app-scope.js'] : rest.slice(sep + 1);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const baseRes = probe.probeModules(path.resolve(BASE), dirs);
const headRes = probe.probeModules(path.resolve(WORK), dirs);
const cmp = probe.compare(baseRes, headRes, fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const standalone = {};
for (const f of NEW.concat(TOUCHED)) {
  const h = probe.loadOne(path.resolve(WORK, f));
  const b = fs.existsSync(path.resolve(BASE, f)) ? probe.loadOne(path.resolve(BASE, f)) : null;
  standalone[f] = { work: { ok: h.ok, error: h.error || null, globals: h.globals }, base: b ? { ok: b.ok, error: b.error || null, globals: b.globals } : null };
}
const newOk = NEW.every(f => standalone[f].work.ok);
const touchedSame = TOUCHED.every(f => standalone[f].base && standalone[f].base.ok === standalone[f].work.ok && JSON.stringify(standalone[f].base.globals) === JSON.stringify(standalone[f].work.globals));
const out = Object.assign({}, cmp, { newFiles: NEW, standalone, newFilesStandaloneOk: newOk, touchedFilesSame: touchedSame, regressionCount: cmp.regressions.length, standaloneOk: cmp.regressions.length === 0 && newOk && touchedSame });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, newOk, touchedSame, standaloneOk: out.standaloneOk, newGlobals: NEW.map(f => f + ':' + standalone[f].work.globals.join(',')) }));
