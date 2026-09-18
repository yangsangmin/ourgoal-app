# 엔지니어링 작업계획서 (PLAN) — 아워골 포커스 성소 실제 기능 직결 및 시안 1:1 완벽 일치 V4

> **문서 ID**: PLAN-uiux-focus-sanctuary-renewal-V4  
> **요구사항 연계**: [REQ-uiux-focus-sanctuary-renewal](file:///C:/dev/ourgoal-app/docs/specs/REQ-uiux-focus-sanctuary-renewal.md)  
> **상태**: 상민 대표님 승인 완료 ([기존 기능 삭제 금지], [가짜 듀얼레이어/스태시 영구 폐기], [실제 엔진 직결])  
> **작성 일시**: 2026-09-18  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제1조 4항 6호, 제2조 2중 8원칙, 제4조 1항 7호)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 및 지시 원문 요약**:
  - 기존 꼼수(스태시 격리, 하드코딩된 더미 목데이터)를 100% 영구 폐기한다.
  - 기존 실제 데이터 모델(`state.profile.goals`, `calendarItemsByDate()`, `state.profile.records`, `OurgoalTimeTracker`, Supabase DB)을 시안 조형에 직접 1:1 직통 바인딩한다.
  - 8대 화면에 대해 [확정 그래픽 시안 원본]과 [실제 브라우저 실측 캡처]를 1:1 Side-by-Side로 완벽 일치 검증한다.
- **영향 받는 파일 목록 전수**:
  - `index.html`: 스태시 꼼수 전면 철거, 4대 화면 렌더러와 실데이터 직결 배선
  - `ui.css`: 레거시 인라인 스타일 척결 및 시안 1:1 시맨틱 클래스 디자인 시스템 확립
  - `js/sanctuary-v3-engine.js`: 0% 더미 목데이터, 100% 실데이터 직결 조형 렌더러 모듈
  - `scripts/verify-integrity-gate.js`: 20/20 무결성 게이트 유지
  - `scripts/smoke-test.js`: 321/321 스모크 테스트 통과

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**:
  - 겉모습만 시안인 척 뒤에 숨긴 가짜 더미를 완전히 걷어내고, **"실제 살아있는 데이터와 비즈니스 로직이 시안의 혁신적 다크 에메랄드 글래스모피즘 조형 위에서 손실 없이 숨 쉬게 만드는 진짜 실제구현"**이다.
