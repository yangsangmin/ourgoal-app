# [요구사항 정의서] #TASK-ES-324 [73] 프로필 편집 내 잇템등록 > 잇템추가 버튼 작동 안함 오류 수정

## 1. 개요 및 배경
- **티켓 ID**: `#TASK-ES-324` (노션 생각 메모장 [73]번)
- **과제명**: `[73] 프로필 편집 내 잇템등록 > 잇템추가 버튼 작동 안함 오류 수정`
- **원문 지시**: `내 잇템등록의 잇템추가 작동안함`
- **본질축**: `FIX/UX` (버그 수정 및 모바일 체감 사용성 무결성 확보)
- **배경**:
  - 모바일 프로필 편집창에서 사용자가 애용하는 운동 장비나 꿀템을 등록할 수 있는 `+ 잇템 추가` 버튼이 26px 크기로 작아 모바일 터치 미스가 발생하고, 등록된 잇템이 없을 때 안내 카드 `[+ 잇템 추가]를 눌러 등록해보세요!`를 탭해도 폼이 열리지 않는 결함이 존재함.
  - 잇템을 입력하고 [잇템 등록 완료]를 눌러도 하단의 전체 [저장] 버튼을 누르지 않은 채 모달을 닫으면 방금 등록한 잇템이 날아가는 비원자적 상태 결함이 존재함.
  - Supabase `users` 테이블 upsert 시 `it_items` 누락으로 인해 원격 동기화가 되지 않는 데이터 결함이 존재함.
  - 설정창 상단의 빠른 프로필 편집 버튼이 아바타 모달만 열어 잇템 등록 화면에 접근하기 어려웠던 동선 혼선이 존재함.

---

## 2. 세부 요구사항 (Requirements)
1. **R1**: `index.html` 내 프로필 편집창 `openProfileEditor`에서 `+ 잇템 추가` 버튼(`#pvAddItItem`)의 터치 타겟을 최소 44px 이상(`min-height: 44px;`)으로 보장하고, 폼 열림 상태에 따라 버튼 텍스트가 `+ 잇템 추가` / `× 닫기`로 토글되며 12ms 햅틱 반응을 제공함을 보장한다.
2. **R2**: `index.html` 내 `openProfileEditor`의 빈 상태 잇템 안내 상자(`pvItItemsContainer` 내 빈 안내 카드 `#pvEmptyItItemTrigger`)를 탭/클릭했을 때도 즉시 인라인 잇템 등록 폼(`pvInlineItItemForm`)이 열리고 잇템 이름 입력창(`#itNameInput`)으로 부드럽게 스크롤 포커스됨을 보장한다.
3. **R3**: `index.html` 내 잇템 등록 완료(`btnConfirmInlineItItem`) 및 잇템 삭제(`data-delititem`) 시 즉시 `state.profile.itItems`에 반영되고 로컬 스토리지(`ourgoal_profile_backup_<uid>`, `ourgoal_guest_profile`)에 즉시 2중 영속화되며 4대 뷰에 동시 전파되어 데이터 유실이 원천 차단(Zero Data Loss)됨을 보장한다.
4. **R4**: `index.html` 내 `saveProfile` 및 `loadProfile`에서 `it_items`를 Supabase `users` 테이블에 안전하게 upsert 및 복원 처리(컬럼 부재 시 자동 폴백)함을 보장한다.
5. **R5**: `index.html` 내 설정 화면 상단의 `btnSettingsQuickAvatar` 클릭 시 아바타 변경과 함께 프로필 편집 모달(`openProfileEditor`)로의 직통 접근 옵션 또는 명확한 프로필 편집 브릿지를 제공함을 보장한다.
6. **R6**: `js/components.js` 내에 표준 직통 핸들러 `handle프로필_Item73Action`을 구현하여 12ms 햅틱 반응, `og_task-73_cache` 로컬 캐시 영속화, Supabase 액션 로그 적재, 4대 뷰 원자적 동시 전파를 완결하고 `window.handle프로필_Item73Action`으로 전역 노출함을 보장한다.
7. **R7**: `tests/profile-edit-ititem.test.js` 단위 테스트 및 `scripts/smoke-test.js` 내에 `#TASK-ES-324` 검증 테스트가 작성되어 무결점을 전수 입증함을 보장한다.
8. **R8**: `docs/rules/TICKETS.md`에 `#TASK-ES-324`가 승인 티켓으로 등록되어 있음을 보장한다.
