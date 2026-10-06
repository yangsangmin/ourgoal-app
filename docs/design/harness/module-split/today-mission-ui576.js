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
    task: 'TASK-ES-576',
    method: '실제 오늘 미션 UI 조작 및 원문 CDP coverage; 함수 직접호출/상태주입 없음',
    steps: [],
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
      report.clicks = report.clicks || [];
      report.clicks.push(
        await page.$eval(sel, e => {
          const r = e.getBoundingClientRect();
          const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { selector: e.outerHTML, hit: h?.outerHTML };
        })
      );
      await page.click(sel);
      await sleep(650);
    };

    const targetFns = ['computeTodayMissionHash', 'renderTodayMissionCard'];
    const save = async name => {
      const stateData = await page.evaluate(() => {
        const appScope = window.OurgoalAppScope?.scope || {};
        const st = appScope.state || {};
        const prof = st.profile || {};
        const setts = prof.settings || {};
        return {
          cardHtml: document.querySelector('#todayMissionCard')?.outerHTML,
          sheetVisible: document.querySelector('#homeDetailSheet')?.style?.display !== 'none',
          missionCardExists: !!document.querySelector('.mission-card'),
          moreBtnText: document.querySelector('#btnToggleMissionAccordion')?.textContent?.trim() || null,
          restListDisplay: document.querySelector('#missionRestList')?.style?.display || null,
          saved: localStorage.getItem('ourgoal_guest_profile'),
          toast: document.querySelector('#toast')?.outerHTML,
          activeTab: st.activeTab,
          goalsCount: (prof.goals || []).length,
          todayMissions: setts.todayMissions || null,
          missionAccordionOpen: !!st.missionAccordionOpen
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
    await page.waitForSelector('#captureInput', { visible: true });
    await sleep(2000);

    // 2. 홈 퀘스트 나침반 열기 (목표 0개인 빈 카드 상태 확인)
    await click('#homeCompassQuest');
    await sleep(500);
    await save('empty goals mission sheet');
    await click('#homeDetailClose');
    await sleep(500);

    // 3. 목표 탭으로 이동하여 추천 목표 2개 담기
    await click('.navbtn[data-tab="goals"]');
    await page.waitForSelector('.btn-quick-adopt-goal', { visible: true, timeout: 10000 });

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.btn-quick-adopt-goal'));
      if (btns.length >= 2) {
        btns[0].click();
        btns[1].click();
      }
    });

    await page.waitForFunction(
      () => (window.OurgoalAppScope?.scope?.state?.profile?.goals || []).length >= 2,
      { timeout: 10000 }
    );
    await sleep(1000);
    await save('two goals adopted');

    // 4. 홈 탭으로 복귀
    await click('.navbtn[data-tab="home"]');
    await sleep(1000);

    // 5. 홈 퀘스트 나침반 클릭 -> 오늘 미션 카드 렌더 확인
    await click('#homeCompassQuest');
    await page.waitForSelector('.mission-card', { visible: true, timeout: 10000 });
    await sleep(1000);
    await save('mission card rendered with two goals');

    // 6. 더보기 아코디언 클릭하여 펼치기
    await page.waitForSelector('#btnToggleMissionAccordion', { visible: true, timeout: 10000 });
    await click('#btnToggleMissionAccordion');
    await sleep(600);
    await save('mission accordion expanded');

    // 7. 더보기 아코디언 다시 클릭하여 접기
    await click('#btnToggleMissionAccordion');
    await sleep(600);
    await save('mission accordion collapsed');

    // 8. 시트 닫기
    await click('#homeDetailClose');
    await sleep(500);
    await save('sheet closed');

    report.actualCallCount = report.coverage
      .flatMap(x => x.scripts.flatMap(s => s.functions))
      .reduce((n, f) => n + (f.ranges[0]?.count || 0), 0);

    const lastStep = report.steps.at(-1);
    report.completed =
      report.actualCallCount > 0 &&
      lastStep.goalsCount >= 2 &&
      report.pageerrors.length === 0;

  } catch (e) {
    report.error = e.stack;
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await server.close();

    const rawFile = 'C:/dev/wt/today-mission576-raw/' + label + '.json';
    fs.mkdirSync(path.dirname(rawFile), { recursive: true });
    const rawText = JSON.stringify(report, null, 2) + '\n';
    fs.writeFileSync(rawFile, rawText, 'utf8');

    const publicText = rawText.replace(/([?&]apikey=)[^&\s"\\]+/gi, '$1<redacted-public-key>');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, publicText, 'utf8');
    fs.writeFileSync(
      out + '.publication.json',
      JSON.stringify(
        {
          task: 'TASK-ES-576',
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
      count: report.actualCallCount,
      pageerrors: report.pageerrors.length,
      error: report.error || null
    })
  );
})();
