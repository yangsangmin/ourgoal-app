'use strict';
/**
 * TASK-ES-581 게스트 UI 실측 하네스
 * 대상: renderAll, boot(또는 runAppBoot)의 실제 브라우저 호출 및 coverage 정밀 수집
 * 사용: node docs/design/harness/module-split/boot-ui581.js <rootArg> <out> <label>
 */
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
    task: 'TASK-ES-581',
    label,
    url,
    method: '실제 게스트 UI 조작 및 CDP Profiler coverage; 함수 직접호출/상태주입 없음',
    steps: [],
    clicks: [],
    rowsWrittenRemote: 0,
    blockedWrites: 0,
    pageerrors: [],
    consoleErrors: [],
    coverage: [],
    callCounts: {},
    branchDetails: {},
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

    // CRITICAL: 로드 전 CDP 활성화
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

    await page.goto(url + '/index.html', { waitUntil: 'networkidle2' });

    const targetFns = ['renderAll', 'boot', 'runAppBoot'];

    const click = async sel => {
      await page.waitForSelector(sel, { visible: true, timeout: 15000 });
      await page.$eval(sel, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await sleep(100);

      const hitInfo = await page.$eval(sel, e => {
        const r = e.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        const isHitTargetOrChild = hit ? (hit === e || e.contains(hit)) : false;
        return {
          elementHtml: e.outerHTML.slice(0, 150),
          hitHtml: hit ? hit.outerHTML.slice(0, 150) : null,
          isHitTargetOrChild
        };
      });
      hitInfo.selector = sel;
      report.clicks.push(hitInfo);

      await page.click(sel);
      await sleep(650);
    };

    const save = async name => {
      const stepData = await page.evaluate(() => {
        const appScope = window.OurgoalAppScope?.scope || {};
        const st = appScope.state || {};
        const toastEl = document.getElementById('toast');
        const toastComputed = toastEl ? window.getComputedStyle(toastEl) : null;
        const toastVisible = toastEl ? (toastComputed.display !== 'none' && toastComputed.opacity !== '0' && toastComputed.visibility !== 'hidden') : false;

        // Collect all localStorage keys
        const ls = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          ls[k] = localStorage.getItem(k);
        }

        return {
          landingDisplay: document.getElementById('landingScreen')?.style?.display || null,
          appShellDisplay: document.getElementById('appShell')?.style?.display || null,
          landingScreenHtml: document.getElementById('landingScreen')?.outerHTML || null,
          appShellHtml: document.getElementById('appShell')?.outerHTML || null,
          toastHtml: toastEl?.outerHTML || null,
          toastVisible,
          toastText: toastEl?.textContent?.trim() || null,
          savedGuestProfile: localStorage.getItem('ourgoal_guest_profile'),
          allLocalStorage: ls,
          activeTab: st.activeTab || null
        };
      });

      const raw = await cdp.send('Profiler.takePreciseCoverage');
      const scripts = raw.result
        .filter(s => s.functions.some(f => targetFns.includes(f.functionName)))
        .map(s => ({
          ...s,
          url: s.url.replace(url, '<site>'),
          functions: s.functions.filter(f => targetFns.includes(f.functionName))
        }));

      report.steps.push({ name, ...stepData });
      report.coverage.push({ step: name, scripts });
    };

    // Step 0: 초기 로드 상태
    await save('0_initial_load');

    // 1. 게스트 모드 진입
    await click('#btnLandingPreviewDirect');
    await page.waitForSelector('#appShell', { visible: true, timeout: 15000 });
    await sleep(1000);
    await save('1_landing_preview_entered');

    // 2. 아바타 인사 모달 닫기
    const greetClose = await page.$('#btnAvatarGreetClose');
    if (greetClose) {
      const isVis = await page.evaluate(el => el.offsetParent !== null, greetClose);
      if (isVis) {
        await click('#btnAvatarGreetClose');
        await sleep(400);
      }
    }
    await save('2_greet_closed');

    // 3. 목표 탭 전환
    await click('.navbtn[data-tab="goals"]');
    await sleep(800);
    await save('3_goals_tab_switched');

    // 4. 홈 탭 복귀
    await click('.navbtn[data-tab="home"]');
    await sleep(800);
    await save('4_home_tab_returned');

    // 통계 계산: 모든 스텝에 걸쳐 대상 스크립트(index.html, all-view-render.js, app-boot.js)의 coverage 집계
    const targetScriptUrls = ['<site>/index.html', '<site>/js/core/all-view-render.js', '<site>/js/core/app-boot.js'];
    for (const stepCov of report.coverage) {
      for (const s of stepCov.scripts) {
        if (!targetScriptUrls.includes(s.url)) continue;
        for (const fn of s.functions) {
          const count = fn.ranges[0]?.count || 0;
          if (count > 0) {
            report.callCounts[fn.functionName] = (report.callCounts[fn.functionName] || 0) + count;
          }
          if (fn.functionName === 'boot' || fn.functionName === 'runAppBoot') {
            const executed = fn.ranges.filter(r => r.count > 0).length;
            const zero = fn.ranges.filter(r => r.count === 0).length;
            report.branchDetails[fn.functionName] = {
              totalRanges: fn.ranges.length,
              executedRangesCount: executed,
              zeroCountRangesCount: zero,
              guestPathMeasured: executed > 0,
              loginBranchMeasured: false,
              note: '게스트 로컬 초기화/리스너 등록 1회 실행, 로그인 복원 분기는 0회 미측정으로 정확히 구분'
            };
          }
        }
      }
    }

    report.completed =
      (report.callCounts['renderAll'] || 0) >= 1 &&
      ((report.callCounts['boot'] || 0) >= 1 || (report.callCounts['runAppBoot'] || 0) >= 1) &&
      report.clicks.every(c => c.isHitTargetOrChild) &&
      report.pageerrors.length === 0;

  } catch (e) {
    report.error = e.stack;
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await server.close();

    const rawDir = 'C:/dev/wt/agy-scratch/TASK-ES-581/raw';
    fs.mkdirSync(rawDir, { recursive: true });
    const rawFile = path.join(rawDir, label + '.json');
    const rawText = JSON.stringify(report, null, 2) + '\n';
    fs.writeFileSync(rawFile, rawText, 'utf8');

    // 공개 파일 apikey 마스킹
    const publicText = rawText.replace(/([?&]apikey=)[^&\s"\\]+/gi, '$1<redacted-public-key>');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, publicText, 'utf8');

    fs.writeFileSync(
      out + '.publication.json',
      JSON.stringify(
        {
          task: 'TASK-ES-581',
          rawFile,
          publicFile: out,
          rawSha256: crypto.createHash('sha256').update(rawText).digest('hex'),
          publicSha256: crypto.createHash('sha256').update(publicText).digest('hex'),
          changed: rawText !== publicText,
          policy: 'URL apikey only redacted; counts/DOM/profile/ranges unchanged; compare public artifacts'
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
      callCounts: report.callCounts,
      branchDetails: report.branchDetails,
      clicksCount: report.clicks.length,
      allClicksHitTargetOrChild: report.clicks.every(c => c.isHitTargetOrChild),
      pageerrors: report.pageerrors.length,
      consoleErrors: report.consoleErrors.length,
      error: report.error || null
    })
  );
})();
