const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, 'chrome-team-invite-proof-v4');
if (fs.existsSync(userDataDir)) {
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
}

const artifactDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\3ec346fb-90a0-415c-85ce-7edbacde7354';

const chromeProc = spawn(chromePath, [
  '--remote-debugging-port=9604',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + userDataDir,
  '--window-size=430,932',
  '--headless=new',
  'http://localhost:8888/?preview=1&t=' + Date.now()
]);

async function run() {
  console.log('🚀 Launching Chrome Headless CDP for Team Invite Companions Verification (v4)...');
  await new Promise(r => setTimeout(r, 4500));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const targets = await httpGet('http://localhost:9604/json');
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

  async function snap(name) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(artifactDir, name), buf);
    console.log(`📸 Saved screenshot: ${name}`);
  }

  async function evalJs(expr) {
    return await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  }

  await new Promise(r => setTimeout(r, 2000));

  // 게스트 모드 진입
  console.log('Entering guest mode...');
  await evalJs(`(() => {
    const guestBtn = document.getElementById('guestModeBtn') || Array.from(document.querySelectorAll('button, a')).find(b => b.innerText && b.innerText.includes('로그인 없이 둘러보기'));
    if (guestBtn) guestBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1500));

  // 1. 목표 탭 전환 및 내 동반자 3명 보장 & 팀장 권한 세팅
  console.log('Ensuring companions and team owner role...');
  await evalJs(`(() => {
    setTab('goals');
    state.goalsSubTab = 'team';
    if(!state.profile) state.profile = { settings: {} };
    if(!state.profile.settings) state.profile.settings = {};
    if(!state.profile.settings.groupState) state.profile.settings.groupState = {};
    state.profile.settings.groupState['g-workshop'] = { joined: true, myRole: 'owner', checkins: [], cheers: 0 };
    
    // 기본 동반자 3명 시드
    state.profile.companions = [
      { id: 'mate_minji', nickname: '새벽러너_민지', name: '새벽러너_민지', avatar: '🏃‍♀️', intro: '매일 아침 5km 가볍게 러닝!', isAiBot: true },
      { id: 'mate_sua', nickname: '갓생사는_수아', name: '갓생사는_수아', avatar: '✨', intro: '퇴근 후 자기계발 2시간 실천', isAiBot: true },
      { id: 'mate_sm', nickname: '러너상민', name: '러너상민', avatar: '🏃', intro: '하반기 풀코스 마라톤 서브4 도전 🔥', isAiBot: false }
    ];

    if(typeof renderTeamGoalsScreen === 'function') renderTeamGoalsScreen();
  })()`);
  await new Promise(r => setTimeout(r, 1500));

  // 2. 팀 목표 카드에서 '팀원 초대' 모달 호출
  console.log('Opening Team Invite Modal for g-workshop...');
  await evalJs(`(() => {
    const btn = document.querySelector('[data-inviteteam="g-workshop"]');
    if (btn) btn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));

  // [샷 1]: 내 동반자 목록 노출 & 첫 번째 동반자 '새벽러너_민지'를 원탭 팀 초대한 상태
  console.log('Inviting first companion "새벽러너_민지"...');
  await evalJs(`(() => {
    const compBtn = document.querySelector('.btn-invite-comp[data-compname="새벽러너_민지"]');
    if (compBtn) compBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await snap('proof_01_companion_one_tap_invite.png');

  // [샷 2]: 지인 닉네임 검색창으로 스크롤 후 '도현' 검색 실행
  console.log('Searching for acquaintance "도현"...');
  await evalJs(`(() => {
    const input = document.getElementById('teamInviteSearchInput');
    const btn = document.getElementById('teamInviteSearchBtn');
    const sheet = document.getElementById('modalSheet');
    if (input && btn) {
      input.value = '도현';
      btn.click();
    }
    if (sheet) sheet.scrollTop = 260;
  })()`);
  await new Promise(r => setTimeout(r, 1200));
  await snap('proof_02_search_acquaintance.png');

  // [샷 3]: 검색된 '코드장인_도현'을 [+ 팀원으로 영입] 클릭하여 '✓ 참여 중'으로 즉각 전환된 상태
  console.log('Recruiting "코드장인_도현"...');
  await evalJs(`(() => {
    const recruitBtn = document.querySelector('.btn-recruit-user');
    if (recruitBtn) recruitBtn.click();
    const sheet = document.getElementById('modalSheet');
    if (sheet) sheet.scrollTop = 180;
  })()`);
  await new Promise(r => setTimeout(r, 600));
  await snap('proof_03_recruited_and_mutual_synced.png');

  // [샷 4]: 모달 상단 '외부 공유' 탭 클릭
  console.log('Switching to Outer Share tab...');
  await evalJs(`(() => {
    const tabOuter = document.getElementById('tabTeamInviteOuter');
    if (tabOuter) tabOuter.click();
    const sheet = document.getElementById('modalSheet');
    if (sheet) sheet.scrollTop = 0;
  })()`);
  await new Promise(r => setTimeout(r, 1000));
  await snap('proof_04_outer_share_options.png');

  console.log('🎉 All 4 proof screenshots captured successfully!');
  ws.close();
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error during capture:', err);
  if (chromeProc) chromeProc.kill();
  process.exit(1);
});
