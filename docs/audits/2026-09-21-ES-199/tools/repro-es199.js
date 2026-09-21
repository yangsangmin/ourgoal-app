'use strict';
// ES-199 고장 2건을 상민님이 직접 눈으로 재현하기 위한 도구.
// 왜 있는가: 두 고장은 이 PC 의 main 에만 있고 운영 서버에는 없다. 그래서 운영 사이트를 눌러 봐서는 볼 수 없다.
//            고치기 전(15df641)과 ES-199 작업 후(1c61f5f) 두 판을 이 PC 에서 나란히 띄워, 같은 순서로 눌러 비교하게 한다.
// 하는 일: 두 커밋의 파일을 임시 폴더에 그대로 풀고(저장소·작업 폴더·HEAD 는 건드리지 않는다) 127.0.0.1 에서만 서빙한다.
// 쓰는 법: repro-es199.cmd 를 더블클릭. (직접 실행: node repro-es199.js [--no-open] [--selfcheck])
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync, execFile } = require('node:child_process');

const BEFORE = { rev: '15df641', port: 8198, name: '① 고치기 전', note: 'GitHub·운영 서버와 같은 판' };
const AFTER = { rev: '1c61f5f', port: 8199, name: '② ES-199 작업 후', note: '이 PC 의 main 에만 있는 판' };
const GUIDE_PORT = 8197;
const TMP_BASE = path.join(os.tmpdir(), 'es199-repro');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function git(repo, args, env) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024, env: env ? { ...process.env, ...env } : process.env });
}

// 커밋의 파일을 destDir 에 그대로 푼다. 임시 인덱스 파일을 쓰므로 저장소의 인덱스·작업 폴더·HEAD 는 바뀌지 않는다(court/lib/git.js 와 같은 방식).
function snapshot(repo, rev) {
  let sha;
  try { sha = git(repo, ['rev-parse', '--verify', '--quiet', rev + '^{commit}']).trim(); } catch (_) { sha = ''; }
  if (!/^[0-9a-f]{40}$/.test(sha)) return null;
  const dest = path.join(TMP_BASE, sha.slice(0, 12));
  if (!path.resolve(dest).startsWith(path.resolve(TMP_BASE) + path.sep)) throw new Error('임시 폴더 경로가 이상하다: ' + dest);
  fs.rmSync(dest, { recursive: true, force: true }); // 지난번에 푼 것만 지운다(TMP_BASE 아래로 한정)
  fs.mkdirSync(dest, { recursive: true });
  const tmpIndex = path.join(TMP_BASE, 'index-' + process.pid + '-' + sha.slice(0, 12));
  try {
    git(repo, ['read-tree', sha], { GIT_INDEX_FILE: tmpIndex });
    git(repo, ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', 'checkout-index', '-a', '-f', '--prefix=' + dest.replace(/\\/g, '/') + '/'], { GIT_INDEX_FILE: tmpIndex });
  } finally {
    try { fs.unlinkSync(tmpIndex); } catch (_) { /* 없을 수 있다 */ }
  }
  return { sha, dir: dest };
}

function serveDir(root, port) {
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]); } catch (_) { res.writeHead(400); return res.end('bad request'); }
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.resolve(path.join(root, p));
    const inside = fp.startsWith(path.resolve(root) + path.sep);
    let stat = null;
    if (inside) { try { stat = fs.statSync(fp); } catch (_) { stat = null; } }
    if (!stat || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  });
  return listen(server, port);
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', e => reject(new Error(e.code === 'EADDRINUSE' ? '포트 ' + port + ' 를 다른 프로그램이 쓰고 있습니다. 이 도구가 이미 떠 있는지 확인하고, 떠 있으면 그 창을 닫은 뒤 다시 실행하세요.' : String(e.message))));
    server.listen(port, '127.0.0.1', () => resolve(server)); // 127.0.0.1 에만 연다 — 같은 공유기의 다른 기기에서 보이지 않게
  });
}

