'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pp = require('C:/dev/command-center/node_modules/puppeteer-core');

const [rootArg, out, label] = process.argv.slice(2);
const root = path.resolve(rootArg);
const cfg = require(path.join(root, 'court/config.json'));
const { start } = require(path.join(root, 'court/lib/static-server'));
const host = require(path.join(root, 'court/lib/site-host')).pickSiteHost();
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const server = await start(root, cfg.denyServePrefixes);
  const url = 'http://' + host + ':' + server.port;
  let browser;
  const report = {
    task: 'TASK-ES-578',
    label: label || 'ui-run',
    method: '실제 테마 선택창 UI 조작 및 원문 CDP coverage; 함수 직접호출/상태주입 없음',
    networkPolicy: '외부 요청 차단(abort), /api/* 503 로컬 정책 응답(가짜 성공 없음), 정적 서빙 및 stubs만 허용',
    steps: [],
    clicks: [],
    rowsWrittenRemote: 0,
    blockedWrites: 0,
    pageerrors: [],
    consoleErrors: [],
    coverage: [],
    completed: false
  };

  try {
    browser = await pp.launch({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--lang=ko-KR',
        '--host-resolver-rules=MAP ' + host + ' 127.0.0.1, MAP * ~NOTFOUND',
        '--unsafely-treat-insecure-origin-as-secure=' + url
      ]
    });
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const cdp = await page.createCDPSession();
    await page.setViewport({ width: 430, height: 1800 });

    const stubs = (cfg.stubs || []).map(s => ({
      ...s,
      re: new RegExp('^' + s.urlPattern.split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')
    }));

    await page.setRequestInterception(true);
    page.on('request', r => {
      const s = stubs.find(s => s.re.test(r.url()));
      if (s) {
        return r.respond({
          status: 200,
          contentType: s.contentType || 'application/javascript',
          body: fs.readFileSync(path.join(root, 'court', s.file))
        });
      }
      const u = new URL(r.url());
      if (u.hostname !== host) {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) report.blockedWrites++;
        return r.abort();
      }
      if (u.pathname.startsWith('/api/')) {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) report.blockedWrites++;
        return r.respond({ status: 503, contentType: 'application/json', body: '{}' });
      }
      r.continue();
    });

    page.on('pageerror', e => report.pageerrors.push(e.message));
    page.on('console', m => {
      if (m.type() === 'error') report.consoleErrors.push(m.text());
    });
    page.on('dialog', d => d.dismiss());

    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

    await page.goto(url + '/index.html', { waitUntil: 'networkidle2' });

    const click = async sel => {
      await page.waitForSelector(sel, { visible: true, timeout: 15000 });
      await page.$eval(sel, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await sleep(100);
      const hitInfo = await page.$eval(sel, (e, s) => {
        const r = e.getBoundingClientRect();
        const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          selector: s,
          targetOuterHTML: e.outerHTML.slice(0, 300),
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          hitTag: h ? h.tagName : null,
          hitOuterHTML: h ? h.outerHTML.slice(0, 300) : null
        };
      }, sel);
      report.clicks.push(hitInfo);
      await page.click(sel);
      await sleep(650);
    };

    const targetFns = ['openThemePickerModal'];
    const save = async name => {
      const stateData = await page.evaluate(() => {
        const appScope = window.OurgoalAppScope?.scope || {};
        const st = appScope.state || {};
        const prof = st.profile || {};
        const records = prof.records || [];
        const rec = records[0] || null;
        const modalSheet = document.getElementById('modalSheet');
        const modalOverlay = document.getElementById('modalOverlay');
        const isModalOpen = !!(modalOverlay && modalOverlay.classList.contains('active'));
        const themePickList = document.querySelector('#themePickList');
        const activeOpt = themePickList ? themePickList.querySelector('.export-theme-opt.active') : null;
        const closeThemeBtn = document.querySelector('#mCloseTheme');
        const toastEl = document.querySelector('#toast');
        const themeChip = document.querySelector('.rec-theme-chip');

        const isToastShow = !!(toastEl && toastEl.classList.contains('show') && window.getComputedStyle(toastEl).opacity !== '0');

        return {
          activeTab: st.activeTab,
          recordsCount: records.length,
          firstRecord: rec ? {
            id: rec.id,
            text: rec.text,
            theme: rec.theme,
            themeConfidence: rec.themeConfidence,
            created_at: rec.created_at,
            date: rec.date
          } : null,
          isModalOpen: !!isModalOpen,
          modalSheetOuterHTML: isModalOpen ? modalSheet.outerHTML : null,
          themePickListExists: !!themePickList,
          themePickListOuterHTML: themePickList ? themePickList.outerHTML : null,
          activeThemeData: activeOpt ? {
            theme: activeOpt.getAttribute('data-picktheme'),
            text: activeOpt.textContent.trim(),
            className: activeOpt.className
          } : null,
          themeChipOuterHTML: themeChip ? themeChip.outerHTML : null,
          themeChipText: themeChip ? themeChip.textContent.trim() : null,
          closeThemeBtnExists: !!closeThemeBtn,
          toastOuterHTML: toastEl ? toastEl.outerHTML : null,
          toastText: toastEl ? toastEl.textContent.trim() : null,
          toastVisible: isToastShow,
          savedGuestProfile: localStorage.getItem('ourgoal_guest_profile')
        };
      });

      report.steps.push({ name, ...stateData });

      const raw = await cdp.send('Profiler.takePreciseCoverage');
      const scripts = raw.result
        .filter(s => s.functions.some(f => targetFns.includes(f.functionName)))
        .map(s => ({
          ...s,
          url: s.url.replace(url, '<site>'),
          functions: s.functions.filter(f => targetFns.includes(f.functionName))
        }));
      report.coverage.push({ step: name, scripts });
    };

    // 1. 게스트 모드 진입
    await click('#btnLandingPreviewDirect');
    await page.waitForSelector('#captureInput', { visible: true, timeout: 15000 });
    await sleep(1500);

    // 아바타 인사 모달이 떠 있을 경우 닫기
    const greetClose = await page.$('#btnAvatarGreetClose');
    if (greetClose) {
      const isVis = await page.evaluate(el => el.offsetParent !== null, greetClose);
      if (isVis) await click('#btnAvatarGreetClose');
    }

    // 2. 실제 홈 #captureInput에 텍스트 입력 및 #captureSave 실제 마우스 저장
    await page.type('#captureInput', '매일 독서와 알고리즘 문제 풀기 실천', { delay: 25 });
    await sleep(300);
    await click('#captureSave');
    await sleep(800);
    await page.waitForFunction(
      () => (window.OurgoalAppScope?.scope?.state?.profile?.records || []).length >= 1,
      { timeout: 10000 }
    );
    await save('1_record_saved_on_home');

    // 첫 체크인 축하 모달(#firstCheckinDoneBtn 또는 .modal-sheet-close) 차폐 해소: 실제 마우스 클릭으로 닫기
    const checkinDoneBtn = await page.$('#firstCheckinDoneBtn');
    if (checkinDoneBtn) {
      const isVis = await page.evaluate(el => el.offsetParent !== null, checkinDoneBtn);
      if (isVis) {
        await click('#firstCheckinDoneBtn');
        await sleep(600);
      }
    } else {
      const modalClose = await page.$('.modal-sheet-close');
      if (modalClose) {
        const isVis = await page.evaluate(el => el.offsetParent !== null, modalClose);
        if (isVis) {
          await click('.modal-sheet-close');
          await sleep(600);
        }
      }
    }

    // 모달 오버레이 닫힘 대기
    await page.waitForFunction(() => {
      const overlay = document.getElementById('modalOverlay');
      return !overlay || overlay.style.display === 'none' || overlay.offsetParent === null;
    }, { timeout: 5000 }).catch(() => {});

    // AI 체크인 피드백 시트(#checkinAiSheetBackdrop #btnCheckinAiClose) 차폐 해소: 실제 마우스 클릭으로 닫기
    const aiFeedbackClose = await page.$('#btnCheckinAiClose');
    if (aiFeedbackClose) {
      const isVis = await page.evaluate(el => el.offsetParent !== null, aiFeedbackClose);
      if (isVis) {
        await click('#btnCheckinAiClose');
        await sleep(600);
      }
    }

    // 피드백 시트 백드롭 닫힘 대기
    await page.waitForFunction(() => {
      const backdrop = document.getElementById('checkinAiSheetBackdrop');
      return !backdrop || backdrop.style.display === 'none' || backdrop.offsetParent === null;
    }, { timeout: 5000 }).catch(() => {});

    // 3. 기록탭 .navbtn[data-tab="records"] 이동
    await click('.navbtn[data-tab="records"]');
    await sleep(1000);
    await page.waitForSelector('.rec-card [data-rectheme]', { visible: true, timeout: 15000 });
    await save('2_records_tab_opened');

    // 4. 생성된 기록 [data-rectheme] 실제 마우스 클릭 -> 테마 창 확인
    await click('.rec-card [data-rectheme]');
    await sleep(600);
    await page.waitForSelector('#themePickList', { visible: true, timeout: 10000 });
    await save('3_theme_picker_opened');

    // 5. 현재와 다른 [data-picktheme] 실제 클릭 -> 저장·토스트·기록테마 변경 확인
    const currentTheme = await page.evaluate(() => {
      const active = document.querySelector('#themePickList .export-theme-opt.active');
      return active ? active.getAttribute('data-picktheme') : 'daily';
    });
    // 현재와 다른 테마 선택 (현재가 study면 workout, 아니면 study)
    const targetTheme = (currentTheme === 'study') ? 'workout' : 'study';
    await click('[data-picktheme="' + targetTheme + '"]');

    // 모달 닫힘 및 프로필 저장 완료 대기
    await page.waitForFunction(() => {
      const overlay = document.getElementById('modalOverlay');
      return !overlay || !overlay.classList.contains('active');
    }, { timeout: 10000 });
    await sleep(500);
    await save('4_theme_changed_and_saved');

    // 6. 다시 열기·현재 표시·닫기 확인
    await click('.rec-card [data-rectheme]');
    await page.waitForFunction(() => {
      const overlay = document.getElementById('modalOverlay');
      return overlay && overlay.classList.contains('active');
    }, { timeout: 10000 });
    await page.waitForSelector('#themePickList', { visible: true, timeout: 10000 });
    await sleep(500);
    await save('5_theme_picker_reopened');

    // #mCloseTheme 실제 마우스 클릭으로 닫기
    await click('#mCloseTheme');
    await page.waitForFunction(() => {
      const overlay = document.getElementById('modalOverlay');
      return !overlay || !overlay.classList.contains('active');
    }, { timeout: 10000 });
    await sleep(500);
    await save('6_theme_picker_closed');

    report.actualCallCount = report.coverage
      .flatMap(x => x.scripts.flatMap(s => s.functions))
      .reduce((n, f) => n + (f.ranges[0]?.count || 0), 0);

    const step3 = report.steps.find(s => s.name === '3_theme_picker_opened');
    const step4 = report.steps.find(s => s.name === '4_theme_changed_and_saved');
    const step5 = report.steps.find(s => s.name === '5_theme_picker_reopened');
    const step6 = report.steps.find(s => s.name === '6_theme_picker_closed');

    report.completed =
      report.actualCallCount >= 2 && // 최소 2회 호출 (처음 열기 + 다시 열기)
      step3 && step3.themePickListExists &&
      step4 && step4.firstRecord && step4.firstRecord.theme === targetTheme &&
      step5 && step5.activeThemeData && step5.activeThemeData.theme === targetTheme &&
      step6 && !step6.isModalOpen &&
      report.pageerrors.length === 0;

  } catch (e) {
    report.error = e.stack;
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await server.close();

    const rawFile = 'C:/dev/wt/agy-scratch/TASK-ES-578/ui-' + label + '-raw.json';
    fs.mkdirSync(path.dirname(rawFile), { recursive: true });
    const rawText = JSON.stringify(report, null, 2) + '\n';
    fs.writeFileSync(rawFile, rawText, 'utf8');

    // secret/apikey 마스킹 (게스트 프로필 및 URL)
    const publicText = rawText
      .replace(/([?&]apikey=)[^&\s"\\]+/gi, '$1<redacted-public-key>')
      .replace(/(supabaseKey["']?\s*:\s*["'])[^"']+["']/gi, '$1<redacted-key>"')
      .replace(/(service_role["']?\s*:\s*["'])[^"']+["']/gi, '$1<redacted-secret>"');

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, publicText, 'utf8');
    fs.writeFileSync(
      out + '.publication.json',
      JSON.stringify(
        {
          task: 'TASK-ES-578',
          rawFile,
          publicFile: out,
          rawSha256: crypto.createHash('sha256').update(rawText).digest('hex'),
          publicSha256: crypto.createHash('sha256').update(publicText).digest('hex'),
          changed: rawText !== publicText,
          policy: 'URL apikey/secret only redacted; counts/DOM/profile/ranges unchanged; compare public artifacts'
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
  }

  console.log(
    JSON.stringify({
      completed: report.completed,
      count: report.actualCallCount,
      pageerrors: report.pageerrors.length,
      error: report.error || null
    })
  );
})();
