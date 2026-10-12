'use strict';
// 작업자 재현: 독립 검토자가 만든 도구 글자는 그대로 두고 별도 전후 사본에 실행한다.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const root = path.resolve(__dirname, '../../..');
const source = 'C:/Users/HP/AppData/Local/Temp/codex-pr968-review';
const before = 'd6b15c1969748b2d622e14d9b2ded26ccac00162';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const manifest = { before, worktreeParentHead: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), afterSourceState: 'worktree bytes; exact source SHA256 below, not a claim about the parent commit', files: [], runs: [], scope: 'product module; simulated store and interleaving; no operating server requests' };
for (const label of ['before', 'after']) {
  const dir = path.join(__dirname, label);
  fs.mkdirSync(path.join(dir, 'head/js/core'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'evidence'), { recursive: true });
  const blob = label === 'before' ? cp.execFileSync('git', ['cat-file', '-p', before + ':js/core/local-keep.js'], { cwd: root }) : fs.readFileSync(path.join(root, 'js/core/local-keep.js'));
  fs.writeFileSync(path.join(dir, 'head/js/core/local-keep.js'), blob, { encoding: 'utf8' });
  manifest.files.push({ label, file: 'js/core/local-keep.js', sha256: sha(blob) });
  for (const tool of ['countercases.cjs', 'comparative.cjs']) {
    const text = fs.readFileSync(path.join(source, tool));
    fs.writeFileSync(path.join(dir, tool), text, { encoding: 'utf8' });
    manifest.files.push({ label, file: tool, sha256: sha(text), sourceSha256: sha(fs.readFileSync(path.join(source, tool))) });
    const r = cp.spawnSync(process.execPath, [tool], { cwd: dir, encoding: 'utf8' });
    fs.writeFileSync(path.join(dir, 'evidence', tool + '.stdout.log'), r.stdout || '', 'utf8');
    fs.writeFileSync(path.join(dir, 'evidence', tool + '.stderr.log'), r.stderr || '', 'utf8');
    manifest.runs.push({ label, tool, exitCode: r.status, error: r.error ? String(r.error) : null });
  }
}
fs.writeFileSync(path.join(__dirname, 'independent-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(manifest));
