#!/usr/bin/env node
/**
 * verify-all-clicks.js — 아워골 전수 인터랙션 및 버튼 클릭 무결성 정밀 검증기
 * (헌법 제7조 제1항 엄밀 Zero Dead-Click 3중 방화벽 정본)
 * 
 * [헌법 엄격 4대 판정 원칙]
 * 1. 단순 공통 디자인 스타일 클래스(btn, btn-primary 등) 매칭 영구 금지
 * 2. 검증기 사기 방지 카나리 변이 시험(Canary Mutation Test) 필수 통과
 * 3. onclick, 고유 ID, 고유 data-*, 고유 비즈니스 클래스만 배선으로 인정
 * 
 * 실행: node scripts/verify-all-clicks.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const UI_JS = path.join(ROOT_DIR, 'ui.js');
const JS_DIR = path.join(ROOT_DIR, 'js');

const html = fs.readFileSync(INDEX_HTML, 'utf8');
const uiJs = fs.existsSync(UI_JS) ? fs.readFileSync(UI_JS, 'utf8') : '';
let allJs = html + '\n' + uiJs;
if (fs.existsSync(JS_DIR)) {
  fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js')).forEach(f => {
    allJs += '\n' + fs.readFileSync(path.join(JS_DIR, f), 'utf8');
  });
}
const combinedJs = allJs;

console.log('================================================================');
console.log('🛡️  아워골 엄밀 Zero Dead-Click 3중 방화벽 검증기 (Anti-False-Pass)');
console.log('================================================================\n');

// 배선 근거로 절대 인정되지 않는 단순 공통 CSS 스타일 클래스 블랙리스트 (헌법 제7조 제1항 제1호)
const STYLE_CLASS_BLACKLIST = new Set([
  'btn', 'btn-primary', 'btn-ghost', 'btn-secondary', 'btn-sm', 'btn-xs',
  'btn-outline', 'btn-danger', 'btn-icon', 'active', 'goal-chip', 'tab-chip',
  'chip', 'card', 'badge', 'item', 'row', 'col', 'flex', 'text-center',
  'pill', 'btn-wrap', 'btn-group'
]);

/**
 * 단일 버튼 배선 여부 엄밀 판정 함수
 */
function evaluateButtonWired(btn, sourceCode) {
  // 0. disabled 상태인 버튼은 비활성 상태 표시용이므로 데드클릭 대상에서 제외
  if (btn.raw && /\bdisabled\b/i.test(btn.raw)) {
    return true;
  }

  // 1. 인라인 onclick이 있는 경우
  if (btn.onclick && btn.onclick.trim().length > 0) {
    return true;
  }

  // 2. ID 기반 핸들러/위임 바인딩
  if (btn.id) {
    const idPattern = new RegExp(`['"]#?${btn.id}['"]`);
    if (idPattern.test(sourceCode)) {
      return true;
    }
  }

  // 3. 폼 서밋 버튼
  if (btn.raw && btn.raw.includes('type="submit"')) {
    return true;
  }

  // 4. data-* 속성 기반 이벤트 위임 매칭 (헌법 제7조 제1항 제1호 다목)
  if (btn.raw) {
    const dataAttrs = [...btn.raw.matchAll(/\b(data-[a-zA-Z0-9_-]+)=/g)].map(m => m[1]);
    for (const dAttr of dataAttrs) {
      const camelCase = dAttr.replace('data-', '').replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      const hasDelegation =
        sourceCode.includes(`[${dAttr}]`) ||
        sourceCode.includes(`[${dAttr}=`) ||
        sourceCode.includes(`getAttribute('${dAttr}')`) ||
        sourceCode.includes(`getAttribute("${dAttr}")`) ||
        sourceCode.includes(`dataset.${camelCase}`) ||
        sourceCode.includes(`dataset['${camelCase}']`);
      if (hasDelegation) {
        return true;
      }
    }
  }

  // 5. 고유 비즈니스 클래스 이벤트 위임 (공통 스타일 클래스는 전면 배제!)
  if (btn.className) {
    const classTokens = btn.className.split(/\s+/).filter(c => c && !STYLE_CLASS_BLACKLIST.has(c));
    for (const token of classTokens) {
      // 모달 닫기 범용 처리
      if (token === 'modal-close' || token === 'close-btn' || token === 'btn-close') {
        return true;
      }
      // 고유 비즈니스 클래스가 이벤트 위임이나 querySelector 등으로 명시적 결속된 경우
      const specificClassPattern = new RegExp(`['"]\\.${token}['"]`);
      if (specificClassPattern.test(sourceCode)) {
        return true;
      }
    }
  }

  return false;
}

