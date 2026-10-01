# [작업계획서] #TASK-CHORE-SHIPYARD-MODULAR-CONSTITUTION: 조선소 블록형 모듈화 및 진화형 아키텍처 헌법 개정 및 전면 정비

> **문서 상태**: [정본] 상민님 최종 승인 완료 (승인선 5: 규범 변경)  
> **적용 규격**: 아워골 최고 헌법 제2조(2중 8원칙 헌법) 제2항 및 제5항 100% 준수  
> **분류 축**: `[INFRA / 아키텍처 거버넌스]`

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악
- **REQ 핵심 요약**: 단일 모놀리스(38,468줄) 관행을 영구 타파하고, 조선소 메가블록-소블록 조립 공법을 최고 헌법에 명문화하며 낡은 족쇄(`TECH-RULE-01`)를 공식 폐기.
- **영향받는 파일 전수 목록 (금고 단독 PR 범위)**:
  - `docs/rules/archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.10.02_STAGE_TRANSITION.md` (신규 아카이브 생성)
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` (정본 헌법 본문 개정)
  - `docs/rules/CONSTITUTION_VERSIONS.md` (버전 대장 갱신)
  - `AGENTS.md` (전역 공통 정본 동기화)
  - `CLAUDE.md`, `GEMINI.md` (도구별 정본 미러 동기화)
  - `docs/specs/REQ-SHIPYARD-MODULAR-CONSTITUTION.md`, `docs/specs/PLAN-SHIPYARD-MODULAR-CONSTITUTION.md` (8원칙 명세서)

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 배선(Wire) 식별
- **[가목] 본질 (Essence)**:
  - 조선소 블록 건조 규범(제3조 제9항)의 헌법 정본 편입을 통해 38,000줄 모놀리스 스파게티 위험을 영구 차단하고, 수밀 격벽 구조로 시스템 안정성을 극대화하는 아키텍처 거버넌스 확립.
- **[나목] 원인 (Root Cause)**:
  - 기존 헌법 조항(제1조 2항, 제4조 1항 7호, 제5조 3항, 제7조 7항, 제15조 6항 3호)이 단일 거대 모놀리스 전제 문구를 담고 있어 분리 아키텍처 적용 시 위헌 충돌을 초래하는 근본 원인 해소.
- **[다목] 중심 (Core Flow)**:
  - 상민님 승인 ➔ 헌법 제3조 제9항 신설 ➔ 기존 5대 조항 정합 개정 ➔ 버전 대장 등록 ➔ AGENTS.md 미러 정본 동기화의 단일 법제 파이프라인.
  ```text
  상민님 승인 ➔ 헌법 제3조 제9항 신설 ➔ 기존 5대 조항 정합 개정 ➔ 버전 대장 등록
     │
     └──> 향후 제품 코드 분리 시: js/core/ (Event Bus) ➔ js/tabs/ (메가/소블록) ➔ index.html (도크)
  ```
- **[라목] 핵심 (Critical Anchor)**:
  - 런타임 `state` 객체(`state.goals`, `state.records`, `state.profile`) 및 로컬스토리지 키 영구 불변 보존(Zero Data Loss). 본 헌법 개정은 순수 규범/금고 정비이므로 런타임 데이터 영향도 0%.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)
- **파일별 변경 예산 (Diff Budget)**:
  - `docs/rules/archive/...`: 신규 생성 (+828줄)
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`: 약 +120줄 / -30줄 (제3조 제9항 신설 및 5대 조항 개정)
  - `docs/rules/CONSTITUTION_VERSIONS.md`: 약 +5줄 / -1줄 (신규 버전 추가)
  - `AGENTS.md`: 약 +30줄 / -10줄 (버전 및 제3조 요약 갱신)
  - `CLAUDE.md`, `GEMINI.md`: 각 약 +30줄 / -10줄 동기화
- **4위 1체 배선 명세**:
  - 본 작업은 헌법 거버넌스 문서 단독 정비이므로 UI 마크업 변경 없음 (금고 단독 PR 규약 준수).

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증
- **유저 자산 100% 보존 재확인**:
  - `index.html`, `ui.css`, `js/` 등 제품 코드는 단 1바이트도 수정하지 않으므로 기존 유저 데이터 및 320종 기능 손실 가능성 0%.
- **15대 조문 위계 불파괴 보증**:
  - 독립 조항 제16조 대신 **제3조 제9항**으로 정합 편입하여, 기존 15대 조문 체계(`1 <= i <= 15`)와 `verify-integrity-gate.js` line 401 단언을 100% 만족함.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)
1. **Step 1**: 현재 헌법 원문을 `docs/rules/archive/OURGOAL_ABSOLUTE_INTEGRITY_RULES_v2026.10.02_STAGE_TRANSITION.md`로 비파괴 복사 저장.
2. **Step 2**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 개정:
   - 버전 헤더: `2026.10.02-SUPREME-15-ARTICLES-SHIPYARD-MODULAR-ARCHITECTURE`
   - 총괄 목차 제3조 요약에 `[조선소 블록형 모듈화 및 진화형 아키텍처 규범]` 추가
   - 제1조 제2항, 제4조 제1항 7호, 제4조 제2항 1호 개정 (프로덕션 코드베이스 범위 및 스타일시트 격리)
   - 제5조 제3항 개정 (`TECH-RULE-01` 2만 줄 하한선 공식 폐기 선언)
   - 제7조 제7항 개정 (검증 게이트 스캔 범위 확장)
   - 제15조 제6항 3호 개정 (4대 뷰 동시 전파를 Event Bus Pub/Sub으로 개정)
   - 제3조 제9항 신설 등재 (1~4호: 도크-메가-소블록 3계층, 플러그인 레지스트리, 800줄 상한 자가분열, Core 통신 의무)
3. **Step 3**: `docs/rules/CONSTITUTION_VERSIONS.md` 대장에 신규 버전 행 추가.
4. **Step 4**: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` 동기화.
5. **Step 5**: `node scripts/verify-integrity-gate.js` 실행하여 린터 및 헌법 15대 조문 무결성 전수 검증.
6. **Step 6**: `node C:/dev/command-center/lib/tri-sync.js check` 실행하여 3자 동기화 상태 점검.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계
- **법정 심사 특성**: 본 PR은 금고(frozen) 단독 변경 PR이므로 제품 코드 주장은 생성하지 않음.
- **확인 시나리오**:
  - `court/judge.js`의 `v.vault.violations` 검사 시 `VAULT_MIXED` 없음 (제품 코드 미포함).
  - `verify-integrity-gate.js`의 헌법 15대 조문 정적 검사 통과.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트
- [x] Step 1: 비파괴 아카이브 생성
- [ ] Step 2: 헌법 본문 개정 (`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`)
- [ ] Step 3: 버전 대장 갱신 (`docs/rules/CONSTITUTION_VERSIONS.md`)
- [ ] Step 4: `AGENTS.md` 및 미러 동기화
- [ ] Step 5: `node scripts/verify-integrity-gate.js` 전수 실행 검증
- [ ] Step 6: Tri-Sync 검증 및 상민님 최종 보고

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획
- **잠재 오류**: 조문 내 특정 단어(`잔디` 등) 누락 감지 또는 헤더 형식 오타.
- **롤백 계획**: Step 1에서 생성한 아카이브 파일(`docs/rules/archive/...`)로부터 원본 즉시 복원 가능.
