const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runStage3Verify() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'chrome-stage6-es173');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9365',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + userDataDir,
    '--window-size=430,950',
    '--headless=new',
    'https://ourgoal-app.vercel.app'
  ]);

  console.log('Chrome started, waiting for ready...');
  await new Promise(r => setTimeout(r, 2500));

  const WebSocket = (() => {
    try { return require('ws'); } catch(e) {
      try { return require('../../command-center/node_modules/ws'); } catch(e2) {
        return null;
      }
    }
  })();

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  try {
    const targets = await httpGet('http://localhost:9365/json');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Page target not found');

    const CDP = async (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const ws = new (WebSocket || require('ws'))(pageTarget.webSocketDebuggerUrl);
        const id = Math.floor(Math.random() * 100000);
        ws.on('open', () => {
          ws.send(JSON.stringify({ id, method, params }));
        });
        ws.on('message', (msg) => {
          const res = JSON.parse(msg);
          if (res.id === id) {
            ws.close();
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        });
        ws.on('error', reject);
      });
    };

    console.log('CDP connected, evaluating initial state...');
    await new Promise(r => setTimeout(r, 1500));

    // 게스트 모드로 즉시 진입 (landGuestBtn 클릭)
    console.log('Clicking landGuestBtn (로그인 없이 바로 둘러보기)...');
    await CDP('Runtime.evaluate', {
      expression: `
        (function(){
          var guestBtn = document.getElementById('landGuestBtn');
          if(guestBtn) { guestBtn.click(); return 'clicked landGuestBtn'; }
          return 'landGuestBtn not found';
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // 나만의 홈 구성 버튼 클릭
    console.log('Clicking 나만의 홈 구성 버튼 (btnCustomHomeLayout)...');
    const clickRes = await CDP('Runtime.evaluate', {
      expression: `
        (function(){
          var btn = document.getElementById('btnCustomHomeLayout');
          if(btn) { btn.click(); return { success: true }; }
          return { success: false, reason: 'btnCustomHomeLayout not found' };
        })()
      `,
      returnByValue: true
    });
    console.log('Click result:', clickRes.result.value);
    await new Promise(r => setTimeout(r, 1200));

    // 모달 내부 항목 검증
    const auditRes = await CDP('Runtime.evaluate', {
      expression: `
        (function(){
          var list = document.getElementById('kf1LayoutList');
          if(!list) return { error: 'kf1LayoutList not found' };

          var rows = Array.from(list.querySelectorAll('.toggle-row'));
          var items = rows.map(function(r){
            var titleEl = r.querySelector('.t b, .t');
            var title = titleEl ? titleEl.innerText.trim() : '';
            var hintEl = r.querySelector('.t div');
            var hint = hintEl ? hintEl.innerText.trim() : '';
            var sw = r.querySelector('.switch');
            var isLocked = sw ? sw.getAttribute('data-kf1-locked') === 'true' : false;
            var isLockedClass = sw ? sw.classList.contains('locked') : false;
            var isOn = sw ? sw.classList.contains('on') : false;
            var id = sw ? sw.getAttribute('data-kf1-id') : '';
            var hasLockBadge = !!r.querySelector('.badge-locked');
            return { id: id, title: title, hint: hint, isLocked: isLocked, isLockedClass: isLockedClass, isOn: isOn, hasLockBadge: hasLockBadge };
          });

          // 첫 번째 잠금 스위치 클릭 시도
          var firstLockedSw = list.querySelector('.switch[data-kf1-locked="true"]');
          if(firstLockedSw) {
            firstLockedSw.click();
          }

          var toastEl = document.querySelector('.toast, #toastBox, .toast-box');
          var toastText = toastEl ? toastEl.innerText : '';

          return {
            itemsCount: items.length,
            items: items,
            crewPacingFound: items.some(function(it){ return it.id === 'crewPacingWidget'; }),
            firstItem: items[0],
            secondItem: items[1],
            toastText: toastText
          };
        })()
      `,
      returnByValue: true
    });

    console.log('\n--- 나만의 홈 구성 감사 결과 ---');
    console.log(JSON.stringify(auditRes.result.value, null, 2));

    await new Promise(r => setTimeout(r, 500));

    // 스크린샷 캡처
    console.log('Capturing screenshot...');
    const screenshot = await CDP('Page.captureScreenshot', { format: 'png' });
    const imgBuffer = Buffer.from(screenshot.data, 'base64');
    const outPath = path.join(__dirname, 'stage6_es173_prod_live.png');
    fs.writeFileSync(outPath, imgBuffer);
    console.log('Screenshot saved to:', outPath);

    console.log('\n✅ [3단계 로컬 수동 확인] 완료!');
  } catch (err) {
    console.error('Stage 3 verification error:', err);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
  }
}

runStage3Verify();
