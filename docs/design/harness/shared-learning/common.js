'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const stable = value => value === null || typeof value !== 'object' ? JSON.stringify(value) :
  Array.isArray(value) ? '[' + value.map(stable).join(',') + ']' :
    '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
const hashFile = file => sha(fs.readFileSync(file));
function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', 'utf8');
}
function inside(root, file) {
  const base = fs.realpathSync(root);
  const resolved = path.resolve(base, file);
  const physical = fs.realpathSync(resolved);
  const rel = path.relative(base, physical);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw Error('PATH_OUTSIDE_ROOT: ' + file);
  return physical;
}
function safeId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(id)) throw Error('INVALID_ID');
  return id;
}
function receipt(file, basePr) {
  return { sourcePath: path.resolve(file), sha256: hashFile(file), basePr: basePr ?? null };
}
function sourceSnapshot(root) {
  const reference = path.join(root, 'WORK-REFERENCE.md');
  const ledger = path.join(root, 'lessons.json');
  const text = fs.readFileSync(reference, 'utf8');
  const lessons = json(ledger);
  if (!Array.isArray(lessons) || new Set(lessons.map(x => x.id)).size !== lessons.length) throw Error('LESSON_IDS');
  const basePr = Number((text.match(/기준 PR #(\d+)/) || [])[1]) || null;
  const advertisedCount = Number((text.match(/경험칙 (\d+)개/) || [])[1]) || null;
  return { root: path.resolve(root), basePr, advertisedCount, actualCount: lessons.length,
    ledgerSha256: hashFile(ledger), referenceSha256: hashFile(reference),
    headerCountMatches: advertisedCount === lessons.length,
    lessons, readReceipt: [receipt(reference, basePr), receipt(ledger, basePr)] };
}
module.exports = { fs, path, sha, json, stable, hashFile, write, inside, safeId, receipt, sourceSnapshot };
