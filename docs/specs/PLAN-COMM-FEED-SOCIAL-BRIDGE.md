# 엔지니어링 작업계획서 (PLAN) — 소통 피드 소셜 브릿지 전면 개통 및 인앱 상호작용 배선

> **문서 ID**: PLAN-COMM-FEED-SOCIAL-BRIDGE  
> **요구사항 연계**: [REQ-COMM-FEED-SOCIAL-BRIDGE](file:///C:/dev/ourgoal-app/docs/specs/REQ-COMM-FEED-SOCIAL-BRIDGE.md)  
> **티켓 연계**: #TASK-COMM-FEED-SOCIAL-BRIDGE  
> **작성 일시**: 2026-09-19  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**:
  - 피드 아바타/닉네임 클릭 프로필 조회 배선 (`openUserProfileModal`)
  - 피드 카드 내 [동반자 추가], [1:1 DM], [팀 초대] 소셜 브릿지 배선
  - 피드 글 인앱 공유 모달 (`openFeedShareModal`: 동반자 DM 전송, 팀 단체방 전송, 외부 SNS 공유)
- **영향 받는 파일 목록 전수**:
  - `js/team-invite-comm.js`: `openFeedShareModal` 신설 및 `openScoutToTeamModal` 탑재
  - `index.html`: `feedPostHtml` 및 `renderCommFeed` 템플릿 마크업과 이벤트 위임 배선
  - `sw.js`: 캐시 버저닝 갱신 (`ourgoal-shell-v20260919-comm-feed-social-bridge`)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선 식별 (Architecture & Wiring)
- **[본질] (Engineering Essence)**: 피드 아이템과 기존 동반자·팀목표·DM 모듈 간의 단절을 외과수술적으로 잇는 무손실 브릿징.
- **[원인] (Technical Causes)**:
  - `feedPostHtml`과 `renderCommFeed`의 마크업에 `data-feedprof` 등의 인터랙션 훅 부재.
  - 피드 공유 버튼 핸들러가 외부 전송 전용 함수 `shareContent`만 직접 호출하도록 하드코딩됨.
- **[중심 배선] (Core Wire & State)**:
  - `OurgoalTeamInviteComm.openUserProfileModal(targetUser)` 호출
  - `OurgoalTeamInviteComm.openFeedShareModal(post, companions, myTeams)` 호출
- **[핵심 안전장치] (Critical Safety & Persistence)**:
  - 본인 글(`isMe`)일 경우 동반자 추가 및 DM 버튼 미노출 방어.
  - 가상 AI 봇 글인 경우 `isAiBot: true` 플래그로 안정적 프로필 표시.
- **종단간 데이터 흐름 다이어그램 (End-to-End Data Pipeline)**:
  `[피드 카드 아바타/이름 탭] -> [openUserProfileModal(user)] -> [동반자 추가/1:1 DM 클릭] -> [동반자 목록 저장/DM방 열기] -> [실시간 상태 전파]`
  `[피드 카드 🔗공유 탭] -> [openFeedShareModal(post)] -> [동반자 선택 또는 팀 선택] -> [DM/팀방 메시지 인서트] -> [성공 토스트]`

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 변경 목적 | 예상 추가(+) | 예상 삭제(-) | 순증가(Net) | 변경 성격 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `js/team-invite-comm.js` | 피드 인앱 공유 모달 및 팀 스카우트 모달 추가 | +120줄 | 0줄 | +120줄 | 신규 모듈화 |
| `index.html` | 피드 아이템 마크업 및 클릭 이벤트 바인딩 | +35줄 | -5줄 | +30줄 | 외과수술적 diff |
| `sw.js` | 캐시 버전 갱신 | +1줄 | -1줄 | 0줄 | 캐시 무효화 |

### 껍데기 UI 방지 4위 1체 상세 배선 명세
1. **마크업 (Markup)**: `data-feedprof`, `data-feedcomp`, `data-feeddm`, `data-feedscout`, `data-sharefeed`
2. **이벤트 리스너 (Listener)**: 클릭 위임 핸들러 배선
3. **비즈니스 로직 (Logic)**: 실제 프로필 조회, 동반자 추가, DM 전송, 팀 채팅 전송
4. **피드백 & 예외처리 (Feedback)**: 토스트 알림, 중복 추가 방지, 게스트 가드

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- [x] 기존 HTML 디자인, CSS 스타일, 레이아웃을 임의로 변경하지 않고 완벽히 계승했는가?
- [x] 전체 파일 덮어쓰기 없이 변경 부분만 외과수술적 diff로 작성하도록 설계되었는가?
- [x] 기존 사용자의 아바타(보관함 포함), 목표, 기록, 세팅값이 100% 무손실 보존되는가?
- [x] 성능 저하(불필요한 전체 리렌더링)나 다중 탭 동시성 충돌을 유발하지 않는가?

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1 (`js/team-invite-comm.js`)**:
   - `openFeedShareModal(post, opts)` 함수 작성 (동반자에게 DM 전송 / 팀 단체방에 공유 / 외부 SNS 공유 3대 옵션)
   - `openScoutToTeamModal(targetUser)` 함수 작성 (내가 운영 중인 팀 목표로 초대)
2. **Step 2 (`index.html`)**:
   - `feedPostHtml` 및 `renderCommFeed` 템플릿의 아바타/이름에 `data-feedprof` 추가 및 포인터 커서 스타일 부여
   - 피드 카드 하단 액션에 퀵 소셜 브릿지 배선
   - `data-sharefeed` 클릭 시 `openFeedShareModal` 호출
3. **Step 3 (`sw.js`)**:
   - PWA 캐시 버전 최신화
4. **Step 4 (검증)**:
   - `npm test` 329개 테스트 및 헌법 13대 게이트 검증
   - 724개 정적 버튼 Zero Dead-Click 전수 검사
   - CDP 모바일 뷰포트(430x932) 스크린샷 캡처 및 시각 검증

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계
> *(주의: 본 원칙은 구현 순서(⑤)와 체크리스트(⑦) 사이에 반드시 독립적으로 존재해야 하며, 생략하거나 합치는 것은 위헌입니다)*
- **시나리오 A (Zero Dead-Click)**: 신규 버튼 및 모달 전수 클릭 시뮬레이션 -> 콘솔 에러 0건 확인
- **시나리오 B (Zero Data Loss)**: 10종 가상 페르소나 데이터 주입 후 업데이트 시뮬레이션 -> 100% 무손실 딥이퀄 대조
- **시나리오 C (Zero UX Regression)**: 게스트 모드, 소셜 로그인 세션 유지, 핵심 루프(E1/E2/E3) 손상 여부 확인
- **시나리오 D (Full State Propagation)**: 데이터 생성/수정/삭제 시 4대 뷰 동시 즉각 렌더링 확인
- **시나리오 E (자동화 게이트 통과)**: `scripts/smoke-test.js` 및 `verify-integrity-gate.js` 100% ALL PASS 설계

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (헌법 제9조 제3항 준수)
- [ ] Step 1~5 순차적 구현 (AI 코드 축약 `// ...` 일절 없이 완전한 실행 코드 작성)
- [ ] 로컬 무결성 게이트 검증: `node scripts/verify-integrity-gate.js` PASS
- [ ] 전수 클릭 검증: `node scripts/verify-all-clicks.js` PASS
- [ ] 스모크 테스트 전수 검증: `npm test` PASS
- [ ] [4단계: 로컬 메인 병합 상태 및 5A 프리뷰 배포] 완결 후 상민님께 실서버 배포 여부 보고

---

## 8. [원칙 ⑧] 본질 완성 및 인과관계 정리 (Closure)
- 소통 피드가 단순 글 목록에서 벗어나, 유저 간의 동반자 형성 및 팀 영입, 인앱 공유로 이어지는 살아있는 소셜 생태계로 완성됨.
