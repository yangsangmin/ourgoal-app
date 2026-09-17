# 작업계획서 (PLAN) — 아바타 바꾸기 버튼 조건부 숨김 및 전 탭 볼드 모듈러 UI 전면 개편

> **문서 ID**: PLAN-TASK-ES-170-avatar-change-banner-and-all-tabs-ui  
> **티켓 연계**: #TASK-ES-170  
> **작성 일시**: 2026-09-17  
> **작성자**: Antigravity  
> **귀속 축**: E1 / UI 혁신 (아바타 UX 최적화 및 전 탭 시인성 대폭 강화)  
> **규범 준수**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) 준수 (헌법 제2조 2중 8원칙 2회차 엄수)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  - 아바타를 1회 이상 적용한 사용자에게는 '내 아바타 바꾸기' 버튼을 영구 숨김 처리하고, 경험치창 아바타 및 화면 우측 상단 프로필(`topUserChip`) 클릭 시 원터치로 아바타 모달을 열 수 있도록 배선.
  - 홈탭에 적용했던 2px 볼드 모듈러 보더 스타일을 목표, 캘린더, 기록, 소통, 설정 전 탭으로 전면 확장하여 초보자도 칸 구획을 즉시 인지하도록 개선.
- **영향받는 파일 전수 목록**:
  - `docs/specs/REQ-TASK-ES-170-avatar-change-banner-and-all-tabs-ui.md`
  - `docs/specs/PLAN-TASK-ES-170-avatar-change-banner-and-all-tabs-ui.md`
  - `index.html` (`levelBadgeHtml`, `renderLevelBadge`, `topUserChip` 클릭 리스너)
  - `js/avatar-system.js` (`saveProfile()` 시 `avatarChangedOnce = true` 영속화)
  - `ui.css` (전역 `--card-border` 및 전 탭 카드 스타일 승격)
  - `sw.js` (`CACHE_NAME` 갱신)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 및 배선(Wire) 식별 (Essence, Causes, Core, Anchor & Wire)

- **[본질] (Essence)**:
  - 아바타 진입 동선의 효율화(신규 유저 안내 vs 기존 유저 1터치 직통)와, 앱 전역의 칸 구분을 명확히 하는 모듈러 시각 언어의 일관성 구축.
- **[원인] (Causes)**:
  - 기존 코드에 아바타 변경 이력 플래그가 없고, 전역 카드의 테두리가 1px 8% 알파로 낮아 전 탭에서 칸 경계가 흐릿했음.
- **[중심] (Core)**:
  - `hasUserCustomizedAvatar(profile)` 판별 기반 버튼 노출 제어, `topUserChip` 아바타 모달 연계, `ui.css` 전역 `--card-border` 2px 볼드 승격.
- **[핵심] (Anchor)**:
  - 신규 가입자 안내 보존 + 1회 적용자 버튼 영구 비노출 보장.
  - 경험치 아바타 및 상단 프로필 칩의 100% 모달 직통 열림.
  - 전 5개 탭의 2px 볼드 테두리 동시 실현.
- **종단간 데이터 흐름 다이어그램**:
  ```
  [User Action: 아바타 사진 적용 / 변경]
         ↓
  [avatar-system.js: saveProfile] → settings.avatarChangedOnce = true 영구 저장
         ↓
  [renderLevelBadge] → hasUserCustomizedAvatar() === true → 버튼 style="display:none;"
         ↓
  [User Click: 경험치 아바타 OR 우측상단 topUserChip] → openAvatarModal() 즉각 오픈
  ```

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **기획 단계 스토리지 원장화 3대 명세 (헌법 제2조 제4항 준수)**:
  - **1호 (원격 DB 스키마 명세)**: Supabase `users.settings` JSONB 컬럼 내 `avatarChangedOnce: boolean` 키 영속화 (추가 DDL 불필요, 기존 스키마 100% 호환).
  - **2호 (스마트 스토리지 분기 설계)**: 대용량 이미지 자산 기존 3계층(스토리지/IndexedDB/localStorage) 규격 준수.
  - **3호 (4대 뷰 전파 배선도)**: 아바타 변경 시 `renderLevelBadge()`, `updateTopBar()`, `renderHome()` 동시 전파.
- **파일별 변경 예산**:
  - `index.html`: 약 +25줄 / -5줄
  - `js/avatar-system.js`: 약 +6줄
  - `ui.css`: 약 +40줄
  - `sw.js`: 1줄

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Integrity Guarantee)

- **기존 테스트 불파괴**:
  - `#btnOpenAvatarModal` 태그를 DOM에서 제거하지 않고 인라인 스타일 `display:none;` 처리하여 기존 스모크 테스트 어설션 통과.
- **기존 프로필 편집 모달 보존**:
  - 설정 탭의 프로필 편집 기능은 그대로 유지하며, 상단 `topUserChip`은 상민님 지시대로 아바타 모달 직통으로 배선.
- **7대 테마 일관성**:
  - `--card-border`를 `--home-card-border`와 동기화하여 다크 스페이스 등 전 테마에서 2px 볼드 아웃라인이 깨짐 없이 적용됨.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. `js/avatar-system.js`: 아바타 적용 완료 시 `settings.avatarChangedOnce = true` 세팅 로직 추가.
2. `index.html`: `hasUserCustomizedAvatar(profile)` 함수 구현 및 `levelBadgeHtml` 조건부 숨김 처리.
3. `index.html`: `renderLevelBadge` 내 아바타 아이콘에 포인터 커서 및 `openAvatarModal` 바인딩.
4. `index.html`: `updateTopBar` 및 DOMContentLoaded에서 `topUserChip` 클릭 리스너를 `openAvatarModal`로 바인딩.
5. `ui.css`: 전역 `--card-border` 및 전 탭 카드 스타일을 2px 볼드 모듈러 보더로 승격.
6. `sw.js`: `CACHE_NAME` 최신화.
7. 무결성 게이트 및 `npm test` 전수 검증.
8. 3단계 로컬 수동 확인 (CDP 스크린샷).
9. 4단계 로컬 main 병합 및 5A Vercel 프리뷰 배포.

---

## 6. [원칙 ⑥] 절차 재검증: 5대 무결성 검증 시나리오 설계 (Verification & Anti-SPOF)

- **검증 A (Zero Dead-Click)**: `topUserChip` 및 경험치 아바타 클릭 시 에러 없이 아바타 모달 오픈.
- **검증 B (Zero UX Regression)**: 신규 계정에서 버튼 노출, 변경 후 비노출 확인.
- **검증 C (Zero Data Loss)**: 아바타 보관함 및 프로필 데이터 무손실 검증.
- **검증 D (Full State Propagation)**: 아바타 변경 시 상단바와 홈탭 동시 갱신.
- **검증 E (자동화 게이트 통과)**: `npm test` 309개 ALL PASS.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Milestones & Checklist)

- [x] 1단계: REQ / PLAN 문서 수립
- [ ] 2단계: 코드 배선 및 전 탭 볼드 모듈러 CSS 확장
- [ ] 3단계: 로컬 CDP 시뮬레이션 및 스크린샷 검증
- [ ] 4단계: 로컬 main 병합 및 5A Vercel 프리뷰 자동 배포

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Rollback & Anti-Blocker)

- **잠재 블로커**:
  - `topUserChip` 클릭 시 이벤트 버블링으로 인한 부작용.
- **대책**:
  - `e.preventDefault()`, `e.stopPropagation()` 안전핀 장착.
