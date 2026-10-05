'use strict';
/* 6개 탭 공통 실측 도구(TASK-ES-349 · 노션 CORE-01) — 탭별 "주요 상태" 정의와 진입 절차.
 * 모든 상태는 진짜 마우스 입력(page.mouse.click)으로 들어가고, 들어갔는지를 DOM 으로 다시 확인한다.
 * 확인에 실패하면 entered:false 와 사유를 돌려준다(성공으로 바꿔 적지 않는다).
 *
 * 상태 항목:
 *   key        : 상태 이름(base · subtab · sheet · focus)
 *   opener     : 무엇을 눌러 들어가는지(사람이 읽는 설명)
 *   extraScope : 탭 화면 밖(body 직속 모달 등)인데 이 상태에서 같이 재야 하는 영역
 *   deadScope  : Dead-Click 탐지에서 누를 영역(없으면 탭 화면 전체). false 면 이 상태는 Dead-Click 을 따로 돌리지 않는다
 *   enter(page): { entered, note } 를 돌려준다
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* 요소를 화면 가운데로 즉시 스크롤한 뒤, 가운데 점이 다른 요소에 가려졌는지 보고 그 점을 진짜로 누른다.
 * finder 는 브라우저 안에서 실행되는 함수 문자열이 아니라 CSS 선택자 또는 { text, within } 객체다. */
async function clickReal(page, target) {
  const info = await page.evaluate((t) => {
    let el = null;
    if (typeof t === 'string') el = document.querySelector(t);
    else {
      const pool = document.querySelectorAll((t.within || 'body') + ' ' + (t.tag || 'button'));
      el = [...pool].find(e => e.textContent.replace(/\s+/g, ' ').includes(t.text)) || null;
    }
    if (!el) return { found: false };
    // [#TASK-ES-509] 접힌 <details> 의 내용(자기 summary 제외)은 그려지지 않는다 — getBoundingClientRect 는 0 이 아니라서
    //   예전에는 "가려진 채 누름"(뒤에 깔린 요소를 가리킴)으로 잘못 적었다. 사람도 먼저 펼쳐야 보이므로 「보이지 않음(접힌 details)」으로 돌려준다.
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DETAILS' && !p.open && !(el.closest('summary') && el.closest('summary').parentElement === p)) {
        const lab0 = (e) => e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '');
        return { found: true, inClosedDetails: true, label: lab0(el), details: lab0(p) };
      }
    }
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    { const q = el.getBoundingClientRect(); if (q.top < 0 || q.bottom > innerHeight) window.scrollTo({ top: scrollY + q.top - innerHeight / 2 + q.height / 2, behavior: 'instant' }); } // scrollIntoView 가 문서 스크롤을 못 옮기는 경우(설정 탭에서 실측) 문서 좌표로 다시 옮긴다
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    const lab = (e) => e ? (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '')) : null;
    return { found: true, x, y, w: r.width, h: r.height, covered: !!top && !el.contains(top), by: lab(top), label: lab(el) };
  }, target);
  if (!info.found) return { clicked: false, note: '누를 요소 없음: ' + JSON.stringify(target) };
  if (info.inClosedDetails) return { clicked: false, hidden: 'details-closed', note: info.label + ' 보이지 않음(접힌 details ' + info.details + ' 안 — 먼저 펼쳐야 보인다)' };
  if (info.w < 1 || info.h < 1) return { clicked: false, note: info.label + ' 크기 0(보이지 않음)' };
  await sleep(150);
  await page.mouse.click(info.x, info.y);
  const note = info.label + ' 누름(y=' + Math.round(info.y) + ')' + (info.covered ? ' — 누름 지점이 ' + info.by + ' 에 가려진 채 누름' : '');
  return { clicked: true, covered: info.covered, note };
}

/* 브라우저 안 확인 함수: 선택자 요소가 실제로 보이는지 */
const VISIBLE_FN = (sel) => {
  const e = document.querySelector(sel);
  if (!e) return false;
  for (let x = e; x && x !== document.documentElement; x = x.parentElement) {
    const cs = getComputedStyle(x);
    if (x.hidden || cs.display === 'none' || cs.visibility === 'hidden') return false;
    // [#TASK-ES-509] 접힌 details 의 내용(자기 summary 제외)은 보이지 않는다
    if (x !== e && x.tagName === 'DETAILS' && !x.open && !(e.closest('summary') && e.closest('summary').parentElement === x)) return false;
  }
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};
const isVisible = (page, sel) => page.evaluate(VISIBLE_FN, sel);
const modalOpen = (page) => page.evaluate(() => {
  const o = document.getElementById('modalOverlay');
  const h = document.querySelector('#modalSheet h1, #modalSheet h2, #modalSheet h3, #modalSheet .modal-title');
  return { open: !!o && o.classList.contains('active'), title: h ? h.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : '' };
});

