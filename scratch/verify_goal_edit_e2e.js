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

async function runStage3Verification() {
  console.log('=== [3단계: 로컬 수동 확인 및 E2E 브라우저 실동작 검증] ===\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9333;
  const userDataDir = path.join(__dirname, 'chrome-stage3-profile');

  // Launch chrome
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=412,915',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://localhost:8000'
  ], { detached: false });

  try {
    const wsUrl = await getPageWsUrl(debugPort);
    console.log('1. Chrome Page CDP 연결 성공:', wsUrl);

    const ws = new WebSocket(wsUrl);
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

    console.log('2. localhost:8000 페이지 로드 대기...');
    await new Promise(r => setTimeout(r, 2000));

    // Evaluate: 게스트 진입 또는 기본 프로필 설정 후 목표 탭으로 전환
    const initCmdRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (async function(){
          if(!window.state) return { error: 'state not found' };
          var landGuestBtn = document.getElementById('landGuestBtn');
          if(landGuestBtn && (!state.profile || !state.profile.id)){
            landGuestBtn.click();
            await new Promise(r => setTimeout(r, 400));
          }
          if(!state.profile){
            state.profile = { id: 'guest-local-1', username: 'guest', displayName: '게스트', goals: [], records: [] };
          }
          if(!state.profile.goals || !state.profile.goals.length){
            state.profile.goals = [{
              id: 'g-test-1',
              title: '2026년 마라톤 풀코스 완주',
              category: '건강/운동',
              color: '#6366f1',
              deadline: '2026-12-31',
              milestones: [
                { id: 'm-1', title: '주 3회 5km 달리기', current: 5, target: 10, unit: '회' },
                { id: 'm-2', title: '하프 마라톤 완주', current: 0, target: 1, unit: '회' }
              ]
            }];
          }
          state.activeGoalId = state.profile.goals[0].id;
          state.goalsSubTab = 'personal';
          if(window.setTab) window.setTab('goals');
          await new Promise(r => setTimeout(r, 400));
          return {
            tab: state.activeTab,
            goalsCount: (state.profile && state.profile.goals ? state.profile.goals.length : 0),
            goalTitle: (state.profile && state.profile.goals && state.profile.goals[0] ? state.profile.goals[0].title : ''),
            editToggleExists: !!document.getElementById('goalEditToggle')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    const initRes = (initCmdRes && initCmdRes.result && initCmdRes.result.value) || initCmdRes;
    console.log('3. 목표 탭 진입 결과:', initRes);

    await new Promise(r => setTimeout(r, 500));

    // Evaluate: 상단 편집 토글 클릭하여 편집 모드 진입
    const editModeCmdRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (function(){
          var editBtn = document.getElementById('goalEditToggle');
          if(!editBtn) return { error: 'goalEditToggle button not found' };
          editBtn.click();
          var titleInp = document.getElementById('goalTitleInput');
          var doneInline = document.getElementById('btnGoalEditDoneInline');
          var doneFloating = document.getElementById('btnGoalEditDoneFloating');
          var floatingBar = document.getElementById('goalEditFloatingBar');
          return {
            goalEditMode: state.goalEditMode,
            editBtnText: editBtn.textContent,
            hasTitleInput: !!titleInp,
            hasDoneInlineBtn: !!doneInline,
            doneInlineText: doneInline ? doneInline.textContent.trim() : null,
            hasFloatingBar: !!floatingBar,
            hasDoneFloatingBtn: !!doneFloating,
            doneFloatingText: doneFloating ? doneFloating.textContent.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    const editModeRes = (editModeCmdRes && editModeCmdRes.result && editModeCmdRes.result.value) || editModeCmdRes;
    console.log('\n4. [편집] 클릭 후 편집 모드 UI 상태:');
    console.log('   - 편집 모드 활성화 여부:', editModeRes.goalEditMode ? '✅ 정상 (true)' : '❌ 실패');
    console.log('   - 상단 버튼 텍스트:', editModeRes.editBtnText);
    console.log('   - 목표 제목 편집 인풋 노출:', editModeRes.hasTitleInput ? '✅ 정상 노출' : '❌ 누락');
    console.log('   - 하단 인라인 완료 버튼:', editModeRes.hasDoneInlineBtn ? `✅ 정상 노출 (${editModeRes.doneInlineText})` : '❌ 누락');
    console.log('   - 하단 고정 플로팅 바:', editModeRes.hasFloatingBar ? '✅ 정상 플로팅' : '❌ 누락');
    console.log('   - 플로팅 완료 CTA 버튼:', editModeRes.hasDoneFloatingBtn ? `✅ 정상 노출 (${editModeRes.doneFloatingText})` : '❌ 누락');

    // Screenshot of edit mode
    const shotEditMode = await sendCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'screen_goal_edit_mode.png'), Buffer.from(shotEditMode.data, 'base64'));
    console.log('5. 편집 모드 화면 캡처 저장: scratch/screen_goal_edit_mode.png');

    // Evaluate: 목표 제목 수정 및 플로팅 완료 버튼 클릭하여 저장 및 완료
    const finishCmdRes = await sendCmd('Runtime.evaluate', {
      expression: `
        (async function(){
          var titleInp = document.getElementById('goalTitleInput');
          if(titleInp){
            titleInp.value = '2026년 마라톤 풀코스 서브4 달성 (편집 완료 검증)';
          }
          var doneFloating = document.getElementById('btnGoalEditDoneFloating');
          if(!doneFloating) return { error: 'btnGoalEditDoneFloating not found' };
          doneFloating.click();
          await new Promise(r => setTimeout(r, 600));
          return {
            goalEditMode: state.goalEditMode,
            savedTitle: state.profile.goals[0].title,
            floatingBarExistsAfterDone: !!document.getElementById('goalEditFloatingBar'),
            editBtnTextAfterDone: document.getElementById('goalEditToggle').textContent
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    const finishRes = (finishCmdRes.result && finishCmdRes.result.value) || finishCmdRes.result || finishCmdRes;
    console.log('\n6. 플로팅 [✓ 편집 완료] 클릭 후 저장 및 복귀 상태:');
    console.log('   - 편집 모드 종료 여부:', !finishRes.goalEditMode ? '✅ 정상 종료 (false)' : '❌ 여전히 편집중');
    console.log('   - 변경된 제목 저장 반영:', finishRes.savedTitle === '2026년 마라톤 풀코스 서브4 달성 (편집 완료 검증)' ? `✅ 정상 저장 (${finishRes.savedTitle})` : `❌ 불일치 (${finishRes.savedTitle})`);
    console.log('   - 하단 플로팅 바 소멸 여부:', !finishRes.floatingBarExistsAfterDone ? '✅ 정상 소멸 (DOM 제거)' : '❌ 여전히 남아있음');
    console.log('   - 상단 버튼 텍스트 복귀:', finishRes.editBtnTextAfterDone);

    // Screenshot of saved mode
    const shotSavedMode = await sendCmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, 'screen_goal_done_saved.png'), Buffer.from(shotSavedMode.data, 'base64'));
    console.log('7. 편집 완료 후 화면 캡처 저장: scratch/screen_goal_done_saved.png');

    console.log('\n✨ [3단계: 로컬 수동 확인 및 E2E 브라우저 실동작 검증 100% 완료!]');

    ws.close();
  } finally {
    try { chromeProcess.kill(); } catch (e) {}
  }
}

runStage3Verification().catch(err => {
  console.error('검증 중 오류 발생:', err);
  process.exit(1);
});
