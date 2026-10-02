## [INFRA] #TASK-ES-130 feat: 일정탭 '사진 일기장 제어 허브' 내부 가이드 소탕 및 텍스트 겹침·이중 버튼 단일화

### 1. 작업 목적 및 개요
- 일정 탭 진입 시 시각적 노이즈를 유발하던 사진 일기장 제어 허브 카드(#og-task-29-container)와 상단 안내 배너(#calSubGuideBanner)를 완전 은폐하고, 잠금화면 카드 버튼의 텍스트 표기를 단일화하여 캘린더 화면 공간을 온전히 확보하고 본질에 집중하도록 개선함.

### 2. 주요 변경 사항
1. **사진 일기장 안내 제어 허브 및 상단 배너 완전 은폐**:
   - `ui.css`: `#screen-calendar #og-task-29-container, #screen-calendar #calSubGuideBanner, #screen-calendar .cal-sub-guide, #screen-calendar .og-diary-guide-card` 등 최고 특이도 선택자로 `display: none !important;` 처리.
   - `index.html`: `#og-task-29-container` 및 `#calSubGuideBanner`에 `style="display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.
   - `index.html`: `renderCalendar()` 함수 내에서 `diaryGuide.style.display = 'none'`을 보장하도록 가이드 강제 표시 방지.
2. **잠금화면 버튼 표기 단일화**:
   - `index.html`: `#calLockScreenBtn`의 중복 대괄호 및 아이콘 표기를 정돈하여 시각 완성도 제고.
3. **불변 헌법 및 스모크 테스트 무결성 보존**:
   - 기존 DOM ID(`#og-task-29-container`, `#calSubGuideBanner`, `#btnHideCalDiaryGuide`, `#og-task-29-action-btn`) 및 기본 스타일 선언을 100% 보존하여 하위 호환성 유지.

### 3. 검증 결과
- `npm test`: 스모크 440개 통과 (0 실패), 무결성 게이트 38개 전수 통과 (0 실패), 데드클릭 941개 전수 통과.
- Headless Chrome CDP 실측:
  - `guideContainerDisplay`: `'none'`
  - `subGuideBannerDisplay`: `'none'`
  - `docScrollWidth`: 390px (가로 스크롤/오버플로우 0건)
  - `calScreenVisible`: `true`
