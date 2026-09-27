# 실행 계획서 (PLAN) — 프로필 내 동네(Region) 시군구 설정 및 저장 오류 수정 및 쾌속 스마트 탐색 UX 완결

> **문서 ID**: PLAN-TASK-ES-327-PROFILE-REGION-PICKER-FIX  
> **티켓 연계**: #TASK-ES-327  
> **작성 일시**: 2026-09-27  
> **작성자**: Antigravity AI  
> **기반 규범**: [OURGOAL_ABSOLUTE_INTEGRITY_RULES](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) (헌법 제2조 2중 8원칙 준수)

---

## 1. 개요 및 변경 범위

- **대상 파일**:
  1. `ui.css`: 동네 요약 바(`.pv-region-summary-bar`), 초기화 버튼(`.pv-region-clear-btn`), 1초 스마트 검색창(`.pv-region-search-wrap`, `.pv-region-search-input`), 스마트 결과 칩 컨테이너(`.pv-region-search-results`), 44px 터치타겟 및 활성화(`.active`) 고대비 스타일링.
  2. `index.html`:
     - `regionPickerHtml`: 상단 요약 바, 초기화 버튼, 검색 인풋 필드, 시/도 탭 및 구 그리드 마크업 구조 개선.
     - `wireRegionPicker`: 기존 시그니처 100% 유지(`wireRegionPicker(sheet, 'pvRegion', regionRef);`), 기존 저장 값 기반 시/도 및 구 자동 활성화, 검색 필터링/결과 클릭 바인딩, 초기화 클릭 핸들러, 12ms 햅틱 반응, [75] 로컬 동반자 혜택 카드 실시간 갱신.
     - `pvSave`: 프로필 저장 시 `region` 값 안전 추출, 로컬스토리지 2중 백업, Supabase upsert, 4대 뷰 원자적 전파.
  3. `js/components.js`: 직통 액션 핸들러 `handle프로필_Item76Action` 구현, 12ms 햅틱, `og_task-76_cache` 영속화, 4대 뷰 동시 전파.
  4. `tests/profile-region-picker.test.js`: 동네 선택, 모달 진입 시 자동 활성화, 초기화 기능, 검색 필터링, 영속화 및 4대 뷰 전파 전용 단위 테스트 신설.
  5. `scripts/smoke-test.js`: #TASK-ES-327 검증 assertion 추가.
  6. `scratch/verify_stage3_es327_cdp.js`: 375px 모바일 뷰포트 CDP 실측 및 스크린샷 캡처 스크립트.
  7. `reports/TASK-ES-327/claims.json`: 법정 주장서 작성.

---

## 2. 단계별 세부 실행 계획

### [1단계] CSS 스타일 정의 (`ui.css`)
- `.pv-region-summary-bar`: 상단에 현재 설정된 동네 표시 (`background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 12px;`).
- `.pv-region-clear-btn`: ✕ 초기화 버튼 (`background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer; min-height: 32px;`).
- `.pv-region-search-wrap` & `.pv-region-search-input`: 깔끔한 검색창 (`width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 13px; outline: none; transition: border-color 0.2s;`).
- `.pv-region-search-results`: 검색어 입력 시 노출되는 추천 구 칩 컨테이너 (`display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; max-height: 120px; overflow-y: auto;`).
- 탭 및 칩 터치타겟 44px 보장 및 active 시 확고한 테마 컬러 적용.

### [2단계] 동네 선택기 마크업 및 로직 구현 (`index.html`)
- `regionPickerHtml`:
  - 상단 요약 바 (`#pvRegionSummaryBar`) + 초기화 버튼 (`#pvRegionClearBtn`).
  - 1초 검색창 (`#pvRegionSearchInput`) 및 검색 결과 슬롯 (`#pvRegionSearchResults`).
  - 시/도 탭 그리드 및 시군구 칩 그리드.
- `wireRegionPicker(sheet, prefix, regionRef)`:
  - 전국 시군구 맵(KOREA_REGIONS)을 사전 인덱싱하여 검색 기능 탑재.
  - 진입 시 `regionRef.value` 분석:
    - 값이 있으면 파싱(예: "서울 마포구" -> 시도 "서울", 구 "마포구").
    - 해당 시도 탭에 `.active` 추가 및 해당 시도의 구 목록 렌더링.
    - 해당 구 칩에 `.active` 추가.
    - 요약 바를 `📍 현재 동네: [서울 마포구]`로 업데이트.
  - 검색창 입력 이벤트: 2글자 이상 입력 시 전국 시군구 매칭 목록을 `#pvRegionSearchResults`에 칩으로 렌더링하고, 클릭 시 즉시 선택 완료.
  - 구 칩 클릭 이벤트:
    - 클릭된 칩에 `.active` 부여하고 `regionRef.value = sido + ' ' + gu;` 설정.
    - 요약 바 갱신 및 12ms 햅틱 반응.
    - [75] 로컬 혜택 카드 `#pvRegionBenefitCard` 실시간 갱신.
  - 초기화 버튼 클릭:
    - `regionRef.value = '';`
    - 모든 `.active` 칩 해제.
    - 요약 바를 `📍 아직 설정된 동네가 없어요`로 전환.
    - [75] 로컬 혜택 카드를 미설정 안내 상태로 전환.

### [3단계] 영속화 및 4대 뷰 원자적 전파 (`index.html`, `js/components.js`)
- `pvSave` 루틴:
  - `p.region = regionRef.value || '';`
  - `ourgoal_profile_backup_<uid>`, `ourgoal_guest_profile` 로컬스토리지 백업.
  - Supabase upsert.
  - 프로필 카드, 설정 탭, 홈 피드, 소통 탭 실시간 동기화.
- `handle프로필_Item76Action`:
  - 직통 액션 핸들러 구현.

### [4단계] 검증 및 측정
- 전용 단위 테스트 `tests/profile-region-picker.test.js` 작성 및 통과.
- `scripts/smoke-test.js`에 검증 assertion 추가 후 전수 통과 확인.
- CDP 375px 모바일 실측 스크립트 실행 및 스크린샷 아티팩트 보존.
- `reports/TASK-ES-327/claims.json` 작성 및 `node court/claims.js TASK-ES-327` 통과.
- `npm run court:quick -- --head HEAD` 로컬 예비 점검 통과.

### [5단계] GitHub PR 및 심사 청구
- Git commit: `[E1] #TASK-ES-327 feat: [76] 프로필 내 동네(Region) 시군구 설정 및 저장 오류 수정 및 쾌속 스마트 탐색 UX 완결`
- Git push 및 `gh pr create --draft`.
- GitHub Actions court 결과 확인 (`node court/chat.js <PR번호>`).
- Tri-Sync 종결 (노션 [76] 완료, 관제센터 저널 task_done, `tri-sync.js check` 무결성 검증).
