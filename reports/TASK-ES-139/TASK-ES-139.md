# [작업 결과 보고서] #TASK-ES-139

> **과제 ID**: #TASK-ES-139  
> **과제명**: [UI/UX] 탭바 FAB 삭제 및 홈탭 7대 결함 일괄 정상화 (Sprint 13)  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Core Engine  

---

## 1. 개요
상민님의 지시에 따라 홈 탭 콕핏과 하단 네비게이션에 존재하던 7대 결함을 일괄 정상화하였습니다:
1. 하단 탭배너 중간에 있는 `+` (FAB) 버튼 완전 삭제 및 6개 탭(홈, 목표, 일정, 기록, 소통, 설정) 균등 배치(각 59.3px).
2. 홈 탭 상단 어제/오늘/내일 날짜 전환 칩 버튼(`homeDateNav`) 및 관련 기능 완전 소탕.
3. 홈 탭 아바타 창에서 아바타 안 보이는 문제 해결 (유저 페르소나 직통 표출) 및 아바타 창/레벨 뱃지 내부 새싹(`🌱`) 오버레이 완전 제거.
4. 커닝페이퍼 설명 및 칩 버튼들(`quickCheckinChips`) 완전 삭제하여 3초 체크인 입력창 수직 범위 대폭 확보.
5. 신체 컨디션/에너지 슬라이더 창 높이를 50% 슬림화(77px)하고 요소 간격 축소.
6. 홈 탭 내 중복 히트맵 카드(`homeGrassSummaryCard`) 완전 삭제 (기록 탭의 연간 365일 히트맵은 100% 무손실 보존).
7. 홈 탭 레이스 창(`crewPacingWidget`)의 유치한 디자인(강한 붉은색, 만화풍 카피 등) 탈피 -> 에메랄드/시안 그라디언트 기반 '⚡ 페이스메이커 라이브' 고품격 모던 위젯으로 전면 개편.

---

## 2. 세부 구현 내역
1. `index.html`:
   - 하단 탭바 `#bottomNavFab` 제거 및 6개 탭 균등 배치 확립.
   - `#homeDateNav`, `#quickCheckinChips`, `#homeGrassSummaryCard` 인라인 은폐 및 렌더러 안전 No-op 처리.
   - `#crewPacingWidget` 마크업 및 `applyCrewPacingUI()` 함수를 고품격 모던 '⚡ 페이스메이커 라이브' 위젯으로 개편.
2. `ui.css`:
   - `.navbtn-fab`: `display: none !important;` 방화벽 추가.
   - `.checkin-dimension-sliders`: 높이, 패딩, 마진, 갭 50% 슬림화 (`padding: 5px 8px`, `gap: 3px`, range 높이 18px).
   - `#homeGrassSummaryCard`, `.quick-checkin-chips`, `.home-date-nav` 전역 은폐 방화벽 확립.
3. `js/avatar-system.js`:
   - `renderAvatarHtml()`: `profile.avatar` 페르소나 우선 배선 및 기본 페르소나(`🦁`) 폴백.
   - `wrapAvatarRankWings()`: `tid === 'sprout'`일 때 `🌱` 뱃지 및 머리 위 새싹 SVG 생성 완전 차단.
   - `getRankThemeInfo()`: `tid === 'sprout'`일 때 `🌱` 아이콘 접두 차단.

---

## 3. 검증 지표
- 단위 테스트: `npm test` 38개 integrity gate + 440개 smoke test 100% 통과.
- 제로 데드클릭: 944개 버튼 전수 배선 통과.
- Shipyard 모듈러 테스트: 5/5 전수 통과.
- Headless Chrome CDP 모바일 390px 뷰포트 실측 (`scratch/verify_es139_cdp.js`):
  - `isFabHidden`: true (하단 네비 FAB 완전 소탕)
  - 6개 탭 너비: 각 59.3px 균등 배치
  - `isDateNavHidden`: true (날짜 칩 완전 소탕)
  - `isChipsHidden`: true (커닝페이퍼 칩 완전 소탕)
  - `isGrassHidden`: true (홈 탭 히트맵 카드 완전 소탕)
  - `slidersHeight`: 77.625px (50% 슬림화 달성)
  - `levelBadgeFound`: true (아바타 정상 표출)
  - `hasSproutOverlay`: false (새싹 오버레이 0건)
  - `pacingWidgetFound`: true ('⚡ 첫 완주 페이스' 모던 위젯 활성화)
  - `docScrollWidth`: 390px (가로 스크롤 넘침 0px).
- 실측 스크린샷: `reports/TASK-ES-139/step3_es139_home_clean_verified.png`
