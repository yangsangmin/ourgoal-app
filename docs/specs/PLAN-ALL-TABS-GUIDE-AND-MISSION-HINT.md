# 실행계획서 (PLAN) — 전 탭 '이 페이지 활용법' 가이드 시스템 & 오늘의 미션 힌트 탑재

> **문서 ID**: PLAN-ALL-TABS-GUIDE-AND-MISSION-HINT  
> **티켓 연계**: #TASK-ES-102  
> **작성 일시**: 2026-09-15  
> **작성자**: Antigravity AI Engine  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. 개요 및 목적
- **목표**: 홈, 목표, 일정, 소통, 설정 5대 탭에 기록탭과 동일한 `[💡 이 페이지 활용법 보기]` 버튼을 마운트하고 탭별 특화 가이드 모달을 제공하며, 홈탭의 `오늘의 미션` 옆에 `'할일이 당장 안떠오르면 활용하세요'` 힌트를 탑재한다.
- **제약 사항**:
  - 헌법 제18조 `index.html` 22,196줄 불변 준수 (순증가 0줄 엄수).
  - 대용량 가이드 데이터 및 모달 로직은 `js/tab-guides.js` 모듈로 분리하여 `index.html`에 스크립트 태그만 연결.

---

## 2. 세부 구현 계획

### 2-1. `js/tab-guides.js` 신규 생성
- 5대 탭별 가이드 콘텐츠 객체 정의:
  1. `home`: 3대 퀘스트, 한 줄 체크인, AI 3단 피드백, 오늘의 미션 활용
  2. `goals`: 마일스톤 분할, D-day 달성률, 공동 목표 크루
  3. `calendar`: 주간/월간 일정, 시간블록, 구글 캘린더 연동, 참고자료 첨부
  4. `comm`: 동류 목표 피드, 응원 스탬프, 마니또, 클린 가이드라인(신고/차단)
  5. `settings`: 100% 데이터 주권(백업/복원), 아바타 커스텀, 푸시 알림, 프라이버시
- 공통 렌더러 함수 `window.showTabUsageGuide(tabKey)` 구현:
  - `window.openModal({ title: '...', body: html, okText: '확인' })` 또는 자체 모달 마운트.

### 2-2. `index.html` 수정 계획
1. **스크립트 태그 마운트**:
   - 기존 스크립트 로드 영역(예: L820 부근)에 `<script src="js/tab-guides.js"></script>` 추가.
2. **헤더 버튼 마운트**:
   - 홈탭: `<h2 class="home-greet"...>` 옆
   - 목표탭: `<div class="goal-head-l">` 내부
   - 일정탭: `<div class="screen-head-l">` 내부
   - 소통탭: `<div class="screen-head">` 내부
   - 설정탭: `<h2 class="s-title">설정</h2>` 옆
3. **오늘의 미션 힌트 추가**:
   - `renderTodayMissionCard` 함수(L9314 부근):
     `'<div style="display:flex;align-items:center;gap:6px;"><div class="ct-label" style="margin:0;">오늘의 미션</div><span style="font-size:11px;color:var(--brand);background:rgba(99,102,241,0.08);padding:1px 6px;border-radius:6px;font-weight:600;">할일이 당장 안떠오르면 활용하세요</span></div>'`
4. **줄 수 균형 조정**:
   - 추가된 줄 수만큼 중복 주석이나 빈 줄을 정리하여 **정확히 22,196줄 유지**.

---

## 3. 검증 계획 (Verification Plan)
1. **단위 테스트**: `scripts/smoke-test.js`에 각 탭별 가이드 버튼 및 미션 힌트 검증 추가, `npm test` 100% PASS 확인.
2. **줄 수 확인**: `index.html` 22,196줄 불변 확인.
3. **실물 CDP 스크린샷 캡처**:
   - 홈탭 미션 힌트 및 가이드 버튼
   - 각 탭별 가이드 모달 팝업 실제 표출 확인.
4. **로컬 main 병합**: 헌법 제14조에 따라 병합 후 다음 과업(신고/차단/푸시) 진행.