/* 공통 꼴: 누르고 → 기다리고 → 확인 */
function clickState(key, opener, target, verify, extra) {
  return Object.assign({
    key, opener,
    enter: async (page) => {
      const c = await clickReal(page, target);
      if (!c.clicked) return { entered: false, note: c.note };
      await sleep(800);
      const v = await verify(page);
      return { entered: !!v.ok, note: c.note + ' · 확인: ' + v.why };
    }
  }, extra || {});
}

const BASE = { key: 'base', opener: '탭 버튼만 누름', enter: async () => ({ entered: true, note: null }) };
const MODAL = { extraScope: ['#modalSheet'], deadScope: ['#modalSheet'] };

const STATES = {
  home: [
    BASE,
    clickState('sheet', '#homeCompassQuest(오늘 목표) → 홈 상세 바텀시트', '#homeCompassQuest', async (page) => {
      const ok = await page.evaluate(() => { const s = document.getElementById('homeDetailSheet'); return !!s && s.classList.contains('open') && s.getAttribute('aria-hidden') === 'false'; });
      return { ok, why: ok ? '#homeDetailSheet.open, aria-hidden=false' : '#homeDetailSheet 가 열리지 않음' };
    }, { extraScope: ['#homeDetailSheet'], deadScope: ['#homeDetailSheet'] }),
    {
      key: 'focus', opener: '#captureInput(체크인 입력) 포커스', deadScope: false,
      enter: async (page) => {
        const c = await clickReal(page, '#captureInput');
        if (!c.clicked) return { entered: false, note: c.note };
        await sleep(500);
        const ok = await page.evaluate(() => !!document.activeElement && document.activeElement.id === 'captureInput');
        return { entered: ok, note: c.note + ' · 헤드리스 크롬은 가상 키보드를 띄우지 않는다(키보드 가림은 이 도구로 판단 불가)' };
      }
    }
  ],
  goals: [
    BASE,
    clickState('subtab', '#btnGoalsSubRoutine(루틴 서브탭)', '#btnGoalsSubRoutine', async (page) => {
      const act = await page.evaluate(() => { const b = document.getElementById('btnGoalsSubRoutine'); return !!b && b.classList.contains('active'); });
      const vis = await isVisible(page, '#routineGoalsView');
      return { ok: act && vis, why: '버튼 active=' + act + ', #routineGoalsView 보임=' + vis };
    }),
    clickState('sheet', '#sAddGoalBtn(+ 새 목표) → 새 목표 시트', '#sAddGoalBtn', async (page) => {
      const m = await modalOpen(page); const vis = await isVisible(page, '#ngDescInput');
      return { ok: m.open && vis, why: '#modalOverlay.active=' + m.open + ', #ngDescInput 보임=' + vis + (m.title ? ', 제목 "' + m.title + '"' : '') };
    }, MODAL)
  ],
  calendar: [
    BASE,
    clickState('subtab', '주간 보기(.s-cal-mode-btn "주간")', { tag: '.s-cal-mode-btn', text: '주간', within: '#screen-calendar' }, async (page) => {
      const r = await page.evaluate(() => {
        const b = [...document.querySelectorAll('#screen-calendar .s-cal-mode-btn')].find(e => e.textContent.includes('주간'));
        return { act: !!b && b.classList.contains('active'), mode: (document.getElementById('screen-calendar') || {}).dataset ? document.getElementById('screen-calendar').dataset.calMode || null : null };
      });
      return { ok: r.act, why: '버튼 active=' + r.act + ', data-cal-mode=' + r.mode };
    }),
    clickState('sheet', '#calAddManualBtn(+ 일정 추가) → 일정 편집 시트', '#calAddManualBtn', async (page) => {
      const m = await modalOpen(page); const vis = await isVisible(page, '#calEditTitle');
      return { ok: m.open && vis, why: '#modalOverlay.active=' + m.open + ', #calEditTitle 보임=' + vis };
    }, MODAL)
  ],
  records: [
    BASE,
    clickState('subtab', '몰입 타이머(.s-rec-mode-btn)', { tag: '.s-rec-mode-btn', text: '몰입 타이머', within: '#screen-records' }, async (page) => {
      const act = await page.evaluate(() => { const b = [...document.querySelectorAll('#screen-records .s-rec-mode-btn')].find(e => e.textContent.includes('몰입 타이머')); return !!b && b.classList.contains('active'); });
      const vis = await isVisible(page, '#sPomodoroDisplay');
      return { ok: act && vis, why: '버튼 active=' + act + ', #sPomodoroDisplay 보임=' + vis };
    }),
    clickState('sheet', '+ 새 기록 작성 → 새 기록 시트', { tag: 'button', text: '새 기록 작성', within: '#screen-records' }, async (page) => {
      const m = await modalOpen(page);
      const ok = m.open && m.title.includes('새 기록');
      return { ok, why: '#modalOverlay.active=' + m.open + ', 제목 "' + m.title + '"' };
    }, MODAL)
  ],
  comm: [
    BASE,
    clickState('subtab', '내 소통(.comm-type-pill[data-feedtype=mine])', '#screen-comm .comm-type-pill[data-feedtype="mine"]', async (page) => {
      const act = await page.evaluate(() => { const b = document.querySelector('#screen-comm .comm-type-pill[data-feedtype="mine"]'); return !!b && b.classList.contains('active'); });
      return { ok: act, why: '버튼 active=' + act };
    }),
    clickState('sheet', '#btnCommPostFeed → 피드 게시 시트(시트만 열고 게시는 누르지 않음)', '#btnCommPostFeed', async (page) => {
      const m = await modalOpen(page);
      return { ok: m.open, why: '#modalOverlay.active=' + m.open + ', 제목 "' + m.title + '"' };
    }, MODAL)
  ],
  settings: [
    BASE,
    clickState('sheet', '#btnSettingsQuickAvatar(프로필 편집) → 아바타 시트', '#btnSettingsQuickAvatar', async (page) => {
      const m = await modalOpen(page);
      return { ok: m.open, why: '#modalOverlay.active=' + m.open + (m.title ? ', 제목 "' + m.title + '"' : '') };
    }, MODAL)
  ]
};
/* 설정 탭에는 서브탭이 없다(화면 안 탭 전환 요소가 없음) — 상태는 base·sheet 둘이다. */
const TAB_NOTES = { settings: '서브탭 없음(base·sheet 만 잰다)', home: 'subtab 대신 체크인 입력 포커스(focus) 상태를 잰다' };

