/* #T015 AI 사용 동의 시험 — 동의 없이 AI 제공자로 나가는 길이 없는지 index.html 을 읽어 확인한다.
   실행: node scripts/test-ai-consent.js  (npm test 에는 들어 있지 않다 — package.json scripts 는 금고) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n    ' + e.message); }
}

/* 1) AI 로 나가는 fetch 는 전부 동의 확인이 앞서야 한다.
      해당 fetch 위쪽으로 가장 가까운 함수 선언(또는 vision 의 onclick) 안에서 aiConsentGranted() 가 먼저 나와야 한다. */
const AI_ENDPOINTS = [
  "fetch('/api/feedback'", "fetch('/api/promptgen'", "fetch('/api/goaltemplate'", "fetch('/api/goalagent'",
  "fetch('/api/goalstatus'", "fetch('/api/todaymission'", "fetch('/api/nextaction'", "fetch('/api/vision-table'",
  "fetch('https://generativelanguage.googleapis.com"
];
const lines = html.split(/\r?\n/);
function enclosingStart(idx) {
  for (let i = idx; i >= 0; i--) {
    if (/^\s*(async\s+)?function\s+\w+\s*\(/.test(lines[i]) && /^ {2}(async )?function/.test(lines[i])) return i; /* 2칸 들여쓴 최상위 함수 */
    if (/runBtn\.onclick\s*=\s*function/.test(lines[i])) return i;
  }
  return -1;
}
const sites = [];
lines.forEach((ln, i) => { if (AI_ENDPOINTS.some(e => ln.includes(e))) sites.push(i); });

t('AI 로 나가는 fetch 지점을 찾았다(최소 10곳)', () => assert.ok(sites.length >= 10, 'found ' + sites.length));
sites.forEach(i => {
  t('L' + (i + 1) + ' ' + lines[i].trim().slice(0, 60) + ' — 앞에 aiConsentGranted() 가 있다', () => {
    const s = enclosingStart(i);
    assert.ok(s >= 0, '둘러싼 함수를 못 찾음');
    const head = lines.slice(s, i).join('\n');
    assert.ok(/aiConsentGranted\(\)/.test(head), '함수 ' + (s + 1) + '행 ~ ' + (i + 1) + '행 사이에 동의 확인이 없다');
  });
});

/* 2) 동의 저장·판정 로직을 격리 실행해 동작을 확인한다. */
const a = html.indexOf('var AI_CONSENT_KEY');
const b = html.indexOf('function showAIConsentModal');
t('동의 로직 구간을 찾았다', () => assert.ok(a > 0 && b > a));
const src = html.slice(a, b);
function run(store) {
  const ls = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const els = { aiConsentStatus: { textContent: '' } };
  const fn = new Function('localStorage', 'document',
    src + '; return { getAIConsent: getAIConsent, aiConsentGranted: aiConsentGranted, setAIConsent: setAIConsent };');
  return { api: fn(ls, { getElementById: id => els[id] || null }), els, store };
}
t('선택이 없으면 동의 아님(null)', () => { const r = run({}); assert.strictEqual(r.api.getAIConsent(), null); assert.strictEqual(r.api.aiConsentGranted(), false); });
t('거부를 저장하면 동의 아님', () => { const r = run({}); r.api.setAIConsent('declined'); assert.strictEqual(r.api.getAIConsent(), 'declined'); assert.strictEqual(r.api.aiConsentGranted(), false); });
t('동의를 저장하면 동의 + 상태 글자 갱신', () => { const r = run({}); r.api.setAIConsent('granted'); assert.strictEqual(r.api.aiConsentGranted(), true); assert.ok(/동의함/.test(r.els.aiConsentStatus.textContent)); });
t('깨진 저장값·다른 버전은 선택 없음으로 본다', () => {
  assert.strictEqual(run({ ourgoal_ai_consent: '{not json' }).api.getAIConsent(), null);
  assert.strictEqual(run({ ourgoal_ai_consent: JSON.stringify({ v: 999, choice: 'granted' }) }).api.getAIConsent(), null);
  assert.strictEqual(run({ ourgoal_ai_consent: JSON.stringify({ v: 1, choice: 'maybe' }) }).api.getAIConsent(), null);
});
t('저장소 접근이 던져도 죽지 않고 선택 없음', () => {
  const fn = new Function('localStorage', 'document', src + '; return getAIConsent();');
  assert.strictEqual(fn({ getItem() { throw new Error('denied'); } }, { getElementById: () => null }), null);
});

/* 3) 페이지·링크·라우팅 */
t('privacy.html·support.html 이 있다', () => { assert.ok(fs.existsSync(path.join(ROOT, 'privacy.html'))); assert.ok(fs.existsSync(path.join(ROOT, 'support.html'))); });
t('vercel.json 이 /privacy·/support 를 재작성한다', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const m = {}; v.rewrites.forEach(r => { m[r.source] = r.destination; });
  assert.strictEqual(m['/privacy'], '/privacy.html'); assert.strictEqual(m['/support'], '/support.html');
});
t('방침에 제3자 4곳(Google·Supabase·PostHog·Vercel)과 삭제 방법이 있다', () => {
  const p = fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8');
  ['Google LLC', 'Supabase', 'PostHog', 'Vercel', '회원 탈퇴', 'ourgoal.support@gmail.com'].forEach(k => assert.ok(p.includes(k), k));
});
t('지원 페이지에 이메일과 FAQ 5개가 있다', () => {
  const s = fs.readFileSync(path.join(ROOT, 'support.html'), 'utf8');
  assert.ok(s.includes('mailto:ourgoal.support@gmail.com'));
  assert.strictEqual((s.match(/<details>/g) || []).length, 5);
});
t('푸터·설정 화면에 /privacy·/support 링크가 있다', () => {
  ['footPrivacyPageLink', 'footSupportPageLink', 'setPrivacyPageLink', 'setSupportPageLink'].forEach(id =>
    assert.ok(new RegExp('id="' + id + '" href="/(privacy|support)"|href="/(privacy|support)" id="' + id + '"').test(html), id));
});

console.log('\n' + pass + '개 통과, ' + fail + '개 실패');
process.exit(fail ? 1 : 0);