function guidePage(b, a) {
  const link = s => '<a class="go" target="_blank" href="http://127.0.0.1:' + s.port + '/">' + s.name + ' 열기</a><div class="sub">' + s.note + ' · 커밋 ' + s.sha.slice(0, 7) + '</div>';
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ES-199 고장 재현</title>' +
    '<style>body{font-family:system-ui,"Malgun Gothic",sans-serif;max-width:760px;margin:32px auto;padding:0 16px;line-height:1.65;color:#1c1c1c;background:#fafafa}' +
    'h1{font-size:22px}h2{font-size:17px;margin-top:28px}.row{display:flex;gap:16px;flex-wrap:wrap}.card{flex:1 1 300px;border:1px solid #d5d5d5;border-radius:10px;padding:16px;background:#fff}' +
    '.go{display:inline-block;padding:10px 16px;border-radius:8px;background:#1f4fd8;color:#fff;text-decoration:none;font-weight:600}.sub{color:#666;font-size:13px;margin-top:6px}' +
    'ol{padding-left:22px}code{background:#eee;padding:1px 5px;border-radius:4px}.note{color:#555;font-size:14px}</style></head><body>' +
    '<h1>ES-199 고장 2건 — 직접 눌러 보기</h1><p class="note">두 판을 이 PC 에서만 띄웠습니다. 운영 서버와 회원 데이터는 건드리지 않습니다(로그인하지 않은 게스트 화면입니다). 끝나면 검은 창을 닫으면 됩니다.</p>' +
    '<div class="row"><div class="card">' + link(b) + '</div><div class="card">' + link(a) + '</div></div>' +
    '<h2>고장 A — 창을 닫았을 뿐인데 "앱 종료" 안내가 뜬다</h2><p>①과 ② 에서 같은 순서로 누릅니다.</p><ol>' +
    '<li>홈 화면에서 <b>새 목표</b> 버튼을 누른다. → 새 목표 창이 열린다.</li>' +
    '<li>창 바깥의 <b>어두운 배경(화면 위쪽)</b>을 누른다. → 창이 닫힌다.</li>' +
    '<li>1~2초 안에 화면 아래를 본다.</li></ol>' +
    '<p>① 은 아무 안내도 뜨지 않습니다. ② 는 <b>“한 번 더 누르면 앱이 종료됩니다.”</b> 가 뜹니다.</p>' +
    '<h2>고장 B — 응원 기능 부품이 켜지자마자 죽는다</h2><ol>' +
    '<li>② 탭에서 키보드 <code>F12</code> 를 누른다. → 개발자 창이 열린다.</li>' +
    '<li>그 창 위쪽 메뉴에서 <b>Console</b> 을 누른다.</li>' +
    '<li>키보드 <code>F5</code> 로 새로고침한다.</li></ol>' +
    '<p>② 에는 빨간 글씨 <b>Uncaught ReferenceError: init is not defined</b> (오른쪽 끝에 <code>reactions.js:394</code>) 가 있습니다. ① 에서 같은 순서로 보면 이 줄이 없습니다. 다른 빨간 줄은 두 판에 똑같이 있을 수 있습니다. 볼 것은 이 한 줄이 ② 에만 있다는 점입니다.</p>' +
    '</body></html>';
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) })); }).on('error', reject);
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  let repo;
  try { repo = git(__dirname, ['rev-parse', '--show-toplevel']).trim(); }
  catch (_) { console.error('이 폴더가 git 저장소 안에 있지 않습니다. 저장소 안의 docs/audits/2026-09-21-ES-199/tools 에서 실행하세요.'); process.exit(2); }

  fs.mkdirSync(TMP_BASE, { recursive: true });
  for (const s of [BEFORE, AFTER]) {
    const snap = snapshot(repo, s.rev);
    if (!snap) {
      console.error('이 PC 의 저장소에 커밋 ' + s.rev + ' 이 없습니다. ' + (s === AFTER ? 'ES-199 작업 커밋은 GitHub 에 올라간 적이 없어서, 그 커밋을 가진 PC(상민님 PC 의 C:/dev/ourgoal-app)에서만 재현할 수 있습니다.' : ''));
      process.exit(2);
    }
    Object.assign(s, snap);
  }

  const servers = [];
  try {
    servers.push(await serveDir(BEFORE.dir, BEFORE.port));
    servers.push(await serveDir(AFTER.dir, AFTER.port));
    const html = guidePage(BEFORE, AFTER);
    servers.push(await listen(http.createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(html); }), GUIDE_PORT));
  } catch (e) { console.error(e.message); servers.forEach(s => s.close()); process.exit(2); }

  if (args.has('--selfcheck')) {
    // 도구가 올바른 판을 서빙하는지 스스로 잰다: 서빙한 바이트의 지문이 git 의 그 커밋 파일과 같은가, function init 이 ①에 있고 ②에 없는가.
    let ok = true;
    for (const s of [BEFORE, AFTER]) {
      for (const f of ['js/reactions.js', 'index.html']) {
        const r = await get('http://127.0.0.1:' + s.port + '/' + f);
        const served = crypto.createHash('sha256').update(r.body).digest('hex');
        const inGit = crypto.createHash('sha256').update(execFileSync('git', ['-C', repo, 'show', s.sha + ':' + f], { maxBuffer: 256 * 1024 * 1024 })).digest('hex');
        const same = served === inGit && r.status === 200;
        if (!same) ok = false;
        console.log(s.name + ' ' + f + ' → HTTP ' + r.status + ' · ' + r.body.length + 'B · sha256 ' + served.slice(0, 16) + ' · git 과 ' + (same ? '같음' : '다름'));
        if (f === 'js/reactions.js') {
          const n = (r.body.toString('utf8').match(/function init\s*\(/g) || []).length;
          const want = s === BEFORE ? 1 : 0;
          if (n !== want) ok = false;
          console.log('    "function init(" ' + n + '번 (기대 ' + want + '번)');
        }
      }
    }
    const g = await get('http://127.0.0.1:' + GUIDE_PORT + '/');
    console.log('안내 페이지 → HTTP ' + g.status + ' · ' + g.body.length + 'B');
    servers.forEach(s => { s.closeAllConnections && s.closeAllConnections(); s.close(); });
    console.log(ok ? '자체 점검: 통과' : '자체 점검: 실패');
    process.exit(ok ? 0 : 1);
  }

  console.log('ES-199 고장 재현 도구가 떠 있습니다. 이 창을 닫으면 끝납니다.');
  console.log('  안내 페이지        http://127.0.0.1:' + GUIDE_PORT + '/');
  console.log('  ' + BEFORE.name + '      http://127.0.0.1:' + BEFORE.port + '/   (커밋 ' + BEFORE.sha.slice(0, 7) + ')');
  console.log('  ' + AFTER.name + ' http://127.0.0.1:' + AFTER.port + '/   (커밋 ' + AFTER.sha.slice(0, 7) + ')');
  if (!args.has('--no-open') && process.platform === 'win32') execFile('cmd', ['/c', 'start', '', 'http://127.0.0.1:' + GUIDE_PORT + '/'], () => {});
}

main().catch(e => { console.error('도구 오류: ' + (e && e.message ? e.message : e)); process.exit(2); });
