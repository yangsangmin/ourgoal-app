## [블록 1] 작업 배경 및 목적 (Problem & Context)
- 티켓: #TASK-ES-333 (결심 4, 5 통합 이행)
- 상민님 원문 결심 및 지시:
  - 결심 4: "기본 공개범위 -> 같은 테마 공개 (고지 + 되돌리기)"
  - 결심 5: "공개 정보 범위 -> 제목 + 진행률 + 체크인한줄 + 연속일"
  - 2026-10-01 상민님 2순위 작업 지시: "진행"
- 배경: 아워골 서비스 정직성 및 동류 소통(E3) 강화를 위해 목표 기본 공개 범위를 '같은 테마 공개(theme)'로 지정하여 유저 간 안전한 연결감을 증진하고, 생성 직후 고지 및 1초 되돌리기(나만 보기로 변경) 액션을 제공하며, 소통 피드에서 타인에게 노출되는 정보를 4대 핵심 팩트 지표(제목, 진행률, 한줄 실천, 연속일수)로 엄격히 한정하여 사생활 프라이버시를 완벽히 보호함.

## [블록 2] 주요 변경 내역 (Key Changes)
- `index.html`:
  - `VISIBILITY_LABELS`: `theme: '같은 테마 공개'` 신설 (`{ public:'전체 공개', theme:'같은 테마 공개', team:'팀원 공개', private:'나만 보기' }`).
  - `showNewGoalManualForm`: 목표 생성 모달 내 `#mGoalVis`의 기본 선택지를 `<option value="theme" selected>🏷️ 같은 테마 공개 (기본)</option>`로 설정.
  - `showUndoPrivacyToast`: 목표 생성 직후 `#toast`에 "🏷️ 같은 테마 러너에게만 공유돼요" 안내와 함께 `[🔒 나만 보기로 변경]` 1초 되돌리기 버튼 배선 (`#btnUndoThemePrivacy`).
  - `goalsPrivacyBadge` & `goalVisInput`: 목표 화면 뱃지 아이콘(`🏷️`) 및 4단계 순환 로직(`private` -> `theme` -> `team` -> `public` -> `private`) 배선.
  - `renderCommFeed`: 타인 글(`!isMe`)의 세부 회고(`recordText`) 및 피드백 노출을 마스킹하고, 4대 실천 지표(제목, 진행률, 한줄, 연속일) 중심 정돈.
- `scripts/smoke-test.js`: 목표 생성 모달 pre-selected 검증 항목을 'theme' 기본값 전환에 맞춰 정합화.
- `docs/rules/TICKETS.md`: #TASK-ES-333 티켓 등록.
- `docs/specs/REQ-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md`: 요구사항 정의서 (8원칙 완비).
- `docs/specs/PLAN-TASK-ES-333-THEME-VISIBILITY-DEFAULT.md`: 엔지니어링 작업계획서 (8원칙 완비).
- `reports/TASK-ES-333/claims.json`: 법정 심사용 6대 단언문(C1~C6) 작성.

## [블록 3] 법정 판정서 (GitHub Court)
- (GitHub court 실행 후 업데이트 예정)

## [블록 4] 영향 범위 및 롤백 대책 (Impact & Rollback Plan)
- 영향 범위: 신규 목표 생성 폼, 목표 상세 공개범위 배지, 소통 탭 피드 노출 범위
- 롤백 대책: PR 닫기 또는 `git revert` 시 기존 코드로 즉시 복구 가능. 기존 유저의 기존 목표 설정값은 100% 무손실 보존됨.
