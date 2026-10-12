'use strict';
const cp = require('child_process'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
const r = process.platform === 'win32'
  ? cp.spawnSync(process.env.ComSpec || 'C:/Windows/System32/cmd.exe', ['/d', '/s', '/c', 'npm test'], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_PATH: 'C:/dev/ourgoal-app/node_modules' }, windowsHide: true, maxBuffer: 20 * 1024 * 1024 })
  : cp.spawnSync('npm', ['test'], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_PATH: 'C:/dev/ourgoal-app/node_modules' }, maxBuffer: 20 * 1024 * 1024 });
fs.writeFileSync(path.join(__dirname, 'npm-test.stdout.log'), r.stdout || '', 'utf8');
fs.writeFileSync(path.join(__dirname, 'npm-test.stderr.log'), r.stderr || '', 'utf8');
const info = { command: 'npm test', exitCode: r.status, signal: r.signal, error: r.error ? String(r.error) : null, sourceState: 'worktree source hash in summary.json', stdout: 'npm-test.stdout.log', stderr: 'npm-test.stderr.log', scope: 'worker preliminary checks, not court verdict' };
fs.writeFileSync(path.join(__dirname, 'npm-test.json'), JSON.stringify(info, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(info));
process.exitCode = r.status === 0 ? 0 : 1;
