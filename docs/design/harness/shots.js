'use strict';
/* 아워골 화면 스크린샷 하네스: 로컬 정적 서버 + Chrome(puppeteer-core) + 게스트 프로필 시드 + Supabase 목(mock)
 * 사용: node shots.js <outDir> [theme]   (theme: white|black)
 */
const http = require('http'), fs = require('fs'), path = require('path');
const puppeteer = require('C:/dev/command-center/node_modules/puppeteer-core');
const APP_DIR = 'C:/dev/ourgoal-app';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 4173 + Math.floor(Math.random() * 200);
const outDir = path.resolve(process.argv[2] || 'shots');
const theme = process.argv[3] || 'white';
fs.mkdirSync(outDir, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('{"ok":true}'); }
  const f = path.join(APP_DIR, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});

const MOCK_SUPABASE = `
(function(){
  var POSTS = [
    {id:'p1',user_id:'u2',display_name:'하늘',avatar_url:'',goal_title:'하프마라톤 완주',caption:'오늘 10km 페이스런. 5분 페이스 유지 성공!',cheers_count:12,extra:{},created_at:new Date(Date.now()-3600e3).toISOString()},
    {id:'p2',user_id:'u3',display_name:'민재',avatar_url:'',goal_title:'정보처리기사 합격',caption:'기출 3회독 끝. 내일부터 실기 준비 들어갑니다.',cheers_count:8,extra:{},created_at:new Date(Date.now()-7200e3).toISOString()},
    {id:'p3',user_id:'u4',display_name:'수아',avatar_url:'',goal_title:'매일 독서 30분',caption:'아침 30분 독서 21일째. 이제 습관이 된 것 같아요.',cheers_count:21,extra:{},created_at:new Date(Date.now()-86400e3).toISOString()}
  ];
  function builder(table){
    var st = { single:false };
    var b = {};
    var chain = ['select','eq','neq','in','is','or','gte','lte','gt','lt','order','limit','range','match','ilike','like','filter','not','contains','upsert','insert','update','delete','textSearch'];
    chain.forEach(function(m){ b[m] = function(){ return b; }; });
    b.single = function(){ st.single = true; return b; };
    b.maybeSingle = function(){ st.single = true; return b; };
    b.then = function(res, rej){
      var data = [];
      if(table === 'feed_posts') data = POSTS.slice();
      if(table === 'users') data = [{id:'guest_demo',username:'demo',display_name:'지민',bio:'매일 조금씩, 꾸준히',avatar_url:'',interests:['러닝','독서']}];
      var out = st.single ? (data[0] || null) : data;
      return Promise.resolve({ data: out, error: null, count: data.length }).then(res, rej);
    };
    b.catch = function(rej){ return b.then(null, rej); };
    return b;
  }
  var ch = { on:function(){ return ch; }, subscribe:function(){ return ch; }, send:function(){ return Promise.resolve('ok'); }, unsubscribe:function(){ return Promise.resolve('ok'); } };
  var client = {
    auth: {
      getSession: function(){ return Promise.resolve({ data:{ session:null }, error:null }); },
      getUser: function(){ return Promise.resolve({ data:{ user:null }, error:null }); },
      onAuthStateChange: function(){ return { data:{ subscription:{ unsubscribe:function(){} } } }; },
      signInWithPassword: function(){ return Promise.resolve({ data:{ user:null, session:null }, error:{ message:'mock' } }); },
      signInWithOAuth: function(){ return Promise.resolve({ data:{}, error:null }); },
      signOut: function(){ return Promise.resolve({ error:null }); },
      signUp: function(){ return Promise.resolve({ data:{}, error:{ message:'mock' } }); },
      updateUser: function(){ return Promise.resolve({ data:{}, error:null }); }
    },
    from: builder,
    rpc: function(){ return Promise.resolve({ data:null, error:null }); },
    channel: function(){ return ch; },
    removeChannel: function(){ return Promise.resolve('ok'); },
    removeAllChannels: function(){ return Promise.resolve([]); }
  };
  window.supabase = { createClient: function(){ return client; } };
})();
`;

