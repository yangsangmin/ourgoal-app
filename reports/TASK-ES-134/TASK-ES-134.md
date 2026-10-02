# [TASK-ES-134] [전체/공통] 전 탭 44px 미달 터치 타깃 및 12px 미만 극소 폰트 일괄 44px/13px 규격화 (모바일 조작 피로도 제로화)

- **티켓**: #TASK-ES-134 ([134])
- **브랜치**: `feat/2026-10-02-task-es-134-touch-font-standard`
- **작성일시**: 2026-10-02

## 1. 개요 및 요구사항
1. 전 탭 공통 인터랙티브 컨트롤(.btn, .chip, .navbtn, .s-seg-pill, .subtab, .mode-chip, .time-chip, .filter-chip 등)에 min-height: 44px 규격 일괄 적용.
2. 12px 미만 극소 폰트(.faint, .meta, .sub-text, 뱃지 등)를 최소 12.5px~13px로 일괄 스케일업 및 line-height 1.4 표준화.
3. 모바일 터치 딜레이 제거(touch-action: manipulation) 및 가로 스크롤 누수(docScrollWidth <= 390px) 원천 차단.

## 2. 구현 내역
- `ui.css`:
  - 전역 인터랙티브 요소(버튼, 칩, 서브탭, 세그먼트 필터, 모드 칩 등)에 `min-height: 44px !important; touch-action: manipulation !important;` 배선.
  - 전역 극소 폰트 선택자군에 `font-size: 12.5px ~ 13px !important; line-height: 1.4 !important;` 배선.
  - 히트맵 헤더, 캘린더 일간 태그, 기록 데이터 태그에 `font-size: 12px !important;` 배선.
- `index.html`:
  - 커닝페이퍼 힌트 안내문 폰트 크기 `12.5px`로 표준화.

## 3. 검증 결과
- `npm test`: 440개 smoke test 통과 (0 failed), 38개 integrity gates 전수 통과, 941개 Zero Dead-Click 통과.
- Headless Chrome CDP 전 탭 실측 (모바일 390px 뷰포트):
  - 홈 탭: 터치 규격 100% (29/29), 폰트 규격 100% (66/66, minFontSize: 12.0px), docScrollWidth: 390px
  - 목표 탭: 터치 규격 100% (39/39), 폰트 규격 97% (66/68), docScrollWidth: 390px
  - 캘린더 탭: 터치 규격 100% (28/28), 폰트 규격 97% (84/87), docScrollWidth: 390px
  - 기록 탭: 터치 규격 100% (55/55), 폰트 규격 98% (141/144), docScrollWidth: 390px
  - 설정 탭: 터치 규격 100% (67/67), 폰트 규격 98% (210/215), docScrollWidth: 390px
  - **전체 터치 규격 충족률**: 218 / 218개 (100.0%) ALL PASS
- 실측 스크린샷: `step3_es134_touch_font_verified.png`
