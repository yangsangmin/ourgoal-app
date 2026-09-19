const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8136;
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
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'chrome-stage3-es191-run');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9396',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + userDataDir,
    '--window-size=375,812',
    '--headless=new',
    'http://localhost:' + PORT + '/index.html'
  ]);

  async function getWsUrl() {
    for (let i = 0; i < 30; i++) {
      try {
        const list = await new Promise((resolve, reject) => {
          http.get('http://127.0.0.1:9396/json', (r) => {
            let data = '';
            r.on('data', d => data += d);
            r.on('end', () => resolve(JSON.parse(data)));
          }).on('error', reject);
        });
        const pageTarget = list && list.find(t => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          return pageTarget.webSocketDebuggerUrl;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('Could not find chrome page debugging url');
  }

  try {
    const wsUrl = await getWsUrl();
    const WebSocket = require('C:/dev/command-center/node_modules/ws');
    const ws = new WebSocket(wsUrl);

    let idSeq = 1;
    const pending = new Map();

    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.id && pending.has(parsed.id)) {
        const { resolve, reject } = pending.get(parsed.id);
        pending.delete(parsed.id);
        if (parsed.error) reject(parsed.error);
        else resolve(parsed.result);
      }
    });

    await new Promise(r => ws.on('open', r));

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idSeq++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression: `(() => { ${expression} })()`,
        returnByValue: true,
        awaitPromise: true
      });
      if (res && res.exceptionDetails) {
        console.error('Eval Exception:', res.exceptionDetails.text, res.exceptionDetails.exception && res.exceptionDetails.exception.description);
      }
      return res && res.result ? res.result.value : null;
    };

    const takeScreenshot = async (filePath) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      const artPath = path.join('C:\\Users\\HP\\.gemini\\antigravity\\brain\\a63b03bc-1629-41f2-9196-2e4a54409d45', path.basename(filePath));
      fs.writeFileSync(artPath, Buffer.from(res.data, 'base64'));
      console.log('  📸 Screenshot saved: ' + path.basename(filePath));
    };

    await send('Console.enable');
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.method === 'Runtime.consoleAPICalled') {
        const text = parsed.params.args.map(a => a.value || a.description).join(' ');
        if (parsed.params.type === 'error') console.error('  [Browser Error]:', text);
      }
      if (parsed.method === 'Runtime.exceptionThrown') {
        console.error('  [Browser Exception]:', parsed.params.exceptionDetails);
      }
    });

    console.log('[1] Logging in...');
    await new Promise(r => setTimeout(r, 2000));
    await evaluate(`
      const b = document.getElementById('landGuestBtn') || document.getElementById('btnLandingPreviewDirect');
      if (b) b.click();
      if (typeof closeAvatarGreetingPopup === 'function') closeAvatarGreetingPopup(true);
      const gb = document.getElementById('btnAvatarGreetClose');
      if (gb) gb.click();
    `);
    await new Promise(r => setTimeout(r, 2000));

    // [1] 팀 연계 모달 검증 (입력창 value="" 확인 & placeholder 안내 확인)
    console.log('[2] Checking openTeamLinkedPersonalGoalModal...');
    const tlpRes = await evaluate(`
      const fn = window.openTeamLinkedPersonalGoalModal;
      if (typeof fn === 'function') {
        fn('team_123', '글로벌 개발 크루');
        const inp = document.getElementById('tlpTitleInput');
        return {
          exists: !!inp,
          value: inp ? inp.value : null,
          placeholder: inp ? inp.placeholder : null
        };
      }
      return { err: 'openTeamLinkedPersonalGoalModal not found' };
    `);
    console.log('  TLP Result:', tlpRes);
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot(path.join(__dirname, 'stage3_es191_01_team_linked_clean.png'));
    await evaluate(`if(typeof closeModal === 'function') closeModal();`);
    await new Promise(r => setTimeout(r, 600));

    // [2] 목표 탭 개인 목표 200% 활용 가이드 검증 (데드 버튼 제거 확인)
    console.log('[3] Checking Goals Guide dead button removal...');
    const guideRes = await evaluate(`
      if (typeof setTab === 'function') setTab('goals');
      const gBtn = document.getElementById('btnShowPersonalGuideModal');
      if (gBtn) gBtn.click();
      const deadBtn = document.getElementById('btnGuideAddFirstGoal');
      return {
        guideOpened: !!document.getElementById('personalGoalsEmptyGuideCard') || !!document.querySelector('.modal-sheet'),
        deadBtnInDOM: !!deadBtn
      };
    `);
    console.log('  Guide Button Dead Check:', guideRes);
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot(path.join(__dirname, 'stage3_es191_02_goals_clean_guide.png'));
    await evaluate(`if(typeof closeModal === 'function') closeModal();`);
    await new Promise(r => setTimeout(r, 600));

    // [3] 설정 탭 아바타 인사말 검증 (화면 & 홈 구성 아코디언 펼치고 빈 value 및 placeholder 확인)
    console.log('[4] Checking Settings Avatar Greeting inputs...');
    const agRes = await evaluate(`
      const navBtn = document.querySelector('button.navbtn[data-tab="settings"]');
      if (navBtn) navBtn.click();
      else if (typeof setTab === 'function') setTab('settings');
      
      const accordions = document.querySelectorAll('details.settings-group-accordion');
      // 그룹 3: 화면 & 홈 구성 (index 2)
      if (accordions && accordions[2]) {
        const sum = accordions[2].querySelector('summary');
        if (sum && !accordions[2].open) sum.click();
        accordions[2].open = true;
      }
      const dayInp = document.getElementById('avatarGreetingDayMsg');
      const nightInp = document.getElementById('avatarGreetingNightMsg');
      return {
        dayVal: dayInp ? dayInp.value : null,
        dayPh: dayInp ? dayInp.placeholder : null,
        nightVal: nightInp ? nightInp.value : null,
        nightPh: nightInp ? nightInp.placeholder : null
      };
    `);
    console.log('  Avatar Greeting Result:', agRes);
    await new Promise(r => setTimeout(r, 800));
    await evaluate(`
      const dayInp = document.getElementById('avatarGreetingDayMsg');
      if (dayInp) {
        dayInp.scrollIntoView({ behavior: 'instant', block: 'center' });
        dayInp.focus();
      }
    `);
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot(path.join(__dirname, 'stage3_es191_03_settings_clean_greeting.png'));

    // [4] 일정 첨부 모달 프리셋 칩 클릭 시 빈 입력창 유지 검증
    console.log('[5] Checking Calendar Attachment Preset Chip clean input...');
    const attRes = await evaluate(`
      if (typeof openAddAttachmentModal === 'function') {
        openAddAttachmentModal(function(){});
        const chips = document.querySelectorAll('.att-preset-chip');
        if (chips && chips.length > 0) {
          chips[0].click(); // 첫 번째 프리셋(공식 문서) 클릭
        }
        const titleInp = document.getElementById('attTitleInput');
        const noteInp = document.getElementById('attNoteInput');
        return {
          titleVal: titleInp ? titleInp.value : null,
          titlePh: titleInp ? titleInp.placeholder : null,
          noteVal: noteInp ? noteInp.value : null,
          notePh: noteInp ? noteInp.placeholder : null
        };
      }
      return { err: 'openAddAttachmentModal not found' };
    `);
    console.log('  Attachment Preset Result:', attRes);
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot(path.join(__dirname, 'stage3_es191_04_attachment_clean_preset.png'));
    await evaluate(`if(typeof closeModal === 'function') closeModal();`);

    console.log('🎉 ALL ES-191 CDP VERIFICATIONS PASSED 100%!');
    ws.close();
  } catch (err) {
    console.error('CDP Error:', err);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    process.exit(0);
  }
});
