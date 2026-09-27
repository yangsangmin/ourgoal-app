# PLAN-TASK-ES-326: 프로필 지역공개 토글 스위치 설정 및 저장 오류 수정 및 안심 로컬 동반자 UX 완결 계획서

## 1. 아키텍처 및 구현 계획

### 1) 스타일 고도화 (`ui.css`)
- `.pv-region-toggle-wrap`: 최소 44px 이상 터치 영역 및 패딩 확보.
- `.pv-region-badge`: `🛡️ 안심 공개 중 (시군구만 노출)` (초록/브랜드 테마) vs `🔒 완전 비공개` (뉴트럴/세컨더리 테마) 실시간 칩.
- `.pv-region-benefit-card`: 토글 ON 시 부드러운 슬라이드 인 애니메이션(`opacity`, `transform`)으로 노출되는 로컬 동반자 연결 가치 카드.
- 4대 테마(성소, 블랙, 화이트, 도심) 전 테마에서 고대비 시인성 보장.

### 2) 프로필 편집 모달 인터랙션 개선 (`index.html`)
- `openProfileEditor`:
  - 마크업: `#pvRegionPublic` 상단 및 하단에 `#pvRegionPublicBadge`, `#pvRegionBenefitCard` 동적 컨테이너 배치.
  - 리스너:
    - 클릭 시 `draft.regionPublic` 토글.
    - 만약 `!regionRef.value`이고 켜려고 할 때: `toast('동네(시군구)를 먼저 선택해주세요 ✨')`, 동네 셀렉트 박스(`pvRegion_city` or `pvRegion_dist`)로 포커스 및 하이라이트.
    - 상태에 따른 배지 텍스트/스타일 및 혜택 카드 실시간 렌더링.
    - 12ms 햅틱 반응 (`navigator.vibrate(12)`).
    - `syncInputsToDraft()` 및 백업 스토리지 임시 동기화.
  - `pvSave`:
    - `p.regionPublic = !!draft.regionPublic;`
    - `p.region = regionRef.value || '';`
    - `ourgoal_profile_backup_<uid>` 및 `ourgoal_guest_profile`에 2중 백업.
    - `saveProfile()` 비동기 호출.
    - 4대 뷰 원자적 전파 (`renderProfileCard`, `renderSettingsScreen`, `renderHome`, `renderCommScreen`, `renderAll`).

### 3) 4위 1체 직통 액션 핸들러 구현 (`js/components.js`)
- `handle프로필_Item75Action(event, customPayload)`:
  - 12ms 햅틱 반응.
  - `og_task-75_cache` 로컬 캐시 영속화.
  - `state.profile.regionPublic` 갱신 및 백업 스토리지 동기화.
  - 4대 뷰 동시 전파.
  - `OurgoalComponents`, `window`, `module.exports` 노출.

### 4) 테스트 및 검증 계획
- 단위 테스트: `tests/profile-region-public.test.js`
- 스모크 테스트: `scripts/smoke-test.js`에 `#TASK-ES-326` 검증 추가.
- CDP 모바일 실측: 375px 모바일 뷰포트에서 스위치 클릭, 배지 변경, 혜택 카드 렌더링, 프로필 카드 반영 실측.
- 주장 파일: `reports/TASK-ES-326/claims.json`.
- GitHub Court 통과.
