# 작업계획서 (PLAN) — 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결

> **문서 ID**: PLAN-TASK-ES-135-TEMPLATE-MILESTONE-DDAY  
> **티켓 연계**: #TASK-ES-135 ([135])  
> **작성 일시**: 2026-10-02  
> **작성자**: Antigravity Agent  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 문제 및 목표 재확인
- 목표 탭 상단 및 엠프티 스테이트에 추천 템플릿 백과사전 퀵 카드(`#goalTemplateHeroCard`)를 연계하여 1초 만에 검증된 로드맵을 내 목표로 이식.
- 마일스톤 행에 실시간 D-day 뱃지(`ddayBadge`)를 상시 표출하고, `[📅 일정 설정]` 버튼을 통해 인앱 캘린더(`customSchedules`)와 1초 만에 동기화.

---

## 2. [원칙 ②] 아키텍처 및 핵심 앵커
- **핵심 앵커 함수**:
  - `adoptTemplateAsMyGoal(title, category)`: 템플릿 1초 자동 이식 함수.
  - `formatSchedulePillHtml(item, level, goalId, msId, taskId)`: 일정 설정 버튼 및 D-day/기간 표기 생성기.
  - `applyScheduleUpdate(level, gid, msId, tid, startISO, endISO)`: 캘린더 원장 동기화 및 4대 뷰 원자적 전파.
- **영향 범위**: `index.html`, `ui.css`, `docs/rules/TICKETS.md`.

---

## 3. [원칙 ③] 세부 작업 단계 (Action Plan)

### Step 1: `index.html` 목표 탭 템플릿 퀵 카드 및 마일스톤 D-day 뱃지 고도화
1. `renderPersonalGoalsEmptyGuideHtml()` 상단에 `#goalTemplateHeroCard` 탑재.
2. 목표가 있을 때도 목표 추가 상자(`#goalFastAddBox`) 아래에 컴팩트 템플릿 퀵바 제공.
3. 마일스톤 렌더링 루프에서 `m.dueDate` 기준 `ddayBadge` 계산 및 노출.
4. `formatSchedulePillHtml`에서 미설정 시 `📅 일정 설정`, 설정 시 `📅 D-day/일정`으로 아이콘 및 라벨 강화.

### Step 2: `ui.css` 스타일 및 44px 터치 규격 안착
1. `.goal-template-hero-card`, `.template-quick-card`: 토스식 둥근 카드, 부드러운 배경 및 테두리.
2. `.btn-quick-adopt-goal`: 최소 높이 44px, 모바일 `touch-action: manipulation` 보장.
3. `.schedule-pill-btn`: 가독성 및 44px 히트 타깃 확보.

### Step 3: 선언이 아닌 측정 (Verification)
1. `npm test`: 스모크 440개 + 무결성 게이트 38개 + 941개 Dead-Click 검사 통과.
2. Headless Chrome CDP (`scratch/verify_es135_cdp.js`):
   - 목표 탭 진입 후 `#goalTemplateHeroCard` 및 `.btn-quick-adopt-goal` 실측.
   - 템플릿 이식 후 목표 목록 생성 및 마일스톤 D-day 뱃지 노출 실측.
   - 모바일 390px 뷰포트 `docScrollWidth === 390px` 무결성 실측.
   - 실측 스크린샷 캡처 및 아티팩트 디렉토리 복제.

### Step 4: 4단계 심사 청구 (PR + 법정 Court)
1. `reports/TASK-ES-135/` 생성: `claims.json`, `scenarios/template-milestone-dday.json`, `pr-body.md`, `TASK-ES-135.md`.
2. 커밋 규범 준수: `[INFRA] #TASK-ES-135 feat: 템플릿 백과사전 원클릭 둘러보기/이식 연동 및 마일스톤 D-day 직통 캘린더 연계 UX 완결`.
3. GitHub 푸시 및 PR 생성, 법정(Court) 심사 청구 및 판정서 4줄 확인 후 스쿼시 머지.
4. Tri-Sync [135] 완료 및 [136] 진행중 전환.
