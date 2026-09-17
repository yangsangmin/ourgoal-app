# 작업계획서 (PLAN) — 아워골 유저 간 상호작용(E3)·팀 공유 동기화·딥링크 게이트웨이 및 다기기 테스트 계정 무결성 전면 고도화

> **문서 ID**: PLAN-TASK-ES-169  
> **티켓 연계**: #TASK-ES-169  
> **요구사항 정의서**: [REQ-TASK-ES-169](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-169.md)  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity (세션 ID: 781ab55c)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 팀 만들기 후 타 유저 동기화 누락 해결 (`loadSharedGroups`).
  - 바이럴 초대 딥링크(`?type=group&id=...`) 파싱 불발 해결.
  - 팀 톡 및 찌르기 내 `setTimeout` 가짜 자동답장 완전 제거 및 Supabase `team_pings` 실시간 웹소켓 배선.
  - 팀장 점검 시스템(`team-leader-check.js`) 서버 영속화 배선.
  - 2계정 테스트를 위한 원터치 테스트 계정(`quickTesterBtn`) 배선.
  - 사진 뷰어 닫기 버튼 등 정적 검사기 경고 해소.
- **영향받는 파일 전수 목록**:
  1. `js/viral-sharing.js`: 딥링크 게이트웨이 파라미터 매핑 개선.
  2. `js/team-invite-comm.js`: 가짜 setTimeout 제거, 팀 톡 DB 및 Realtime 채널 배선.
  3. `js/team-leader-check.js`: 확인 도장 및 넛지 원격 DB 비동기 영속화.
  4. `index.html`: `loadSharedGroups()` 배선, 테스트 계정 버튼, 사진 뷰어 닫기 ID 부여.
  5. `sw.js`: PWA 캐시 버전 무효화 (`CACHE_NAME`).
  6. `scripts/smoke-test.js`: #TASK-ES-169 신규 무결성 검증 테스트 케이스 추가.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)
- **본질 축 (Essence Axis)**: `E3` (동류 소통 루프) 및 `FIX` (상호작용 단절 및 가짜구현 핫픽스)
- **[본질] (Essence)**:
  - 아워골 내 모든 다자간 상호작용이 로컬 브라우저의 폐쇄적 자가 순환 루프나 `setTimeout` 타이머 눈속임을 완전히 탈피하여, 실제 등록된 사용자 간에 원격 DB 원장 및 Realtime 채널을 통해 물리적으로 100% 실시간 연동되는 엔지니어링 파이프라인의 완성.
- **[원인] (Root Causes - 기저 원인 3가지)**:
  1. **원인 1 (서버 원장 로드 누락)**: 팀 생성 시 `team_pings`에 insert만 하고, 다른 유저가 조회하는 `loadSharedGroups`가 없어 타 기기 화면에 노출되지 않음.
  2. **원인 2 (딥링크 파라미터 불일치)**: 초대 링크의 `?type=group&id=...` 포맷과 파서의 구버전 키값 검사 간 괴리로 초대장이 무음 실패함.
  3. **원인 3 (로컬 가짜 봇 자동답장 잔재)**: 팀 대화방과 찌르기에 `setTimeout` 기반 가상 답변 코드가 남아 있어 헌법 제13조를 위반함.
- **[중심] (Core Bottleneck & Anchor)**:
  - `team_pings` 및 Realtime 채널을 통한 [낙관적 즉각 표출 ➔ 원격 DB 영구 저장 ➔ 웹소켓 브로드캐스트 ➔ 수신자 화면 실시간 렌더링] 4단계 완결성.
- **[핵심] (Critical Safety & Termination)**:
  - 기존 유저 자산(아바타, 목표, 체크인 기록) 100% 무손실 보존과 네트워크 단절 시에도 멈추지 않는 그레이스풀 폴백.
- **전역 상태(`state`) 영향 분석**:
  - `state.profile.settings.customGroups`: 서버에서 로드된 공유 팀 목록과 안전하게 비파괴 병합.
  - `state._activeTeamChatChannel`: 팀 톡 Realtime 구독 채널 참조 보관.
