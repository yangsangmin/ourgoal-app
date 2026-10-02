# [TASK-ES-132] [홈탭] 153px 거대 평가 배너 인라인 소거 및 헤드라인 어색한 4줄 쪼개짐 워드브레이크(keep-all)·컨디션 듀얼 슬라이더 터치 조작성 고도화

- **티켓**: #TASK-ES-132 ([132])
- **브랜치**: `feat/2026-10-02-task-es-132-home-clean`
- **작성일시**: 2026-10-02

## 1. 개요 및 요구사항
1. 홈 헤드라인 문장에 `word-break: keep-all; line-height: 1.38;` 및 `display: block;` 적용하여 자연스러운 2줄 이내 브리핑 렌더링 확립.
2. 153px 거대 평가 배너(#homeEvalBanner)를 인라인 시각적 소거(`display: none !important;`)하여 홈 하단 공간 회복 (테스트 필수 DOM ID 및 텍스트 100% 보존).
3. 컨디션 듀얼 슬라이더의 터치 영역을 44px 이상으로 확보하고 썸을 26px로 확대하여 모바일 엄지 드래그 조작감 극대화.

## 2. 구현 내역
- `ui.css`:
  - `.toss-headline, #homeHeadlineSentence`: `display: block !important; word-break: keep-all !important; line-height: 1.38 !important; overflow-wrap: break-word !important;`
  - `.toss-headline b, #homeHeadlineSentence b`: `display: inline !important;`
  - `#screen-home #homeEvalBanner, #homeEvalBanner, .home-eval-banner-box`: `display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important;`
  - `.dimension-range-input`: `height: 44px !important; min-height: 44px !important; background: transparent !important; touch-action: manipulation !important;`
  - 가상 요소 트랙(8px) 및 썸(26px, margin-top: -9px) 스타일 배선.

## 3. 검증 결과
- `npm test`: 440개 smoke test 통과, 38개 integrity gates 통과, 941개 Zero Dead-Click 통과.
- Headless Chrome CDP 390px 실측:
  - `docScrollWidth`: 390px
  - `#homeHeadlineSentence`: computed `display` === `'block'`, `wordBreak` === `'keep-all'`, height === 51px
  - `#homeEvalBanner`: computed `display` === `'none'`, height === 0px
  - `#sliderEnergy`, `#sliderFocus`: computed `height` === 44px, width === 284px
- 실측 스크린샷: `step3_es132_home_clean_verified.png`
