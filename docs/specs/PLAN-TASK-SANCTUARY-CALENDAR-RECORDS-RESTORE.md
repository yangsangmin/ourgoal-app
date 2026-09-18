# 엔지니어링 작업계획서 (PLAN) — 성소 UI 일정 및 기록 탭 무결성 복원 및 4위 1체 배선

> **문서 ID**: PLAN-TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE  
> **요구사항 연계**: [REQ-TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE.md)  
> **티켓 연계**: #TASK-SANCTUARY-CALENDAR-RECORDS-RESTORE  
> **작성 일시**: 2026-09-18  
> **작성자**: Antigravity AI  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 포커스 성소(Focus Sanctuary V4) 디자인을 100% 보존하면서, `ui.css`의 파괴적 은폐를 걷어내고, `sanctuary-v3-engine.js`의 가짜 토스트/미정의 함수를 실제 캘린더 엔진(`calShift`, `openCalendarManualEditModal`, `openCalendarDayEditHubModal`, `toggleScheduleDone`) 및 기록 세그먼트 엔진(`setRecordsSegment`)과 4위 1체로 직결함.
- **영향 받는 파일 목록 전수**:
  - `ui.css`: `#calGrid`, `#calDayDetail`, `#calAgentCard`, `.cal-nav-row`, `.cal-sub-guide`, `#recSegmentBar` 등의 파괴적 `display: none !important;` 정밀 해제 및 성소 스타일화.
  - `js/sanctuary-v3-engine.js`: 월 이동, 일자 선택, 일정 추가, 타임라인 체크, 히트맵 필터, 위클리 리캡 Canvas 이미지 다운로드, 기록 세그먼트 5종 연동.
  - `index.html`: `window.openCalendarManualEditModal`, `window.openCalendarDayEditHubModal`, `window.calShift` 등 전역 노출 보증 및 성소 캘린더 퀵바 연동.
  - `sw.js`: PWA 캐시 무효화(`CACHE_NAME` 버전 갱신 - 헌법 제14조 3항).

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 성소 UI 컴포넌트(`sanctuaryCalendarView`, `sanctuaryRecordsView`)를 고립된 껍데기 뷰에서 '기존 코어 비즈니스 로직을 호출하는 정식 인터페이스'로 승격시켜 4위 1체 결합 완성.
- **[원인] (Technical Causes)**:
  - 성소 뷰가 생성될 때 기존 DOM을 숨겨두고 자체 뷰 안에서는 실제 모달 트리거가 배선되지 않아 사용자 인터랙션이 가짜 토스트나 무반응으로 끊김.
