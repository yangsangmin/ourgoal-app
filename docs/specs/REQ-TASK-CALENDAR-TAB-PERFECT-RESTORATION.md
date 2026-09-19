# 요구사항 정의서 (REQ) — 일정 탭 최고 헌법 15대 조문 기반 전면 무결성 복구
# (헌법 버전: 2026.09.19-SUPREME-15-ARTICLES-PHILOSOPHY-INTEGRATED 준수 정본)

> **문서 ID**: `REQ-TASK-CALENDAR-TAB-PERFECT-RESTORATION`  
> **티켓 연계**: `#TASK-CALENDAR-TAB-PERFECT-RESTORATION`  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity AI  
> **진행 상태**: **[6단계: 실서버 프로덕션 배포 완료 — PR #331 머지 a4d07a1, 라이브: https://ourgoal-app.vercel.app]** (상민님 승인 완료)  

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

### 1-1. 상민 대표님 지시 원문
- "일정탭 문제파악해. 헌법 적용해서."

### 1-2. 기저 층위 심층 분석
1. **1층 (표면적 결함 — 시각적 파탄 및 오배선)**:
   - 375px 모바일 뷰포트에서 상단 탭 텍스트 강제 줄바꿈 깨짐(`⏱️ 일간 타임라`/`인`), 날짜 셀 텍스트가 우측 셀을 침범하는 오버플로우 발생.
   - 월간 달력 1~4일 셀 폭이 22px로 찌그러져 44px 터치 규격에 미달.
   - 하단 일간 상세 헤더의 `[+ 일정 추가]` 버튼이 뷰포트 오른쪽 바깥으로 잘려나감.
   - 일반 일정(`custom`)의 구글 캘린더 반영 버튼 클릭 시 아무 반응 없는 Dead-Click 발생.
   - AI 일정 등록 카드가 일정이 아닌 목표(`sendGoalAgentMessage`)를 생성하는 기만적 오배선 발생.
2. **2층 (구조적 결함 — 듀얼레이어 및 은폐 꼼수)**:
   - 기존의 검증된 `#calGrid`, `#calViewToggle`, `.cal-nav-row`를 인라인 `style="display:none;"`으로 통째로 은폐하고, 상위에 성소 대체 뷰를 중첩하는 가짜 듀얼레이어 위헌 구조 방치.
   - `ui.css:7480`에서 `[data-cal-mode="timeline"] #calDayDetail { display: none !important; }` 등 CSS 편의주의적 은폐 룰셋 남발.
   - 주간(Week) 뷰가 완전히 사라져 주간 일정 파악 불가.
   - 타임라인 모드 내에서 어제/내일/오늘로 이동할 수 있는 날짜 이동 컨트롤러 전무.
3. **3층 (시스템/데이터 괴리 — 전파 누락 및 용량 초과 위험)**:
   - 일정 완료 체크(`toggleScheduleDone`) 및 일정 생성/수정 시 4대 뷰(`renderHome`, `renderRecordsScreen`, `renderStatsScreen`) 동시 호출이 누락되어 화면 간 불일치 초래.
   - 배경사진 Base64 DataURL을 `localStorage`에 직접 JSON으로 저장하여 5MB 용량 한도 초과(`QuotaExceededError`) 위험 상존.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

### 2-1. 5대 축 귀속
- **FIX (회귀 결함 복구 및 무결성 보완)** & **E1 (체크인 루프 및 일정 실천)**

### 2-2. 4대 요소 분석
- **[가목] 본질 (Essence)**:
  - 헌법 제3조 제5항(가짜 듀얼레이어 은폐 금지)과 제7조 제8항(시각 조형 무결성), 제15조 제6항(4대 뷰 동시 전파)에 입각하여 일정 탭을 단일하고 완전한 4위 1체 캘린더 인터페이스로 완벽히 복원하는 것.
  - **무공해성**: 2중/3중 중복 버튼 난립과 배너 방해를 걷어내고, 단정하고 평온한 사용자 경험 제공.
  - **RPG식 체감**: 일정 완료 시 홈과 통계에 실시간 경험치/달성도가 즉각 반영되는 효능감 직결.
  - **동류 연대**: 일정 공개 범위 및 팀 목표와의 조화로운 연계 지원.
- **[나목] 원인 (Root Causes)**:
  1. 성소 개편 시 기존 DOM을 은폐하고 대체 뷰를 중첩시킨 듀얼레이어 편의주의.
  2. 375px 모바일 반응형 실측 감사 없이 하드코딩된 여백 및 텍스트 줄바꿈.
  3. 일반 일정과 구글 캘린더 연동 간의 데이터 매핑 누락 및 4대 뷰 렌더러 호출 누락.
- **[다목] 중심 (Core Bottleneck)**:
  - `OurgoalSanctuaryV3` 엔진과 기존 비즈니스 파이프라인의 1:1 시맨틱 통합 및 4대 뷰 전파 배선.
- **[라목] 핵심 (Critical Anchor)**:
  - Zero Dead-Click, Zero Data Loss, Zero Visual Defect, Full State Propagation.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

### 3-1. 하지 말아야 할 것과 해야 할 것
- **하지 말 것**: 기존 일정 데이터 스키마 파괴 금지, 파괴적 `display:none !important` 남용 금지.
- **할 것**:
  1. 모드 바 버튼 줄바꿈 방지 (`white-space: nowrap`) 및 가로 스크롤 안전 배선.
  2. 7열 균등 그리드(`grid-template-columns: repeat(7, 1fr)`)로 날짜 셀 찌그러짐 해소 및 min-height 44px 보장.
  3. 날짜 셀 텍스트 오버플로우 방지 (`max-width: 90%; overflow: hidden; text-overflow: ellipsis`).
  4. 주간(Week) 뷰 복원 및 타임라인 날짜 내비게이션(◀ YYYY-MM-DD ▶ 오늘) 장착.
  5. 일반 일정 구글 캘린더 반영 로직 정상화 및 4대 뷰 동시 전파 배선.
  6. AI 일정 등록 카드를 실제 `customSchedules` 등록 파이프라인으로 직통 배선.
  7. 하단 중복 버튼 정돈 및 뷰포트 이탈 잘림 해결.

### 3-2. 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)
1. **1호 (원격 DB 스키마 명세)**: Supabase `custom_schedules`, `records`, `user_profiles` 100% 호환 유지.
2. **2호 (스마트 스토리지 분기 설계)**: 배경사진 DataURL은 IndexedDB 캐싱 및 localStorage에는 경량 메타데이터 유지.
3. **3호 (4대 뷰 전파 배선도)**: `toggleScheduleDone`, `openCalendarManualEditModal` 저장/삭제 시 `renderCalendarScreen`, `renderHome`, `renderRecordsScreen`, `renderStatsScreen` 동시 호출.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

1. **소형 뷰포트(375px) 엣지 케이스**: 셀 내부에 도트와 텍스트가 공존할 때 높이가 과도하게 늘어나지 않도록 도트와 텍스트 간격을 정밀 조율.
2. **오프라인 및 구글 미연동 상태**: 구글 캘린더 미연동 시 "먼저 설정에서 구글 캘린더를 연결해주세요" 친절한 모달 안내 제공.
3. **데이터 무손실 검증**: 기존 10종 페르소나 데이터 딥이퀄 무손실 100% 유지.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. `ui.css` 수정: 모드 탭 줄바꿈 방지, 7열 균등 그리드, 하단 헤더 flex-wrap, 은폐 셀렉터 정돈.
2. `js/sanctuary-v3-engine.js` 수정: 주간 뷰 복원, 타임라인 날짜 이동 내비게이터 배선, 셀 태그 말줄임표 처리.
3. `index.html` 수정: 4대 뷰 동시 전파, 일반 일정 구글 캘린더 반영, AI 일정 등록 파서 배선, 중복 버튼 정돈.
4. `scripts/smoke-test.js` 테스트 추가 및 `npm test` 전수 통과 확인.
5. Chrome CDP 375px/430px 실측 재촬영 및 5대 시각 감사 PASS 확인.
6. 로컬 main 병합 및 5A 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

1. **SPOF 점검**: 주간 뷰 모드 추가 시 `renderCalendarScreen`이나 기존 스모크 테스트와 충돌할 가능성 점검 ➔ `setCalMode`에 안전 분기 처리.
2. **구글 캘린더 토큰 점검**: 일반 일정을 구글 캘린더로 내보낼 때 `getGoogleAccessToken()` 실패 시 안전한 토스트 피드백 확인.
3. **절차 수정사항**: AI 일정 등록의 경우 목표 에이전트와 분리하여 자연어 날짜/시간 파서(`parseNaturalScheduleText`)를 순수 vanilla JS로 프론트에서 안전하게 처리하여 `customSchedules`에 즉각 적재하도록 절차 수정.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

1. 375px 모바일 뷰포트에서 텍스트 오버플로우 0건, 버튼 잘림 0건 달성.
2. 날짜 셀 7열 균등 분할 및 최소 터치 규격 확보.
3. 일반 일정 구글 반영 버튼 클릭 시 정상 캘린더 이벤트 전송 확인.
4. 일정 체크 토글 시 홈 탭과 통계 탭 동시 갱신 실측 확인.
5. `npm test` 263+ 스모크 테스트 및 무결성 게이트 100% ALL PASS.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **블로커 시나리오**: 기존 스모크 테스트 중 `#calGrid`의 셀 수(42개)를 검사하는 정적 단언문이 있을 경우.
- **대응 및 재검증 트리거**: `renderCalendarScreen`이 성소 월간 뷰와 함께 기존 `#calGrid`의 데이터 모델을 온전히 유지하도록 동기화 배선하고, 테스트 실패 시 [원칙 ③]과 [원칙 ⑤]로 되돌아가 DOM 슬롯 바인딩을 재검증한다.
