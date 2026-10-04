'use strict';
/* 6개 탭 공통 실측 도구(TASK-ES-349 · 노션 CORE-01) — 자동 클릭 Dead-Click 탐지.
 *
 * 한 상태(탭 × 상태)에 들어간 뒤, 그 영역에서 보이는 조작 요소를 문서 순서대로 하나씩 진짜로 눌러
 * 아래 반응 중 하나라도 있는지 본다. 하나도 없으면 Dead-Click 후보로 적는다.
 *   - DOM 변화(MutationObserver; 누르기 전 대기 구간에 저절로 바뀌던 노드는 빼고 센다)
 *   - 네트워크 시도(대기 구간에 이미 보이던 주소는 뺀다)
 *   - 토스트·알림 영역 표시, 화면 전환(.screen.active 변경)·주소 변경·페이지 이동·스크롤 이동
 *   - 입력칸 포커스, window.open·confirm·alert·prompt·파일 선택창·공유·클립보드·알림 권한 호출(가로채서 기록만 한다)
 * 반응이 있었으면 새 브라우저 컨텍스트에서 처음부터 다시 들어가 원래 상태로 되돌린 뒤 다음 요소를 누른다
 * (다른 탭으로 가 버린 경우도 같은 방식으로 복귀한다). 포커스만 생긴 경우는 blur 만 한다.
 *
 * 누르지 않는 것(누르지 않음 + 사유로 기록): 외부로 나가는 링크·새 창, 삭제·초기화·로그아웃·탈퇴처럼 되돌릴 수 없는 것,
 * 바깥으로 보내는 것(게시·공유·전송·문의), 결제, 외부 인증 연동, 파일 선택 입력.
 * 같은 모양(태그·클래스·data 속성 이름이 같은) 요소가 많으면 종류마다 SAMPLE_PER_KIND 개까지만 누르고 나머지 수를 적는다.
 */
const { sleep } = require('./tab-states.js');

const SAMPLE_PER_KIND = 2;
const MAX_CLICKS = 60;
const IDLE_MS = 400, AFTER_MS = 700, GLOBAL_IDLE_MS = 2500;

/* 브라우저 안: 영역 안의 보이는 조작 후보 목록(문서 순서). 같은 함수를 매번 다시 불러 같은 순서를 얻는다. */
const COLLECT_FN = (scopeSels) => {
  const IA = 'button, a[href], [role="button"], [role="tab"], [role="switch"], input:not([type=hidden]), select, textarea, summary, [onclick], [tabindex]:not([tabindex="-1"])';
  const label = (el) => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (e.hidden || cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      // 접힌 details 의 내용(자기 summary 는 제외)은 그려지지 않는다
      if (e !== el && e.tagName === 'DETAILS' && !e.open && !(el.tagName === 'SUMMARY' && el.parentElement === e) && !(el.closest('summary') && el.closest('summary').parentElement === e)) return false;
    }
    if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  const scopes = scopeSels.map(s => document.querySelector(s)).filter(Boolean);
  const seen = new Set(), out = [], els = [];
  for (const s of scopes) {
    const all = [s, ...s.querySelectorAll('*')];
    for (const el of all) {
      if (seen.has(el)) continue;
      const ia = el.matches(IA);
      // 조작 요소 선택자에 안 걸려도 손가락 모양(cursor:pointer)이면 "눌릴 것처럼 보이는 것"으로 함께 넣는다(가장 바깥 것만)
      const ptr = !ia && getComputedStyle(el).cursor === 'pointer' && !(el.parentElement && getComputedStyle(el.parentElement).cursor === 'pointer') && !el.closest('button, a[href], label');
      if (!ia && !ptr) continue;
      if (el.closest('[disabled]') && el.matches('button, input, select, textarea')) continue;
      if (!visible(el)) continue;
      seen.add(el); els.push(el);
      const dataKeys = Object.keys(el.dataset || {}).sort().join(',');
      const kind = el.id ? 'id:' + el.id : el.tagName.toLowerCase() + '|' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(c => !/^(active|on|selected|open)$/.test(c)).slice(0, 2).join('.') : '') + '|' + dataKeys;
      const text = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 30);
      const href = el.tagName === 'A' ? el.getAttribute('href') : null;
      // 판단 낱말: 보이는 글자·aria-label·id·data 속성 이름(id 는 낙타표기를 낱말로 쪼갠다: clearCacheBtn → clear Cache Btn). title 설명문은 쓰지 않는다
      const camel = (x) => String(x || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
      const words = [text, el.getAttribute('aria-label') || '', camel(el.id), Object.keys(el.dataset || {}).map(camel).join(' ')].join(' ');
      out.push({ sel: label(el), kind, text, ptrOnly: ptr, href, target: el.getAttribute('target'), type: el.getAttribute('type'), tag: el.tagName, words: words.slice(0, 300), onclick: (el.getAttribute('onclick') || '').slice(0, 300), resolved: href ? el.href : null });
    }
  }
  window.__tcList = els;
  return out;
};

