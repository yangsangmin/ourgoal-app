# 실행 계획서 (PLAN) — 16개 MBTI 연계 320개 아바타 페르소나 온톨로지 확장 (#TASK-ES-126)

> **문서 ID**: PLAN-TASK-ES-126-AVATAR-320-PERSONAS  
> **티켓 연계**: #TASK-ES-126  
> **작성 일시**: 2026-09-16  
> **작성자**: Antigravity 세션 454cedb2  

---

## 1. 구현 세부 계획

### Step 1: 페르소나 데이터셋 및 컬러/아이콘 팔레트 생성
- 16개 MBTI × 20개 = 총 320개 페르소나 객체 배열 정의 (`BODY_THEMES_320`).
- 각 MBTI 그룹별 대표 테마 컬러 매핑:
  - 분석형 (NT: INTJ, INTP, ENTJ, ENTP): 보라/남색/다크인디고 계열 (#4F46E5, #7C3AED, #1E1B4B 등)
  - 외교형 (NF: INFJ, INFP, ENFJ, ENFP): 에메랄드/그린/민트/소프트로즈 계열 (#059669, #10B981, #E11D48 등)
  - 관리자형 (SJ: ISTJ, ISFJ, ESTJ, ESFJ): 블루/네이비/슬레이트/앰버 계열 (#1E3A8A, #0284C7, #D97706 등)
  - 탐험가형 (SP: ISTP, ISFP, ESTP, ESFP): 오렌지/레드/옐로우/바이올렛 계열 (#EA580C, #EF4444, #F59E0B 등)

### Step 2: 하위 호환성 (Backward Compatibility) 함수 구현
- 기존 `BODY_THEMES_77` 배열은 보존하되, 신규 `BODY_THEMES_320`와 연계.
- `OurgoalAvatar.getTheme(themeId)`:
  - 1~320 범위 내에서 `BODY_THEMES_320`에서 우선 조회.
  - 레거시 77종 데이터셋과도 100% 호환 반환.
- `OurgoalAvatar.getAllThemes()`:
  - 전체 320개 테마 반환.
- `OurgoalAvatar.getThemesByMbti(mbti)`:
  - 특정 MBTI에 해당하는 20개 테마 필터 반환.
- `OurgoalAvatar.getThemesByGroup(group)`:
  - 4대 군('NT', 'NF', 'SJ', 'SP')별 80개 테마 필터 반환.

### Step 3: 아바타 선택 드로어 UI 확장 및 렌더링 최적화
- `renderAvatarThemeSelector(container, selectedId, userMbti)`:
  - 상단에 MBTI 맞춤 추천 탭 및 4대 군(NT, NF, SJ, SP) 필터 탭 제공.
  - 검색창(테마명, 키워드, 카테고리) 실시간 필터링 지원.
  - 320종 렌더링 시 DOM 렌더링 오버헤드를 막기 위해 선택된 탭 기준 20~80개씩 즉각 렌더링.

### Step 4: 자동화 스모크 테스트 추가
- `scripts/smoke-test.js`에 다음 검증 추가:
  - `OurgoalAvatar.getAllThemes().length === 320`
  - ID 1~320 중복/누락 0건
  - 16개 MBTI 각각 정확히 20개
  - `OurgoalAvatar.getTheme(77)` 및 `OurgoalAvatar.getTheme(320)` 유효성

### Step 5: 무결성 검증 및 Tri-Sync 동기화
- `wc -l index.html` 22,196줄 검증.
- `npm test` ALL PASS 검증.
- `docs/rules/TICKETS.md`, `dev_log.md`, `journal.jsonl`, `tri-sync.js` 동기화.
