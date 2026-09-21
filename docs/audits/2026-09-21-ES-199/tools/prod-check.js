'use strict';
// 운영 실물 대조: "지금 운영 서버에 나가 있는 것이 어느 커밋인가"를 작업자 보고가 아니라 실물 지문으로 확인한다.
// 왜 있는가: ES-199 의 고장 2건이 운영에 나갔는지가 이 사건의 피해 범위를 가른다. 말이 아니라 파일 지문으로 답한다.
// 방법: 운영 주소에서 파일을 받아 sha256 을 내고, git 의 두 커밋(고치기 전 15df641 / ES-199 작업 후 1c61f5f) 같은 파일 지문과 비교한다.
//       읽기만 한다(GET). 원격 main 은 git ls-remote 로 읽는다(로컬 상태를 바꾸지 않는다).
// 쓰는 법: node docs/audits/2026-09-21-ES-199/tools/prod-check.js   (결과는 evidence/prod-check.out.json)
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const AUDIT_DIR = path.resolve(__dirname, '..');
const PROD = 'https://ourgoal-app.vercel.app';
const REVS = { 고치기전: '15df641', ES199작업후: '1c61f5f' };
const COMPARE = ['js/reactions.js', 'index.html'];       // 두 커밋에서 내용이 다른 파일
const STATUS_ONLY = ['.well-known/assetlinks.json', 'AGENTS.md', 'scripts/verify-all-clicks.js']; // 응답 코드만 본다

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function get(url) {
  return new Promise(resolve => {
    const req = https.get(url, { headers: { 'Cache-Control': 'no-cache' }, timeout: 20000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: null, error: '시간 초과' }); });
    req.on('error', e => resolve({ status: null, error: String(e.message) }));
  });
}

function gitBlobSha(repo, rev, file) {
  try { return sha256(execFileSync('git', ['-C', repo, 'show', rev + ':' + file], { maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })); }
  catch (_) { return null; } // 그 커밋이 이 PC 에 없거나 그 파일이 커밋에 없다
}

(async () => {
  const repo = execFileSync('git', ['-C', __dirname, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const out = { 잰시각: new Date().toISOString(), 운영주소: PROD, 원격main: null, 파일대조: [], 응답코드: [] };
  try { out.원격main = execFileSync('git', ['-C', repo, 'ls-remote', 'origin', 'refs/heads/main'], { encoding: 'utf8', timeout: 30000 }).trim().split(/\s+/)[0] || null; }
  catch (_) { out.원격main = null; } // 못 읽으면 null(측정불가)로 남긴다

  for (const f of COMPARE) {
    const r = await get(PROD + '/' + f);
    const prod = r.status === 200 ? sha256(r.body) : null;
    const row = { 파일: f, 운영응답: r.status, 운영바이트: r.body ? r.body.length : null, 운영지문: prod, 오류: r.error || null };
    for (const [name, rev] of Object.entries(REVS)) { const g = gitBlobSha(repo, rev, f); row[name + '_지문'] = g; row['운영이_' + name + '_과같음'] = prod && g ? prod === g : null; }
    out.파일대조.push(row);
  }
  for (const f of STATUS_ONLY) { const r = await get(PROD + '/' + f); out.응답코드.push({ 경로: '/' + f, 운영응답: r.status, 바이트: r.body ? r.body.length : null, 오류: r.error || null }); }

  fs.writeFileSync(path.join(AUDIT_DIR, 'evidence', 'prod-check.out.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log('원격 main: ' + (out.원격main || '측정불가'));
  for (const r of out.파일대조) console.log(r.파일 + ' → 운영 HTTP ' + r.운영응답 + ' · ' + r.운영바이트 + 'B · 고치기 전(15df641)과 ' + (r.운영이_고치기전_과같음 === null ? '측정불가' : r.운영이_고치기전_과같음 ? '같음' : '다름') + ' · ES-199 작업 후(1c61f5f)와 ' + (r.운영이_ES199작업후_과같음 === null ? '측정불가' : r.운영이_ES199작업후_과같음 ? '같음' : '다름'));
  for (const r of out.응답코드) console.log(r.경로 + ' → 운영 HTTP ' + r.운영응답 + (r.바이트 !== null ? ' · ' + r.바이트 + 'B' : ''));
})().catch(e => { console.error('도구 오류: ' + (e && e.message ? e.message : e)); process.exit(2); });