function buildGuestProfile(){
  const now = new Date();
  const iso = (d) => d.toISOString();
  const daysAgo = (n, h, m) => { const d = new Date(now); d.setDate(d.getDate() - n); d.setHours(h || 9, m || 0, 0, 0); return d; };
  const dueIn = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const goals = [
    { id:'g1', title:'하프마라톤 완주', category:'운동', topic:'health', dueDate:dueIn(45), createdAt:iso(daysAgo(40)), visibility:'private', archivedAt:null, result:null,
      milestones:[
        { id:'m1', title:'주 3회 5km 러닝 습관 만들기', status:'done', dueDate:dueIn(-10), tasks:[{id:'t1',title:'러닝화 구매',done:true},{id:'t2',title:'러닝 앱 설치',done:true}] },
        { id:'m2', title:'10km 60분 안에 완주', status:'doing', dueDate:dueIn(14), tasks:[{id:'t3',title:'인터벌 훈련 4회',done:true},{id:'t4',title:'장거리 12km 1회',done:false}] },
        { id:'m3', title:'15km 장거리 적응', status:'todo', dueDate:dueIn(30), tasks:[{id:'t5',title:'주말 LSD 2회',done:false}] },
        { id:'m4', title:'대회 신청 및 컨디션 조절', status:'todo', dueDate:dueIn(44), tasks:[] }
      ] },
    { id:'g2', title:'정보처리기사 필기 합격', category:'공부', topic:'study', dueDate:dueIn(28), createdAt:iso(daysAgo(30)), visibility:'private', archivedAt:null, result:null,
      milestones:[
        { id:'m5', title:'1과목 소프트웨어 설계 정리', status:'done', dueDate:dueIn(-5), tasks:[{id:'t6',title:'요약노트 작성',done:true}] },
        { id:'m6', title:'기출 5개년 1회독', status:'doing', dueDate:dueIn(10), tasks:[{id:'t7',title:'2024 기출',done:true},{id:'t8',title:'2023 기출',done:false},{id:'t9',title:'2022 기출',done:false}] },
        { id:'m7', title:'모의고사 80점 이상', status:'todo', dueDate:dueIn(25), tasks:[] }
      ] },
    { id:'g3', title:'매일 독서 30분', category:'습관', topic:'reading', dueDate:dueIn(80), createdAt:iso(daysAgo(21)), visibility:'public', archivedAt:null, result:null,
      milestones:[
        { id:'m8', title:'「아주 작은 습관의 힘」 완독', status:'doing', dueDate:dueIn(7), tasks:[{id:'t10',title:'1~5장',done:true},{id:'t11',title:'6~10장',done:false}] },
        { id:'m9', title:'독서 노트 10편 쓰기', status:'todo', dueDate:dueIn(40), tasks:[] }
      ] }
  ];
  const texts = [
    ['workout','5km 러닝 28분. 페이스 안정적. 마지막 1km 스퍼트 성공'],
    ['study','정보처리기사 2024년 1회 기출 풀기. 72점. 데이터베이스 파트 약함'],
    ['daily','아침 독서 30분. 습관의 힘 4장까지. 환경 설계가 핵심'],
    ['workout','인터벌 400m x 8. 심박 최대 178. 회복 빨라진 느낌'],
    ['business','주간 업무 정리 및 다음 주 계획 30분'],
    ['study','소프트웨어 설계 요약노트 정리 1시간'],
    ['daily','저녁 스트레칭 15분, 물 2L 달성'],
    ['workout','휴식 조깅 3km 천천히. 무릎 괜찮음']
  ];
  const records = [];
  let k = 0;
  for (let d = 0; d < 24; d++) {
    if (d % 5 === 3) continue;
    const cnt = d % 3 === 0 ? 2 : 1;
    for (let c = 0; c < cnt; c++) {
      const t = texts[(k++) % texts.length];
      const s = daysAgo(d, 7 + c * 6, 30);
      const e = new Date(s.getTime() + (t[0] === 'workout' ? 35 : 45) * 60000);
      records.push({ id:'r' + d + '_' + c, type:'text', text:t[1], startAt:iso(s), endAt:iso(e), createdAt:iso(e), category:null, theme:t[0], subTheme:null, themeConfidence:0.9 });
    }
  }
  return {
    id:'guest_demo', username:'demo', displayName:'지민', bio:'매일 조금씩, 꾸준히', avatarUrl:'', interests:['러닝','독서'], region:'', regionPublic:false,
    schemaVersion:1, createdAt: iso(daysAgo(40)), goals, records,
    settings: {
      checkinTimes:['10:00','15:00','21:00'], notify:false, exportFormat:'csv', aiProvider:'claude', geminiKey:'', geminiModel:'gemini-2.5-flash',
      notionSync:false, notionWebhookUrl:'', notionApiKey:'', notionDatabaseId:'', notionAutoPush:false, autoUpdateSuggest:true, virtualCheerEnabled:true,
      gcalClientId:'', gcalSync:{ goals:{}, ms:{}, imported:{} }, googleCalendarConnected:false, googleCalendarEmail:'', gcalAutoSync:true,
      privacy:{ goals:'private', calendar:'private', records:'private', stats:'private' },
      theme, fontSize:'normal', dataSaver:false, twoFactorAuth:false,
      quietHoursEnabled:false, quietHoursStart:'22:00', quietHoursEnd:'08:00',
      notifTeamVerify:true, notifCheers:true, notifDday:true, notifStreak:true, onlineStatus:true, customSchedules:[],
      customFeedbackPrompt:'', customFeedbackActive:false, goalStatusSummaries:{}, feedReactions:{}, feedComments:{}, myFeedPosts:[], contentReports:{}, todayMissions:{},
      streakFreeze:{ available:1, usedDates:[], grantedTier:0 }, social:{ cheersSeen:0, manitoSeen:0 }, xp:{ total:420, log:[] },
      highContrast:false, challenges:[], hasSeenGuide:true, subscription:{ isPro:true, plan:'free_all', expiresAt:null, billingKey:null }
    }
  };
}

