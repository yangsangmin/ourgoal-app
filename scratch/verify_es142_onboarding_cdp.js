const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, '../temp-chrome-cdp-es142');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const CHROME_PORT = 9560;
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=390,844',
    '--headless=new',
    'http://localhost:8888'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const targets = await httpGet(`http://127.0.0.1:${CHROME_PORT}/json`);
  const pageTarget = targets.find(t => t.type === 'page');
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const WebSocket = require('C:/dev/command-center/node_modules/ws');
  const ws = new WebSocket(wsUrl);
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === msgId) {
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res && res.exceptionDetails) {
      console.warn('Eval Exception:', res.exceptionDetails);
    }
    return res && res.result ? res.result.value : null;
  };

  const captureScreenshot = async (filePath) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log('📸 스크린샷 저장됨:', filePath);
  };

  console.log('1. 페이지 로딩 대기...');
  await new Promise(r => setTimeout(r, 1500));

  // 게스트로 시작하기 위해 localStorage 초기화
  await evalJs(`
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  `);
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. 게스트 모드로 입장 후 30초 무마찰 온보딩 트리거...');
  await evalJs(`
    document.getElementById('landGuestBtn').click();
  `);
  await new Promise(r => setTimeout(r, 1000));
  await evalJs(`
    if(typeof window.startOnboarding === 'function') window.startOnboarding();
  `);
  await new Promise(r => setTimeout(r, 1000));

  console.log('3. 온보딩 Step 1: 수호동물 선택 모달 검증...');
  const step1State = await evalJs(`
    (() => {
      const modal = document.getElementById('modalSheet');
      const overlay = document.getElementById('modalOverlay');
      const isVisible = overlay && overlay.classList.contains('active');
      const stepLabel = modal ? modal.querySelector('.ob-step-label')?.textContent : '';
      const avatarCards = modal ? modal.querySelectorAll('.ob-avatar-card').length : 0;
      const grpChips = modal ? modal.querySelectorAll('.ob-grp-chip').length : 0;
      const aiBanner = modal ? modal.textContent.includes('내 실제 사진 기반 AI 아바타') : false;
      return { visible: isVisible && !!modal, stepLabel, avatarCards, grpChips, aiBanner };
    })()
  `);
  console.log('  Step 1 상태:', step1State);

  // 관리형 그룹 선택 후 거북이 아바타 선택
  console.log('  관리형 그룹 클릭 및 거북이(ISTJ) 아바타 선택...');
  await evalJs(`
    (() => {
      const grpBtn = document.querySelector('.ob-grp-chip[data-grp="관리형"]');
      if (grpBtn) grpBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  await evalJs(`
    (() => {
      const turtle = document.querySelector('.ob-avatar-card[data-mbti="ISTJ"]');
      if (turtle) turtle.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  const artifactDir = 'C:/Users/HP/.gemini/antigravity/brain/75840bfe-477a-4777-9907-98c9ad01a30f';
  await captureScreenshot(path.join(artifactDir, 'step1_es142_animal_avatar.png'));

  console.log('4. [수호동물 확정하고 다음으로 ➔] 클릭...');
  await evalJs(`document.getElementById('obNext1').click();`);
  await new Promise(r => setTimeout(r, 1000));

  console.log('5. 온보딩 Step 2: 닉네임 & 1호 목표 선택 모달 검증...');
  const step2State = await evalJs(`
    (() => {
      const modal = document.getElementById('modalSheet');
      const overlay = document.getElementById('modalOverlay');
      const isVisible = overlay && overlay.classList.contains('active');
      const stepLabel = modal ? modal.querySelector('.ob-step-label')?.textContent : '';
      const nickInput = modal ? modal.querySelector('#obNickInput')?.value : '';
      const presets = modal ? Array.from(modal.querySelectorAll('.ob-preset-chip')).map(c => c.textContent.trim()) : [];
      return { visible: isVisible && !!modal, stepLabel, nickInput, presets };
    })()
  `);
  console.log('  Step 2 상태:', step2State);

  // 닉네임 수정 및 1호 운동 프리셋 선택
  await evalJs(`
    (() => {
      const nick = document.getElementById('obNickInput');
      if (nick) { nick.value = '성실한거북이'; }
      const chip = document.querySelector('.ob-preset-chip[data-title="매일 30분 달리기/걷기"]');
      if (chip) chip.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 500));
  await captureScreenshot(path.join(artifactDir, 'step2_es142_goal_preset.png'));

  console.log('6. [아워골 시작하기 (+10 EXP) 🚀] 클릭...');
  await evalJs(`document.getElementById('obFinish2').click();`);
  await new Promise(r => setTimeout(r, 1500));

  console.log('7. 홈 콕핏 안착 및 첫 체크인 튜토리얼 칩 검증...');
  const cockpitState = await evalJs(`
    (() => {
      const banner = document.getElementById('firstCheckinTutorialBanner');
      const bannerVisible = banner && window.getComputedStyle(banner).display !== 'none';
      const bannerTitle = document.getElementById('firstCheckinTutorialTitle')?.textContent || '';
      const bannerEmoji = document.getElementById('firstCheckinTutorialEmoji')?.textContent || '';
      const inp = document.getElementById('captureInput');
      const placeholder = inp ? inp.placeholder : '';
      const xp = (state.profile && state.profile.settings && state.profile.settings.xp) ? state.profile.settings.xp.total : 0;
      const goals = (state.profile && state.profile.goals) ? state.profile.goals.map(g => g.title) : [];
      const animal = state.profile ? state.profile.guardianAnimal : null;
      return { bannerVisible, bannerTitle, bannerEmoji, placeholder, xp, goals, animal };
    })()
  `);
  console.log('  홈 콕핏 안착 상태:', cockpitState);
  await captureScreenshot(path.join(artifactDir, 'step3_es142_cockpit_tutorial.png'));

  console.log('8. 3단계 (10초): 첫 체크인(E1) 작성 및 저장...');
  await evalJs(`
    (() => {
      const inp = document.getElementById('captureInput');
      inp.value = '오늘 30분 힘차게 러닝 완료!';
      document.getElementById('captureSave').click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  console.log('9. 첫 체크인 축하 팝업 모달(E1 루프) 검증...');
  const celebrationState = await evalJs(`
    (() => {
      const modal = document.getElementById('modalSheet');
      const overlay = document.getElementById('modalOverlay');
      const isVisible = overlay && overlay.classList.contains('active');
      const title = modal ? modal.querySelector('h3')?.textContent : '';
      const sub = modal ? modal.querySelector('p')?.textContent : '';
      const doneBtn = modal ? !!modal.querySelector('#firstCheckinDoneBtn') : false;
      const xp = (state.profile && state.profile.settings && state.profile.settings.xp) ? state.profile.settings.xp.total : 0;
      const recordsCount = (state.profile && state.profile.records) ? state.profile.records.length : 0;
      return { visible: isVisible && !!modal, title, sub, doneBtn, xp, recordsCount };
    })()
  `);
  console.log('  축하 팝업 상태:', celebrationState);
  await captureScreenshot(path.join(artifactDir, 'step4_es142_checkin_celebrated.png'));

  console.log('10. [홈 콕핏 둘러보기 ➔] 클릭 후 튜토리얼 칩 정리 및 레벨 1 달성 상태 확인...');
  await evalJs(`
    (() => {
      const doneBtn = document.getElementById('firstCheckinDoneBtn');
      if (doneBtn) doneBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  const finalState = await evalJs(`
    (() => {
      const banner = document.getElementById('firstCheckinTutorialBanner');
      const bannerDisplay = banner ? window.getComputedStyle(banner).display : 'none';
      const xp = (state.profile && state.profile.settings && state.profile.settings.xp) ? state.profile.settings.xp.total : 0;
      const recordsCount = (state.profile && state.profile.records) ? state.profile.records.length : 0;
      const celebrated = state.profile ? state.profile.firstCheckinCelebrated : false;
      return { bannerDisplay, xp, recordsCount, celebrated };
    })()
  `);
  console.log('  최종 상태:', finalState);
  await captureScreenshot(path.join(artifactDir, 'step5_es142_home_after_checkin.png'));

  const report = {
    task: 'TASK-ES-142',
    name: '30초 온보딩 및 첫 체크인(E1) 경험 극대화',
    step1: step1State,
    step2: step2State,
    step3_cockpit: cockpitState,
    step4_celebration: celebrationState,
    finalState: finalState,
    success: (
      step1State.visible &&
      step2State.visible &&
      cockpitState.bannerVisible &&
      celebrationState.visible &&
      finalState.recordsCount === 1 &&
      finalState.xp >= 20 &&
      finalState.celebrated === true
    )
  };

  fs.writeFileSync(path.join(artifactDir, 'es142_verification_report.json'), JSON.stringify(report, null, 2));
  console.log('📊 검증 보고서 작성 완료:', report);

  ws.close();
  chromeProc.kill();
  console.log('✨ CDP 전 과정 검증 완결!');
}

run().catch(err => {
  console.error('검증 실행 중 에러 발생:', err);
  process.exit(1);
});
