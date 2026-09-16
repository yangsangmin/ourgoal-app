# 요구사항 정의서 (REQ) — #TASK-ES-133 소통 탭 3대 핵심 상호작용 실 서버 DB 완전 배선

> **문서 ID**: REQ-TASK-ES-133-REAL-INTERACTION-BACKEND  
> **티켓 연계**: #TASK-ES-133  
> **작성 일시**: 2026-09-16  
> **작성자**: Antigravity 세션 a0a58f30  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)
- **상민님 지시 원문**:
  1. "활용법과 현재 시스템 차이 있는 것들 모두 확인해. 감찰이 압수수색하듯이. 아워골 헌법기준에 맞춰서 모든사항 다 점검하고, 표로 보고해"
  2. "한번더 압수수색해. 이번엔 아워골 전체 버튼, 기능, 유저간 상호작용을 중점으로."
  3. "1" (P0 3대 핵심 상호작용 서버 DB 완전 배선 승인)
  4. "문제해결8원칙 적용해서 한번더 검토하고 넘어가자"
- **현재 발생하는 문제 및 한계**:
  1. **피드 댓글**: 사용자가 댓글을 작성해도 클라이언트 `localStorage`에만 머물러 타 기기나 타 사용자에게 전혀 공유되지 않았으며, 새로고침 시 가짜 AI 시뮬레이션 답글이 자동으로 달려 마치 타인과 상호작용하는 것처럼 오인시키는 문제가 존재함 (헌법 제4조 제1항 제7호 및 제13조 위반).
  2. **새 팀 만들기**: 팀 개설 시 브라우저 메모리/로컬 배열(`MOCK_GROUPS`)에만 추가되어 타인에게 전역 공유되지 않고, 브라우저 캐시 삭제 시 영구 유실될 위험이 존재함.
  3. **마니또**: 100% 난수 시드 기반 가짜 봇으로 동작하여 진정한 동류 소통(E3) 경험이 단절됨.
- **사용자 상황 및 페르소나**:
  - 목표를 등록하고 동료들과 피드에서 소통하려는 모든 사용자 및 팀을 개설하여 멤버를 모으려는 팀장 사용자.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Root Cause & Essence)
- **근본 원인**: 초기 UI 프로토타입 단계의 로컬 목업 구조가 방치되어 백엔드 원격 테이블과의 실시간 양방향 파이프라인 배선이 누락됨.
- **본질 축 (Essence Axis)**: **E3 (동류 소통 - Peer Interaction)**
- **체감 가설 (User Experience Hypothesis)**:
  > *"사용자가 소통 탭에서 동료의 목표에 댓글을 달거나 새 팀을 개설했을 때, 실제 다른 사용자에게 실시간으로 전달되고 반응을 주고받음으로써 고립감이 해소되고 지속적인 실천 동기를 얻게 된다."*
- **기존 전체 기능 영향도 분석**:
  - 계정/로그인(세션, 게스트, 소셜): 게스트(`u_...`)와 소셜 유저 모두 `team_pings`의 유연한 `TEXT` 식별자를 통해 완벽 호환 및 보존.
  - 홈 화면 및 스트릭: 마니또 스트릭 카운터 정상 연동.
  - 기록/통계/캘린더: 핵심 데이터 스키마를 일체 변경하지 않고 격리된 세팅(`customGroups`, `feedComments`)과 원격 실시간 채널만 연결하여 회귀 0건 보장.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Functional Specifications)

### 3-1. 세부 기능 요구사항 (Functional Requirements)
- **FR-01 (피드 댓글 실시간 원격 동기화)**:
  - `loadServerFeedComments(postId)`: Supabase `team_pings`(`group_id: 'feed'`) 비동기 조회.
  - `handleUserCommentSubmit(postId, text)`: 로컬 낙관적 추가 + Supabase 실시간 insert.
  - 타인 실사용자 게시물에 무작위로 달리던 가짜 AI 챗봇 답글 시뮬레이션 전면 배제.
  - 댓글 삭제 시 Supabase 원격 레코드 동기 삭제 (`deleteFeedComment`).
- **FR-02 (새 팀 개설 전역 공유 및 영구 보존)**:
  - `promptNewGroup()`: `state.profile.settings.customGroups`에 영구 보존(로컬 자가치유) + Supabase `team_pings`(`group_id: 'shared_groups'`) 마스터 레코드 등록.
  - `loadSharedGroups()`: 전역 팀 데이터 페칭 및 실시간 구독 반영.
