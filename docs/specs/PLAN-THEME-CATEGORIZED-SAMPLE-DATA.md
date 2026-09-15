# [PLAN-THEME-CATEGORIZED-SAMPLE-DATA] 추천 샘플 데이터 테마별 카테고리화 및 효과적 UI/UX 엔지니어링 계획서

- **티켓**: `#TASK-ES-093`
- **본질 태그**: `[E2]` 5단위 회고 및 추천 샘플 데이터 테마별 모아보기 UI/UX 고도화
- **작성 일시**: 2026-09-15
- **담당**: Antigravity (상민님 지시 완결)
- **규범 준수**: `OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` (헌법 제2조: 2중 8원칙, 제18조: 지시 의도 스코프 준수, 제19조: 4위 1체 배선)

---

## 1. 파일별 변경량 예산 및 격리 방침
- **`js/universal-stats.js`**:
  - `generateDomainSample(domainKey)` 확장: 운동 7종(하이록스, 파워리프팅, 요가/필라테스, 러닝, 크로스핏, 수영, 클라이밍), 업무 7종, 공부 7종, 재테크 7종, 웰니스 7종 생성 로직 완비.
  - `openUniversalImportModal`: 상단 테마 칩 바 (`u-theme-tab-btn`) 및 선택된 테마의 7종 카드 렌더링 배선.
  - 예산: 순증가 220줄 이내.
- **`ui.css`**:
  - `.u-theme-tab-row`, `.u-theme-tab-btn`, `.u-sample-card-grid` 반응형 스타일 (약 40줄).
- **`scripts/smoke-test.js`**:
  - `#TASK-ES-093` 컴플라이언스 체크 (약 35줄).
- **`scripts/test-universal-stats-ux.js`**:
  - 테마별 7대 샘플 렌더링 및 하이록스 데이터 융합 테스트 보강 (약 40줄).
- **`index.html`**:
  - 순증가 0줄 엄수.

---

## 2. 8단계 엔지니어링 실행 계획 (헌법 제2조 준수)
1. **1단계 (기획·설계)**: REQ/PLAN 수립, task-link 갱신, Obsidian Vault 동기화.
2. **2단계 (시뮬레이션 및 구현)**:
   - `SAMPLE_CATALOG` 5개 테마 × 7개 종목 정의.
   - 하이록스(HYROX) 등 최신 트렌드 운동 종목 메트릭 생성기 완비.
   - `openUniversalImportModal` 테마 필터 탭 UI 및 원터치 1초 로드 배선.
   - `ui.css` 스타일 추가.
   - `npm test` 전수 통과 (241개+).
3. **3단계 (로컬 수동 확인)**: `http://localhost:8000` 환경에서 테마별 7종 샘플 확인 및 상민님 보고.
4. **4단계 (메인 병합)**: PR 및 main 브랜치 병합.
5. **5~6단계 (배포 및 실운영 확인)**: Vercel 프로덕션 배포 및 최종 검증.
