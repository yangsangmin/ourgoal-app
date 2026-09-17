# 작업계획서 (PLAN) — 아워골 홈탭 UI 전면 개편 및 직관적 시인성 강화

> **문서 ID**: PLAN-TASK-ES-165-home-ui-renewal  
> **티켓 연계**: #TASK-ES-165  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **귀속 축**: FIX / E1 (체크인 루프 및 UI/UX 시인성 혁신)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  - 홈탭 UI의 수직 과밀화 및 경계 모호 문제를 해결하기 위해, 칸 구분이 확실한 볼드 모듈러 보더 스타일을 도입하고 3단 스마트 구역화(히어로 / 간편 기록 / 목표 퀘스트)를 적용하여 초보자 친화적이고 직관적인 사용자 경험 구축.
- **영향받는 파일 전수 목록**:
  - `docs/specs/REQ-TASK-ES-165-home-ui-renewal.md` (요구사항 정의서)
  - `docs/specs/PLAN-TASK-ES-165-home-ui-renewal.md` (작업계획서)
  - `ui.css` (카드 보더 토큰, 모듈러 카드, 퀘스트 카드 스타일)
  - `index.html` (`renderHome` 구조 및 홈탭 마크업 3단 구역화)
  - `sw.js` (PWA 캐시 버전 갱신)
  - `scripts/smoke-test.js` (홈탭 렌더링 무결성 검증)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 및 배선(Wire) 식별 (Essence, Causes, Core, Anchor & Wire)

- **[본질] (Essence)**:
  - 아워골 홈 화면의 본질은 사용자가 앱을 켜자마자 복잡함에 압도되지 않고, 직관적인 3단 블록(오늘의 나 → 한 줄 실천 → 퀘스트 목표)을 통해 1초 만에 성장의 즐거움을 체감하게 만드는 데 있다.
- **[원인] (Causes)**:
  - 카드 간 테두리 대비가 극도로 낮은 스타일과 수직으로 누적된 10여 개의 위젯들이 칸의 시각적 경계를 무너뜨려 사용자에게 극심한 인지 부하를 초래함.
- **[중심] (Core)**:
  - 볼드 모듈러 보더(1.5px~2px) 기반 영역 분리와, 복잡한 옵션을 숨기고 [기록창]과 [목표 퀘스트]를 주인공으로 세우는 3단 스마트 레이아웃 구축.