- **종단간(End-to-End) 데이터 흐름 다이어그램**:
```
[사용자 A (기기 1)] ➔ 팀 개설/초대 ➔ Supabase team_pings (ping_type: 'group_creation')
                                                      │
                                           [Supabase DB / Realtime]
                                                      │
[사용자 B (기기 2)] ➔ loadSharedGroups() / 초대 링크 (?type=group&id=...) ➔ 실시간 팀 참여 & 팀 톡/찌르기
```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **4위 1체 배선 명세**:
  - [마크업]: 2계정 테스트 버튼, 사진 뷰어 닫기 버튼 ID, 팀 톡 입력창.
  - [리스너]: 클릭/키다운 이벤트 위임 및 바인딩.
  - [비즈니스 로직]: `team_pings` upsert, Realtime broadcast, `loadSharedGroups` 병합.
  - [피드백]: 낙관적 UI 즉각 렌더링, 토스트 알림, 에러 방어.
- **파일별 변경 예산 (Diff Budget)**:
  - `js/viral-sharing.js`: +25 lines, -5 lines
  - `js/team-invite-comm.js`: +60 lines, -45 lines (가짜 setTimeout 제거)
  - `js/team-leader-check.js`: +30 lines, -0 lines
  - `index.html`: +55 lines, -10 lines
  - `sw.js`: +2 lines, -2 lines
  - `scripts/smoke-test.js`: +40 lines, -0 lines
  - **합계 예상 Diff**: 약 +210 lines / -60 lines (품질 완결성 보장)

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **기존 디자인/스타일 보존**:
  - `ui.css` CSS 전역 변수 계승, 인라인 하드코딩 지양.
- **유저 자산 100% 무손실 보존 재확인**:
  - 기존 아바타 설정, 개인 목표, 마일스톤, 체크인 기록 데이터의 필드나 키를 일체 변경하지 않음.
  - 게스트 및 카카오 로그인 세션 완벽 보존.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **1단계**: `js/viral-sharing.js` 딥링크 파라미터 매핑 보강 (`?type=group&id=...`).
2. **2단계**: `js/team-invite-comm.js` 내 가짜 `setTimeout` 타이머 제거 및 `team_pings` 실시간 팀 톡 배선.
3. **3단계**: `js/team-leader-check.js` 팀장 도장/넛지 원격 DB 비동기 전파 배선.
4. **4단계**: `index.html` 공유 팀 로드(`loadSharedGroups`), 2계정 테스트 버튼, 사진 뷰어 닫기 ID 배선.
5. **5단계**: `sw.js` 캐시 버전 갱신.
6. **6단계**: `scripts/smoke-test.js`에 ES-169 테스트 추가.
7. **7단계**: `npm test` 및 무결성 게이트 검증.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **A. 전수 클릭(Dead-Click 0)**: `node scripts/verify-all-clicks.js` 통과 및 미배선 0건 확인.
- **B. 유저 데이터 무손실(Data Loss 0)**: 가상 유저 페르소나 10종 딥 이퀄 대조 100% PASS.
- **C. 전 UX 회귀(UX Regression 0)**: 게스트/카카오 세션 보존, 기존 308개 테스트 0 Failure.
- **D. 화면 상호연동(State Propagation)**: 팀 개설/수정 시 목표 탭 및 소통 탭 실시간 동기화.
- **E. 자동화 게이트 통과**: `node scripts/verify-integrity-gate.js` 정적 AST 방화벽 100% 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [ ] 1. `js/viral-sharing.js` 수정 및 딥링크 복구
- [ ] 2. `js/team-invite-comm.js` 가짜 봇 제거 및 실시간 팀 톡 배선
- [ ] 3. `js/team-leader-check.js` 팀장 점검 서버 원장화
- [ ] 4. `index.html` 공유 팀 동기화, 테스트 계정 버튼, 버튼 배선 보강
- [ ] 5. `sw.js` PWA 캐시 버전 갱신
- [ ] 6. `scripts/smoke-test.js` 테스트 케이스 추가 및 `npm test` ALL PASS
- [ ] 7. `node scripts/verify-all-clicks.js` 및 `verify-integrity-gate.js` 100% 통과
- [ ] 8. 로컬 main 브랜치 병합 (헌법 제9조 제3항 4단계 마감 상한선 엄수)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **엔지니어링 잠재 오류**:
  - `loadSharedGroups`에서 잘못된 JSON 형식이 들어올 경우 JSON.parse 예외 발생 위험 ➔ try-catch 안전 가드 배치.
- **롤백 계획**:
  - 커밋 전 git stash 또는 브랜치 롤백(`git reset --hard`)으로 기존 코드로 0초 즉각 복구 가능.
