# 구현 계획서 (PLAN) — #TASK-ES-340 홈 코어 인터랙션 4위 1체 배선

> **문서 ID**: PLAN-TASK-ES-340-CORE-INTERACTION  
> **티켓 연계**: 노션 「아워골 UI/UX 대개편 작업 티켓 DB」 HOME-02, HOME-03, HOME-04, HOME-05, HOME-11  
> **작업 일시**: 2026-10-04  
> **작성자**: Antigravity 세션 28d56b7f  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

## 1. 개요 및 Diff Budget

- **목표**: 80px 중앙 아바타 + breathing pulse + EXP/말풍선 + 깨끗한 빈 체크인 + 가이드 칩 + 3대 스마트 칩 + 접힘 듀얼 슬라이더 + 러닝메이트 UX 라이팅 4위 1체 완성.
- **예상 Diff Budget**:
  - `ui.css`: +80줄 내외 (아바타 펄스, 말풍선, 칩 및 슬라이더 아코디언 스타일)
  - `js/tabs/home/sub-onescreen.js`: +50줄 내외 (80px 아바타 카드 마운트 및 스마트 칩 배선, 총 줄 수 320줄 이하로 800줄 상한선 엄수)
  - `index.html`: +30줄 / -15줄 (마크업 정돈 및 러닝메이트 라이팅 교체)
  - `docs/rules/TICKETS.md`: +1줄

## 2. 4위 1체 배선 표 (Zero-Dead-Click 보증)

| 요소 식별자 | 1. 마크업 (DOM) | 2. 리스너 (Event) | 3. 로직 (Logic) | 4. 피드백 (Visual/Haptic) |
| :-- | :-- | :-- | :-- | :-- |
| `#homeHeroAvatar` | `.home-hero-avatar-card` 80px 아바타 | `click` | `openAvatarModal()` 호출 | `scale(0.95)` + 15ms 햅틱 |
| `#smartChipExercise` | `.btn-smart-chip` [🏃 운동] | `click` | 인풋에 [운동] 태그 바인딩 | 파란 활성화 테두리 + 10ms 햅틱 |
| `#smartChipReading` | `.btn-smart-chip` [📚 독서] | `click` | 인풋에 [독서] 태그 바인딩 | 파란 활성화 테두리 + 10ms 햅틱 |
| `#smartChipMental` | `.btn-smart-chip` [🧘 멘탈] | `click` | 인풋에 [멘탈] 태그 바인딩 | 파란 활성화 테두리 + 10ms 햅틱 |
| `#dimensionAccordion` | `<details class="dimension-accordion">` | `toggle` | 슬라이더 2줄 노출/접힘 | 8ms 햅틱 + 펼침/접힘 화살표 회전 |
| `#sliderEnergy` | `<input type="range" id="sliderEnergy">` | `input` | `valEnergy.textContent` 갱신 | 8ms 햅틱 + 퍼센트 실시간 표시 |
| `#sliderFocus` | `<input type="range" id="sliderFocus">` | `input` | `valFocus.textContent` 갱신 | 8ms 햅틱 + 퍼센트 실시간 표시 |
| `#captureSave` | `button#captureSave` | `click` | `saveCheckinLog()` 및 EXP 갱신 | Confetti 폭발 + 20ms 햅틱 + 토스트 |

## 3. 세부 단계별 구현 내역

1. **Step 1: CSS 스타일 정의 (`ui.css`)**
   - `@keyframes avatarPulseBreathing`: 3초 주기 호흡 애니메이션 (`scale(1)` ➔ `scale(1.04)` ➔ `scale(1)`)
   - `.home-hero-avatar-card`: 중앙 정렬, 80px 아바타 프레임, 다이나믹 말풍선, EXP 바
   - `.dimension-accordion`: 기본 접힘 상태에서 0px 높이, 펼치면 부드러운 슬라이드
   - `.smart-recommend-chips`: 가로 스크롤/인라인 태그 칩 스타일
   - `.home-running-mate-text`: `word-break: keep-all` 및 다정한 감성 폰트

2. **Step 2: JS 소블록 배선 (`js/tabs/home/sub-onescreen.js`)**
   - `buildHeroAvatar(sanctuaryTopBar)`: 상단 바 아래 중앙 80px 아바타 카드 빌드
   - 스마트 칩 3종 클릭 리스너 및 인풋 바인딩
   - 아바타 클릭 시 15ms 햅틱 및 모달 오픈

3. **Step 3: HTML 렌더러 정돈 (`index.html`)**
   - `renderQuickCheckinGuideChips()` 활성화
   - `initDimensionSliders()` 접힘 아코디언과 연동
   - UI 라벨들을 러닝메이트 대화체로 전면 갱신

4. **Step 4: 로컬 실측 및 Court 검증**
   - 375×812 및 375×667에서 스크롤 0px 및 아바타 80px 렌더링 확인
   - `npm test` 38/38 통과 확인
   - claims.json 작성 및 법정 시나리오 실행
