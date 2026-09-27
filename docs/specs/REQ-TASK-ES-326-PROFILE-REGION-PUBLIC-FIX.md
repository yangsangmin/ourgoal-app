# REQ-TASK-ES-326: 프로필 지역공개 토글 스위치 설정 및 저장 오류 수정 및 안심 로컬 동반자 UX 완결

## 1. 배경 및 목적
- **출처**: 노션 생각 메모장 [75]번 아이디어
- **상민님 원문 메모**: *"프로필에 지역공개 작동안함"*
- **목적**:
  1. 프로필 편집 모달(`openProfileEditor`) 내 지역공개 토글 스위치(`#pvRegionPublic`)의 설정·저장 작동 결함을 근본 해결하고 Zero Data Loss를 보장한다.
  2. 안심할 수 있는 '시군구 안심 바운더리' 캡션 및 실시간 상태 배지(`🛡️ 안심 공개 중 (시군구만 노출)` vs `🔒 완전 비공개 (동네 추천 제외)`)를 도입하여 개인정보 노출에 대한 심리적 불안을 해소한다.
  3. 동네(`region`)가 아직 설정되지 않은 상태에서 토글 시, 기계적 전환 대신 동네 선택기(`regionPickerHtml`)로의 포커스 유도 및 친절한 스마트 넛지를 제공한다.
  4. 지역 공개 활성화 시 같은 동네에서 함께 달리는 동반자 수 및 혜택 프리뷰 카드(`#pvRegionBenefitCard`)를 실시간으로 노출하여 아워골 고유의 로컬 연대 가치를 극대화한다.
  5. 12ms 햅틱 피드백, `js/components.js` 내 표준 직통 핸들러 `handle프로필_Item75Action` 배선, `og_task-75_cache` 영속화, 4대 뷰(프로필 카드, 설정, 홈, 소통) 원자적 동시 전파를 완결한다.

## 2. 요구사항 명세
- **R1 (안심 UI 및 동적 배지)**: `ui.css` 및 `index.html` 내 지역공개 행에 최소 44px 터치타겟, 실시간 상태 배지(`#pvRegionPublicBadge`), 안심 안내 문구, 로컬 동반자 혜택 프리뷰 카드(`#pvRegionBenefitCard`)가 완비됨을 보장한다.
- **R2 (동네 미설정 시 스마트 넛지)**: 동네(`region`)가 비어 있는 상태에서 지역공개 토글을 클릭할 경우, 무의미한 공개 방지를 위해 12ms 햅틱과 함께 동네 선택기를 포커스 및 안내함을 보장한다.
- **R3 (인스턴트 동기화 및 2중 영속화)**: 토글 조작 시 `draft.regionPublic`이 즉시 갱신되며, 저장(`#pvSave`) 시 Supabase 및 `ourgoal_profile_backup_<uid>`, `ourgoal_guest_profile`에 무손실 원자적 2중 저장이 완료됨을 보장한다.
- **R4 (4대 뷰 원자적 동시 전파)**: 저장 후 `renderProfileCard()`, `renderSettingsScreen()`, `renderHome()`, `renderCommScreen()` 등 연계 뷰에 지역 공개/비공개 상태(`📍 지역명` vs `🔒 비공개`)가 지연 없이 원자적으로 즉시 반영됨을 보장한다.
- **R5 (표준 직통 핸들러 4위 1체 배선)**: `js/components.js` 내 `handle프로필_Item75Action`이 구현되어 12ms 햅틱 반응, `og_task-75_cache` 로컬 캐시 영속화, 4대 뷰 동시 전파, 3자 노출(`OurgoalComponents`, `window`, `module.exports`)을 보장한다.
- **R6 (단위 및 스모크 테스트 무결점)**: `tests/profile-region-public.test.js` 단위 테스트 및 `scripts/smoke-test.js` 전수 검증을 통과함을 보장한다.
- **R7 (TICKETS.md 승인 티켓 등록)**: `docs/rules/TICKETS.md`에 `#TASK-ES-326`이 등록되어 본질 게이트를 통과함을 보장한다.
