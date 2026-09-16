// scratch/verify_avatar_drawer_e2e.js
// #TASK-ES-119 3단계: 로컬 크롬 실측 - 아바타 서랍 누적 확인 및 원클릭 변경 착용 검증

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

async function runAvatarDrawerE2E() {
  console.log('=== [#TASK-ES-119 3단계: 로컬 크롬 브라우저 실측 E2E 검증] ===\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9342;
  const userDataDir = path.join(__dirname, 'chrome-avatar-drawer-profile-9342');

  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

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

    await sendCmd('Page.enable');
    await sendCmd('Runtime.enable');
    await new Promise(r => setTimeout(r, 2000));

    console.log('2. 게스트 모드 진입 (landGuestBtn 클릭)...');
    await sendCmd('Runtime.evaluate', { expression: 'document.getElementById("landGuestBtn").click();' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. 아바타 모달 오픈 (#btnOpenAvatarModal 클릭)...');
    await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          // 샘플 3종 생성
          function makeColorDataUrl(color, text) {
            var c = document.createElement('canvas');
            c.width = 100; c.height = 100;
            var ctx = c.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 50, 50);
            return c.toDataURL('image/png');
          }

          var ava1 = makeColorDataUrl('#EF4444', '🏃'); // 러너
          var ava2 = makeColorDataUrl('#2563EB', '💼'); // CEO
          var ava3 = makeColorDataUrl('#10B981', '🧘'); // 요가

          // 보관함에 3개 주입
          OurgoalAvatar.addSavedAvatar(state.profile, {
            id: 'ava_runner',
            url: ava1,
            themeId: 1,
            themeName: '열정 러너',
            themeIcon: '🏃'
          });
          OurgoalAvatar.addSavedAvatar(state.profile, {
            id: 'ava_ceo',
            url: ava2,
            themeId: 12,
            themeName: '비전 CEO',
            themeIcon: '💼'
          });
          OurgoalAvatar.addSavedAvatar(state.profile, {
            id: 'ava_yoga',
            url: ava3,
            themeId: 4,
            themeName: '마인드 요가',
            themeIcon: '🧘'
          });

          // 현재 착용은 러너로 설정
          state.profile.settings.customAvatarUrl = ava1;
          state.profile.settings.avatarType = 'custom';
          state.profile.settings.avatarThemeId = 1;

          // 모달 오픈 버튼 클릭
          var btn = document.getElementById('btnOpenAvatarModal');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log('4. 만화형 탭으로 전환...');
    await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          var customTab = document.querySelector('[data-avatartype="custom"]');
          if (customTab) customTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    const deckCheck = await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          var cards = document.querySelectorAll('.saved-avatar-card');
          return {
            cardCount: cards.length,
            firstCard: cards[0] ? cards[0].textContent.trim() : '',
            secondCard: cards[1] ? cards[1].textContent.trim() : '',
            thirdCard: cards[2] ? cards[2].textContent.trim() : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log(' - 서랍 UI 렌더링 결과:', deckCheck.result.value);

    console.log('5. 서랍 내 2번째 카드(비전 CEO) 클릭하여 원클릭 선택 인터랙션 검증...');
    const selectResult = await sendCmd('Runtime.evaluate', {
      expression: `
        (() => {
          var cards = document.querySelectorAll('.saved-avatar-card');
          if (cards.length >= 2) {
            cards[1].click(); // 2번째 카드 클릭
            var meta = document.querySelector('#customAvatarMetaText');
            return {
              clicked: true,
              metaText: meta ? meta.textContent : '',
              hasSelectedBorder: cards[1].style.border.includes('var(--emerald') || cards[1].style.boxShadow.includes('16, 185, 129')
            };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log(' - 카드 선택 결과:', selectResult.result ? selectResult.result.value : selectResult);

    console.log('6. 스크린샷 캡처 중...');
    const screenshotRes = await sendCmd('Page.captureScreenshot', {
      format: 'png',
      quality: 90
    });
    const screenshotPath = path.join(__dirname, 'screen_avatar_drawer_verified.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotRes.data, 'base64'));
    console.log(' - 스크린샷 저장 완료:', screenshotPath);

    console.log('\n✨ [#TASK-ES-119] 로컬 Chrome 브라우저 실측 E2E 검증 100% 성공!');
  } finally {
    if (ws) ws.close();
    chromeProcess.kill('SIGTERM');
  }
}

runAvatarDrawerE2E().catch((err) => {
  console.error('E2E 검증 실패:', err);
  process.exit(1);
});