- **[원인] (Technical Root Causes)**:
  - 1) 편의주의적 스태시 격리(`.sanctuary-legacy-stash` / `clip: rect(0,0,0,0)`)로 실제 UI를 화면 밖으로 치워버림.
  - 2) 빠른 프리뷰 완성을 위해 `js/sanctuary-v3-engine.js`에 하드코딩된 문자열 배열과 `toast()` 전용 가짜 버튼을 삽입함.
  - 3) 레거시 인라인 스타일(`style="..."`)의 난립으로 스타일 우선순위 충돌이 발생함.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.goals` & `state.activeGoalId`: 목표 등반 마운틴 트레일 및 마일스톤 상태 직결.
  - `calendarItemsByDate()` & `state.profile.customSchedules`: 월간 캘린더 도트 및 24시간 타임라인 직결.
  - `state.profile.records` & `OurgoalTimeTracker`: 365일 연간 히트맵 및 뽀모도로 타이머 적립 직결.
  - Supabase `feed_posts` & `state.companions`: 28인 러닝메이트 레이더 및 4단계 건강 상호작용 직결.
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 기존 28개 기능 모듈 및 72개 전 버튼의 핸들러를 100% 보존하며, 단 1바이트의 유저 데이터도 초기화하지 않고 `saveProfile()`로 삼중 백업 유지.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

### 3-1. 가짜 목데이터(Mock) 전면 척결 & 실제 엔진 직결 명세
1. **목표 탭 (Mountain Trail)**:
   - `state.profile.goals`에서 활성 목표 로드.
   - 각 마일스톤 노드를 순회 렌더링: 완료(`✓`), 진행중(`⚡`, [기록 입력] 칩 직결), 대기.
   - 클릭 시 `m.status` 토글, `m.tasks` 체크박스 토글, `saveProfile()` 즉시 동기화.
   - `+ 새 목표` -> `promptNewGoal()`, `📖 템플릿백과사전` -> 백과사전 모달, `편집` -> `goalEditToggle`.
   - `⚡ 내 목표에 바로 담기` -> 현재 루틴을 신규 목표로 즉시 복제하여 `state.profile.goals`에 영구 적립.
2. **일정 탭 (Month / Timeline / Timer)**:
   - `calendarItemsByDate()` 실제 일정으로 월간 달력 날짜별 에메랄드 도트 렌더링.
   - 날짜 선택 시 당일 일정 리스트 출력, `+ 일정 추가` -> `openAddScheduleModal()`.
   - 24시간 타임라인: 실제 일정 시각순 정렬 및 체크 완료 토글.
   - 뽀모도로 타이머: `OurgoalTimeTracker`와 직결, 25분 완주 시 `state.profile.records`에 25분 몰입 기록 자동 insert 및 EXP 적립.
3. **기록 탭 (365 Heatmap / Feed / Recap)**:
   - `state.profile.records`의 실제 날짜별 빈도를 집계하여 5단계(lvl-0~4) 에메랄드 발광 셀 매핑.
   - 5단위 세그먼트(오늘/이번주/이번달/올해/전체) 필터링 및 실측 스트릭/누적시간 산출.
   - `⏱️ 지금부터 시간기록` -> `OurgoalTimeTracker.open()`, `+ 새 기록` -> `openAddRecordModal()`.
   - 위클리 리캡: 실측 데이터 기반 9:16 인스타그램 스토리 카드 렌더링 및 다운로드/카카오 공유.
4. **소통 탭 (Radar / Feed / Reactions / DM)**:
   - `state.companions` 및 실시간 유저로 28인 레이더 렌더링, 클릭 시 1:1 글래스모피즘 DM 연결.
   - 피드 4단계 리액션: `[👏 박수]`, `[💡 도움돼요]`, `[🔥 함께해요]`, `[⚡ 1초 이식]` 실제 DB 및 목표 복제 직결.
   - 6대 서브탭(`피드`, `팀`, `동반자`, `DM`, `마니또`, `공유`) 100% 보존.

### 3-2. 레거시 인라인 스타일 척결 및 시안 1:1 신규 마크업 설계
- `index.html` 내부의 난잡한 인라인 `style="..."`을 제거하고 시안 1:1 시맨틱 클래스로 표준화.

### 3-3. 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/sanctuary-v3-engine.js` | 100% 실데이터 직결 조형 렌더러 구현 | +480줄 | -450줄 | +30줄 | 엔진 정규화 |
| `index.html` | 스태시 완전 제거 및 뷰 배선 | +60줄 | -50줄 | +10줄 | 무결성 배선 |
| `ui.css` | 시안 1:1 글래스모피즘 토큰 고도화 | +120줄 | -20줄 | +100줄 | CSS 토큰 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 기능 삭제 금지: 28개 기능 모듈 및 72개 버튼의 핸들러가 단 하나도 누락되지 않았는가?
- [x] 가짜 목데이터 전면 제거: 하드코딩된 더미 문자열 및 toast 전용 가짜 버튼이 0건인가?
- [x] 데이터 무손실: 사용자의 기존 아바타, 목표, 체크인, 세팅값이 100% 보존되는가?
- [x] 타 테마 불파괴: `data-theme="focus-sanctuary"` 외 다른 테마(white, black 등)가 정상 작동하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **1단계 (엔진 실데이터 직결)**: `js/sanctuary-v3-engine.js`를 재작성하여 `state.profile.goals`, `calendarItemsByDate()`, `state.profile.records`를 직접 읽고 수정하도록 전면 교체.
2. **2단계 (마크업 배선 정규화)**: `index.html`에서 스태시 없이 성소 뷰 컨테이너와 기존 기능 뷰가 자연스럽게 테마별로 전환되도록 배선.
3. **3단계 (스타일 무결성 확립)**: `ui.css`의 성소 조형 스타일을 정본 그래픽 시안 20종과 1:1로 미세 조정.
4. **4단계 (테스트 게이트 통과)**: `verify-integrity-gate.js` (20/20) 및 `smoke-test.js` (321/321) 통과.
5. **5단계 (Side-by-Side 시각 검증)**: 8대 화면에 대해 [확정 그래픽 원본] vs [실측 캡처] 대조 리포트 발행.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 및 Side-by-Side 시각 검증 설계
- **무결성 게이트 검증**: `node scripts/verify-integrity-gate.js` 20개 검사 전수 PASS 확인.
- **스모크 테스트 검증**: `node scripts/smoke-test.js` 321개 단언문 전수 PASS 확인.
- **8대 화면 Side-by-Side 시각 대조 검증 매트릭스**:
  1. 홈 상단: `tab1_hero_checkin_1789707471804.jpg` vs `final_live_01_home.png`
  2. 홈 퀘스트: `tab1_quest_grid_1789707487292.jpg` vs `final_live_01_home_scrolled.png`
  3. 목표 마운틴: `og_tab2_goals_roadmap_1789707403907.jpg` vs `final_live_02_goals.png`
  4. 일정 월간: `tab3_cal_month_1789707499041.jpg` vs `final_live_03_calendar.png`
  5. 일정 타임라인: `tab3_day_timeline_1789707512337.jpg` vs `final_live_03_calendar_timeline.png`
  6. 일정 타이머: `tab3_focus_timer_1789707524934.jpg` vs `final_live_03_calendar_timer.png`
  7. 기록 히트맵: `tab4_stats_heatmap_1789707560171.jpg` vs `final_live_04_records.png`
  8. 소통 레이더: `tab5_peer_lounge_1789707591225.jpg` vs `final_live_05_comm.png`

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] `js/sanctuary-v3-engine.js` 실데이터 직결 엔진 작성 완료
- [ ] `index.html` 화면 렌더러 배선 완료
- [ ] `node scripts/verify-integrity-gate.js` 20/20 물리적 통과
- [ ] `node scripts/smoke-test.js` 321/321 물리적 통과
- [ ] CDP 스크린샷 캡처 및 `VISUAL_DIFF_VERIFICATION.md` 발행
- [ ] `node C:/dev/command-center/lib/tri-sync.js check` 100% 동기화 검증

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 블로커 1**: 신규 유저 또는 빈 데이터 상태에서 렌더러 에러 발생 가능성 -> 기본 샘플 루틴 및 빈 상태 가이드 안전망(Fall-safe null guard) 구축.
- **잠재 블로커 2**: 타이머 완료 시 사운드/권한 이슈 -> 브라우저 오디오 컨텍스트 안전 처리 및 EXP 적립 우선 집행.
- **롤백 계획**: 문제 발생 시 git commit 이전 스냅샷으로 무손실 복구하며, 유저 로컬스토리지 삼중 백업 데이터는 즉시 자가치유 복원.
