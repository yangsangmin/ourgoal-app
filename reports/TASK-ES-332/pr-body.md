## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-332 (마인드맵 결심 안 A 확정 이행)
- 상민님 원문 결심 및 지시:
  - 490108: "기존 가상 인물 40인 삭제 -> 40인 및 가짜 응원/댓글 생성기 전면 삭제 (순수 실사용자 중심으로 전환, 헌법 제4조 1항 1호/7호 준수)"
  - 490102: "공개범위 선택 '팔로워만' 기능 구현 -> 미작동 followers 옵션 제거, 기존 followers 목표는 team(팀원 공개)으로 무손실 정규화"
  - 490601: "피드에 ai 가이드 글 1개 노출 유지 or 삭제 -> 가상 봇 주입 로직 제거, 순수 실사용자 피드 일원화"
- 배경: 아워골 서비스 정직성 헌법(제4조 1항 1호/7호 '가짜 실제구현 금지') 및 상민님 결심에 따라 하드코딩된 가상 페르소나 40인(`SIM_PERSONAS`)과 가짜 응원/댓글 생성기를 전면 영구 제거하고, 미작동 중이던 `followers` 공개 옵션을 UI에서 제거하며 기존 데이터는 `team`(팀원 공개)으로 100% 무손실 마이그레이션함.

## [블록 2] 주요 변경 내역 (Key Changes)
- `index.html`:
  - `SIM_PERSONAS`: 하드코딩된 40인 가상 페르소나 객체 배열을 `var SIM_PERSONAS = [];` 빈 배열로 변경하여 위조 인물 0건화 (외부 참조 타입에러 방지).
  - `defaultSettings().virtualCheerEnabled`: `false`로 설정하여 가상 응원 기본 비활성화.
  - `triggerFirstCheerResponse`: `virtualCheerEnabled === false` 방화벽 가드 및 봇 응원 발송 차단.
  - `addSimulatedCheerAndReplyToPost`: 가짜 봇 응원/답글 스케줄러 no-op 처리.
  - `mGoalVis`: 목표 생성 모달 내 `<option value="followers">` 제거.
  - `loadProfile` & `initApp`: 목표 로드 및 게스트 프로필 복원 시 `followers` -> `team` 자동 정규화 및 영구 보존.
  - `VISIBILITY_LABELS`: `{ public:'전체 공개', team:'팀원 공개', private:'나만 보기' }` 표준화.
  - `renderCommFeed`: 순수 실사용자 게시글(`realCombined`) 기반 렌더링 일원화 및 단독 봇 주입 배제.
- `js/viral-sharing.js`:
  - `showFeedGuestViewerModal`: `global.SIM_PERSONAS` 가상 페르소나 폴백 의존성 제거.
- `docs/rules/TICKETS.md`:
  - `#TASK-ES-332` 정식 티켓 등록.
- `docs/specs/REQ-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS.md`:
  - 요구사항 정의서 (8원칙 완비, 헌법 게이트 100% 통과).
- `docs/specs/PLAN-TASK-ES-332-PURGE-MOCK-PERSONAS-FOLLOWERS.md`:
  - 엔지니어링 작업계획서 (8원칙 완비, 헌법 게이트 100% 통과).
- `reports/TASK-ES-332/claims.json`:
  - 법정 심사용 6대 정적 주장(C1~C6) 작성.

## [블록 3] 법정 판정서 (GitHub Court)
- (GitHub court 실행 후 업데이트 예정)

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: 신규 유저 첫 체크인 응원, 소통 탭 피드 렌더링, 목표 생성/조회 공개범위 라벨
- 롤백 대책: PR 닫기 또는 `git revert` 시 기존 코드로 즉시 복구 가능. 기존 데이터는 `team`으로 정규화되어 데이터 유실 없음.
