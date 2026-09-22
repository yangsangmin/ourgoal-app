# [PLAN] #TASK-ES-206 결심권자 즉시 가시성 보장 헌법 제정 (Decision Visibility Mandate)

---

## 1. [원칙 ①] 엔지니어링 아키텍처 및 변경 범위 파악 (Architecture & Scope)

- **핵심 목표**:
  - 어떤 에이전트가 어떤 방식으로 PR을 생성하든, 최고 결정권자이신 상민님(`yangsangmin`) 계정이 100% 즉시 Reviewer와 Assignee로 바인딩되어 스마트폰 모바일 GitHub 앱 검토·병합 목록에 즉시 노출되도록 보장한다.
- **영향받는 파일 전수 목록**:
  1. `[MODIFY]` [`docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`](file:///C:/dev/ourgoal-app/docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md) (최고 헌법 제6조 제3항 신설: 결심권자 즉시 가시성 보장 헌법 - 금고)
  2. `[MODIFY]` [`C:/Users/HP/AGENTS.md`](file:///C:/Users/HP/AGENTS.md) (전역 공통 최고 헌법 동기화)
  3. `[NEW]` [`reports/TASK-ES-206/claims.json`](file:///C:/dev/ourgoal-app/reports/TASK-ES-206/claims.json) (법정 정식 청구서 - 중립)
  4. `[MODIFY]` [`docs/rules/TICKETS.md`](file:///C:/dev/ourgoal-app/docs/rules/TICKETS.md) (티켓 등록 - 중립)

---

## 2. [원칙 ②] 본질 · 중심 배선(Wire) 식별 (Essence, Causes, Core & Anchor)

- **귀속 축**: `[RULES]`
- **체감 가설**:
  - PR이 GitHub에 생성되는 순간, 상민님의 스마트폰에 즉각 검토 요청 알림이 울리고, GitHub 앱 홈 화면 `Review requests`에 뱃지가 표시되어 즉시 원터치로 승인·병합을 완료할 수 있다.
- **4대 요소 엔지니어링 분석**:
  - **[가목] 본질 (Essence)**:
    - 최고결정권자의 결심 파이프라인 무결성 보장. 아워골의 프로덕션 발행은 오직 상민님의 결심으로만 집행되므로, 결정권자가 인지하지 못하는 PR은 존재하지 않아야 한다.
    - **무공해성 (Anti-Pollution)**: "보고는 올라왔는데 어디서 승인해야 하지?"라는 인지 부하와 탐색 마찰을 영구 제거.
    - **RPG식 체감 (Immediate Self-Efficacy)**: 상민님의 모바일 기기 화면에 명확한 승인 대기 카드와 알림이 즉시 제공됨.
    - **동류 연대 (Peer Accompaniment)**: AI 작업자와 인간 결정권자 간의 실시간 비동기 결심 루프 완결.
  - **[나목] 원인 (Root Causes)**:
    - PR 생성 커맨드에서 reviewer/assignee 옵션 누락 허용 및 사후 검증 절차 부재.
  - **[다목] 중심 (Core Bottleneck)**:
    - GitHub PR 메타데이터 상의 `reviewRequests`와 `assignees` 필드가 빈 상태로 방치되는 병목.
  - **[라목] 핵심 (Critical Anchor)**:
    - 최고 헌법 제6조 제3항 명문화를 통해 PR 생성 즉시 배정 및 기계적 검증 파이프라인 강제.

---

## 3. [원칙 ③] 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

- **파일별 변경 예산 (Diff Budget)**:
  - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md`: 약 +10줄
  - `reports/TASK-ES-206/claims.json`: 약 +25줄
  - `docs/rules/TICKETS.md`: +1줄
  - 총 예상 변경 줄 수: 약 40줄 내외의 컴팩트한 순수 규범/금고 패키지.

---

## 4. [원칙 ④] 1~3 재검토 및 기존 기능 불파괴 보증 (Review & Anti-Regression)

- **기존 워크플로우 불파괴**:
  - 제품 코드 파일 변경이 0건이므로 기존 앱 런타임 및 UX에 0건의 회귀 위험.
- **금고 무결성**:
  - 순수 금고/중립 파일로만 구성되어 `VAULT_MIXED` 블로킹을 원천 배제.

---

## 5. [원칙 ⑤] 구현 상세 순서 (Step-by-Step Sequence)

1. **최고 헌법 정본 갱신**:
   - `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 제6조 제3항 신설.
   - `AGENTS.md` 제6조 동기화.
2. **법정 청구서 작성**:
   - `reports/TASK-ES-206/claims.json` 작성.
3. **로컬 무결성 검증**:
   - `npm test` 및 무결성 게이트 전수 통과 확인.
   - `node court/judge.js --quick` 사전 통과 확인.

---

## 6. [원칙 ⑥] 절차 재검증: 법정 주장(claims) 설계 (Claims & SPOF Verification)

- **법정 주장 설계 (`reports/TASK-ES-206/claims.json`)**:
  - **R1**: 최고 헌법 제6조에 결심권자 즉시 가시성 보장 헌법(제6조 제3항)이 명문화되어야 한다.
- **재검증 과정에서 도출된 절차 수정사항**:
  - OAuth 토큰 scope 제한 및 `VAULT_MIXED` 방어를 위해 순수 헌법 개정안(금고 단독)으로 절차를 정돈함.

---

## 7. [원칙 ⑦] 단계별 실행 체크리스트 (Execution Checklist)

- [ ] 1단계: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 및 `AGENTS.md` 헌법 개정안 작성
- [ ] 2단계: `reports/TASK-ES-206/claims.json` 작성
- [ ] 3단계: `npm test` 및 38개 무결성 게이트 검증
- [ ] 4단계: Tri-Sync 검증
- [ ] 5단계: `node court/judge.js --quick` 사전 통과
- [ ] 6단계: 초안 PR 생성 및 GitHub 법정 심사 청구 (상민님 Reviewer & Assignee 즉시 지정)

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 롤백 계획 (Blockers & Rollback)

- **잠재 장애**:
  - 법정에서 금고 변경 건에 대해 상민님 결심 대기로 올바르게 분류하는지 확인.
- **롤백 계획**:
  - `git revert`로 즉시 복구 가능.
