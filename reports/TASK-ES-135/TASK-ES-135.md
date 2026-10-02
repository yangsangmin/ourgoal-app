# #TASK-ES-135 이행 보고서

> **과제 번호**: #TASK-ES-135  
> **과제명**: [목표탭/연동] 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결 (지식기반 정체 [80],[87],[106] 결합)  
> **작성 일시**: 2026-10-02  
> **담당 에이전트**: Antigravity Agent  
> **상태**: 4단계(심사 청구) 진행

---

## 1. 개요 및 목적
목표 탭 빈 화면에서 막막함을 느끼지 않도록 검증된 60대 목표 템플릿의 원클릭 퀵 이식 카드(`#goalTemplateHeroCard`)를 상시 배치하고, 마일스톤에 D-day 뱃지 계산 로직과 직통 캘린더 연계(`customSchedules`)를 완결하여 목표와 일정의 상호작용 체감을 극대화함.

---

## 2. 주요 변경 사항
1. `index.html`:
   - `renderPersonalGoalsEmptyGuideHtml`: 추천 템플릿 퀵 카드(`#goalTemplateHeroCard`) 추가.
   - `adoptTemplateAsMyGoal`: 마일스톤 마감일(D-14, D-30) 자동 세팅 및 `customSchedules` 캘린더 원장 동기화, `dispatchFullViewPropagation` 4대 뷰 원자적 전파.
   - 마일스톤 헤더 렌더링: `ddayBadge` 동적 계산 로직 복원 및 표출.
   - `formatSchedulePillHtml`: 캘린더 아이콘 `📅` 및 상태별 명확한 텍스트 라벨 부여.
2. `js/sanctuary-v3-engine.js`:
   - `sanctuaryGoalsView`의 empty state(`!activeGoal`) 시 `#goalTemplateHeroCard` 즉시 렌더링 연계.
3. `ui.css`:
   - `.goal-template-hero-card`, `.template-quick-card`, `.btn-quick-adopt-goal`, `.milestone-dday-badge`, `.schedule-pill-btn` 44px 터치 타깃 및 시각 디자인 토큰 안착.

---

## 3. 검증 결과
- `npm test`: 스모크 440개 통과, 무결성 게이트 38개 통과, Dead-Click 945개 전수 통과.
- Headless Chrome CDP:
  - 템플릿 히어로 카드 노출: 가로 326px, 세로 392.6px.
  - 1초 자동 이식 실행 시 목표 즉시 생성 및 마일스톤 `D-14`, `D-30` D-day 뱃지 노출 확인.
  - 390px 뷰포트 너비 안정성: `docScrollWidth === 390px`.
  - 실측 스크린샷: `step3_es135_template_dday_verified.png`.
