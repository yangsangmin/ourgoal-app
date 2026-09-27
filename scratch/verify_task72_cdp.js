const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8002, '127.0.0.1', async () => {
  console.log('Static server listening on http://127.0.0.1:8002');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const profileDir = path.join(__dirname, 'chrome-profile-task72');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--window-size=430,932',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + profileDir
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const jsonRes = await fetch('http://127.0.0.1:9225/json/list');
    const targets = await jsonRes.json();
    const target = targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => {
      if (ws.readyState === WebSocket.OPEN) r();
      else ws.onopen = r;
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:8002/index.html' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. 게스트 모드 진입
    await send('Runtime.evaluate', {
      expression: `(function() {
        var gBtn = document.getElementById('landGuestBtn') || document.querySelector('.btn-guest');
        if (gBtn) gBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // 설정창 열기
    await send('Runtime.evaluate', {
      expression: `(function() {
        if (typeof window.showScreen === 'function') {
          window.showScreen('settings');
        }
        var setBlock = document.getElementById('setAccountEmail');
        if (setBlock) {
          var details = setBlock.closest('details');
          if (details) details.open = true;
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1000));

    const guestRes = await send('Runtime.evaluate', {
      expression: `(function() {
        var emailEl = document.getElementById('setAccountEmail');
        var passBtn = document.getElementById('btnChangePassModal');
        var heroBadge = document.getElementById('settingsHeroStatusDesc');
        return {
          emailText: emailEl ? emailEl.textContent.trim() : null,
          passBtnText: passBtn ? passBtn.textContent.trim() : null,
          heroBadge: heroBadge ? heroBadge.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('=== GUEST AUDIT ===', guestRes.result.value);

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'step3_es323_guest_settings.png'), Buffer.from(shot.data, 'base64'));
    console.log('✅ Guest screenshot saved');

    // 2. 이메일 로그인 유저 전환
    const emailLoginRes = await send('Runtime.evaluate', {
      expression: `(function() {
        state.user = { id: 'u_email_72', email: 'sangmin@ourgoal.app' };
        state.profile = Object.assign({}, state.profile, {
          id: 'u_email_72',
          email: 'sangmin@ourgoal.app',
          displayName: '상민',
          provider: 'email',
          isGuest: false
        });

        if (typeof window.renderSettingsScreen === 'function') window.renderSettingsScreen();
        if (typeof window.renderSettingsHeroCard === 'function') window.renderSettingsHeroCard();

        var setBlock = document.getElementById('setAccountEmail');
        if (setBlock) {
          var details = setBlock.closest('details');
          if (details) details.open = true;
        }

        return {
          emailText: document.getElementById('setAccountEmail') ? document.getElementById('setAccountEmail').textContent.trim() : null,
          passBtnText: document.getElementById('btnChangePassModal') ? document.getElementById('btnChangePassModal').textContent.trim() : null,
          heroBadge: document.getElementById('settingsHeroStatusDesc') ? document.getElementById('settingsHeroStatusDesc').innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    if (emailLoginRes.exceptionDetails) {
      console.error('EMAIL EXCEPTION:', emailLoginRes.exceptionDetails);
    }
    console.log('=== EMAIL USER AUDIT ===', emailLoginRes.result ? emailLoginRes.result.value : emailLoginRes);

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'step3_es323_login_settings.png'), Buffer.from(shot.data, 'base64'));
    console.log('✅ Email user screenshot saved');

    // 3. 카카오 소셜 로그인 유저 전환
    const kakaoLoginRes = await send('Runtime.evaluate', {
      expression: `(function() {
        state.user = { id: 'u_kakao_72', email: 'kakao_user@kakao.com', app_metadata: { provider: 'kakao' } };
        state.profile = Object.assign({}, state.profile, {
          id: 'u_kakao_72',
          email: 'kakao_user@kakao.com',
          displayName: '카카오상민',
          provider: 'kakao',
          isGuest: false
        });

        if (typeof window.renderSettingsScreen === 'function') window.renderSettingsScreen();
        if (typeof window.renderSettingsHeroCard === 'function') window.renderSettingsHeroCard();

        var setBlock = document.getElementById('setAccountEmail');
        if (setBlock) {
          var details = setBlock.closest('details');
          if (details) details.open = true;
        }

        return {
          emailText: document.getElementById('setAccountEmail') ? document.getElementById('setAccountEmail').textContent.trim() : null,
          passBtnText: document.getElementById('btnChangePassModal') ? document.getElementById('btnChangePassModal').textContent.trim() : null,
          heroBadge: document.getElementById('settingsHeroStatusDesc') ? document.getElementById('settingsHeroStatusDesc').innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('=== KAKAO USER AUDIT ===', kakaoLoginRes.result ? kakaoLoginRes.result.value : kakaoLoginRes);

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'step3_es323_kakao_settings.png'), Buffer.from(shot.data, 'base64'));
    console.log('✅ Kakao user screenshot saved');

    ws.close();
  } catch (err) {
    console.error('CDP Error:', err);
  } finally {
    chrome.kill();
    server.close();
    console.log('CDP Verification finished.');
    process.exit(0);
  }
});