async function main(){
  await new Promise(r => server.listen(PORT, r));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--lang=ko-KR', '--font-render-hinting=none'] });
  const consoleErrors = [];
  async function newPage(seedGuest){
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const u = req.url();
      if (/supabase-js/.test(u)) return req.respond({ status: 200, contentType: 'text/javascript', body: MOCK_SUPABASE });
      if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net\/gh\/orioncactus/.test(u)) return req.continue();
      if (/supabase\.co|accounts\.google\.com|googleapis\.com|gstatic\.com|kakao|pagead|googlesyndication|doubleclick/.test(u)) return req.respond({ status: 204, body: '' });
      req.continue();
    });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + String(e).slice(0, 200)));
    const profile = buildGuestProfile();
    await page.evaluateOnNewDocument((p, seed, th) => {
      try {
        localStorage.clear();
        localStorage.setItem('ourgoal_current_theme', th);
        if (seed) localStorage.setItem('ourgoal_guest_profile', JSON.stringify(p));
      } catch (e) {}
      window.confirm = () => true; window.alert = () => {}; window.prompt = () => null;
      if (navigator.vibrate) navigator.vibrate = () => true;
    }, profile, seedGuest, theme);
    return page;
  }
  const shot = async (page, name) => { await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false }); console.log('shot', name); };
  const shotFull = async (page, name) => { await page.screenshot({ path: path.join(outDir, name + '-full.png'), fullPage: true }); };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  let page = await newPage(false);
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(800);
  await shot(page, '00-landing');
  await page.evaluate(() => document.getElementById('landStartBtn') && document.getElementById('landStartBtn').click());
  await sleep(500);
  await shot(page, '01-auth');
  await page.close();

  page = await newPage(true);
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);
  await page.evaluate(() => { const o = document.getElementById('modalOverlay'); if (o && o.classList.contains('active')) { o.classList.remove('active'); } });
  await sleep(300);
  await shot(page, '10-home'); await shotFull(page, '10-home');
  const tabs = ['goals', 'calendar', 'records', 'comm', 'settings'];
  for (const t of tabs) {
    await page.evaluate((t) => { const b = document.querySelector('.navbtn[data-tab="' + t + '"]'); b && b.click(); }, t);
    await sleep(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);
    await shot(page, '1x-' + t); await shotFull(page, '1x-' + t);
  }
  await page.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="home"]'); b && b.click(); });
  await sleep(600);
  await page.evaluate(() => { const b = document.getElementById('homeAddGoal'); b && b.click(); });
  await sleep(800);
  await shot(page, '20-modal-newgoal');
  await page.evaluate(() => { const o = document.getElementById('modalOverlay'); o && o.click(); });
  await sleep(500);
  await page.evaluate(() => { const b = document.querySelector('.navbtn[data-tab="records"]'); b && b.click(); });
  await sleep(600);
  await page.evaluate(() => { const b = document.getElementById('recAddBtn'); b && b.click(); });
  await sleep(800);
  await shot(page, '21-modal-record');
  await page.close();
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(outDir, 'console-errors.json'), JSON.stringify(consoleErrors, null, 2), 'utf8');
  console.log('console errors:', consoleErrors.length);
}
main().catch(e => { console.error(e); process.exit(1); });
