'use strict';
/**
 * TASK-ES-585 게스트 UI 실측 하네스
 * 대상: openTemplateRecordDetailModal, checkRecordDeepLink 실제 브라우저 조작 및 CDP coverage 계측
 * 사용: node docs/design/harness/module-split/task585-record-detail-ui.js <appRoot> <outPath> <label>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pp = require('C:/dev/command-center/node_modules/puppeteer-core');

const [rootArg, out, label] = process.argv.slice(2);
if (!rootArg || !out) {
  console.error('Usage: node task585-record-detail-ui.js <appRoot> <outPath> [label]');
  process.exit(1);
}

const root = path.resolve(rootArg);
const cfg = require(path.join(root, 'court/config.json'));
const { start } = require(path.join(root, 'court/lib/static-server'));
const host = require(path.join(root, 'court/lib/site-host')).pickSiteHost();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function sanitizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.search = '';
    return u.toString();
  } catch (_) {
    return rawUrl.split('?')[0];
  }
}

(async () => {
  const server = await start(root, cfg.denyServePrefixes);
  const url = 'http://' + host + ':' + server.port;
  let browser;
  let page;

  let inputCommit = null;
  const receiptFile = path.join(root, 'receipt.json');
  if (fs.existsSync(receiptFile)) {
    try {
      inputCommit = JSON.parse(fs.readFileSync(receiptFile, 'utf8')).commit;
    } catch (_) {}
  }
  if (!inputCommit) {
    try {
      inputCommit = require('child_process').execSync(`git -C "${root}" rev-parse HEAD`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch (_) {
      inputCommit = 'unresolved_commit';
    }
  }

  const fileSha256 = {};
  for (const rel of ['index.html', 'js/tabs/records/template-record-detail.js']) {
    const fp = path.join(root, rel);
    if (fs.existsSync(fp)) {
      fileSha256[rel] = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
    }
  }

  const report = {
    task: 'TASK-ES-585',
    label: label || 'ui-run',
    url,
    inputCommit,
    fileSha256,
    method: '실제 게스트 UI 조작 및 URL 해시 딥링크 브라우저 실제 탐색(page.goto); 함수 직접호출/상태주입 0',
    networkPolicy: '외부 요청 및 /api/* 전면 abort 차단(가짜 응답 0, 원시 실패 보존), 정적 서빙 및 stubs만 허용',
    allowedStaticServing: [],
    courtStubs: [],
    blockedRequests: [],
    steps: [],
    clicks: [],
    pageerrors: [],
    consoleErrors: [],
    coverage: [],
    targetFunctionStats: {},
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
        '--host-resolver-rules=MAP ' + host + ' 127.0.0.1, MAP * ~NOTFOUND'
      ]
    });

    const ctx = await browser.createBrowserContext();
    page = await ctx.newPage();
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
        report.courtStubs.push({ url: sanitizeUrl(r.url()), stubFile: s.file });
        return r.respond({
          status: 200,
          contentType: s.contentType || 'application/javascript',
          body: fs.readFileSync(path.join(root, 'court', s.file))
        });
      }
      const u = new URL(r.url());
      if (u.hostname !== host || u.pathname.startsWith('/api/')) {
        report.blockedRequests.push({
          url: sanitizeUrl(r.url()),
          method: r.method(),
          reason: u.hostname !== host ? 'external_origin_blocked' : 'api_route_blocked_no_fake_response'
        });
        return r.abort('blockedbyclient');
      }
      report.allowedStaticServing.push({ path: u.pathname, method: r.method() });
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

    const click = async (sel, textFilter) => {
      await page.waitForSelector(sel, { visible: true, timeout: 15000 });
      let handle;
      if (textFilter) {
        const handles = await page.$$(sel);
        for (const h of handles) {
          const txt = await page.evaluate(el => el.textContent, h);
          if (txt && txt.includes(textFilter)) {
            handle = h;
            break;
          }
        }
        if (!handle) throw new Error(`Selector ${sel} with text "${textFilter}" not found`);
      } else {
        handle = await page.$(sel);
      }

      await page.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }), handle);
      await sleep(100);

      const hitInfo = await page.evaluate((e, s) => {
        const r = e.getBoundingClientRect();
        const centerX = r.x + r.width / 2;
        const centerY = r.y + r.height / 2;
        const h = document.elementFromPoint(centerX, centerY);
        const isTargetOrDescendant = !!(h && (e === h || e.contains(h)));
        const inViewport = (centerX >= 0 && centerY >= 0 && centerX <= window.innerWidth && centerY <= window.innerHeight);
        const nonZero = (r.width > 0 && r.height > 0);
        return {
          selector: s,
          targetOuterHTML: e.outerHTML.slice(0, 300),
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          point: { x: centerX, y: centerY },
          hitTag: h ? h.tagName : null,
          hitOuterHTML: h ? h.outerHTML.slice(0, 300) : null,
          isTargetOrDescendant,
          inViewport,
          nonZero
        };
      }, handle, sel);

      report.clicks.push(hitInfo);

      if (!hitInfo.isTargetOrDescendant || !hitInfo.inViewport || !hitInfo.nonZero) {
        throw new Error(`Click verification failed for ${sel}: hitTag=${hitInfo.hitTag}, inViewport=${hitInfo.inViewport}, nonZero=${hitInfo.nonZero}`);
      }

      await handle.click();
      await sleep(700);
    };

    const targetFns = ['openTemplateRecordDetailModal', 'checkRecordDeepLink'];

    const snapshot = async stepName => {
      const stateData = await page.evaluate(() => {
        const appScope = window.OurgoalAppScope?.scope || {};
        const st = appScope.state || {};
        const prof = st.profile || {};
        const records = prof.records || [];
        const templateRec = records.find(r => r && r.type === 'template') || null;

        const modalSheet = document.getElementById('modalSheet');
        const modalOverlay = document.getElementById('modalOverlay');
        const isModalOpen = !!(modalOverlay && modalOverlay.classList.contains('active'));
        const toastEl = document.querySelector('#toast');
        const isToastShow = !!(toastEl && toastEl.classList.contains('show') && window.getComputedStyle(toastEl).opacity !== '0');

        const allLocalStorage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          allLocalStorage[k] = localStorage.getItem(k);
        }
        const allSessionStorage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          allSessionStorage[k] = sessionStorage.getItem(k);
        }

        return {
          activeTab: st.activeTab,
          recordsCount: records.length,
          templateRecordId: templateRec ? templateRec.id : null,
          templateRecordKey: templateRec ? (templateRec.templateKey || templateRec.templateId) : null,
          templateRecordRowsCount: templateRec && templateRec.rows ? templateRec.rows.length : 0,
          isModalOpen,
          modalSheetHTML: isModalOpen && modalSheet ? modalSheet.innerHTML : null,
          modalSheetOuterHTML: isModalOpen && modalSheet ? modalSheet.outerHTML : null,
          fullDomHTML: document.documentElement.outerHTML,
          toastOuterHTML: toastEl ? toastEl.outerHTML : null,
          toastText: toastEl ? toastEl.textContent.trim() : null,
          toastVisible: isToastShow,
          allLocalStorage,
          allSessionStorage,
          currentHash: window.location.hash || ''
        };
      });

      const raw = await cdp.send('Profiler.takePreciseCoverage');
      const filteredScripts = raw.result
        .filter(s => s.functions.some(f => targetFns.includes(f.functionName)))
        .map(s => ({
          url: s.url.replace(url, '<site>'),
          functions: s.functions.filter(f => targetFns.includes(f.functionName)).map(fn => {
            const entryCount = (fn.ranges && fn.ranges[0]) ? fn.ranges[0].count : 0;
            const subRangesSum = (fn.ranges && fn.ranges.length > 1)
              ? fn.ranges.slice(1).reduce((acc, r) => acc + (r.count || 0), 0)
              : 0;
            return {
              functionName: fn.functionName,
              isBlockCoverage: fn.isBlockCoverage,
              rangesCount: fn.ranges ? fn.ranges.length : 0,
              entryCount,
              subRangesSum,
              ranges: fn.ranges
            };
          })
        }));

      report.steps.push({
        step: stepName,
        consoleErrors: [...report.consoleErrors],
        pageerrors: [...report.pageerrors],
        ...stateData
      });

      report.coverage.push({
        step: stepName,
        scripts: filteredScripts
      });
    };

    // 1. 게스트 둘러보기 진입
    await click('#btnLandingPreviewDirect');
    await page.waitForSelector('#captureInput', { visible: true, timeout: 15000 });
    await sleep(1500);

    // 인사 닫기 (존재 시)
    const greetClose = await page.$('#btnAvatarGreetClose');
    if (greetClose) {
      const isVis = await page.evaluate(el => el.offsetParent !== null, greetClose);
      if (isVis) {
        await click('#btnAvatarGreetClose');
        await sleep(500);
      }
    }
    await snapshot('1_guest_entered');

    // 2. 기록 탭 이동
    await click('.navbtn[data-tab="records"]');
    await page.waitForSelector('#recQuickDockBar', { visible: true, timeout: 10000 });
    await sleep(800);
    await snapshot('2_records_tab_opened');

    // 3. recQuickDockBar의 실제 '📋 템플릿' 토글 버튼 클릭
    await click('#recQuickDockBar button', '📋 템플릿');
    await page.waitForSelector('#recProTemplateCard', { visible: true, timeout: 10000 });
    await sleep(600);
    await snapshot('3_pro_template_card_toggled');

    // 4. recOpenProTemplateBtn 클릭하여 전문 템플릿 작성 모달 열기
    await click('#recOpenProTemplateBtn');
    await page.waitForSelector('#modalSheet', { visible: true, timeout: 10000 });
    await page.waitForSelector('#proGeneralSaveBtn', { visible: true, timeout: 10000 });
    await sleep(800);
    await snapshot('4_pro_template_modal_opened');

    // 5. 실제 행 추가 및 입력
    await click('#proAddRowBtn');
    await sleep(500);
    const cellInputs = await page.$$('#proTableBody input[type="text"]');
    if (cellInputs && cellInputs.length > 0) {
      await cellInputs[0].type('실측 벤치프레스 60kg 10회', { delay: 20 });
    }
    const memoInput = await page.$('#proRecMemo');
    if (memoInput) {
      await memoInput.type('TASK-ES-585 게스트 전문 템플릿 실측', { delay: 20 });
    }
    await sleep(500);
    await snapshot('5_pro_template_row_entered');

    // 6. proGeneralSaveBtn 클릭하여 일반저장
    await click('#proGeneralSaveBtn');
    await sleep(1200);
    await page.waitForFunction(() => {
      const overlay = document.getElementById('modalOverlay');
      return !overlay || !overlay.classList.contains('active') || overlay.offsetParent === null;
    }, { timeout: 10000 }).catch(() => {});
    await sleep(500);
    await snapshot('6_pro_template_saved');

    // 7. 생성된 기록 카드 클릭 -> 상세 모달 열기
    const recId = await page.evaluate(() => {
      const appScope = window.OurgoalAppScope?.scope || {};
      const st = appScope.state || {};
      const prof = st.profile || {};
      const records = prof.records || [];
      const rec = records.find(r => r && r.type === 'template');
      return rec ? rec.id : null;
    });

    if (!recId) {
      throw new Error('Template record was not created or saved in profile');
    }

    const cardSel = `.rec-card[data-recid="${recId}"]`;
    await page.waitForSelector(cardSel, { visible: true, timeout: 10000 });
    await click(cardSel);
    await page.waitForSelector('#detailCloseBtn', { visible: true, timeout: 10000 });
    await sleep(800);
    await snapshot('7_detail_modal_opened_via_card');

    // 8. 차트 기간 필터 변경: scroll -> elementFromPoint -> 진짜 click
    await click('#detailTrendChartWrap .pro-trend-filter-chip[data-period="30"]');
    await sleep(600);
    await snapshot('8_detail_chart_period_changed');

    // 9. 상세 모달 내 수정 버튼 클릭 -> openTemplateRecordDetailModal 내부의 editBtn.onclick 발동
    await click('#detailEditBtn');
    await sleep(600);
    await snapshot('9_detail_edit_btn_clicked');

    // 10. 기록 카드의 수정 버튼([data-recedit]) 클릭 -> 전문 템플릿 수정 모달 열기
    await click(`${cardSel} [data-recedit]`);
    await page.waitForSelector('#proCancelBtn', { visible: true, timeout: 10000 });
    await sleep(600);
    await snapshot('10_card_edit_modal_opened');

    // 11. 취소 버튼 클릭 -> 수정 모달 닫기
    await click('#proCancelBtn');
    await sleep(800);
    await snapshot('11_card_edit_modal_cancelled');

    // 12. 기록 카드 다시 클릭하여 상세 모달 열고 닫기 버튼으로 닫기
    await click(cardSel);
    await page.waitForSelector('#detailCloseBtn', { visible: true, timeout: 10000 });
    await sleep(600);
    await click('#detailCloseBtn');
    await sleep(800);
    await snapshot('12_detail_modal_closed_via_button');

    // 13. URL 해시 딥링크 실제 브라우저 page.goto 탐색: url + /index.html#record:<id>
    const deepLinkUrl = url + '/index.html#record:' + encodeURIComponent(recId);
    console.log('[task585-ui] Navigating to deeplink:', deepLinkUrl);
    await page.goto(deepLinkUrl, { waitUntil: 'networkidle2' });
    await sleep(800);
    const preCheck = await page.evaluate(() => ({
      hash: window.location.hash,
      active: document.getElementById('modalOverlay')?.classList.contains('active'),
      display: document.getElementById('modalOverlay') ? window.getComputedStyle(document.getElementById('modalOverlay')).display : null,
      hasBtn: !!document.getElementById('detailCloseBtn')
    }));
    console.log('[task585-ui] Deeplink preCheck:', preCheck);
    await page.waitForSelector('#detailCloseBtn', { visible: true, timeout: 10000 });
    await snapshot('13_detail_modal_opened_via_deeplink');

    // 14. 딥링크 모달 닫기
    await click('#detailCloseBtn');
    await sleep(800);
    await snapshot('14_deeplink_modal_closed');

    // Aggregate target function statistics
    for (const fn of targetFns) {
      let totalEntry = 0;
      let totalSub = 0;
      for (const cov of report.coverage) {
        for (const scr of cov.scripts) {
          for (const f of scr.functions) {
            if (f.functionName === fn) {
              totalEntry = Math.max(totalEntry, f.entryCount || 0);
              totalSub = Math.max(totalSub, f.subRangesSum || 0);
            }
          }
        }
      }
      report.targetFunctionStats[fn] = {
        maxEntryCount: totalEntry,
        maxSubRangesSum: totalSub,
        called: totalEntry > 0
      };
    }

    report.completed = true;
  } catch (err) {
    report.error = err.message;
    report.stack = err.stack;
    console.error(`[task585-record-detail-ui ERROR]`, err);
    if (page) {
      const dbg = await page.evaluate(() => ({
        url: window.location.href,
        hash: window.location.hash,
        ovActive: document.getElementById('modalOverlay')?.classList.contains('active'),
        ovDisplay: document.getElementById('modalOverlay') ? window.getComputedStyle(document.getElementById('modalOverlay')).display : null,
        hasDetailCloseBtn: !!document.getElementById('detailCloseBtn'),
        detailCloseVisible: document.getElementById('detailCloseBtn') ? document.getElementById('detailCloseBtn').offsetParent !== null : false
      })).catch(() => null);
      console.error(`[task585-record-detail-ui DEBUG STATE]`, dbg);
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');
  console.log(`UI run completed: ${label} -> ${out} (completed: ${report.completed})`);
  if (!report.completed) process.exit(1);
})();