/* 누르기 전에 걸러낼 것. 되돌릴 수 없거나 바깥으로 나가는 것은 누르지 않는다. */
function skipReason(c, origin) {
  if (c.tag === 'INPUT' && String(c.type).toLowerCase() === 'file') return '파일 선택 입력(파일 첨부)';
  if (c.href) {
    if (/^(mailto|tel|sms|intent):/i.test(c.href)) return '외부 앱으로 나감(' + c.href.split(':')[0] + ')';
    if (c.resolved && !String(c.resolved).startsWith(origin) && !/^#/.test(c.href) && !/^javascript:/i.test(c.href)) return '외부 링크(' + String(c.resolved).slice(0, 60) + ')';
    if (String(c.target).toLowerCase() === '_blank') return '새 창 링크(target=_blank)';
  }
  if (/window\.open|location\.(href|assign|replace)\s*=|location\.(assign|replace)\(/.test(c.onclick)) return '새 창·페이지 이동 코드(onclick)';
  if (c.tag === 'SUMMARY') return null; // 접힌 묶음을 펼치기만 한다
  if (/삭제|지우기|지움|비우기|초기화|리셋|탈퇴|로그아웃|원격 차단|일괄|\b(reset|delete|remove|clear|logout|withdraw|kill|wipe|del|delpost|timedel)/i.test(c.words)) return '되돌릴 수 없음(삭제·초기화·로그아웃·차단)';
  if (/결제|구독|구매|업그레이드|\b(checkout|payment)/i.test(c.words)) return '돈(결제·구독)';
  if (/게시|공유|(?<!내)보내기|전송|제보|문의|신고|초대|\b(share|send|publish)/i.test(c.words)) return '바깥으로 보냄(게시·공유·전송·문의)';
  if (/연동하기|계정 연동|회원가입|\boauth|sign ?in/i.test(c.words)) return '외부 인증·계정 연동';
  return null;
}

/* 브라우저 안: 가로채기 설치(실제 창·대화상자·파일 선택창을 띄우지 않고 호출만 기록) + 반응 관찰 시작 */
const ARM_FN = () => {
  const calls = window.__tcCalls = window.__tcCalls || [];
  if (!window.__tcArmed) {
    window.__tcArmed = true;
    window.open = function (u) { calls.push('window.open ' + String(u || '').slice(0, 60)); return null; };
    window.confirm = function () { calls.push('confirm'); return false; };
    window.alert = function () { calls.push('alert'); };
    window.prompt = function () { calls.push('prompt'); return null; };
    const oc = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () { if (String(this.type).toLowerCase() === 'file') { calls.push('file-chooser'); return; } return oc.call(this); };
    if (HTMLInputElement.prototype.showPicker) HTMLInputElement.prototype.showPicker = function () { calls.push('showPicker'); };
    try { navigator.share = function () { calls.push('navigator.share'); return Promise.reject(new Error('blocked')); }; } catch (e) {}
    try { if (navigator.clipboard) navigator.clipboard.writeText = function () { calls.push('clipboard'); return Promise.resolve(); }; } catch (e) {}
    try { if (window.Notification) window.Notification.requestPermission = function () { calls.push('Notification.requestPermission'); return Promise.resolve('denied'); }; } catch (e) {}
  }
  window.__tcNoise = window.__tcNoise || new Set();
  window.__tcMut = [];
  if (window.__tcObs) window.__tcObs.disconnect();
  window.__tcObs = new MutationObserver((list) => { for (const m of list) window.__tcMut.push(m.target); });
  window.__tcObs.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
};
/* 대기 구간에 저절로 바뀐 노드를 잡음(noise)으로 옮긴다 */
const NOISE_FN = () => { for (const t of window.__tcMut) window.__tcNoise.add(t); window.__tcMut = []; };
const SNAP_FN = () => {
  const ae = document.activeElement;
  const toast = [...document.querySelectorAll('#toast, .toast, [role="alert"], [role="status"], [class*="toast"], [class*="snackbar"]')]
    .filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05 && e.textContent.trim(); })
    .map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
  return {
    screen: (document.querySelector('.screen.active') || {}).id || null, href: location.href, scrollY: Math.round(scrollY),
    focus: ae && ae !== document.body ? (ae.id || ae.tagName) : null, focusField: !!ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || !!(ae && ae.isContentEditable),
    calls: (window.__tcCalls || []).length, toast: toast.join(' / ')
  };
};
const AFTER_FN = (before) => {
  const noise = window.__tcNoise;
  const muts = window.__tcMut.filter(t => !noise.has(t));
  const lab = (e) => e.nodeType !== 1 ? (e.parentElement ? lab(e.parentElement) : '#text') : (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : ''));
  const mutTargets = [...new Set(muts.map(lab))];
  const calls = (window.__tcCalls || []).slice(before.calls);
  return { mutations: muts.length, mutTargets: mutTargets.slice(0, 4), calls };
};

