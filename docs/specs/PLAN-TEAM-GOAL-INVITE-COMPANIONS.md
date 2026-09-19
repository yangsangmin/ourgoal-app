# 엔지니어링 작업계획서 (PLAN) — 팀 목표 내 동반자 원탭 초대 및 아워골 가입자 닉네임 실시간 검색·영입 시스템

> **문서 ID**: PLAN-TEAM-GOAL-INVITE-COMPANIONS  
> **요구사항 연계**: [REQ-TEAM-GOAL-INVITE-COMPANIONS](file:///C:/dev/ourgoal-app/docs/specs/REQ-TEAM-GOAL-INVITE-COMPANIONS.md)  
> **티켓 연계**: #TASK-TEAM-GOAL-INVITE-COMPANIONS  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 팀 목표 카드에서 `👥 팀원 초대` 클릭 시 기존 외부 공유 전용 모달을 확장하여,
    1) 내 목표 동반자(러닝메이트) 목록을 즉시 띄워 원탭으로 팀원에 초대/추가.
    2) 아직 동반자가 아닌 지인도 닉네임 실시간 검색으로 찾아 즉각 팀원으로 영입하고 동시에 내 동반자로 자동 연동.
    3) 팀 채팅방에 초대 환영 시스템 메시지 자동 등록 및 팀 인원수 즉각 반영.
    4) 기존 카카오톡/문자/링크 외부 공유 기능 완벽 보존.
