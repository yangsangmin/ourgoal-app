'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const root = path.resolve(__dirname, '../..');
const original = '7857c8fa23fe0c99d2a93dc688b6ec22a3f7c6c4';
const base = '1e3789f41344a769d4258cede571d23b34abb9da';
const product = 'fe625f42fab8960629ecc7338c9401ef5547aed1';
const excluded = new Set(['reports/TASK-ES-701/court-first/REPORT.md', 'reports/TASK-ES-701/court-first/verdict.json']);
function git(args) { return cp.execFileSync('git', ['-c', 'core.longpaths=true', ...args], { cwd: root, maxBuffer: 64 * 1024 * 1024 }); }
function sha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
const files = git(['diff', '--name-only', '-z', base, original]).toString('utf8').split('\0').filter(Boolean);
const rows = [];
for (const file of files) {
  if (excluded.has(file)) continue;
  const target = path.resolve(root, file);
  if (!target.startsWith(root + path.sep)) throw new Error('출력 경로 범위 밖');
  const bytes = git(['cat-file', 'blob', original + ':' + file]);
  if (!process.argv.includes('--seal-only')) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    git(['add', '-f', '--', file]);
  }
  const staged = git(['show', ':' + file]);
  if (!staged.equals(bytes)) throw new Error('게시 바이트 불일치: ' + file);
  rows.push({ file, sourceCommit: original, sha256: sha(bytes), bytes: bytes.length, stagedEqualsOriginal: true });
}
const correction = JSON.parse(git(['cat-file', 'blob', original + ':reports/TASK-ES-701/correction-manifest.json']).toString('utf8'));
const bindings = correction.artifacts.map(item => {
  const published = git(['show', ':' + item.file]);
  const source = git(['cat-file', 'blob', product + ':' + item.file]);
  const same = published.equals(source) && sha(source) === item.sha256;
  if (!same) throw new Error('제품 고정 근거 불일치: ' + item.file);
  return { ...item, publicationBytesEqual: same };
});
for (const file of excluded) {
  try { git(['cat-file', '-e', ':' + file]); throw new Error('법정 원문이 게시 index에 있음: ' + file); }
  catch (error) { if (error.status !== 128) throw error; }
}
const manifest = {
  taskId: 'TASK-ES-701', observedAt: new Date().toISOString(), publicationBase: base,
  preservedLocalTip: original, canonicalCorrectionProduct: product,
  originalReview: correction.originalReview, originalOpinion: correction.originalOpinion,
  allowedBlobs: rows, productBindings: bindings,
  privateOfficialCourtArtifacts: correction.exactCourt.map(item => ({ ...item, scope: '다운로드한 로컬 법정 원문; Git 게시 제외', localOnly: true })),
  firstCourt: { verdictId: '0A7F8493', runId: '38397563659', url: 'https://github.com/yangsangmin/ourgoal-app/actions/runs/38397563659' },
  rejectedPublication: { tip: original, localPrePushCheck: '25AEBC3A', remoteMutation: false, cause: '법정 REPORT.md/verdict.json 추적 금지', externalCourtReturnCountUnchanged: true },
  correction: '원 7857/fe625 기록은 그대로 남기고 원격 1e378의 후손에 허용된 최종 blob만 게시한다. 법정 원문을 개명하거나 작업자 판정으로 바꾸지 않는다.',
  initialExportFailure: { cause: '제품 변화가 아닌 checkout CRLF와 Git blob LF의 비교 층 불일치', preservedToolTrace: true, correction: '원 Git blob과 게시 index blob을 직접 대조; 제품 바이트 변경 없음' },
  sourceBehaviorChangedByPublication: false, operatingUse: null, remoteWrites: 0, nextCourt: null
};
const out = path.join(__dirname, 'publication-manifest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
git(['add', '--', 'reports/TASK-ES-701/export-publication.cjs', 'reports/TASK-ES-701/publication-manifest.json']);
console.log(JSON.stringify({ allowedBlobs: rows.length, productBindings: bindings.length, allEqual: true, manifestSha256: sha(fs.readFileSync(out)), excluded: [...excluded] }));
