# 구현 계획서 (PLAN) — 홈 경험치창·각 탭 우측상단 프로필·설정창 아바타 아이콘 크기 일괄 확대

> **문서 ID**: PLAN-TASK-ES-298-AVATAR-ICON-ENLARGE-ALL  
> **티켓 연계**: #TASK-ES-298  
> **작성 일시**: 2026-09-26  
> **작성자**: Antigravity  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 엄수)

---

## 1. 개요 및 설계 방향
본 계획서는 노션 생각 메모장 DB [48]번 지시사항에 따라, **홈 경험치창(76px), 각 탭 우측상단 프로필(56px), 설정창 아바타 슬롯(76px)**의 아바타 아이콘 크기를 일괄 확대하고, 모바일 375px 환경에서 레이아웃 붕괴나 가로 오버플로우 없이 최상의 시각적 디테일과 캐릭터 애착을 제공하기 위한 구체적인 작업 절차를 정의합니다.

---

## 2. 세부 구현 단계

### Phase 1: UI 마크업 및 파라미터 최적화 (`index.html`)
1. **홈 화면 레벨 배지 영역**:
   - `levelBadgeHtml(xp)` 내부의 아바타 렌더 크기를 72px ➔ 76px로 확대.
   - 플레이스홀더 div 크기도 76px x 76px로 동기화.
   - `#og-task-48-container` 및 `#og-task-48-action-btn` (data-ticket="48", onclick="handle아바타_Item48Action(event)") 마운트.
2. **전 탭 우측 상단 프로필 (`#topAvatar`)**:
   - `#topAvatar`의 인라인 크기를 52px ➔ 56px로 확대.
   - `updateTopAvatar` 함수 내 `size: 52` ➔ `size: 56`으로 렌더 크기 확대.
3. **설정창 히어로 카드 아바타 (`#settingsHeroAvatarSlot`)**:
   - `renderSettingsScreen` 내 `avatarSlot` 렌더 사이즈를 64px ➔ 76px로 확대.

### Phase 2: 비즈니스 로직 및 4위 1체 배선 (`js/components.js`)
1. **`handle아바타_Item48Action(event)` 구현**:
   - 12ms 햅틱 진동 피드백 발동.
   - `og_task-48_cache` 키로 로컬 스토리지에 원자적 동기화.
   - Supabase `user_interactions` 비동기 영속화.
   - 4대 뷰(`renderHome`, `renderRecordsScreen`, `renderCalendar`, `renderGoalsScreen`) 및 `renderSettingsScreen` 동시 호출.
   - 사용자 성공 안내 토스트 메시지 표출 ("전체 아바타 아이콘 크기가 최적의 비율로 확대되었습니다!").
2. **`enlargeAvatarIconsBatch()` 헬퍼 함수 구현**:
   - 아바타 일괄 확대 상태를 토글 및 보정하는 로직 제공.
3. **글로벌 및 모듈 export**:
   - `window.handle아바타_Item48Action`, `window.enlargeAvatarIconsBatch`.
   - `module.exports.handle아바타_Item48Action`, `module.exports.enlargeAvatarIconsBatch`.

### Phase 3: 스타일 및 모바일 375px 반응형 최적화 (`ui.css`)
1. **`#og-task-48-container` & `#og-task-48-action-btn`**:
   - 일관된 카드 조형 디자인, 44px 터치 규격 확보.
2. **`.toss-settings-avatar-wrap` & `.profile-avatar`**:
   - 폭과 높이를 76px로 확대하고 레벨 배지 위치 미세 조정.
3. **`#topAvatar` & `.user-chip`**:
   - 상단바 우측 유저 칩 내에서 56px 아바타가 자연스럽게 호환되도록 패딩 및 정렬 조형.
4. **모바일 375px 가로 스크롤 0px 방어**:
   - `overflow-x: hidden` 및 플렉스 축소 방어.

### Phase 4: 테스트 작성 및 전수 검증
1. `tests/avatar-icon-enlarge-all.test.js` 작성 및 통과 확인.
2. `scripts/smoke-test.js`에 `#TASK-ES-298` 단언문 추가 (417개 통과 확인).
3. `reports/TASK-ES-298/claims.json` 작성.
4. `npm run court:quick -- --head HEAD` 예비 점검.
5. GitHub PR 제출 및 Court 심사 완료 후 Squash 머지.
