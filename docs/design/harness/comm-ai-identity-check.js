'use strict';
/* TASK-ES-348 (노션 COMM-01) 측정 하네스 — 실제 사용자 AI 오분류 · AI 표시 없는 가짜 사람.
 * 로컬 정적 서버 + Chrome(puppeteer-core) + shots-lib.js 의 게스트 시드·Supabase 목(mock). 원격·실계정에 붙지 않는다.
 * 사용: node comm-ai-identity-check.js <APP_DIR> [outJson]
 * 재는 것:
 *   M1 닉네임 '민지'(인증 UUID, 예전 이름 판별이 남긴 isAiBot:true 포함) 가 isKnownAiCompanion 에서 실사용자
 *   M2 같은 '민지' 가 동반자 목록(실 사용자 배지)·DM 후보(getTeamMembersPool)에 노출
 *   M3 첫 체크인 축하 창의 동류 러너: 고정 이름 0, 실데이터 0명이면 위젯 없음 / 실데이터 있으면 그 회원만
 *   M4 AI 요소 배지: 마니또 AI 동반자 카드 배지·달성률 게이지·연속일수 없음, 팀 영입 오프라인 예시 판별
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const shots = require('./shots-lib.js');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP_DIR = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const MINJI = { id: '3f6c2a1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f', nickname: '민지', name: '민지', avatar: '🙂', isAiBot: true };
const OLD_PEERS = ['열정부엉이', '코딩마스터', '새벽독서러', '미라클모닝', '성실토끼', '루틴요정', '달리는치타', '새벽러너', '철인도전'];

function serve(dir){
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}

(async () => {
  const srv = await serve(APP_DIR); const base = 'http://localhost:' + srv.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const out = { app: APP_DIR, at: new Date().toISOString(), results: {} };
  const errors = [];
  try {
    // M3: 실데이터 없는 첫 방문 게스트의 첫 체크인 → 축하 창
    const page = await shots.newPage(browser, false, 'focus-sanctuary');
    page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('#btnLandingPreviewDirect', { timeout: 20000 });
    await page.evaluate(() => document.getElementById('btnLandingPreviewDirect').click());
    await page.waitForSelector('#captureInput', { visible: true, timeout: 20000 });
    await page.type('#captureInput', '아침 러닝 5km 완료');
    await page.click('#captureSave');
    await page.waitForSelector('#firstCheckinCommBtn', { visible: true, timeout: 10000 });
    out.results.M3_modal = await page.evaluate((OLD) => {
      const t = document.body.innerText;
      return { peerWidget: !!document.getElementById('firstCheckinPeerRunners'), peerTitleVisible: t.indexOf('함께 달리는 동류 러너') !== -1,
        oldNamesShown: OLD.filter((n) => t.indexOf(n) !== -1), commBtn: !!document.getElementById('firstCheckinCommBtn'), doneBtn: !!document.getElementById('firstCheckinDoneBtn') };
    }, OLD_PEERS);
    out.results.M3_fn = await page.evaluate(() => {
      const uuid = (n) => '00000000-0000-4000-8000-00000000000' + n;
      const posts = [
        { id: 'a', user_id: uuid(1), display_name: '실회원A', goal_title: '아침 러닝 5km', caption: '오늘 러닝 완료', extra: { category: 'workout' } },
        { id: 'b', user_id: uuid(1), display_name: '실회원A', goal_title: '아침 러닝 5km', caption: '어제도 러닝', extra: { category: 'workout' } },
        { id: 'c', user_id: uuid(2), display_name: '실회원B', goal_title: '토익 900', caption: '공부', extra: { category: 'study' } },
        { id: 'd', user_id: 'sim_1', display_name: '시뮬', goal_title: '헬스 운동', caption: '운동', extra: {} },
        { id: 'e', user_id: uuid(3), display_name: 'AI글', goal_title: '헬스 운동', caption: '운동', is_ai: true, extra: {} }
      ];
      const f = window.getPeerRunnersForCategory;
      return { workout: f('운동', posts), study: f('공부', posts), none: f('운동', []), noStreakField: f('운동', posts).every((p) => !('streak' in p)) };
    });
    // M1·M2: 실명형 닉네임 '민지'
    out.results.M1_M2 = await page.evaluate((MINJI) => {
      const C = window.OurgoalTeamInviteComm;
      const r = {};
      r.isAi_uuid_minji_staleFlag = C.isKnownAiCompanion(Object.assign({}, MINJI));
      r.isAi_uuid_minji_clean = C.isKnownAiCompanion({ id: MINJI.id, nickname: '민지' });
      r.isValidRealUser = window.isValidRealUser(MINJI.id);
      r.isAi_string_name = C.isKnownAiCompanion('민지');
      r.isAi_seed_persona_handle = C.isKnownAiCompanion({ id: 'user-minji-runner', nickname: '새벽러너_민지' });
      r.isAi_persona_handle_real_uuid = C.isKnownAiCompanion({ id: MINJI.id, nickname: '새벽러너_민지' });
      r.isAi_mem_prefix = C.isKnownAiCompanion({ id: 'mem_ws_1', nickname: '이지수 팀장' });
      r.isAi_is_ai_field = C.isKnownAiCompanion({ id: MINJI.id, nickname: 'x', is_ai: true });
      window.state.profile.companions = [Object.assign({}, MINJI)];
      const pool = C.getTeamMembersPool();
      r.dmPoolHasMinji = pool.some((p) => p.id === MINJI.id);
      const box = document.createElement('div'); document.body.appendChild(box);
      C.renderCommCompanions(box);
      const card = Array.from(box.querySelectorAll('.card')).find((el) => el.textContent.indexOf('민지') !== -1);
      r.companionListHasMinji = !!card;
      r.companionCardBadge = card ? (card.textContent.indexOf('실 사용자') !== -1 ? '실 사용자' : (card.textContent.indexOf('AI') !== -1 ? 'AI' : '없음')) : null;
      r.companionStoredFlagAfterRender = (window.state.profile.companions.find((c) => c.id === MINJI.id) || {}).isAiBot;
      r.companionFakeStreakShown = card ? /🔥\s*1일/.test(card.textContent) : null;
      box.remove();
      return r;
    }, MINJI);
    // M4: 마니또 AI 동반자 카드(축하 창을 닫고, 마니또 시작하기를 누른 뒤)
    await page.evaluate(() => { const b = document.getElementById('firstCheckinDoneBtn'); if (b) b.click(); });
    out.results.M4_manito = await page.evaluate(async () => {
      window.setTab('comm');
      await new Promise((r) => setTimeout(r, 800));
      const tabBtn = document.querySelector('[data-sub="manito"]'); if (tabBtn) tabBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      const join = document.getElementById('mnJoin'); if (join) { join.click(); await new Promise((r) => setTimeout(r, 1200)); }
      const cards = Array.from(document.querySelectorAll('.manito-card'));
      return { cards: cards.length,
        aiCards: cards.filter((c) => c.querySelector('.badge-ai')).length,
        cardsWithoutAnyBadge: cards.filter((c) => !c.querySelector('.badge-ai') && !c.querySelector('.badge-real')).length,
        aiCardsWithGauge: cards.filter((c) => c.querySelector('.badge-ai') && c.querySelector('.gauge')).length,
        aiCardsWithStreak: cards.filter((c) => c.querySelector('.badge-ai') && /일 연속/.test((c.querySelector('.manito-sub') || {}).textContent || '')).length,
        inboxItems: document.querySelectorAll('.cheer-in').length,
        inboxItemsWithAiBadge: document.querySelectorAll('.cheer-in .badge-ai').length,
        welcomeHeroAiBadge: !!Array.from(document.querySelectorAll('span')).find((el) => /웰컴 응원 보내기/.test(el.textContent) && el.querySelector('.badge-ai')) };
    });
    out.results.feedLabel = await page.evaluate(async () => {
      const fb = document.querySelector('[data-sub="feed"]'); if (fb) fb.click();
      await new Promise((r) => setTimeout(r, 1200));
      const t = document.body.innerText;
      return { fakeGuideLabel: t.indexOf('응원 가이드 1건 포함') !== -1 || t.indexOf('초기 실천 가이드 (1건)') !== -1 };
    });
    out.results.teamSampleIsAi = await page.evaluate(() => ['user-runner-sm', 'user-early-reader', 'user-clean-coder', 'user-minji-runner', 'user-dohyun-dev', 'user-sua-god'].every((id) => window.OurgoalTeamInviteComm.isKnownAiCompanion({ id: id })));
    out.pageErrors = errors;
    await page.close();
  } finally { await browser.close(); srv.close(); }
  const r = out.results;
  out.pass = {
    M1: r.M1_M2.isAi_uuid_minji_staleFlag === false && r.M1_M2.isAi_uuid_minji_clean === false && r.M1_M2.isValidRealUser === true,
    M2: r.M1_M2.dmPoolHasMinji === true && r.M1_M2.companionListHasMinji === true && r.M1_M2.companionCardBadge === '실 사용자',
    M3: r.M3_modal.peerWidget === false && r.M3_modal.oldNamesShown.length === 0 && r.M3_modal.commBtn && r.M3_fn.none.length === 0 && r.M3_fn.workout.length === 1 && r.M3_fn.workout[0].name === '실회원A' && r.M3_fn.noStreakField,
    M4: r.M4_manito.cards > 0 && r.M4_manito.cardsWithoutAnyBadge === 0 && r.M4_manito.aiCardsWithGauge === 0 && r.M4_manito.aiCardsWithStreak === 0 && r.M4_manito.inboxItems === r.M4_manito.inboxItemsWithAiBadge && r.M4_manito.welcomeHeroAiBadge === true && r.teamSampleIsAi === true,
    feedLabel: r.feedLabel.fakeGuideLabel === false
  };
  const s = JSON.stringify(out, null, 2);
  if (OUT) fs.writeFileSync(OUT, s, 'utf8');
  console.log(s);
})().catch((e) => { console.error(e); process.exit(1); });
