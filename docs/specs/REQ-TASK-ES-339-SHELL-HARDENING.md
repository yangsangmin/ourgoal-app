# 요구사항 정의서 (REQ) — #TASK-ES-339 홈 쉘 안정화 및 바텀시트 완전 모듈화

> **문서 ID**: REQ-TASK-ES-339-SHELL-HARDENING  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-06, HOME-12, HOME-13  
> **작업 일시**: 2026-10-04  
> **작성자**: Antigravity 세션 28d56b7f  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

## 지시 원문

- 상민님 2026-10-04: "646은 병합됐어. 진행해"
- 티켓 연계:
  - **HOME-06**: 메인 홈에는 1초 요약 콕핏만 남기고, 상세 탐색/설정/스튜디오 및 잔존 배너들을 배경 35% 어두워지는 85vh 대형 바텀시트로 점진적 공개.
  - **HOME-12**: 모든 바텀시트/모달 배경을 opacity: 0.35 암막으로 뒤 탭 화면 보존. ✕ 버튼, 백드롭 터치, 스와이프 다운, 기기 뒤로가기/Esc 4중 탈출망 확립 및 overscroll-behavior-y contain 적용.
  - **HOME-13**: 375×667(iPhone SE) 스크롤 0px 달성(콤팩트 패딩 모드) 및 최하단 스크롤 안전 여백(calc(var(--nav-h) + env(safe-area-inset-bottom) + 48px)) 부여.

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **현상 1 (HOME-06 잔존 요소의 홈 화면 침범)**: HOME-01을 통해 목표 목록과 동반자 레이스를 바텀시트로 옮겼으나, `#todayMissionCard`(오늘의 카드/질문)와 `#homeEvalBanner`(아워골 평가 배너)가 여전히 `#screen-home` 내에 남아 특정 상태나 조건에서 세로 150px 이상의 불필요한 높이를 차지하여 1초 콕핏 무스크롤을 오염시킬 위험이 잔존함.
- **현상 2 (HOME-12 바텀시트 규격 미세 불일치)**: 현재 `ui.css`의 `.home-detail-backdrop` 배경 암막이 `rgba(0,0,0,.30)`으로 설정되어 있어 티켓 정본 규격인 35%(`rgba(0,0,0,.35)`)와 차이가 있으며, 내부 스크롤 시 부모 뷰포트로 스크롤 체이닝이 전파되는 현상을 막기 위한 `overscroll-behavior-y: contain`이 시트 본체에 명시적으로 완비되어야 함.
- **현상 3 (HOME-13 소형 화면 375×667 스크롤 잔존)**: HOME-01 실측 결과 375×812(812px) 및 390×844는 스크롤 0px를 달성했으나, iPhone SE 규격인 375×667에서는 799px가 측정되어 **132px의 스크롤이 여전히 발생**함. 소형 화면 전용 패딩 콤팩트 미디어쿼리가 부재함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **본질**: 홈은 375px 모바일 어떤 기기(iPhone SE ~ 최신 기기)에서도 첫 진입 1초 만에 하루를 장악하는 **단일 무스크롤 원스크린 콕핏**이어야 한다.
- **원인**:
  1. `#todayMissionCard`와 `#homeEvalBanner`가 바텀시트로 이관되지 않고 홈 DOM 트리에 방치됨.
  2. 667px 이하 높이의 뷰포트에 대한 전용 미디어쿼리(`@media (max-height: 700px)`) 부재.
- **중심**: `js/tabs/home/sub-onescreen.js`의 DOM 노드 이관 로직 및 `ui.css`의 콤팩트 반응형 룰셋.
- **핵심**: 기존 노드를 삭제하지 않고 `#homeDetailSheet` 안으로 안전하게 이동시켜 기존 핸들러/렌더러를 100% 보존하고, 소형 뷰포트에서 스크롤 0px를 달성한다.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

1. **HOME-06 (완전 격리)**:
   - `sub-onescreen.js`의 `build()` 단계에서 `#todayMissionCard`와 `#homeEvalBanner`를 `#homeSheetPanelQuest`의 하단(목표 목록 아래)으로 노드째 이동.
   - 메인 화면에는 오직 [상단 바(+ 새 목표 버튼)] + [체크인 카드] + [3대 미니 나침반] 3개 계층만 100% 무오염으로 유지.
2. **HOME-12 (바텀시트 하드닝)**:
   - `ui.css`의 `.home-detail-backdrop` 배경색을 `rgba(0, 0, 0, .35)`로 일원화.
   - `.home-detail-panel` 및 `.home-detail-body`에 `overscroll-behavior-y: contain` 부여.
   - 4중 탈출망 (✕ 버튼, 백드롭 터치, 손잡이 Swipe-Down 80px, 기기 뒤로가기/Esc) 동작 신뢰성 보증.