- **[중심 배선] (Core Wire & State)**:
  - `state.calSelectedDate`, `state.calDate`, `state.calView`: 성소 달력과 전역 캘린더 상태의 양방향 동기화.
  - `state.recordsSegment`: 성소 기록 탭 모드(`heatmap`, `feed`, `stats`, `archive`, `recap`)와 `setRecordsSegment`의 1:1 결합.
  - `calendarItemsByDate()`: 24시간 타임라인 및 월간 캘린더에 실시간 투영.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 4대 뷰 동시 전파(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`, `renderCalendarScreen`) 및 원격 Supabase DB 쓰기 보장.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[성소 캘린더 날짜/버튼 클릭] -> [실제 모달/핸들러 호출] -> [유효성 검증 & Local State 갱신] -> [원격 DB 비동기 영속화] -> [4대 뷰 실시간 동시 전파] -> [성공 토스트 & 시각적 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `ui.css` | 파괴적 `display: none !important` 제거 및 성소 캘린더/통계 레이아웃 조화 | +50줄 | -20줄 | +30줄 | CSS 토큰 준수 |
| `js/sanctuary-v3-engine.js` | 실제 모달 호출, 월 이동, 타임라인 완료 토글, 리캡 Canvas 다운로드, 5대 모드 배선 | +120줄 | -30줄 | +90줄 | 핵심 로직 직결 |
| `index.html` | 전역 헬퍼 바인딩 보장 및 퀵바 슬롯 무결성 확보 | +15줄 | -5줄 | +10줄 | 외과수술적 diff |
| `sw.js` | 서비스워커 캐시 무효화 버전 갱신 | +2줄 | -2줄 | 0줄 | 캐시 방화벽 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 접근성 레이블, 올바른 데이터 속성(`data-sgoalid`, `data-caldate`, `data-timeslot`), 시맨틱 버튼.
2. **이벤트 리스너 (Listener)**: 클릭 이벤트 전파 차단(`stopPropagation`) 및 키보드 접근성 유지.
3. **비즈니스 로직 (Logic)**: 실제 DB 및 상태 연동 함수 호출 (빈 stub, // TODO 일절 금지).
4. **피드백 & 예외처리 (Feedback)**: 햅틱 진동, 작업 완료 토스트, 4대 뷰 동시 즉각 갱신.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가? (성소 다크 에메랄드 테마 디자인 100% 보존)
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가? (필요한 선택자 및 함수 블록만 정밀 수정)
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가? (Zero Data Loss)
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가? (최적화된 탭별 조건부 렌더링 유지)

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (UI.CSS 외과수술적 정비)**:
   - `ui.css` 내 `#calGrid`, `#calDayDetail`, `#calAgentCard`, `.cal-nav-row`, `.cal-sub-guide`, `#recSegmentBar` 숨김 규칙 제거.
   - 성소 테마 하에서 해당 슬롯들이 성소 디자인 카드와 자연스럽게 결합되도록 글래스모피즘 래핑 스타일 적용.
2. **Step 2 (일정 탭 실기능 100% 직결)**:
   - `sanctuary-v3-engine.js`의 월 이동 화살표를 `window.calShift(-1)`, `window.calShift(1)`로 교체.
   - 성소 날짜 셀 클릭 시 `state.calSelectedDate` 갱신 및 `openCalendarDayEditHubModal(dateKey)` 트리거.
   - `+ 일정 추가` 및 `+ 새 일정`을 `openCalendarManualEditModal`로 1:1 직결.
   - 24시간 타임라인에서 목표/마일스톤/gcal 일정을 집계하고 `toggleScheduleDone`을 호출하여 4대 뷰 동시 전파.
3. **Step 3 (기록/통계 탭 5대 서브모드 완성)**:
   - `sanctuary-v3-engine.js`의 기록 모드 내비게이션에 `[성취 통계]` 및 `[보관함]` 서브모드 추가.
   - 모드 전환 시 `setRecordsSegment(seg)`를 호출하여 `#recViewStats` 및 `#recViewArchive`를 부드럽게 노출.
   - 365일 히트맵 기간 필터(`s-seg-pill`) 클릭 이벤트 배선.
   - 위클리 리캡 `downloadRecapImage`에 HTML5 Canvas 기반 실제 PNG 생성/다운로드 로직 탑재.
4. **Step 4 (헤더 액션 & PWA 캐시 갱신)**:
   - 소통 탭 상단 피드 작성 버튼(`btnCommPostFeed`) 시인성 복원.
   - `sw.js`의 `CACHE_NAME`을 `ourgoal-20260918-sanctuary-restore`로 갱신.
5. **Step 5 (5대 무결성 검증)**:
   - `node scripts/verify-integrity-gate.js` 및 `npm test` 스모크 테스트 실행하여 ALL PASS 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**:
  - 성소 캘린더 ◀, ▶ 클릭, 날짜 셀 클릭, `+ 일정 추가` 클릭, 타임라인 체크박스 클릭, 히트맵 필터 클릭 시 에러 없이 지정된 모달/동작이 100% 실행되는지 검증.
- **시나리오 B (Zero Data Loss)**:
  - 10종 가상 페르소나 데이터 주입 후 게이트키퍼 검증 -> 100% 무손실 딥이퀄 통과.
- **시나리오 C (Zero UX Regression)**:
  - 비-성소 테마(화이트, 블랙 등)로 전환했을 때도 기존 캘린더 및 기록 탭이 정상 작동하는지 확인.
- **시나리오 D (Full State Propagation)**:
  - 성소 타임라인에서 일정 완료 체크 시 홈 탭의 잔디/체크인 카드 및 기록 피드에 즉시 동시 전파되는지 확인.
- **시나리오 E (자동화 게이트 통과)**:
  - `scripts/verify-integrity-gate.js` 정적 방화벽 100% PASS 확인.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1: `ui.css` 정밀 정비
- [ ] Step 2: `js/sanctuary-v3-engine.js` 일정 탭 실기능 100% 직결
- [ ] Step 3: `js/sanctuary-v3-engine.js` 기록/통계 5대 모드 및 Canvas 다운로드 배선
- [ ] Step 4: `index.html` 전역 바인딩 및 `sw.js` PWA 캐시 갱신
- [ ] Step 5: `node scripts/verify-integrity-gate.js` 20/20 ALL PASS 검증
- [ ] Step 6: `npm test` 스모크 테스트 전수 통과 확인
- [ ] Step 7: [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**:
  - `calShift` 호출 후 성소 캘린더 헤더 텍스트와 그리드가 즉시 동기화되지 않을 수 있음.  
    -> *방어책*: `calShift` 실행 직후 `renderSanctuaryCalendar()`를 명시적으로 재호출하도록 배선.
  - 리캡 이미지 다운로드 시 외부 폰트/이미지 CORS 이슈로 Canvas 오염(`tainted canvas`) 위험.  
    -> *방어책*: 순수 벡터 SVG 및 시스템 폰트로 렌더링하고, CORS 방어 옵션(`crossOrigin = "anonymous"`) 적용.
- **롤백 계획 (Rollback Strategy)**:
  - `git checkout main`으로 1초 만에 안전 복귀 가능한 티켓 전용 브랜치 분기 격리 유지.
- **재검증 트리거**:
  - 만약 성소 모드에서 일정 추가 모달이 열리지 않는 경우: [원칙 ⑥ 가정의 타당성]으로 되돌아가 `window.openCalendarManualEditModal` 바인딩 검증.
