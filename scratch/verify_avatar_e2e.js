// scratch/verify_avatar_e2e.js
// 3단계: 로컬 수동 확인 및 아바타 생성·새로고침 유지 E2E 실측 검증

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function getPageWsUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/json`, (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve(data));
        }).on('error', reject);
      });
      const targets = JSON.parse(res);
      const page = targets.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw new Error('Chrome page target not ready');
}

async function runAvatarE2EVerification() {
  console.log('=== [3단계: 로컬 수동 확인 및 아바타 라이프사이클 E2E 실측 검증] ===\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9340;
  const userDataDir = path.join(__dirname, 'chrome-avatar-e2e-profile-9340');

  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}

  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=430,932',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://localhost:8000'
  ], { detached: false });

  let ws;
  try {
    const wsUrl = await getPageWsUrl(debugPort);
    console.log('1. Chrome Page CDP 연결 성공:', wsUrl);

    ws = new WebSocket(wsUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    function sendCmd(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, (res) => {
          if (res.error) reject(new Error(JSON.stringify(res.error)));
          else resolve(res.result);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCmd('Runtime.enable');
    await sendCmd('Page.enable');

    console.log('2. 페이지 로드 대기 (2.0초)...');
    await new Promise(r => setTimeout(r, 2000));

    // 1. 게스트 모드로 입장
    console.log('3. 게스트 모드로 앱 입장...');
    await sendCmd('Runtime.evaluate', { expression: 'document.getElementById("landGuestBtn").click();' });
    await new Promise(r => setTimeout(r, 1500));

    // 2. 초기 아바타 렌더링 확인 (기본 로봇 아바타)
    console.log('4. 초기 아바타 상태 확인 (기본 로봇 아바타)...');
    const initialAvatarRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (function() {
          const lvBadge = document.getElementById('levelBadgeRow');
          const topAv = document.getElementById('topAvatar');
          return {
            hasRobotAvatar: lvBadge ? lvBadge.innerHTML.includes('robot-avatar-frame') : false,
            topAvatarInitialText: topAv ? topAv.textContent.trim() : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log('   초기 아바타 상태:', initialAvatarRes.result.value);

    // 3. 3등신 만화형 아바타 설정 및 저장 (신규 아바타 시스템)
    console.log('5. 3등신 아바타 생성 및 영속화 반영...');
    const mockDataUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="%2310B981"/><text x="32" y="38" text-anchor="middle" font-size="20" fill="white">★</text></svg>';

    const saveAvatarRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (function() {
          const guestRaw = localStorage.getItem('ourgoal_guest_profile');
          const guest = JSON.parse(guestRaw || '{}');
          guest.settings = guest.settings || {};
          guest.settings.avatarType = 'custom';
          guest.settings.customAvatarUrl = '${mockDataUrl}';
          guest.settings.avatarThemeId = 7;
          guest.avatarUrl = '${mockDataUrl}';
          
          localStorage.setItem('ourgoal_guest_profile', JSON.stringify(guest));
          localStorage.setItem('ourgoal_settings_' + guest.id, JSON.stringify(guest.settings));
          
          // 전역 state 및 UI 즉각 반영
          if (window.state && window.state.profile) {
            window.state.profile.settings = guest.settings;
            window.state.profile.avatarUrl = guest.avatarUrl;
          }
          if (typeof renderLevelBadge === 'function') renderLevelBadge();
          if (typeof updateTopBar === 'function') updateTopBar();
          
          const lvBadgeEl = document.getElementById('levelBadgeRow');
          const topAvEl = document.getElementById('topAvatar');
          
          return {
            saved: true,
            levelBadgeHasCustom: lvBadgeEl ? lvBadgeEl.innerHTML.includes('custom-avatar-frame') : false,
            topAvatarHasImg: topAvEl ? topAvEl.innerHTML.includes('data:image/svg+xml') : false
          };
        })()
      `,
      returnByValue: true
    });
    console.log('   아바타 설정 및 즉각 UI 반영 결과:', saveAvatarRes.result.value);

    // 4. 새로고침(F5 / Page.reload) 실행 후 복원 검증 (앱 나갔다 들어오는 상황 완벽 재현)
    console.log('6. 브라우저 새로고침(F5 / Page.reload) 실행...');
    await sendCmd('Page.reload');
    await new Promise(r => setTimeout(r, 2500));

    console.log('7. 새로고침 후 아바타 복원 및 UI 동기화 검증...');
    const reloadedAvatarRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (function() {
          const guestRaw = localStorage.getItem('ourgoal_guest_profile');
          const guest = JSON.parse(guestRaw || '{}');
          const lvBadgeEl = document.getElementById('levelBadgeRow');
          const topAvEl = document.getElementById('topAvatar');
          const lvBadgeHtml = lvBadgeEl ? lvBadgeEl.innerHTML : '';
          const topAvHtml = topAvEl ? topAvEl.innerHTML : '';
          
          return {
            profileRestored: !!(guest && guest.id),
            settingsRestored: !!(guest && guest.settings && guest.settings.customAvatarUrl),
            avatarType: guest && guest.settings && guest.settings.avatarType,
            levelBadgeHasCustomFrame: lvBadgeHtml.includes('custom-avatar-frame'),
            levelBadgeHasCustomImg: lvBadgeHtml.includes('data:image/svg+xml'),
            topAvatarHasImg: topAvHtml.includes('data:image/svg+xml')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('   새로고침 후 검증 결과:', reloadedAvatarRes.result.value);

    // 검증 어설션
    const r = reloadedAvatarRes.result.value;
    if (!r.profileRestored || !r.settingsRestored || r.avatarType !== 'custom' || !r.levelBadgeHasCustomFrame || !r.topAvatarHasImg) {
      throw new Error('아바타 복원 검증 실패: ' + JSON.stringify(r));
    }

    // 5. 스크린샷 캡처
    console.log('8. 수동 검증 스크린샷 캡처 저장...');
    const shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(__dirname, 'screen_avatar_persistence_verified.png');
    fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
    console.log('   ✅ 스크린샷 저장 완료:', shotPath);

    console.log('\n=== [3단계 로컬 수동 확인 및 E2E 실측 검증 100% PASS] ===');

  } catch(err) {
    console.error('E2E 실행 중 에러 발생:', err);
    process.exit(1);
  } finally {
    if (ws) ws.close();
    chromeProcess.kill('SIGTERM');
  }
}

runAvatarE2EVerification();