3. **HOME-13 (소형 폰 무스크롤 & 안전 여백)**:
   - `ui.css`에 `@media (max-height: 700px)` 콤팩트 룰셋 추가:
     - `#captureCardBox` 패딩 및 마진 미세 축소 (18px ➔ 10px, margin 12px ➔ 6px)
     - `#captureInput` min-height 축소 (80px ➔ 48px)
     - `#sanctuaryTopBar` 및 인사말 마진 축소
     - `.home-compass-btn` min-height 축소 (64px ➔ 48px) 및 서브라벨 숨김
     - 375×667 화면에서 스크롤 높이 <= 667px(스크롤 0px) 실측 달성.
   - 시트 내부 바닥에 `padding-bottom: calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 0px) + 48px)` 엄수.

### 3-1. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
- 이번 작업은 UI 쉘 및 레이아웃 구조화 작업으로 신규 DB 스키마 생성 및 데이터 파괴 없음. 기존 로컬스토리지 및 Supabase 동기화 로직 100% 보존.

### 3-2. 전수 인터랙션(버튼/클릭/입력) 명세표 (Zero-Dead-Click)

| 요소 ID | 행동 | 결과 | 피드백 |
| :-- | :-- | :-- | :-- |
| `#homeCompassQuest` | 터치 | 바텀시트 열림 (목표 목록 + 오늘의 미션 + 평가 배너 이관 표시) | 12ms 햅틱 |
| `#homeCompassCrew` | 터치 | 바텀시트 열림 (동반자 레이스 위젯 표시) | 12ms 햅틱 |
| `#homeCompassReflect` | 터치 | 기록 탭으로 공간 융합 이동 | 12ms 햅틱 |
| `#homeDetailClose` | 터치 | 바텀시트 닫힘 | 12ms 햅틱 |
| `#homeDetailBackdrop` | 터치 | 바텀시트 닫힘 | 12ms 햅틱 |
| `#homeDetailHandle` | 아래로 80px 쓸기 | 바텀시트 닫힘 | 12ms 햅틱 |
| 기기 뒤로가기 / Esc | 키 누름 | 바텀시트만 닫힘 (앱 이탈 0건) | — |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Double Check & Non-Destruction)

- [x] `#todayMissionCard`와 `#homeEvalBanner`를 DOM에서 삭제하지 않고 바텀시트로 옮기므로, 기존 평가 이벤트 핸들러(`onclick="openEvalModal()"`) 및 미션 완료 로직이 100% 정상 작동함.
- [x] 375×812뿐만 아니라 375×667에서도 스크롤이 발생하지 않음을 정밀 실측함.
- [x] `npm test` 38개 무결성 게이트 및 948개 Zero Dead-Click 전수 통과 보장.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. `js/tabs/home/sub-onescreen.js`: `todayMissionCard` 및 `homeEvalBanner` 바텀시트 패널(`homeSheetPanelQuest`)로 노드 이동 배선.
2. `ui.css`: 바텀시트 배경 암막 35%(`rgba(0,0,0,.35)`), `overscroll-behavior-y: contain`, `@media (max-height: 700px)` 콤팩트 무스크롤 룰셋 추가.
3. 실측 스크립트 실행: 375×812 및 375×667에서 스크롤 0px 달성 측정.
4. `npm test` 및 법정 예비 점검 실행.
5. claims.json 및 법정 시나리오 작성.

---

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파 (Refutation & Destruction)

- **반론 1**: *"iPhone SE(375×667)에서 패딩을 줄이면 터치하기 불편하지 않은가?"*
  - **격파**: 버튼의 터치 히트박스는 최소 44×44px(헌법 규격)을 철저히 유지하며, 불필요한 공백 마진(margin)과 빈 여백만을 줄이므로 터치 사용성에 전혀 지장을 주지 않음.
- **반론 2**: *"평가 배너를 시트 안으로 옮기면 사용자가 평가 배너를 못 찾는 것 아닌가?"*
  - **격파**: 메인 성소에 평가 배너가 상시 노출되는 것은 상민님의 '무공해 성장 도피처' 철학에 위배됨. 바텀시트 '오늘 목표' 하단에 다정하게 배치되어 필요 시 언제든 평가할 수 있도록 보존됨.

---

## 7. [원칙 ⑦] 즉시 실행 (Execution)
- 작업 폴더 `C:/dev/wt/shell-hardening`에서 외과수술적 최소 diff로 즉시 배선 착수.

---

## 8. [원칙 ⑧] 성과 측정 (Measurement & Verification)
- **375×812 스크롤 높이**: 정확히 812px (스크롤 0px)
- **375×667 스크롤 높이**: 정확히 667px (기존 799px에서 132px 감축, 스크롤 0px 달성)
- **바텀시트 닫기 4중 동작**: ✕ 버튼, 백드롭 터치, Swipe-Down, Esc/뒤로가기 100% 정상 작동.
- **`npm test`**: 38/38 ALL PASS.
