## 1. 판정서 요약 (Court Verdict Summary)
- **과제 번호**: #TASK-ES-135
- **과제명**: [목표탭/연동] 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결 (지식기반 정체 [80],[87],[106] 결합)
- **연계 티켓**: #TASK-ES-135 ([135])
- **작업 브랜치**: `feat/2026-10-02-task-es-135-template-milestone-dday`

---

## 2. 작업 내용 (Changes Made)
1. **목표 탭 빈 화면 추천 템플릿 백과사전 히어로 카드 탑재 (`index.html`, `js/sanctuary-v3-engine.js`, `ui.css`)**:
   - 신규 가입 유저 및 목표가 없는 상태에서 막막하지 않도록 `#goalTemplateHeroCard` 전면 노출.
   - 인기 3대 템플릿("10km 마라톤 완주", "정보처리기사 실기 합격", "미라클 모닝 30일 루틴")을 배치하고 `.btn-quick-adopt-goal` 터치 한 번으로 1초 만에 내 목표로 즉각 자동 이식.
   - 전체 60선 탐색을 위한 `#btnOpenFullTemplateEncyclopedia` 원클릭 서브탭 직통 전환 연계.
2. **마일스톤 헤더 실시간 D-day 뱃지 산출 및 표출 (`index.html`, `ui.css`)**:
   - 마일스톤 행 렌더링 시 `m.dueDate` 기준 `dDay(m.dueDate)` 동적 계산 배선.
   - `.milestone-dday-badge` 시각 뱃지(12px, font-weight: 700) 상시 노출로 달성 시한 인지력 극대화.
3. **일정 설정 버튼 어포던스 및 인앱 캘린더(`customSchedules`) 1초 직통 동기화 (`index.html`, `ui.css`)**:
   - 미설정 시 `📅 일정 설정`, 설정 시 `📅 D-day/기간`으로 직관적 라벨 및 아이콘 표준화.
   - `adoptTemplateAsMyGoal` 실행 시 마일스톤 시작일/마감일이 `customSchedules` 원장에 즉시 인입되어 캘린더 탭과 4대 뷰에 동시 전파.

---

## 3. 검증 결과 (Verification Results)
- `npm test`: 440개 smoke test 통과 (0 failed), 38개 integrity gates 전수 통과, 945개 Zero Dead-Click 통과, 5개 Shipyard modular tests 전수 통과.
- Headless Chrome CDP 모바일 390px 뷰포트 실측:
  - `heroCardVisible`: true (가로 326px, 세로 392.6px 정상 노출)
  - `adoptBtnsCount`: 6개 퀵 담기 버튼 정상 배선
  - `+ 담기` 클릭 후: `totalGoals: 1`, `goalTitle: '10km 마라톤 완주 로드맵'`, `ddayBadges: ['D-14', 'D-30']`, `firstSchedPillText: '📅 D-30'` 즉각 반영 확인.
  - `docScrollWidth`: 390px (가로 스크롤 누수 제로).
- 실측 스크린샷: `step3_es135_template_dday_verified.png`
