'use strict';
// 실제 UI가 만든 기록의 UUID·시각만 그 보고서에서 읽은 값으로 치환한다. 파일·DOM·저장값·toast·오류는 비교하며 원본 보고서는 보존한다.
const fs = require('fs'), crypto = require('crypto');
const [B1, B2, AFTER, OUT] = process.argv.slice(2);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function normalized(j) {
  const map = new Map();
  for (const [i, r] of (j.steps.at(-1).recordValues || []).entries()) {
    for (const key of ['id', 'startAt', 'endAt', 'createdAt']) if (r[key] && !map.has(r[key])) map.set(r[key], '<record-' + i + '-' + key + '>');
  }
  const selected = { completed: j.completed, emptyDownloadCount: j.emptyDownloadCount, rowsWrittenRemote: j.rowsWrittenRemote, pageerrors: j.pageerrors, steps: j.steps.map(s => ({ name: s.name, records: s.records, recordValues: s.recordValues, storageRecords: s.storageRecords, html: s.html, toast: s.toast, buttonVisible: s.buttonVisible })), download: { suggestedFilename: j.download.suggestedFilename, bytes: j.download.bytes, bom: j.download.bom, csv: j.download.csv, hasQuotedText: j.download.hasQuotedText } };
  let text = JSON.stringify(selected); for (const [a, b] of map) text = text.split(a).join(b);
  return { value: JSON.parse(text), substitutions: [...map].map(([raw, replacement]) => ({ raw, replacement })), normalizedCsvSha256: crypto.createHash('sha256').update(JSON.parse(text).download.csv).digest('hex') };
}
function flatten(v, prefix = '', out = {}) { if (v && typeof v === 'object') { const keys = Object.keys(v); if (!keys.length) out[prefix] = JSON.stringify(v); else for (const key of keys) flatten(v[key], prefix + '/' + key, out); } else out[prefix] = v; return out; }
function compare(a, b) { const x = flatten(a.value), y = flatten(b.value), keys = [...new Set([...Object.keys(x), ...Object.keys(y)])]; const diffs = keys.filter(k => JSON.stringify(x[k]) !== JSON.stringify(y[k])).map(path => ({ path, base: x[path], after: y[path] })); return { comparedValues: keys.length, differingValues: diffs.length, diffs }; }
const [a, b, c] = [B1, B2, AFTER].map(p => normalized(read(p)));
const result = { tool: 'csv-compare571.js', inputs: [B1, B2, AFTER], normalization: 'Only UUID and ISO timestamp values read from each actual saved record; equality of shared timestamp fields is preserved. Original JSON/file bytes retained. Transport blocked-request counts are metadata, not product values.', substitutions: [a.substitutions, b.substitutions, c.substitutions], normalizedCsvSha256: [a, b, c].map(x => x.normalizedCsvSha256), base1VsBase2: compare(a, b), base1VsAfter: compare(a, c), base2VsAfter: compare(b, c) };
fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n', 'utf8'); console.log(JSON.stringify({ hashes: result.normalizedCsvSha256, baseDiff: result.base1VsBase2.differingValues, afterDiff: result.base1VsAfter.differingValues, afterDiff2: result.base2VsAfter.differingValues, values: result.base1VsAfter.comparedValues }));
process.exitCode = [result.base1VsBase2, result.base1VsAfter, result.base2VsAfter].some(x => x.differingValues) ? 1 : 0;
