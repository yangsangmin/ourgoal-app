#!/usr/bin/env node
'use strict';
// #TASK-ES-687 모의 트리의 화면 시나리오(작업자 측정 도구, 판정 아님) — mock-apply.cjs 가 만든 모의 트리(저장소 밖)를 기준 트리와 맞댄다.
// 법정 실행기를 읽기만 쓰는 reports/TASK-ES-659/tools/scenario-local.cjs 로 기준 2회 · 모의 1회 돌리고 mock/scenarios.json 에 id 별로 모은다(시간이 길어 여러 번 나눠 돌린다).
// 사용: NODE_PATH=… node reports/TASK-ES-687/tools/mock-scenarios.cjs <작업 트리> <모의 트리> <기준 트리> <시나리오.json…>
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const [WORK, MOCK, BASE, ...FILES] = process.argv.slice(2).map((a, i) => (i < 3 ? path.resolve(a) : a));
const OUT = path.join(WORK, 'reports', 'TASK-ES-687', 'mock', 'scenarios.json');
const part = path.join(os.tmpdir(), 'es687-sc-' + process.pid + '.json');
const r = cp.spawnSync(process.execPath, [path.join(WORK, 'reports', 'TASK-ES-659', 'tools', 'scenario-local.cjs'), BASE, MOCK, part].concat(FILES.map(f => path.resolve(f))), { cwd: WORK, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
if (!fs.existsSync(part)) { console.error('시나리오 실행 실패: ' + ((r.stderr || '') + (r.stdout || '')).slice(-500)); process.exit(1); }
const got = JSON.parse(fs.readFileSync(part, 'utf8')); fs.unlinkSync(part);
const all = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { tool: 'reports/TASK-ES-687/tools/mock-scenarios.cjs (reports/TASK-ES-659/tools/scenario-local.cjs — 법정 실행기 읽기 전용)', type: '작업자 측정, 판정 아님 — 저장소 밖 모의 트리', rows: {} };
for (const id of Object.keys(got.scenarios)) { const x = got.scenarios[id]; all.rows[id] = { file: x.file, base: x.runs.base.passed, base2: x.runs.base2.passed, mock: x.runs.work.passed, mockExceptions: (x.runs.work.exceptions || []).length, steps: x.runs.work.steps, nonVacuousExpects: x.runs.work.nonVacuousExpects }; }
const rows = Object.values(all.rows);
all.ran = rows.length; all.allPassed = rows.length > 0 && rows.every(x => x.base && x.base2 && x.mock && x.mockExceptions === 0);
all.sources = [...new Set((all.sources || []).concat(FILES.map(f => path.dirname(path.relative(WORK, path.resolve(f))).replace(/\\/g, '/'))))];
fs.writeFileSync(OUT, JSON.stringify(all, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ chunk: Object.keys(got.scenarios).length, ran: all.ran, allPassed: all.allPassed }));
