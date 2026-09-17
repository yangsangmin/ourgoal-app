# 엔지니어링 작업계획서 (PLAN) — 아워골 생각 메모장 4대 과제 통합 패키지 (#TASK-ES-140 ~ #TASK-ES-143)

> **문서 ID**: PLAN-NOTEPAD-BATCH-ES140-ES143  
> **요구사항 연계**: [REQ-NOTEPAD-BATCH-ES140-ES143](file:///C:/dev/ourgoal-app/docs/specs/REQ-NOTEPAD-BATCH-ES140-ES143.md)  
> **티켓 연계**: #TASK-ES-140, #TASK-ES-141, #TASK-ES-142, #TASK-ES-143  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **규범 준수**: 15대 조문 절대 무결성 헌법(`AGENTS.md`) 및 문제해결 8원칙 준수

---

## 1. [원칙 ①] 파악: 엔지니어링 아키텍처 및 변경 범위
- **REQ 핵심 요약**:
  1. **#TASK-ES-140**: 목표탭 3계층(목표·마일스톤·할일) [일정설정]/[디데이·기간] 동적 버튼 배선 및 일정 설정 모달 연동.
  2. **#TASK-ES-141**: `js/customize.js` 화이트리스트 정리(`quickRoutineRow` 제거, `todayMissionCard` 라벨 '오늘의 카드'로 최신화) 및 실제 홈 UI 10종 1:1 완벽 정합성 확보.
  3. **#TASK-ES-142**: 구글 캘린더 OAuth 토큰의 `localStorage` 영속화 및 `initApp` 시 자동 복원(Self-Healing), 재인증 팝업 루프 차단.
  4. **#TASK-ES-143**: Gemini API 장애 시 전수 오프라인 지능 폴백(Local Smart Fallback) 및 보안 감사 완료.

- **영향 받는 파일 목록**:
  - `index.html`: 목표 탭 일정 배지/모달 배선, 구글 토큰 영속화/복원 로직
  - `ui.css`: `.schedule-pill` 스타일 및 반응형 배지 디자인
  - `js/customize.js`: 화이트리스트 최신화 및 명칭 동기화
  - `scripts/smoke-test.js`: #TASK-ES-140~143 전수 검증 추가

---

## 2. [원칙 ②] 본질 · 중심 배선 파악 (Architecture & Wiring)
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.goals`: `startDate`, `dueDate` 필드 완벽 보존 및 양방향 갱신.
  - `state.googleToken`: `accessToken`, `expiresAt` 메모리 캐시 및 `localStorage` 동기화.
  - `state.profile.settings.homeLayout`: 화이트리스트 기반 유효 ID만 안전 보존.
- **데이터 흐름 다이어그램**:
  `[목표탭 일정설정 배지 클릭] ➔ [openScheduleSetupModal] ➔ [날짜/시간 선택 후 저장] ➔ [state.profile.goals & customSchedules 동시 반영] ➔ [saveProfile()] ➔ [renderGoalsScreen & renderCalendar 동시 리렌더]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 한도 준수 여부 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `index.html` | 일정 배지 렌더러, 일정 모달, 구글 토큰 영속화 | +90줄 | -10줄 | +80줄 | 준수 (한도 300줄) |
| `ui.css` | `.schedule-pill` 및 일정 모달 스타일 | +25줄 | 0줄 | +25줄 | CSS 파일 |
| `js/customize.js` | 화이트리스트 정비 및 명칭 동기화 | +10줄 | -5줄 | +5줄 | 모듈 파일 |
| `scripts/smoke-test.js` | #TASK-ES-140~143 스모크 단언문 추가 | +50줄 | 0줄 | +50줄 | 테스트 파일 |

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 278개 테스트가 단 하나도 깨지지 않도록 Non-destructive로 설계되었는가?
- [x] 기존 유저의 목표, 마일스톤, 할일, 아바타, 세팅값이 100% 보존되는가?
- [x] `state.goalEditMode`와 일반 뷰 모두에서 일정 설정이 직관적으로 동작하는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Implementation Sequence)
1. **Step 1: 구글 캘린더 토큰 영속화 및 자동 복원 (#TASK-ES-142)**
   - `saveGoogleToken()`, `restoreGoogleToken()` 구현 및 `initApp()` 배선.
2. **Step 2: 나만의 홈 구성 화이트리스트 정비 (#TASK-ES-141)**
   - `js/customize.js` 내 레거시 ID 정리 및 최신 라벨 반영.
3. **Step 3: 목표 탭 3계층 일정 배지 및 모달 구현 (#TASK-ES-140)**
   - `formatSchedulePillHtml(item, type)` 함수 신설.
   - 목표 헤더, 마일스톤 행, 할 일 행의 달력 아이콘 좌측에 배지 삽입.
   - `openScheduleSetupModal()` 및 저장 로직 구현.
4. **Step 4: AI 엔드포인트 전수 룰베이스 오프라인 폴백 보강 (#TASK-ES-143)**
5. **Step 5: 자동화 검증 (`scripts/smoke-test.js`) 작성 및 100% ALL PASS 확인**
6. **Step 6: Tri-Sync 및 헌법 15대 게이트 전수 통과 확인**

---

## 6. [원칙 ⑥] 5대 무결성 검증 시나리오
- **시나리오 1**: 목표/마일스톤/할일에서 일정 미설정 시 `[일정설정]` 버튼이 노출되고, 클릭 시 모달에서 날짜 저장 시 즉시 디데이 또는 기간 배지로 전환되는지 검증.
- **시나리오 2**: 저장된 일정이 캘린더 화면(일간 타임테이블 및 월간 뷰)에 즉각 반영되는지 검증.
- **시나리오 3**: 나만의 홈 구성 모달에서 '오늘의 카드' 토글 시 정상적으로 숨김/노출되는지 검증.
- **시나리오 4**: 브라우저를 닫고 다시 열거나 재로그인 시 구글 캘린더 토큰이 자동 복원되어 재인증 팝업이 뜨지 않는지 검증.
- **시나리오 5**: 오프라인 상태에서도 룰베이스 폴백으로 피드백과 미션이 멈추지 않는지 검증.

---

## 7. [원칙 ⑦] 구현 완료 체크리스트
- [ ] #TASK-ES-140: 목표·마일스톤·할일 일정 설정 버튼 및 디데이/기간 표시 완결
- [ ] #TASK-ES-141: 나만의 홈 구성 화이트리스트 전수 일치
- [ ] #TASK-ES-142: 구글 캘린더 토큰 영속화 및 자동 복원 완결
- [ ] #TASK-ES-143: Gemini API 전수 폴백 및 보안 감사 완결
- [ ] `npm test` 282개 이상 전수 통과
- [ ] Zero Dead Click (568개 전수 검사 통과)
- [ ] Tri-Sync 100% 무결성 유지

---

## 8. [원칙 ⑧] 블로커 대책 및 롤백 계획
- 만일의 스크립트 에러 발생 시 즉각 안전 가드(Optional chaining / try-catch)로 격리하여 기본 화면 렌더링 100% 보장.
