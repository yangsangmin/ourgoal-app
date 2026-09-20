'use strict';
// 법정(court) — headless Chrome 기동 + CDP(Chrome DevTools Protocol) 클라이언트. 의존성 없음(Node 22+ 전역 WebSocket).
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  if (process.platform === 'win32') {
    for (const base of [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env['LOCALAPPDATA']].filter(Boolean)) {
      candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
    for (const base of [process.env['PROGRAMFILES(X86)'], process.env['PROGRAMFILES']].filter(Boolean)) {
      candidates.push(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidates.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/snap/bin/chromium');
  }
  for (const c of candidates) { try { if (fs.statSync(c).isFile()) return c; } catch (_) { /* 다음 후보 */ } }
  return null;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let d = ''; res.setEncoding('utf8');
      res.on('data', c => { d += c; });
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error('timeout')));
  });
}

// allowHosts: 외부 통신 허용 호스트(기본 없음). 127.0.0.1 만 열고 나머지는 전부 NOTFOUND 로 막는다 → 판정이 외부 상태에 흔들리지 않는다.
async function launch(opts) {
  const o = opts || {};
  const exe = o.chromePath || findChrome();
  if (!exe) throw new Error('Chrome 실행 파일을 찾지 못했다(CHROME_PATH 로 지정 가능)');
  if (typeof WebSocket === 'undefined') throw new Error('전역 WebSocket 이 없다(Node 22 이상 필요). 현재 ' + process.version);
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'court-chrome-'));
  const allow = ['127.0.0.1'].concat(o.allowHosts || []);
  // siteOrigin(예: http://court.test:51234): 앱을 127.0.0.1·localhost 로 열면 개발용 지름길(자동 샘플 프로필)로 빠져 실사용자 경로를 못 본다.
  // 법정 전용 호스트 이름을 127.0.0.1 로 매핑해서 열고, 그 주소를 보안 컨텍스트로 취급하게 한다(서비스워커·저장소 API 가 실서비스처럼 동작).
  let siteHost = null;
  try { if (o.siteOrigin) siteHost = new URL(o.siteOrigin).hostname; } catch (_) { siteHost = null; }
  const mapSite = siteHost && siteHost !== '127.0.0.1' ? 'MAP ' + siteHost + ' 127.0.0.1 , ' : '';
  const rules = mapSite + 'MAP * ~NOTFOUND' + allow.map(h => ' , EXCLUDE ' + h).join('');
  const vp = o.viewport || { width: 375, height: 812 };
  const args = [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + userDataDir,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
    '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-extensions', '--lang=' + (o.locale || 'ko-KR'),
    '--window-size=' + vp.width + ',' + vp.height, '--host-resolver-rules=' + rules,
  ];
  if (mapSite) args.push('--unsafely-treat-insecure-origin-as-secure=' + o.siteOrigin);
  if (process.platform === 'linux') args.push('--no-sandbox', '--disable-dev-shm-usage');
  args.push('about:blank');
  const proc = spawn(exe, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  proc.stderr.on('data', c => { if (stderr.length < 20000) stderr += c.toString(); });
  let exited = false;
  proc.on('exit', () => { exited = true; });

  const portFile = path.join(userDataDir, 'DevToolsActivePort');
  let port = null;
  for (let i = 0; i < 150 && !exited; i++) {
    try {
      const first = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
      if (/^\d+$/.test(first)) { port = Number(first); break; }
    } catch (_) { /* 아직 안 생김 */ }
    await sleep(100);
  }
  const close = async () => {
    try { proc.kill(); } catch (_) { /* 이미 종료 */ }
    for (let i = 0; i < 30 && !exited; i++) await sleep(100);
    for (let i = 0; i < 5; i++) {
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); break; } catch (_) { await sleep(300); }
    }
  };
  if (!port) { await close(); throw new Error('Chrome 디버그 포트를 얻지 못했다: ' + stderr.slice(0, 500)); }

  let pageTarget = null;
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await getJson('http://127.0.0.1:' + port + '/json');
      pageTarget = targets.find(t => t.type === 'page');
      if (pageTarget) break;
    } catch (_) { /* 재시도 */ }
    await sleep(100);
  }
  if (!pageTarget) { await close(); throw new Error('Chrome 페이지 타깃을 찾지 못했다'); }
  let version = null;
  try { version = (await getJson('http://127.0.0.1:' + port + '/json/version')).Browser || null; } catch (_) { version = null; }

  const page = await connect(pageTarget.webSocketDebuggerUrl);
  return { page, version, exe, close: async () => { try { page.close(); } catch (_) { /* 무시 */ } await close(); } };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 1;
    const pending = new Map();
    const listeners = new Map();
    ws.addEventListener('error', e => reject(new Error('CDP 연결 실패: ' + (e && e.message ? e.message : 'unknown'))));
    ws.addEventListener('close', () => { for (const p of pending.values()) p.reject(new Error('CDP 연결이 닫혔다')); pending.clear(); });
    ws.addEventListener('message', evt => {
      let m; try { m = JSON.parse(typeof evt.data === 'string' ? evt.data : evt.data.toString()); } catch (_) { return; }
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message || JSON.stringify(m.error))); else p.resolve(m.result);
      } else if (m.method) {
        for (const fn of listeners.get(m.method) || []) { try { fn(m.params); } catch (_) { /* 리스너 오류는 판정에 영향 주지 않는다 */ } }
      }
    });
    ws.addEventListener('open', () => resolve({
      send(method, params) {
        return new Promise((res, rej) => {
          const id = seq++;
          pending.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params: params || {} }));
        });
      },
      on(method, fn) { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); },
      close() { try { ws.close(); } catch (_) { /* 무시 */ } },
    }));
  });
}

module.exports = { findChrome, launch, connect, sleep };
