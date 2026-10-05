'use strict';
// 인라인 스크립트 세포화 P1(#TASK-ES-436~) 새 세포 등록 — 손 편집 없이 도구로만:
//  ① docs/architecture/cell-descriptions.json 에 설정(.json)의 세포별 짧은 이름(name)·하는 일(does)을 넣는다(이미 있는 순서는 그대로, 새 키는 이름순 앞 키 다음 자리)
//  ② node scripts/module-specs.js --write (신고서) → node scripts/module-guard.js --update (기준선) → node scripts/inline-script-map.js --write (지도) → node scripts/cell-map-export.js (세포지도)
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node register-inline-p1.js <APP_DIR> <설정 .json> [--descriptions-only]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const [APP, CFG_FILE] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const ONLY_DESC = process.argv.includes('--descriptions-only');
const CFG = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
const DESC = path.join(APP, 'docs', 'architecture', 'cell-descriptions.json');
const raw = fs.readFileSync(DESC, 'utf8');
const crlf = raw.includes('\r\n');
const j = JSON.parse(raw);
const insert = (obj, key, val) => {
  if (Object.prototype.hasOwnProperty.call(obj, key)) { obj[key] = val; return obj; }
  const keys = Object.keys(obj);
  let after = null; for (const k of keys) if (k < key) after = k;
  const out = {};
  if (after === null) out[key] = val;
  for (const k of keys) { out[k] = obj[k]; if (k === after) out[key] = val; }
  return out;
};
for (const c of CFG.cells) {
  const id = c.file.replace(/^js\/(tabs\/)?/, '').replace(/\.js$/, '');
  if (!c.name || !c.does) throw new Error('설정에 name·does 없음: ' + c.file);
  j.names = insert(j.names, id, c.name);
  j.cells = insert(j.cells, id, c.does);
}
let s = JSON.stringify(j, null, 2) + '\n';
if (crlf) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(DESC, s, 'utf8');
console.log('cell-descriptions: ' + CFG.cells.length + '개 세포 이름·하는 일');
if (ONLY_DESC) process.exit(0);
const run = (args) => { const r = cp.spawnSync('node', args, { cwd: APP, env: process.env, encoding: 'utf8' }); console.log('$ node ' + args.join(' ') + ' → ' + r.status + '\n' + ((r.stdout || '') + (r.stderr || '')).split('\n').slice(-6).join('\n')); if (r.status !== 0) throw new Error('실패: ' + args.join(' ')); };
run(['scripts/module-specs.js', '--write']);
run(['scripts/module-guard.js', '--update']);
run(['scripts/inline-script-map.js', '--write']);
run(['scripts/cell-map-export.js']);
