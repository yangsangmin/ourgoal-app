# [작업 결과 보고서] #TASK-ES-130: 일정 탭 '사진 일기장 제어 허브' 내부 가이드 소탕 및 텍스트 겹침·이중 버튼 단일화

> **티켓**: #TASK-ES-130 (P1)  
> **일시**: 2026-10-02  
> **상태**: 4단계 심사 청구 (PR 생성 및 GitHub Court 법정 심사 대기)

---

## 1. 지시 및 문제 배경
- **상민님 지시 원문**: "병합하고 관련 모든 티켓 중단없이 집행해"
- **티켓 원문 ([130])**: "일정 탭 내부에 '사진 일기장 안내 제어 허브'라는 이름의 기능 안내 카드가 화면 중앙을 차지하고 있어 실제 캘린더 일정이 가려짐. 잠금화면용 일정 카드 저장 버튼 등에 중복 아이콘/대괄호가 노출되어 조형적 산만함을 유발함."
- **문제점 실측**:
  1. `#og-task-29-container` 및 `#calSubGuideBanner`가 캘린더 탭 상단 공간을 불필요하게 점유하여 월간/주간 달력과 당일 일정 뷰포트가 협소해짐.
  2. `#calLockScreenBtn` 내부의 `[📱 잠금화면용 일정 카드 저장]` 등 중복 아이콘/브라켓이 시각적 노이즈를 유발함.

---

## 2. 해결 내역
1. **사진 일기장 안내 제어 허브 및 상단 배너 완전 은폐**:
   - `ui.css`: `#screen-calendar #og-task-29-container, #screen-calendar #calSubGuideBanner, #screen-calendar .cal-sub-guide, #screen-calendar .og-diary-guide-card` 등 최고 특이도 선택자로 `display: none !important;` 처리.
   - `index.html`: `#og-task-29-container` 및 `#calSubGuideBanner`에 `style="display:none !important;" aria-hidden="true"` 인라인 방어벽 구축.
   - `index.html`: `renderCalendar()` 함수 내에서 `diaryGuide.style.display = 'none'`을 보장하도록 가이드 강제 표시 방지.
2. **잠금화면 버튼 표기 단일화**:
   - `index.html`: `#calLockScreenBtn`의 중복 대괄호 및 아이콘 표기를 정돈하여 시각 완성도 제고.
3. **불변 헌법 및 스모크 테스트 무결성 보존**:
   - 기존 DOM ID(`#og-task-29-container`, `#calSubGuideBanner`, `#btnHideCalDiaryGuide`, `#og-task-29-action-btn`) 및 기본 스타일 선언을 100% 보존하여 하위 호환성 유지.

---

## 3. 측정 및 검증 증거 (선언이 아닌 측정)
- **스모크 테스트**: 440개 통과 (0개 실패)
- **헌법 무결성 게이트**: 38개 검사 전수 통과 (0개 실패)
- **Zero Dead-Click 검증기**: 941개 전수 핸들러 배선 통과
- **조선소 모듈 아키텍처**: 5개 테스트 100% 통과
- **Headless Chrome CDP 실측**:
  - `guideContainerDisplay`: `'none'`
  - `subGuideBannerDisplay`: `'none'`
  - `docScrollWidth`: 390px (가로 스크롤 0건)
  - `calScreenVisible`: `true`
- **스크린샷**: `step3_es130_calendar_clean_verified.png`
