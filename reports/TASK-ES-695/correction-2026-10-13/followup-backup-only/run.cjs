'use strict';
// 공급받은 독립 도구·원시 결과는 읽기만 하고, 자기 스냅샷에서 같은 도구를 글자 그대로 실행한다.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto'), assert = require('assert');
const root = path.resolve(__dirname, '../../../..'), parent = path.dirname(__dirname);
const independent = 'C:/Users/HP/AppData/Local/Temp/codex-p0-correction-review/head/reports/TASK-ES-695/correction-2026-10-13';
const baseline = 'c5d95027b6dd5624ab4decc1c214ed1354c447c1';
const source = fs.readFileSync(path.join(independent, 'direct-backup-only.cjs'));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(__dirname, { recursive: true });
fs.writeFileSync(path.join(__dirname, 'independent-tool-original.cjs'), source, { encoding: 'utf8' });
fs.copyFileSync(path.join(independent, 'direct-backup-only.json'), path.join(__dirname, 'independent-results-original.json'));
const files = ['js/account-isolation.js','js/record-ledger.js','js/core/local-keep.js','js/core/home-cockpit.js','js/core/server-records-sync.js','js/tabs/settings/guest-migration.js'];
const runs = [], snapshots = [], results = {};
for (const label of ['before', 'after']) {
  const snapshot = path.join(__dirname, label + '-snapshot'), toolDir = path.join(snapshot, 'reports/TASK-ES-695/correction-2026-10-13');
  fs.mkdirSync(toolDir, { recursive: true });
  fs.writeFileSync(path.join(toolDir, 'direct-backup-only.cjs'), source, { encoding: 'utf8' });
  fs.copyFileSync(path.join(parent, 'sequence-probe.json'), path.join(toolDir, 'sequence-probe.json'));
  for (const file of files) {
    const blob = label === 'before' ? cp.execFileSync('git', ['cat-file', '-p', baseline + ':' + file], { cwd: root }) : fs.readFileSync(path.join(root, file));
    const target = path.join(snapshot, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, blob, { encoding: 'utf8' });
    snapshots.push({ label, file, sha256: hash(blob) });
  }
  const r = cp.spawnSync(process.execPath, ['direct-backup-only.cjs'], { cwd: toolDir, encoding: 'utf8' });
  fs.writeFileSync(path.join(__dirname, label + '.stdout.log'), r.stdout || '', 'utf8'); fs.writeFileSync(path.join(__dirname, label + '.stderr.log'), r.stderr || '', 'utf8');
  runs.push({ label, exitCode: r.status, error: r.error ? String(r.error) : null });
  assert.strictEqual(r.status, 0);
  results[label] = JSON.parse(fs.readFileSync(path.join(toolDir, 'direct-backup-only.json'), 'utf8'));
}
const comparisons = [];
for (const which of ['syncServerRecords','migrateGuestDataToUser']) {
  const before = results.before.rows.find(r => r.label === 'after' && r.which === which && !r.failing), after = results.after.rows.find(r => r.label === 'after' && r.which === which && !r.failing);
  const rec = label => JSON.parse(label.data['ourgoal_records_backup_11111111-1111-4111-8111-111111111111']).find(r => r.id === 'same');
  const a = rec(before), b = rec(after);
  const row = { which, beforePhoto: a.photo || null, beforeFeedback: a.feedback || null, afterPhoto: b.photo || null, afterFeedback: b.feedback || null, afterEnergy: b.energy, afterFocus: b.focus, serverSame: JSON.stringify(before.server) === JSON.stringify(after.server), screenStateSame: JSON.stringify(before.state) === JSON.stringify(after.state), renderSame: JSON.stringify(before.render) === JSON.stringify(after.render), backupOnly: !before.state.records[0].photo && !after.state.records[0].photo };
  assert.strictEqual(row.beforePhoto, null); assert.strictEqual(row.beforeFeedback, null);
  assert.strictEqual(row.afterPhoto, 'unique-photo'); assert.strictEqual(row.afterFeedback, 'visible-feedback'); assert.strictEqual(row.afterEnergy, 60); assert.strictEqual(row.afterFocus, 40);
  assert.ok(row.serverSame && row.screenStateSame && row.renderSame && row.backupOnly); comparisons.push(row);
}
const out = { baseline, sourceSHA256: hash(source), sourceReadOnly: true, snapshots, runs, comparisons, scope: 'exact supplied independent script on fixed source snapshots; injected VM server/storage/render; operating requests 0', notFullConditionFour: true };
fs.writeFileSync(path.join(__dirname, 'replay.json'), JSON.stringify(out, null, 2) + '\n', 'utf8'); console.log(JSON.stringify({ comparisons, sourceSHA256: out.sourceSHA256 }));