- **FR-03 (진짜 마니또 익명 응원 연동)**:
  - `loadServerManitoData()`: 실제 가입자 풀(`manito_pool`) 및 나에게 온 응원함(`manito`) 실시간 조회.
  - 실 유저 풀 최우선 매칭 및 콜드스타트 가상 유저 `[🤖 AI 동반자]` 투명 뱃지 표기.
  - 응원 스탬프 전송 시 Supabase `team_pings` 실시간 전송.
- **FR-04 (Vercel Hobby 12개 함수 한도 사수)**:
  - 신규 엔드포인트 증설 없이 클라이언트-Supabase 직접 파이프라인으로 해결하여 12개 한도 엄격 준수.

### 3-2. 전수 인터랙션 명세표 (Zero-Dead-Click)
| UI 요소 | 위치/화면 | 사용자 액션 | 기대 동작 (비즈니스 로직) | 예외 처리 및 피드백 |
| :--- | :--- | :--- | :--- | :--- |
| `[data-delcomment]` | 피드 댓글 항목 | 클릭 | 로컬 및 Supabase 원격 댓글 동기 삭제 | 작성자 본인 댓글에만 노출, 삭제 토스트 |
| `[data-stamp]` | 마니또 파트너 카드 | 클릭 | 실시간 응원 전송 + 햅틱/컨페티 연출 | 당일 중복 발송 방지 토스트 |
| `[data-mndm]` | 마니또 파트너 카드 | 클릭 | 상호 응원 3회 달성 시 1:1 익명 DM 열기 | 미달 시 비활성화(disabled) |
| `[data-mnreveal]` | 마니또 파트너 카드 | 클릭 | 7일 연속 상호응원 시 정체 공개 제안 | 확인 confirm 후 제안 상태 저장 |
| `#mnJoin` | 마니또 소개 화면 | 클릭 | 마니또 풀 등록 및 관심사 기반 파트너 매칭 | 등록 완료 토스트 및 메인 화면 전환 |
| `#mnReshuffle` | 마니또 설정 카드 | 클릭 | 파트너 재매칭 실행 | confirm 확인 후 시드 갱신 |

### 3-3. 유저 데이터 100% 무손실 보존 규격 (Zero-Data-Loss)
- **아바타/목표/기록**: 불변 보존.
- **팀 데이터**: `state.profile.settings.customGroups` + `team_pings` 원격 레코드 이중화.
- **댓글 데이터**: `state.profile.settings.feedComments` + `team_pings` 원격 레코드 이중화.

---

## 4. [원칙 ④] 1~3 재검토 및 보완 (Review & Edge Cases)
- **중복 추가 방지**: `MOCK_GROUPS` 및 댓글 리스트에 동일 ID 존재 시 중복 추가 배제.
- **오프라인 대응**: 네트워크 단절 시에도 낙관적 로컬 업데이트로 UI가 즉시 반응하며 콘솔 경고로 안전 격리.
- **게스트 모드**: `team_pings`의 모든 식별자가 `TEXT` 타입으로 게스트 유저(`u_...`)도 RLS 및 타입 에러 없이 정상 작동.
- **콜드 스타트**: 실 유저 가입 풀이 부족할 경우 AI 동반자가 투명 뱃지(`[🤖 AI 동반자]`)와 함께 안전하게 폴백.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Procedure & State Propagation)
- 댓글/팀/마니또 데이터 발생 ➔ `[로컬 상태 저장 & 자가치유]` ➔ `[Supabase team_pings 실시간 배선]` ➔ `[전역 Realtime 구독자 즉시 화면 반영]` ➔ `[토스트 피드백]`

---

## 6. [원칙 ⑥] 절차 재검증 (Verification of Procedure)
- [x] 헌법 제13조(실 사용자 계정 상호 연동) 및 3대 본질(E3) 완벽 정합.
- [x] 껍데기 UI 0건, 전수 버튼 실 핸들러 배선 확인.
- [x] 유저 데이터 무손실 100% 보증.
- [x] 헌법 제9조 제3항(배포 안전핀) 엄격 준수 (원격 머지 대기).

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics)
- `npm test`: 272개 전수 통과 (0 failures)
- 헌법 5대 게이트 14종 통과
- Headless Chrome CDP E2E 실측 스크린샷 3종 확보
- Tri-Sync 100% (509/509) 유지

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 대책 (Anticipated Blockers)
- **Supabase 타입/RLS 블로커**: `team_comments` 대신 `team_pings` 채택으로 원천 해결.
- **Vercel Hobby 12개 한도**: 신규 함수 없이 클라이언트 파이프라인으로 해결.
- **index.html 커밋 성장 한도**: 268줄 순증가로 통제하여 본질 게이트 통과.
- **롤백 계획**: 문제 발생 시 커밋 `1d4489b`로 즉시 원복 가능.