/* 진입 직후 떠 있는 팝업을 기록하고 닫는다(home-check.js 와 같은 처리) */
async function boot(page) {
  const bootModal = await page.evaluate(() => {
    const o = document.getElementById('modalOverlay');
    if (!o || !o.classList.contains('active')) return null;
    const t = (o.querySelector('h1,h2,h3,.modal-title') || o).textContent.trim().slice(0, 60);
    o.classList.remove('active');
    return t;
  });
  const greet = await page.evaluate(() => {
    const g = document.getElementById('avatarGreetingModal');
    if (!g || getComputedStyle(g).display === 'none') return null;
    return (document.getElementById('avatarGreetMessageText') || g).textContent.trim().slice(0, 60);
  });
  if (greet !== null) { await page.click('#btnAvatarGreetClose').catch(() => {}); await sleep(800); }
  return [bootModal && ('#modalOverlay: ' + bootModal), greet !== null && ('#avatarGreetingModal: ' + greet)].filter(Boolean);
}

/* 하단 탭 버튼을 진짜로 누르고 그 탭 화면이 활성인지 확인한다 */
async function goTab(page, tab) {
  // 병렬 실행으로 느려지면 첫 누름이 안 먹을 때가 있다(2026-10-04 실행 B 달력 첫 장에서 실측) — 진짜 누름을 두 번까지 다시 하고, 다시 한 횟수를 남긴다
  let active = null, tries = 0;
  for (; tries < 3; tries++) {
    if (tab !== 'home') {
      const c = await clickReal(page, '.navbtn[data-tab="' + tab + '"]');
      if (!c.clicked) return { ok: false, note: c.note };
      await sleep(900 + tries * 600);
    }
    active = await page.evaluate(() => (document.querySelector('.screen.active') || {}).id || null);
    if (active === 'screen-' + tab) break;
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(200);
  return { ok: active === 'screen-' + tab, note: '활성 화면=' + active + (tries > 0 ? ' · 탭 버튼 다시 누름 ' + Math.min(tries, 2) + '회' : ''), retried: tries > 0 };
}

module.exports = { STATES, TAB_NOTES, boot, goTab, clickReal, sleep, VISIBLE_FN };
