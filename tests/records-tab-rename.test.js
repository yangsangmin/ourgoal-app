/**
 * [#TASK-ES-260] 기록탭 명칭 '기록/통계'로 변경 2차 초정밀 완결 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-260';

console.log('[TEST] records-tab-rename.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const uiCssPath = path.join(__dirname, '..', 'ui.css');
const uiCss = fs.readFileSync(uiCssPath, 'utf8');

// 1. 하단 내비게이션 바 data-tab="records" 버튼 검증 (텍스트 및 aria-label)
{
  assert(indexHtml.includes('data-tab="records"'), '하단 내비게이션에 data-tab="records" 속성이 존재해야 합니다.');
  
  // 버튼 태그와 내부 텍스트 검증
  const recordsBtnRegex = /<button[^>]*class="navbtn"[^>]*data-tab="records"[^>]*>([\s\S]*?)<\/button>/;
  const match = indexHtml.match(recordsBtnRegex);
  assert(match, 'navbtn data-tab="records" 버튼 마크업이 매칭되어야 합니다.');
  
  const btnTag = match[0];
  assert(btnTag.includes('aria-label="기록/통계"'), 'navbtn data-tab="records"에 aria-label="기록/통계" 속성이 부여되어야 합니다.');
  assert(match[1].includes('기록/통계'), 'navbtn data-tab="records" 내부 텍스트로 "기록/통계"가 포함되어야 합니다.');
}

// 2. 기록 화면(#screen-records) 상단 헤더 타이틀 검증
{
  const screenRecordsRegex = /<section[^>]*id="screen-records"[^>]*>([\s\S]*?)<\/section>/;
  const screenMatch = indexHtml.match(screenRecordsRegex);
  assert(screenMatch, 'id="screen-records" 화면이 존재해야 합니다.');
  
  assert(screenMatch[1].includes('기록/통계'), 'screen-records 헤더 영역에 "기록/통계" 타이틀이 존재해야 합니다.');
  assert(screenMatch[1].includes('<h2 class="s-title" style="font-size:1.15rem;margin:0;">기록/통계</h2>'), 'h2.s-title로 기록/통계가 지정되어야 합니다.');
}

// 3. 가이드 허브 모달(tabGuideHubModal) 탭 정의 검증
{
  assert(indexHtml.includes("{ key: 'records', label: '기록/통계', icon: '📝' }"), 'tabGuideHubModal의 records 탭 label이 "기록/통계"여야 합니다.');
}

// 4. 공개 범위 모달(openPrivacyPickerModal) 탭명 분기 검증
{
  assert(indexHtml.includes("tabKey==='records' ? '기록/통계' : '통계'"), 'openPrivacyPickerModal의 records tabName이 "기록/통계"여야 합니다.');
}

// 5. CSS 스타일 검증 (white-space:nowrap 및 375px 모바일 미디어 쿼리 방어)
{
  assert(uiCss.includes('.navbtn{') || uiCss.includes('.navbtn {'), '.navbtn 클래스 스타일이 존재해야 합니다.');
  assert(uiCss.includes('white-space:nowrap'), '.navbtn에 white-space:nowrap 속성이 지정되어 줄바꿈이 방지되어야 합니다.');
  assert(uiCss.includes('@media (max-width: 375px){.navbtn{') || uiCss.includes('@media (max-width:375px)'), '375px 모바일 미디어 쿼리 방어 규칙이 존재해야 합니다.');
}

// 6. 회귀 결함 방지: 내부 라우팅 및 탭 키 무결성 검증
{
  assert(indexHtml.includes("if(tab==='records') renderRecordsScreen();"), 'renderRecordsScreen 호출 라우팅이 온전히 유지되어야 합니다.');
  assert(indexHtml.includes("document.querySelector('.navbtn[data-tab=\"records\"]')"), 'navbtn[data-tab="records"] 쿼리 선택자가 유지되어야 합니다.');
}

console.log('[TEST] records-tab-rename.test.js: ALL ASSERTIONS PASSED! (100% OK)');
