'use strict';
// TASK-ES-581 병렬 촬영 실행 어댑터. tab-check의 테마·폭·상태·검사·Chrome 옵션은 그대로, 정적 서버 포트만 OS가 원자적으로 배정한다.
// 사용: node tab-isolated581.js <APP_DIR> <outDir> <tabs> --summary <file> --deadclick off
// 원래 tab-check.js 파일은 수정하지 않는다. Chrome은 Puppeteer의 기본 --remote-debugging-port=0 및 독립 임시 프로필을 그대로 쓴다.
const fs = require('fs'), path = require('path'), Module = require('module');
const target = path.resolve(process.argv[2], 'docs/design/harness/tab-check.js');
const source = fs.readFileSync(target, 'utf8');
const port = 'const port = 4700 + Math.floor(Math.random() * 300);';
const base = "const base = 'http://localhost:' + port;";
for (const text of [port, base]) if (source.split(text).length !== 2) throw Error('tab-check 포트 구문이 바뀌었다. 원문을 읽고 어댑터를 재검토한다.');
const compiled = source.replace(port, 'const port = 0;').replace(base, "const base = 'http://localhost:' + server.address().port;");
const child = new Module(target, module); child.filename = target; child.paths = Module._nodeModulePaths(path.dirname(target));
const crypto = require('crypto'), http = require('http');
const summaryAt = process.argv.indexOf('--summary');
const proofFile = summaryAt >= 0 ? process.argv[summaryAt + 1] + '.adapter.json' : null;
const proof = { task: 'TASK-ES-581', portAllocation: '포트만 OS가 원자적으로 배정', adapter: 'docs/design/harness/module-split/tab-isolated581.js', original: target, originalSha256: crypto.createHash('sha256').update(source).digest('hex'), compiledSha256: crypto.createHash('sha256').update(compiled).digest('hex'), exactReplacements: [{ before: port, after: 'const port = 0;', count: 1 }, { before: base, after: "const base = 'http://localhost:' + server.address().port;", count: 1 }], args: process.argv.slice(2), pid: process.pid, servers: [], chrome: [] };
const save = () => { if (proofFile) { fs.mkdirSync(path.dirname(proofFile), { recursive: true }); fs.writeFileSync(proofFile, JSON.stringify(proof, null, 2) + '\n', 'utf8'); } };
if (process.argv.includes('--metadata-only')) { proof.boundaryOnly = true; save(); console.log(JSON.stringify({ task: proof.task, portAllocation: proof.portAllocation, boundaryOnly: true })); return; }
const listen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) { this.once('listening', () => { proof.servers.push(this.address()); save(); }); return listen.apply(this, args); };
const pp = require('C:/dev/command-center/node_modules/puppeteer-core');
const launch = pp.launch.bind(pp);
const observed = Object.assign({}, pp, { launch: async (...args) => { const browser = await launch(...args); proof.chrome.push({ pid: browser.process()?.pid, wsEndpoint: browser.wsEndpoint(), profileArg: browser.process()?.spawnargs.find(x => x.startsWith('--user-data-dir=')) }); save(); return browser; } });
const originalRequire = child.require.bind(child);
child.require = name => name.includes('puppeteer-core') ? observed : originalRequire(name);
save();
child._compile(compiled, target);
child.exports.main(process.argv.slice(2)).catch(e => { console.error(e); process.exitCode = 1; });