- **[핵심] (Anchor)**:
  - 공간 지각력이 부족한 사용자도 단 0.1초 만에 인지할 수 있는 명확한 카드 테두리와, 완료 시 게임 퀘스트처럼 성취감을 주는 시각적 피드백 체계.
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.goals`: 목표 퀘스트 카드 렌더링 시 기존 데이터 구조 100% 무손실 계승.
  - `state.profile.settings`: 홈 레이아웃 커스텀 설정 보존.
  - `state.activeTab`: `home` 탭 렌더링 시 `renderHome()` 호출 완벽 보존.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [User Action: 홈탭 진입 / 1줄 기록 입력]
         ↓
  [Hero Zone: 아바타 인사 & 스트릭 불꽃 점등]
         ↓
  [Action Zone: 볼드 카드 내 한 줄 입력창 + 사진/마이크 인라인 툴바]
         ↓
  [captureSave()] → [Server-First DB upsert] → [4대 뷰 동시 전파: renderHome, renderRecordsScreen, renderStatsScreen, renderCalendar]
         ↓
  [Quest Zone: 목표 퀘스트 카드 실시간 프로그레스 바 갱신]
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **기획 단계 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)**:
  - **1호 (원격 DB 스키마 명세)**: 기존 Supabase `users`, `user_goals`, `user_checkins` 테이블 스키마 100% 호환 (신규 테이블 증설 없음).
  - **2호 (스마트 스토리지 분기 설계)**: 대용량 이미지 자산 3계층(Supabase Storage 버킷 / 로컬 IndexedDB `ourgoal_media` / localStorage 메타) 기존 규격 완벽 준수.
  - **3호 (4대 뷰 전파 배선도)**: `captureSave` 실행 시 `renderHome()`, `renderRecordsScreen()`, `renderStatsScreen()`, `renderCalendar()` 4대 뷰 100% 동시 호출 배선 유지.
- **파일별 변경 예산 (Diff Budget)**:
  - `ui.css`: 약 +80줄 (볼드 모듈러 보더 클래스, 퀘스트 카드 스타일링)
  - `index.html`: 약 +40줄 / -30줄 (`renderHome` 내 카드 마크업 정돈)
  - `sw.js`: 1줄 변경 (`CACHE_NAME` 갱신)

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Integrity Guarantee)

- **기존 디자인/스타일 보존**:
  - CSS 전역 변수(`--card`, `--rule`, `--brand` 등)를 그대로 계승하여 7대 테마(다크 스페이스, 글로잉 스페이스 등) 전환 시 색상 깨짐 방지.
- **유저 자산 100% 무손실 보존**:
  - 기존 사용자의 아바타 설정값, 목표 목록, 체크인 기록, 스트릭 데이터 단 1바이트도 변경 없이 안전 승계.
- **Dead Click 방지**:
  - 기존 마이크 버튼(`micBtn`), 사진 첨부(`capturePhotoBtn`), 목표 추가(`homeAddGoal`) 등 모든 이벤트 핸들러 ID 100% 유지.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

- **Step 1 (비주얼 시안 생성)**: `generate_image`를 통해 초보자 친화적이고 테두리가 뚜렷한 홈탭 UI 개편안 이미지 렌더링.
- **Step 2 (스타일 토큰 보강)**: `ui.css`에 `.modular-card`, `.quest-goal-card` 등 시인성 극대화 보더 스타일 배선.
- **Step 3 (홈탭 마크업 3단화)**: `index.html` 내 `renderHome` 및 홈 섹션을 [Hero / Action / Quest] 3구역으로 정돈.
- **Step 4 (PWA 캐시 갱신)**: `sw.js` 캐시 네임 `ourgoal-shell-v20260917-es165`로 갱신.
- **Step 5 (5대 무결성 검증)**: `scripts/smoke-test.js` 및 `scripts/verify-integrity-gate.js` 전수 실행.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification & Anti-SPOF)

- **검증 A (Zero Dead-Click)**: 홈탭 내 모든 버튼(기록 저장, 마이크, 사진, 새 목표 등) 클릭 시 에러 0건.
- **검증 B (Zero UX Regression)**: 스트릭 계산, 아바타 렌더링, 알림 배지, 피드백 티어 바 정상 작동.
- **검증 C (Zero Data Loss)**: 가상 페르소나 10종 데이터 무결성 100% 보존.
- **검증 D (Full State Propagation)**: 기록 작성 시 4대 뷰 동시 전파.
- **검증 E (자동화 게이트 통과)**: `npm test` 304개 이상 테스트 ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Milestones & Checklist)

- [x] 1단계: 요구사항 정의서(REQ) 및 작업계획서(PLAN) 작성 완료
- [ ] 2단계: 홈탭 UI 개편안 고해상도 이미지 시안 생성 (`generate_image`)
- [ ] 3단계: Tri-Sync 관제센터 저널 연동 및 무결성 체크
- [ ] 4단계: 상민님께 대책 보고 및 UI 개편안 이미지 브리핑 (모드 2/3 정지선 준수)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Rollback & Anti-Blocker)

- **잠재 블로커**:
  - 사용자가 기존의 빽빽한 화면에서 특정 세부 정보를 필요로 할 가능성.
- **대책**:
  - 기존 세부 위젯들을 영구 삭제하는 것이 아니라 `OurgoalComponents` 모듈 내에서 아코디언 또는 [더보기/홈구성]을 통해 언제든 열어볼 수 있도록 비파괴 합집합 원칙 준수.
- **롤백 계획**:
  - `git stash` 또는 백업 브랜치를 통해 즉시 롤백 가능하도록 안전 격리.
