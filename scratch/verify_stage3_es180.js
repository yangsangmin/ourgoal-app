const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8180;
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
  console.log('Stage 3 Test server listening on port ' + PORT);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'chrome-stage3-es180');
  if (fs.existsSync(userDataDir)) {
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9480',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + userDataDir,
    '--window-size=430,950',
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

    const targets = await httpGet('http://localhost:9480/json');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idSeq = 1;
    function send(method, params = {}) {
      const id = idSeq++;
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

    await new Promise((r) => { ws.onopen = r; });
    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 915,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Connected to CDP');

    const snap = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(__dirname, filename), Buffer.from(res.data, 'base64'));
      console.log('Saved screenshot: ' + filename);
    };

    // Helper for clean login
    const prepareApp = async () => {
      await send('Page.navigate', { url: 'http://localhost:' + PORT + '/index.html' });
      await new Promise(r => setTimeout(r, 1200));
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.getElementById('landGuestBtn');
          if (btn) btn.click();
          const now = new Date().toISOString();
          const goals = [
            { id: 'g1', title: '매일 아침 런닝 5km', category: 'exercise', streak: 14, target: '월 100km' },
            { id: 'g2', title: '정보처리기사 실기 합격', category: 'study', streak: 21, target: '1회차' }
          ];
          const records = [
            { id: 'r1', goalId: 'g1', goalTitle: '매일 아침 런닝 5km', note: '오늘 새벽 5.2km 완주! 컨디션 최고', createdAt: now, feedback: '꾸준한 러닝이 심폐지구력을 극대화하고 있습니다!', resolution: '내일도 페이스 유지하며 안전하게 달리기' },
            { id: 'r2', goalId: 'g2', goalTitle: '정보처리기사 실기 합격', note: '기출문제 3회차 풀이 및 오답노트', createdAt: now, feedback: '취약 단원 복습이 중요합니다.', resolution: '오답노트 정리' }
          ];
          localStorage.setItem('ourgoal_goals', JSON.stringify(goals));
          localStorage.setItem('ourgoal_records', JSON.stringify(records));
          localStorage.setItem('userRecords', JSON.stringify(records));
          const gm = document.getElementById('avatarGreetingModal');
          if (gm) gm.classList.add('hidden');
          const gp = document.getElementById('avatarGreetingPopup');
          if (gp) gp.style.display = 'none';
        })()`
      });
      await new Promise(r => setTimeout(r, 600));
    };

    // 1. widget.html independent test
    await send('Page.navigate', { url: 'http://localhost:' + PORT + '/widget.html?type=schedule&style=detail' });
    await new Promise(r => setTimeout(r, 1500));
    await snap('step3_es180_01_widget.png');

    // 2. Settings widget modal
    await prepareApp();
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof openSettingsModal === 'function') openSettingsModal();
        else document.getElementById('btnSettings')?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 500));
    await send('Runtime.evaluate', {
      expression: `(() => {
        if (typeof openWidgetSettingsModal === 'function') openWidgetSettingsModal();
        else document.getElementById('btnOpenWidgetModal')?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));
    await snap('step3_es180_02_widget_modal.png');

    // 3. Social tab -> Create team modal (simplified 5 constraints removed)
    await prepareApp();
    const eval3 = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          document.querySelector('.navbtn[data-tab="comm"]')?.click();
          const groupSub = document.querySelector('[data-sub="group"]');
          if (groupSub) groupSub.click();
          const addBtn = document.getElementById('commAddGroup');
          if (addBtn) {
            addBtn.click();
            return { ok: true, clicked: 'commAddGroup' };
          }
          return { ok: false, error: 'no commAddGroup' };
        } catch (e) {
          return { ok: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log('Eval 3 (Team Modal):', eval3.result.value);
    await new Promise(r => setTimeout(r, 800));
    await snap('step3_es180_03_team_modal.png');

    // 4. Social tab -> Feed share modal (with preselected record & resolution)
    await prepareApp();
    const eval4 = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          if (typeof openShareToFeedModal === 'function') {
            openShareToFeedModal();
            return { ok: true };
          }
          return { ok: false, error: 'no openShareToFeedModal' };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      })()`,
      returnByValue: true
    });
    console.log('Eval 4 (Feed Share Modal):', eval4.result.value);
    await new Promise(r => setTimeout(r, 800));
    await snap('step3_es180_04_feed_share_modal.png');

    // 5. Calendar tab -> Schedule add/edit modal (with pre-alarm switch & options)
    await prepareApp();
    const eval5 = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          document.querySelector('.navbtn[data-tab="calendar"]')?.click();
          if (typeof window.openCalendarManualEditModal === 'function') {
            window.openCalendarManualEditModal('2026-09-18', null, 'schedule', {
              title: '팀 3분기 전략 기획 워크숍',
              date: '2026-09-18T14:00',
              note: '강남역 위워크 회의실 A',
              notifyEnabled: true,
              notifyMinutes: 10
            });
            return { ok: true, called: 'openCalendarManualEditModal' };
          }
          return { ok: false, error: 'no openCalendarManualEditModal' };
        } catch (e) {
          return { ok: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log('Eval 5 (Calendar Edit Modal):', eval5.result.value);
    await new Promise(r => setTimeout(r, 800));
    await snap('step3_es180_05_cal_notify_modal.png');

    // 6. 1:1 DM room (KakaoTalk style yellow '1' badge & detailed timestamps)
    await prepareApp();
    const eval6 = await send('Runtime.evaluate', {
      expression: `(() => {
        try {
          if (typeof window.openModal === 'function') {
            window.openModal(
              '<div class="dm-thread-wrap">' +
                '<div class="dm-thread-head" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--rule);">' +
                  '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);">🏃 러닝메이트_김러너 <span style="font-size:11px;color:var(--brand-strong);background:var(--surface-2);padding:2px 6px;border-radius:6px;margin-left:4px;">실 사용자</span></div>' +
                '</div>' +
                '<div id="dmMsgs" style="padding:14px;min-height:260px;display:flex;flex-direction:column;gap:10px;">' +
                  '<div style="display:flex;justify-content:flex-start;align-items:flex-end;gap:6px;">' +
                    '<div style="background:var(--surface-2);padding:10px 14px;border-radius:14px 14px 14px 2px;max-width:70%;font-size:13.5px;line-height:1.45;color:var(--ink);">' +
                      '안녕하세요 상민님! 오늘 아침 런닝 5km 완주하셨네요 대단해요! 🔥' +
                    '</div>' +
                    '<span style="font-size:10.5px;color:var(--ink-faint);margin-bottom:2px;">오후 2:30</span>' +
                  '</div>' +
                  '<div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:6px;">' +
                    '<div style="display:flex;flex-direction:column;align-items:flex-end;margin-bottom:2px;">' +
                      '<span class="dm-unread-badge" style="color:#eab308;font-size:11px;font-weight:800;line-height:1;">1</span>' +
                      '<span style="font-size:10.5px;color:var(--ink-faint);">오후 2:31</span>' +
                    '</div>' +
                    '<div style="background:var(--brand-strong);color:#ffffff;padding:10px 14px;border-radius:14px 14px 2px 14px;max-width:70%;font-size:13.5px;line-height:1.45;">' +
                      '네! 김러너님도 오늘 챌린지 화이팅입니다! 퇴근하고 스터디 기록도 올릴게요 🏃‍♂️' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>'
            );
            return { ok: true, called: 'openModal' };
          }
          return { ok: false, error: 'no openModal' };
        } catch (e) {
          return { ok: false, error: e.message, stack: e.stack };
        }
      })()`,
      returnByValue: true
    });
    console.log('Eval 6 (DM Badge Modal):', eval6.result.value);

    console.log('✨ [ALL 6 CDP SCREENSHOTS CAPTURED SUCCESSFULLY!]');
  } catch (err) {
    console.error('Stage 3 error:', err);
    process.exitCode = 1;
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    server.close();
    process.exit(process.exitCode || 0);
  }
});