async function probeState(ctx) {
  const { open, scope, tab, state, skipKinds } = ctx; // open(): 새 컨텍스트에서 그 상태까지 들어간 page 와 정리 함수를 돌려준다
  const t0 = Date.now();
  const res = { tab, state, scope, candidates: 0, clicked: 0, reacted: 0, dead: [], covered: [], notClicked: [], sampledOut: {}, alreadyInBase: 0, cappedOut: 0, mismatch: [], restoreFail: 0, reactions: {} };
  let cur = await open();
  if (!cur.ok) { res.error = '상태 진입 실패: ' + cur.note; await cur.close(); return res; }
  const origin = await cur.page.evaluate(() => location.origin);
  const plan = await cur.page.evaluate(COLLECT_FN, scope);
  res.candidates = plan.length;
  const perKind = {}, todo = [];
  plan.forEach((c, i) => {
    const why = skipReason(c, origin);
    if (why) { res.notClicked.push({ sel: c.sel, text: c.text, reason: why }); return; }
    if (skipKinds && skipKinds.has(c.kind + '|' + c.text)) { res.alreadyInBase++; return; }
    perKind[c.kind] = (perKind[c.kind] || 0) + 1;
    if (!c.kind.startsWith('id:') && perKind[c.kind] > SAMPLE_PER_KIND) { res.sampledOut[c.sel] = (res.sampledOut[c.sel] || 0) + 1; return; }
    if (todo.length >= MAX_CLICKS) { res.cappedOut++; return; }
    todo.push({ i, c });
  });
  res.probedKeys = todo.map(x => x.c.kind + '|' + x.c.text);
  // 상태에 들어간 직후 잠시 그대로 두고 저절로 바뀌는 노드·저절로 나가는 요청을 잡음으로 모은다
  const reqs = []; let navs = 0;
  const attach = (page) => {
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith('data:')) reqs.push(u.split('?')[0]); });
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
  };
  attach(cur.page);
  const settle = async () => {
    await cur.page.evaluate(ARM_FN);
    const r0 = reqs.length; await sleep(GLOBAL_IDLE_MS); await cur.page.evaluate(NOISE_FN);
    return new Set(reqs.slice(r0));
  };
  let noiseUrls = await settle();
  for (const { i, c } of todo) {
    const now = await cur.page.evaluate(COLLECT_FN, scope);
    const live = now[i];
    if (!live || live.sel !== c.sel || live.text !== c.text) { res.mismatch.push({ sel: c.sel, text: c.text, found: live ? live.sel + ' "' + live.text + '"' : null }); continue; }
    const pt = await cur.page.evaluate((idx) => {
      // 바로 앞의 COLLECT_FN 이 남긴 같은 순서의 목록에서 꺼내 화면 가운데로 옮긴다
      const el = window.__tcList[idx];
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      { const q = el.getBoundingClientRect(); if (q.top < 0 || q.bottom > innerHeight) window.scrollTo({ top: scrollY + q.top - innerHeight / 2 + q.height / 2, behavior: 'instant' }); } // scrollIntoView 가 문서 스크롤을 못 옮기는 경우(설정 탭에서 실측) 문서 좌표로 다시 옮긴다
      const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const top = document.elementFromPoint(x, y);
      const lab = (e) => e ? (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '')) : null;
      return { x, y, covered: !top || !el.contains(top), by: lab(top) };
    }, i);
    if (pt.covered) { res.covered.push({ sel: c.sel, text: c.text, by: pt.by }); continue; }
    await sleep(120);
    await cur.page.evaluate(NOISE_FN); // 스크롤로 생긴 변화는 잡음으로 돌린다
    await sleep(IDLE_MS);
    await cur.page.evaluate(NOISE_FN);
    const before = await cur.page.evaluate(SNAP_FN);
    const r0 = reqs.length, n0 = navs;
    await cur.page.mouse.click(pt.x, pt.y);
    await sleep(AFTER_MS);
    res.clicked++;
    let after = null, diff = null;
    // 같은 문서 안 주소 이동(history·해시)도 framenavigated 로 잡히므로, 문서가 그대로면 나머지 반응도 함께 센다
    try { after = await cur.page.evaluate(SNAP_FN); diff = await cur.page.evaluate(AFTER_FN, before); } catch (e) { after = null; }
    const kinds = [];
    if (!after) kinds.push('페이지 이동');
    else {
      if (navs !== n0 && after.href === before.href) kinds.push('주소 이동(같은 문서)');
      if (diff.mutations > 0) kinds.push('DOM 변화');
      if (after.screen !== before.screen) kinds.push('화면 전환');
      if (after.href !== before.href) kinds.push('주소 변경');
      if (Math.abs(after.scrollY - before.scrollY) > 2) kinds.push('스크롤 이동');
      if (after.toast && after.toast !== before.toast) kinds.push('토스트');
      if (after.focusField && after.focus !== before.focus) kinds.push('입력 포커스');
      for (const k of diff.calls) kinds.push('호출 ' + k.split(' ')[0]);
    }
    const newReqs = reqs.slice(r0).filter(u => !noiseUrls.has(u));
    if (newReqs.length) kinds.push('네트워크 시도');
    if (!kinds.length) { res.dead.push({ sel: c.sel, text: c.text, ptrOnly: c.ptrOnly || undefined }); continue; }
    res.reacted++;
    for (const k of kinds) res.reactions[k] = (res.reactions[k] || 0) + 1;
    if (kinds.length === 1 && kinds[0] === '입력 포커스') { await cur.page.evaluate(() => document.activeElement && document.activeElement.blur()); continue; }
    // 원래 상태로 복귀: 새 컨텍스트에서 처음부터 다시 들어간다
    await cur.close();
    cur = await open();
    if (!cur.ok) { res.restoreFail++; res.error = '복귀 실패: ' + cur.note; break; }
    attach(cur.page);
    noiseUrls = new Set([...noiseUrls, ...(await settle())]);
  }
  await cur.close();
  res.durationSec = Math.round((Date.now() - t0) / 1000);
  res.deadCount = res.dead.length;
  return res;
}

module.exports = { probeState, skipReason, COLLECT_FN, SAMPLE_PER_KIND, MAX_CLICKS };
