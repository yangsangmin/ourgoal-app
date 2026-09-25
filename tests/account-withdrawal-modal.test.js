/**
 * tests/account-withdrawal-modal.test.js
 * #TASK-ES-271: 계정 탈퇴 시 법적책임·데이터 분실 사전 안내 팝업 및 4위 1체 배선 검증
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'ui.css');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

// 1. 설정 탭 내 회원 탈퇴 버튼 배선
assert.ok(html.includes('id="withdrawBtn"'), 'withdrawBtn must exist in index.html');
assert.ok(html.includes("document.getElementById('withdrawBtn').addEventListener('click', openWithdrawModal);"), 'withdrawBtn click listener must be bound');

// 2. 탈퇴 모달 컨테이너 및 헤더
assert.ok(html.includes('id="withdrawModal"'), 'withdrawModal container must be defined in template');
assert.ok(html.includes('id="withdrawCloseBtn"'), 'withdrawCloseBtn must exist');
assert.ok(html.includes('회원 탈퇴 및 법적책임·데이터 분실 사전 안내'), 'modal title must include legal and loss notice');

// 3. 데이터 분실 4대 영역 정밀 고지
assert.ok(html.includes('1. 소중한 목표 및 기록 분실 안내 (개인 자산 4대 영역 고지)'), '4 major loss areas title must exist');
assert.ok(html.includes('목표 및 마일스톤'), 'loss item: goals and milestones must exist');
assert.ok(html.includes('인생 실천 기록 및 타임라인'), 'loss item: practice records and timeline must exist');
assert.ok(html.includes('아바타 인벤토리 및 성장 자산'), 'loss item: avatar inventory and growth assets must exist');
assert.ok(html.includes('소통 및 커뮤니티 데이터'), 'loss item: communication and community data must exist');

// 4. 30일 안전 유예 및 원클릭 복구 안내
assert.ok(html.includes('2. 30일 탈퇴 유예 안전망 및 원클릭 복구'), '30-day grace period title must exist');
assert.ok(html.includes('30일간 안전 유예 기간'), '30-day grace notice must exist');
assert.ok(html.includes('원클릭으로 모든 데이터가 100% 무손실 복구'), 'one-click lossless recovery notice must exist');

// 5. 법적 책임 및 보존 고지 3대 법령
assert.ok(html.includes('3. 법적 책임 및 관계 법령에 따른 정보 보존 고지'), 'legal responsibility title must exist');
assert.ok(html.includes('개인정보보호법 제21조'), 'Personal Information Protection Act Art 21 must exist');
assert.ok(html.includes('전자상거래 등에서의 소비자보호에 관한 법률 제6조'), 'Electronic Commerce Act Art 6 must exist');
assert.ok(html.includes('통신비밀보호법 제15조의2'), 'Protection of Communications Secrets Act Art 15-2 must exist');
assert.ok(html.includes('부정 이용 및 분쟁 방지'), 'fraud prevention clause must exist');

// 6. 4위 1체 배선 (체크박스, 취소, 확정 버튼)
assert.ok(html.includes('id="withdrawAgreeCheck"'), 'withdrawAgreeCheck checkbox must exist');
assert.ok(html.includes('id="withdrawCancelBtn"'), 'withdrawCancelBtn must exist');
assert.ok(html.includes('id="withdrawConfirmBtn"'), 'withdrawConfirmBtn must exist');
assert.ok(html.includes('confirmBtn.disabled = !this.checked;'), 'checkbox toggle logic must control confirmBtn.disabled');
assert.ok(html.includes('closeBtn.onclick = closeWithdrawModal;'), 'closeBtn click must invoke closeWithdrawModal');
assert.ok(html.includes('cancelBtn.onclick = closeWithdrawModal;'), 'cancelBtn click must invoke closeWithdrawModal');
assert.ok(html.includes('confirmBtn.onclick = submitWithdrawAccount;'), 'confirmBtn click must invoke submitWithdrawAccount');

// 7. CSS 반응형 및 스크롤 최적화
assert.ok(css.includes('.withdraw-modal-container'), '.withdraw-modal-container must be defined in ui.css');
assert.ok(css.includes('max-height: 80vh;'), 'modal container max-height must be 80vh');
assert.ok(css.includes('-webkit-overflow-scrolling: touch;'), 'modal touch scrolling must be enabled');
assert.ok(css.includes('.withdraw-box-danger'), '.withdraw-box-danger class must exist');
assert.ok(css.includes('.withdraw-box-legal'), '.withdraw-box-legal class must exist');
assert.ok(css.includes('.withdraw-agree-wrapper'), '.withdraw-agree-wrapper class must exist');