- **영향 받는 파일 목록 전수**:
  - `js/team-invite-comm.js`: `openTeamInviteModal` 함수 전면 확장 및 2단 탭/동반자 초대/지인 검색 배선
  - `index.html`: 레거시 `openTeamInviteModal` 호출 시 `OurgoalTeamInviteComm.openTeamInviteModal` 위임 보장
  - `sw.js`: `CACHE_NAME` 최신화
  - `docs/rules/TICKETS.md`: 티켓 등록
  - `docs/specs/REQ-TEAM-GOAL-INVITE-COMPANIONS.md`: 요구사항 정의서
  - `docs/specs/PLAN-TEAM-GOAL-INVITE-COMPANIONS.md`: 작업 계획서

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 팀 목표의 팀원 구성은 단순 텍스트 공유가 아닌, 인앱 내 소셜 원장(동반자 목록, 회원 검색 파이프라인, 모임 참여 멤버십)과 실시간 팀 대화방의 3자 상호 연동으로 완성되는 완결된 인앱 소셜 파이프라인이다.
- **[원인] (Technical Causes)**: 기존 `openTeamInviteModal`이 외부 공유 링크 문자열 조립에만 국한되어, 이미 앱 내 구축되어 있던 동반자 목록(`ensureDefaultCompanions()`) 및 회원 검색 파이프라인(`/api/track`, Supabase RPC)과 연결되지 못한 채 단절되어 있었음.
- **[중심 배선] (Core Wire & State)**:
  - `state.profile.companions`: 내 동반자 목록 조회 및 지인 영입 시 동반자 자동 연동
  - `groupState(gid).membersList` & `g.membersList` & `g.roster`: 팀원 등록 및 인원수 갱신
  - `groupState(gid).chatMessages`: 팀 채팅방 초대 환영 시스템 메시지 등록
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 이미 참여 중인 멤버는 `[✓ 참여 중]` 비활성 배지로 표시하여 중복 추가 원천 차단
  - 로컬스토리지 영속화(`persistCompanions()`, `saveProfile()`) 및 목표 탭 화면 실시간 리렌더링
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[팀원 초대 클릭] -> [모달 오픈: 동반자 목록 렌더링 & 지인 검색창] -> [팀 초대 또는 팀원 영입 클릭] -> [팀 멤버십 갱신 + 채팅방 공지 등록 + 동반자 연동] -> [로컬/원격 저장] -> [목표 탭 리렌더링] -> [성공 토스트 피드백]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/team-invite-comm.js` | 초대 모달 2단 탭, 동반자 초대, 지인 검색·영입 구현 | +280줄 | -50줄 | +230줄 | 기능 전면 강화 |
| `index.html` | 레거시 함수 위임 안전핀 | +3줄 | 0줄 | +3줄 | 위임 배선 |
| `sw.js` | 캐시 버전 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: 2단 탭 버튼, 동반자 목록 카드, 지인 검색 인풋(`teamInviteSearchInput`), 검색 버튼, 검색 결과 영역
2. **이벤트 리스너 (Listener)**: 탭 전환, `btn-invite-comp` 클릭, 지인 검색(`Enter` 및 클릭), `btn-recruit-user` 클릭, 외부 공유 3종 클릭, 닫기 클릭
3. **비즈니스 로직 (Logic)**: `addMemberToTeam` (멤버십 추가, 로스터 추가, 인원수 증가, 채팅 메시지 전송), `ensureDefaultCompanions` 동반자 연동, `/api/track` 및 RPC 검색
4. **피드백 & 예외처리 (Feedback)**: 클릭 즉시 `[✓ 참여 중]` 낙관적 전환, 축하 토스트 표출, 검색어 미입력 시 안내, 미발견 시 재검색 안내

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 카카오톡, 문자(SMS), 링크 복사 기능이 외부 공유 탭에 100% 보존되는가?
- [x] 전체 파일 덮어쓰기 없이 외과수술적 치환으로 작성되었는가?
- [x] 기존 사용자의 아바타, 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 가짜 AI 유저와 실사용자가 정직하게 구분 표기되는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (데이터 모델 & 팀원 판별 함수)**: `isMemberOfGroup(person)` 및 `addMemberToTeam(group, userObj)` 구현
2. **Step 2 (동반자 목록 렌더링 & 초대 배선)**: `companions` 순회, 참여 중 여부 표기, `+ 팀 초대` 클릭 시 멤버 추가 및 채팅 알림
3. **Step 3 (가입 지인 닉네임 검색 & 영입)**: `/api/track` + RPC + 로컬 풀 3중 검색, `+ 팀원으로 영입` 클릭 시 멤버 영입 + 동반자 자동 연동
4. **Step 4 (외부 공유 탭 통합)**: 카톡, 문자, 링크 복사 이벤트 핸들러 배선
5. **Step 5 (리렌더링 및 캐시 갱신)**: `renderTeamGoalsScreen()` 리렌더링 및 `sw.js` `CACHE_NAME` 최신화

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
- **시나리오 A (Zero Dead-Click)**:
  - 초대 모달 내 모든 버튼(`tabTeamInviteInner`, `tabTeamInviteOuter`, `btn-invite-comp`, `teamInviteSearchBtn`, `btn-recruit-user`, `btnInviteKakao`, `btnInviteSms`, `btnInviteCopy`, `closeInviteModalBtn`) 클릭 시 콘솔 에러 0건 및 기대 동작 100% 완결.
- **시나리오 B (Zero Data Loss)**:
  - 동반자 초대 및 지인 영입 후 새로고침 시에도 팀 멤버십과 동반자 목록이 무손실 영속화됨을 확인.
- **시나리오 C (Zero UX Regression)**:
  - 기존 목표 탭의 팀 목표 카드 기능(팀 연계 개인목표, 팀 대화, 공동 팀 목표 등)에 일체의 회귀나 레이아웃 깨짐이 없음.
- **시나리오 D (Full State Propagation)**:
  - 팀원 초대 즉시 팀 카드의 인원수와 채팅방 대화 내역이 실시간으로 동기화됨.
- **시나리오 E (자동화 게이트 통과)**:
  - `npm test` 329개 스모크 테스트 및 헌법 13대 게이트 100% ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [x] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] CDP 기반 모바일(430x932) 실측 스크린샷 캡처 및 상민님께 선보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재적 엔지니어링 블로커**: 오프라인 또는 로컬 환경에서 Vercel `/api/track` 또는 Supabase 서버리스 검색 응답이 지연되거나 차단될 수 있음.
- **사전 방어 및 우회 로직**: 3단계 다중 폴백(서버리스 API -> Supabase RPC -> 로컬 가입자 풀)을 설계하여 오프라인 환경에서도 지인 검색이 즉시 반응하고 에러가 발생하지 않도록 방어.
- **롤백 계획 (Rollback Strategy)**: 기능 결함 발생 시 git을 통해 `js/team-invite-comm.js`의 `openTeamInviteModal`을 이전 백업 커밋으로 복구.
- **재검증 트리거**: 모달 클릭 시 런타임 예외 발생 시 원칙 ⑤의 Step 2~3 이벤트 바인딩으로 돌아가 즉각 수정.
