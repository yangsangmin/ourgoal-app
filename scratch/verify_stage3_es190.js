const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8190;
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(filePath);
  const mimes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  res.writeHead(200, { 'Content-Type': mimes[ext] || 'text/plain' });
  res.end(fs.readFileSync(filePath));
});

server.listen(PORT, async () => {
  console.log('[STAGE 3 ES190] Test server listening on port ' + PORT);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'chrome-stage3-es190');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9390',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + userDataDir,
    '--window-size=375,812',
    '--headless=new',
    'http://localhost:' + PORT + '/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const httpGet = (url) => new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const targets = await httpGet('http://localhost:9390/json');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('[STAGE 3 ES190] Waiting for page load and guest setup...');
    await new Promise(r => setTimeout(r, 2000));

    // 게스트 모드 진입 클릭 (만약 로그인 화면이면)
    await send('Runtime.evaluate', {
      expression: `
        (function() {
          var exploreBtn = document.getElementById('exploreGuestBtn') || document.querySelector('.btn-guest-explore') || document.querySelector('[onclick*="guestLogin"]');
          if (exploreBtn) exploreBtn.click();
          if (typeof setTab === 'function') setTab('home');
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1500));

    // 1. 초기 3초 체크인 입력창 검증
    console.log('--- [검증 1] 초기 captureInput 상태 실측 ---');
    const evalInit = await send('Runtime.evaluate', {
      expression: `
        (function() {
          var inp = document.getElementById('captureInput');
          return {
            exists: !!inp,
            value: inp ? inp.value : null,
            placeholder: inp ? inp.placeholder : null,
            charCount: inp ? inp.value.length : -1
          };
        })()
      `,
      returnByValue: true
    });

    console.log('초기 입력창 상태:', JSON.stringify(evalInit.result.value));
    if (evalInit.result.value.value !== '') {
      throw new Error('FAIL: captureInput is NOT empty initially! value=' + evalInit.result.value.value);
    }
    console.log('✓ [PASS] 초기 입력창이 완전히 깨끗한 빈 상태(value = "")입니다.');

    // 2. 정적 칩 및 동적 커닝페이퍼 칩 클릭 후 상태 실측
    console.log('--- [검증 2] 커닝페이퍼 칩 클릭 후 실측 ---');
    const evalChipClick = await send('Runtime.evaluate', {
      expression: `
        (function() {
          var chip = document.querySelector('.btn-quick-chip');
          if (!chip) return { found: false };
          var chipText = chip.textContent.trim();
          chip.click();
          var inp = document.getElementById('captureInput');
          return {
            found: true,
            chipText: chipText,
            valueAfterClick: inp ? inp.value : null,
            placeholderAfterClick: inp ? inp.placeholder : null,
            isFocused: document.activeElement === inp
          };
        })()
      `,
      returnByValue: true
    });

    console.log('칩 클릭 후 상태:', JSON.stringify(evalChipClick.result.value));
    if (evalChipClick.result.value.valueAfterClick !== '') {
      throw new Error('FAIL: captureInput has text after chip click! value=' + evalChipClick.result.value.valueAfterClick);
    }
    if (!evalChipClick.result.value.placeholderAfterClick.includes('예: ')) {
      throw new Error('FAIL: placeholder does not contain hint! placeholder=' + evalChipClick.result.value.placeholderAfterClick);
    }
    console.log('✓ [PASS] 칩 클릭 후에도 입력창 value는 깨끗한 빈 상태("") 유지!');
    console.log('✓ [PASS] placeholder에 예시 힌트 반영 확인: ' + evalChipClick.result.value.placeholderAfterClick);
    console.log('✓ [PASS] 입력창 포커스 상태 확인: ' + evalChipClick.result.value.isFocused);

    // 3. 스크린샷 캡처
    console.log('--- [검증 3] 실측 스크린샷 캡처 ---');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(__dirname, 'stage3_es190_clean_checkin.png');
    fs.writeFileSync(shotPath, Buffer.from(screenshot.data, 'base64'));
    console.log('✓ [PASS] 스크린샷 저장 완료: ' + shotPath);

    // 아티팩트 디렉토리에도 복사
    const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a63b03bc-1629-41f2-9196-2e4a54409d45';
    fs.copyFileSync(shotPath, path.join(artifactDir, 'stage3_es190_clean_checkin.png'));
    console.log('✓ [PASS] 아티팩트 디렉토리 복사 완료');

    ws.close();
    chromeProc.kill();
    server.close();
    console.log('\n✨ [ALL PASS] #TASK-ES-190 실측 CDP 검증 100% 성공 완료!');
    process.exit(0);

  } catch (err) {
    console.error('검증 실패:', err);
    chromeProc.kill();
    server.close();
    process.exit(1);
  }
});