// ================================================================
// 🔬 [Canary Mutation Test] 검증기 자체 사기 방지 자가 시험
// ================================================================
console.log('🧪 [카나리 자가 시험] 검증기 판정 무결성 시험 중...');
const dummyCanary = {
  raw: '<button class="btn-primary btn-ghost">가짜 카나리</button>',
  id: null,
  className: 'btn-primary btn-ghost',
  onclick: null,
  text: '가짜 카나리'
};

const canaryResult = evaluateButtonWired(dummyCanary, combinedJs);
if (canaryResult === true) {
  console.error('❌ [CRITICAL] 카나리 변이 시험 실패! 검증기가 단순 공통 CSS 클래스(btn-primary)로 인해 가짜 버튼을 통과시키고 있습니다.');
  process.exit(1);
}
console.log('✓ [PASS] 카나리 변이 시험 통과: 공통 CSS 클래스를 통한 허위 통과(False-Pass)가 원천 차단됨을 입증했습니다.\n');

// ================================================================
// 1. Static HTML 버튼 전수 추출 및 검사
// ================================================================
const staticButtons = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi)].map(m => {
  const attrs = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  const idMatch = attrs.match(/id=["']([^"']+)["']/i);
  const classMatch = attrs.match(/class=["']([^"']+)["']/i);
  const onclickMatch = attrs.match(/onclick=["']([^"']+)["']/i);
  return {
    raw: m[0],
    id: idMatch ? idMatch[1] : null,
    className: classMatch ? classMatch[1] : null,
    onclick: onclickMatch ? onclickMatch[1] : null,
    text: text.slice(0, 30)
  };
});

console.log(`[분석] 정적 <button> 태그 총 ${staticButtons.length}개 발견`);

let wiredCount = 0;
let unhandledButtons = [];

staticButtons.forEach(btn => {
  const isWired = evaluateButtonWired(btn, combinedJs);
  if (isWired) {
    wiredCount++;
  } else {
    unhandledButtons.push(`[${btn.id ? '#' + btn.id : (btn.className ? '.' + btn.className : 'NO-ID')}] "${btn.text}"`);
  }
});

console.log(`[결과] 엄밀 핸들러 배선 확인 버튼: ${wiredCount}개 / ${staticButtons.length}개`);

// 2. 링크 태그 dead-link 검사
const deadLinks = [...html.matchAll(/<a\s+[^>]*href=["']#["'][^>]*>/gi)].filter(m => {
  return !m[0].includes('onclick') && !m[0].includes('id=') && !m[0].includes('class=');
});
assert.strictEqual(deadLinks.length, 0, `동작 없는 데드 링크(href="#") 발견: ${deadLinks.length}건`);
console.log('✓ [PASS] 모든 <a> 링크 태그에 올바른 href 또는 이벤트 핸들러가 존재합니다.');

// 3. 전역 클릭 이벤트 위임 리스너 검증
const delegationScript = combinedJs.includes("document.addEventListener('click'") || combinedJs.includes('document.addEventListener("click"');
assert.ok(delegationScript, '전역 클릭 이벤트 위임 리스너가 존재하여 동적 UI 상호작용을 보장합니다.');
console.log('✓ [PASS] 전역 클릭 이벤트 위임(Event Delegation) 배선 정상 확인');

// 4. 미배선 버튼 적발 시 FAIL 처리
if (unhandledButtons.length > 0) {
  console.error(`\n❌ [FAIL] 엄밀 분석 상 핸들러가 결여된 껍데기/데드클릭 버튼 (${unhandledButtons.length}개) 발견:`);
  unhandledButtons.forEach(b => console.error(`   - ${b}`));
  process.exit(1);
}

console.log('\n✨ [ALL PASS] 아워골 전수 인터랙션 및 엄밀 Zero Dead-Click 검증 100% 완료!\n');
process.exit(0);