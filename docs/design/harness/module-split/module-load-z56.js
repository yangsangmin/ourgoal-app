'use strict';
// #TASK-ES-541 원본 단독 로드(module-load-inline-split-2.js 와 같은 방식, 새 파일을 인자로) — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서
// 기준 트리·작업 트리에 돌리고 맞댄다(court/** 변경 0). 새 세포 파일과 그 키트 파일을 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다.
// 사용: node module-load-z56.js <기준 트리> <작업 트리> <out.json> <새 파일...> [-- <같이 볼 기존 파일...>]
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const [BASE, WORK, OUT] = args;
const rest = args.slice(3);
const cut = rest.indexOf('--');
const NEW = cut < 0 ? rest : rest.slice(0, cut);
const TOUCHED = cut < 0 ? ['js/core/app-scope.js'] : rest.slice(cut + 1);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const baseRes = probe.probeModules(path.resolve(BASE), dirs);
const headRes = probe.probeModules(path.resolve(WORK), dirs);
const cmp = probe.compare(baseRes, headRes, fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const standalone = {};
for (const f of NEW.concat(TOUCHED)) {
  const h = probe.loadOne(path.resolve(WORK, f));
  standalone[f] = { ok: h.ok, error: h.error || null, globals: h.globals };
}
const out = Object.assign({}, cmp, { newFilesStandalone: standalone, standaloneOk: cmp.regressions.length === 0 && Object.values(standalone).every(x => x.ok) });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, standaloneOk: out.standaloneOk, globals: Object.entries(standalone).map(([f, x]) => f + ':' + (x.ok ? x.globals.join(',') : 'ERR ' + x.error)) }));
