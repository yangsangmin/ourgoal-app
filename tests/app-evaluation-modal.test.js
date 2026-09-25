// tests/app-evaluation-modal.test.js
// TASK-ES-268: 홈탭 최하단 <아워골 평가해주기> 고정배너 및 90% 팝업 평가폼 단위 검증

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const indexHtmlPath = path.join(__dirname, '..', 'index.html');
  const uiCssPath = path.join(__dirname, '..', 'ui.css');

  assert.ok(fs.existsSync(indexHtmlPath), 'index.html 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(uiCssPath), 'ui.css 파일이 존재해야 합니다.');

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const uiCss = fs.readFileSync(uiCssPath, 'utf8');

  // 1. 홈탭 최하단 고정 배너 및 <아워골 평가해주기> 버튼 존재 검증
  assert.ok(indexHtml.includes('id="homeEvalBanner"'), 'homeEvalBanner 요소가 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="btnOpenEvalModal"'), 'btnOpenEvalModal 버튼이 존재해야 합니다.');
  assert.ok(indexHtml.includes('&lt;아워골 평가해주기&gt;'), '버튼 텍스트가 <아워골 평가해주기>로 구현되어야 합니다.');

  // 나만의 홈 구성(data-home-widget)으로 숨겨지지 않아야 함
  const bannerSlice = indexHtml.slice(indexHtml.indexOf('id="homeEvalBanner"'), indexHtml.indexOf('id="homeEvalBanner"') + 200);
  assert.ok(!bannerSlice.includes('data-home-widget'), 'homeEvalBanner는 나만의 홈 구성 위젯에서 바꿀 수 없도록 data-home-widget을 갖지 않아야 합니다.');

  // 2. 90% 크기 평가 모달 및 5대 입력 폼 존재 검증
  assert.ok(indexHtml.includes('id="appEvaluationModal"'), 'appEvaluationModal 모달이 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="evalScoreInput"'), '100점 만점 종합 점수 인풋(evalScoreInput)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="evalProsInput"'), '장점 입력칸(evalProsInput)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="evalConsInput"'), '단점 입력칸(evalConsInput)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="evalImprovementsInput"'), '추가 및 개선요청 입력칸(evalImprovementsInput)이 존재해야 합니다.');
  assert.ok(indexHtml.includes('id="evalCeoMsgInput"'), '대표에게 하고싶은 말 입력칸(evalCeoMsgInput)이 존재해야 합니다.');

  // 3. 대표에게 하고싶은 말 플레이스홀더 문구 검증
  assert.ok(indexHtml.includes('placeholder="진짜 맘대로 써주셔도 됩니다. 신고안합니다"'), '대표에게 하고싶은 말에 원문 플레이스홀더가 존재해야 합니다.');

  // 4. Supabase app_evaluations 직접 적재 및 폼 리셋 검증
  assert.ok(indexHtml.includes("sb.from('app_evaluations').insert"), 'Supabase app_evaluations 테이블 직접 적재 파이프라인이 구현되어야 합니다.');
  assert.ok(indexHtml.includes('resetAppEvaluationForm'), '평가 제출 완료 후 폼 초기화(resetAppEvaluationForm)가 구현되어야 합니다.');
  assert.ok(indexHtml.includes('소중한 평가가 접수되었습니다. 감사합니다! ⭐'), '제출 완료 감사 토스트가 구현되어야 합니다.');

  // 5. ui.css 내 90vw / 90vh 규격 검증
  assert.ok(uiCss.includes('width: 90vw;'), 'ui.css에 width: 90vw가 정의되어야 합니다.');
  assert.ok(uiCss.includes('height: 90vh;'), 'ui.css에 height: 90vh가 정의되어야 합니다.');
}

runTest();
