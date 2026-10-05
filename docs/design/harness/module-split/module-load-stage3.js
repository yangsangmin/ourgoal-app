'use strict';
// #TASK-ES-521 원본 단독 로드(인라인 3단계 공용) — 법정 모듈 로드 탐침(court/probes/module-load.js)을 읽기만 해서 기준 트리·작업 트리에 돌려 맞대고(court/** 변경 0),
// 새 세포 파일·같이 읽히는 키트 파일을 각각 격리된 vm 에서 단독으로 불러 오류·등록 전역을 적는다(module-load-inline-split-2.js 를 파일 목록 인자로 넓힘). 작업자 측정, 판정 아님.
// 사용: node module-load-stage3.js <기준 트리> <작업 트리> <out.json> <새 파일,…> [같이 볼 기존 파일,…]
const fs = require('fs'), path = require('path');
const [BASE, WORK, OUT, NEWS, TOUCHED] = process.argv.slice(2);
const probe = require(path.resolve(WORK, 'court', 'probes', 'module-load.js'));
const cfg = JSON.parse(fs.readFileSync(path.resolve(WORK, 'court', 'config.json'), 'utf8'));
const dirs = cfg.productModuleDirs || ['js'];
const cmp = probe.compare(probe.probeModules(path.resolve(BASE), dirs), probe.probeModules(path.resolve(WORK), dirs), fs.readFileSync(path.resolve(WORK, 'index.html'), 'utf8'));
const NEW = String(NEWS || '').split(',').filter(Boolean), OLD = String(TOUCHED || '').split(',').filter(Boolean);
const newFilesStandalone = {};
for (const f of NEW.concat(OLD)) { const h = probe.loadOne(path.resolve(WORK, f)); newFilesStandalone[f] = { ok: h.ok, error: h.error || null, globals: h.globals }; }
const out = Object.assign({}, cmp, { newFilesStandalone, standaloneOk: cmp.regressions.length === 0 && Object.values(newFilesStandalone).every(x => x.ok) });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(JSON.stringify({ regressions: cmp.regressions.length, counts: cmp.counts, standaloneOk: out.standaloneOk, files: Object.fromEntries(Object.entries(newFilesStandalone).map(([k, v]) => [k, v.ok + ':' + v.globals.join(',')])) }));
