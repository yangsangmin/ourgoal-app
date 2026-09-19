const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome-feed-bridge-proof');
if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\3ec346fb-90a0-415c-85ce-7edbacde7354';

const chromeProc = spawn(chromePath, [
  '--remote-debugging-port=9607',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + userDataDir,
  '--window-size=430,932',
  '--headless=new',
  'http://localhost:8888/?preview=1&t=' + Date.now()
]);

async function run() {
  console.log('🚀 Launching Chrome Headless CDP for Feed Social Bridge Verification...');
  await new Promise(r => setTimeout(r, 4500));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const targets = await httpGet('http://localhost:9607/json');
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No page target found');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let reqId = 1;
  function send(method, params = {}) {
    const id = reqId++;
    return new Promise((resolve, reject) => {
      const handler = (evt) => {
        const parsed = JSON.parse(evt.data);
        if (parsed.id === id) {
          ws.removeEventListener('message', handler);
          if (parsed.error) reject(parsed.error);
          else resolve(parsed.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 2,
    mobile: true
  });

  console.log('1. 소통 탭 진입...');
  await send('Runtime.evaluate', {
    expression: `
      (function(){
        if(typeof setTab === 'function'){
          setTab('comm');
        } else {
          var btn = document.querySelector('.navbtn[data-tab="comm"]');
          if(btn) btn.click();
        }
        state.commSubTab = 'feed';
        var feedTabBtn = document.querySelector('[data-commsubtab="feed"]');
        if(feedTabBtn) feedTabBtn.click();
        if(typeof renderCommScreen === 'function') renderCommScreen();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // 1호: 피드 카드 내 4대 소셜 액션 버튼 확인
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'proof_01_feed_social_bridge.png'), Buffer.from(snap1.data, 'base64'));
  console.log('✓ proof_01_feed_social_bridge.png 저장 완료');

  // 2호: 아바타/닉네임 클릭 -> 회원 상세 프로필 모달 오픈
  console.log('2. 피드 첫번째 작성자 프로필 클릭...');
  await send('Runtime.evaluate', {
    expression: `
      (function(){
        var profEl = document.querySelector('[data-feedprof]');
        if(profEl) profEl.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'proof_02_user_profile_modal_from_feed.png'), Buffer.from(snap2.data, 'base64'));
  console.log('✓ proof_02_user_profile_modal_from_feed.png 저장 완료');

  // 모달 닫기
  await send('Runtime.evaluate', {
    expression: `if(typeof closeModal === 'function') closeModal();`
  });
  await new Promise(r => setTimeout(r, 600));

  // 3호: 피드 첫번째 카드의 🔗 공유 클릭 -> 인앱 통합 공유 모달 오픈
  console.log('3. 피드 공유 버튼 클릭...');
  await send('Runtime.evaluate', {
    expression: `
      (function(){
        var shareBtn = document.querySelector('[data-sharefeed]');
        if(shareBtn) shareBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'proof_03_feed_inapp_share_modal.png'), Buffer.from(snap3.data, 'base64'));
  console.log('✓ proof_03_feed_inapp_share_modal.png 저장 완료');

  // 모달 닫기
  await send('Runtime.evaluate', {
    expression: `if(typeof closeModal === 'function') closeModal();`
  });
  await new Promise(r => setTimeout(r, 600));

  // 4호: 피드 첫번째 카드의 👑 영입 클릭 -> 팀 목표 영입 초대 모달 오픈
  console.log('4. 피드 팀 영입 버튼 클릭...');
  await send('Runtime.evaluate', {
    expression: `
      (function(){
        var scoutBtn = document.querySelector('[data-feedscout]');
        if(scoutBtn) scoutBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  const snap4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'proof_04_feed_scout_to_team_modal.png'), Buffer.from(snap4.data, 'base64'));
  console.log('✓ proof_04_feed_scout_to_team_modal.png 저장 완료');

  // 모달 닫기
  await send('Runtime.evaluate', {
    expression: `if(typeof closeModal === 'function') closeModal();`
  });

  console.log('✨ All 4 Proofs captured successfully!');
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  try { chromeProc.kill(); } catch (e) {}
  process.exit(1);
});
