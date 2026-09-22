# [REQ] #TASK-ES-206 결심권자 즉시 가시성 보장 헌법 제정 (Decision Visibility Mandate)

---

## 1. [원칙 ①] 문제 정확히 파악 (Problem Identification)

- **상민님 지시 원문 (2026-09-22)**:
  > "375는 병합했는데, 니가 보고했는데 내가 결심을 못하는 이런 일이 발생하면 안되지 바로 해결해"
- **표면적 현상**:
  - AI 에이전트가 작업 완료 및 심사 청구(PR #375) 후 상민님께 보고를 올렸으나, 상민님이 이동 중 스마트폰(모바일 GitHub 앱)의 `검토 목록(Review Requests)` 및 `병합 목록(Assigned/PRs)`을 확인했을 때 해당 PR이 전혀 노출되지 않아 즉시 승인 및 병합 결심을 내리지 못함.
- **기저 원인 분석 (3단계 층위)**:
  - **1층 (표면적 결여)**: PR 생성 시 Reviewer 및 Assignee 메타데이터가 빈 배열(`[]`)로 생성됨.
  - **2층 (구조적 프로세스 부재)**: GitHub 모바일 앱의 기본 인덱싱/필터(`is:open is:pr review-requested:@me` 또는 `assignee:@me`)는 자신에게 요청되거나 할당된 항목만 홈 탭에 노출하므로, 작성자(`ourgoaltest`)가 아닌 상민님 계정에는 푸시 알림도 가지 않고 목록에 표시되지 않음.
  - **3층 (규범적 강제력 부재)**: 최고 헌법에 PR 생성 시 결정권자 가시성을 확보해야 한다는 절대 의무 및 사후 기계적 검증 의무 조항이 부재했음.
- **대상 사용자 및 발생 상황**:
  - 상민님(최고 결정권자)께서 밖에서 이동 중 스마트폰으로 아워골 개발 진행 상황을 확인하고 배포 결심을 내리고자 할 때마다 언제 어디서든 즉각적으로 검토 및 병합 목록에 노출되어야 함.

---

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심 파악 (Essence, Causes, Core & Anchor)

- **귀속 축**: `[RULES]` (최고 헌법 규범 개정)
- **체감 가설**:
  - 어떤 에이전트나 작업자가 PR을 생성하더라도 상민님의 스마트폰에 검토 요청 뱃지와 푸시 알림이 100% 즉시 도착하고, GitHub 앱 홈 화면 검토 목록 및 병합 목록에 즉각 노출됨으로써 상민님의 결심 흐름이 단 1초도 단절되지 않는다.
- **4대 요소 분석**:
  - **[가목] 본질 (Essence)**:
    - 최고결정권자의 '결심 흐름(Decision Flow)' 무결성 보장. 아워골의 모든 코드는 상민님의 결심과 승인을 통해서만 프로덕션에 진입하며, AI가 작업 보고를 올렸다면 상민님의 손끝(스마트폰 모바일 앱)에서 즉각 인지하고 원터치로 승인·병합할 수 있어야 한다.
    - **무공해성 (Anti-Pollution)**: 작업자가 보고만 하고 결정권자는 찾지 못해 헤매는 불필요한 인지 피로와 마찰을 완전히 근절하여 무공해한 개발 운영 환경을 구축한다.
    - **RPG식 체감 (Immediate Self-Efficacy)**: 상민님이 폰을 열었을 때 승인 대기 중인 퀘스트(PR)가 선명하게 뱃지로 떠 있어 즉시 승인하고 진화를 완결하는 직관적 통제 효능감을 제공한다.
    - **동류 연대 (Peer Accompaniment)**: AI 작업자와 인간 결정권자 간의 비동기 협업 파이프라인이 100% 신뢰성 있게 유지된다.
  - **[나목] 원인 (Root Causes)**:
    1. 클라이언트 단: PR 생성 시 리뷰어/담당자 메타데이터 누락 허용.
    2. 검증 단: PR 생성 후 Reviewer/Assignee 지정 여부 기계적 확인 절차 부재.
    3. 규범 단: 최고 헌법에 PR 생성 시 결정권자 가시성 보장 의무 조항 부재.
  - **[다목] 중심 (Core Bottleneck)**:
    - GitHub PR 메타데이터 상의 `reviewRequests`와 `assignees` 필드가 빈 상태로 방치되어 모바일 앱 인덱스 쿼리에서 누락되는 병목.
  - **[라목] 핵심 (Critical Anchor)**:
    - 최고 헌법 제6조 제3항 명문화를 통해 PR 생성 시 `--reviewer yangsangmin --assignee yangsangmin` 필수 지정 및 사후 기계적 조회(`gh pr view --json reviewRequests,assignees`) 검증을 의무화.

---

## 3. [원칙 ③] 효과적 · 효율적 해결방식 결정 (Effective Solutions)

- **하지 말 것 (확장 금지, 파괴 금지)**:
  - 복잡한 외부 서드파티 봇/앱을 도입하여 의존성을 늘리지 않는다.
  - 기존 법정이나 금고의 검사 로직을 훼손하지 않는다.
- **할 것 (완주, 배선, 동결)**:
  1. **최고 헌법 및 AGENTS.md 규범 명문화**:
     - 제6조(1티켓 1PR 헌법) 제3항 [결심권자 즉시 가시성 보장 헌법] 신설.
     - PR 오픈 시 `--reviewer yangsangmin --assignee yangsangmin` 필수 지정 강제.
     - PR 생성 직후 `gh pr view <PR> --json reviewRequests,assignees` 기계적 검증 및 미배정 시 즉시 `gh pr edit` 자동 보정 의무화.

---

## 4. [원칙 ④] 1~3 재검토 · 보완 (Critical Review & Edge Cases)

- **엣지 케이스 점검**:
  - 케이스 1: PR 작성자가 상민님 본인(`yangsangmin`)인 경우
    - 본인 작성 PR은 검토 요청 대신 본인 담당(`assignee`)으로 등록되므로 모바일 앱 Assigned 탭에 노출 보장.
  - 케이스 2: 초안 PR(Draft PR)로 먼저 생성된 경우
    - 초안 상태라도 reviewer/assignee가 등록되어 있으면 모바일 앱에 즉시 뱃지와 함께 노출됨.

---

## 5. [원칙 ⑤] 해결 절차 정리 (Implementation Procedure)

1. **티켓 등록**: `docs/rules/TICKETS.md`에 `#TASK-ES-206` 등록.
2. **REQ 및 PLAN 수립**: 8원칙 1회차/2회차 작성 및 린트 검증.
3. **최고 헌법 및 AGENTS.md 명문화**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 및 `AGENTS.md` 제6조 제3항 신설.
4. **법정 청구서 작성**: `reports/TASK-ES-206/claims.json` 작성.
5. **로컬 및 단위 검증**: 린트 검사, `npm test` 전수 통과.
6. **심사 청구**: 초안 PR 생성 및 GitHub 법정 심사 청구.

---

## 6. [원칙 ⑥] 절차 재검증 (Procedure Verification & Anti-SPOF)

- **SPOF 점검**:
  - 작업자가 플래그를 실수로 빠뜨리더라도 PR 생성 직후 `gh pr view` 기계적 조회 및 `gh pr edit` 보정 단계를 헌법으로 강제하여 단일 실패점을 원천 방어함.
  - **재검증 과정에서 도출된 절차 수정사항**: OAuth 토큰 권한(workflow scope) 한계 및 금고 혼합(VAULT_MIXED) 문제를 사전에 차단하기 위해, 워크플로우 대신 최고 헌법 조항 단일화로 절차를 전격 수정함.

---

## 7. [원칙 ⑦] 단계별 실행 기준 (Success Metrics & Criteria)

- **측정 1**: `docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 제6조 제3항이 명문화될 것.
- **측정 2**: `npm test` 335개 테스트 및 38개 무결성 게이트 ALL PASS.
- **측정 3**: Tri-Sync 100% 무결성 검증 통과.
- **측정 4**: GitHub PR 생성 시 상민님 스마트폰 GitHub 앱에 Review Request와 Assignee가 100% 즉시 배정될 것.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 재검증 트리거 (Blockers & Re-verification Triggers)

- **블로커 1**: 에이전트가 PR 생성 후 검증을 건너뛰는 경우
  - 대응: 헌법 제6조 제3항에 "상민님의 스마트폰에 검토 요청 알림이 울리기 전까지 보고를 완료할 수 없다"를 명시하여 보고 차단.
- **재검증 트리거**:
  - 만약 PR 생성 후 `gh pr view <PR> --json reviewRequests`에 `yangsangmin`이 확인되지 않으면 즉시 `gh pr edit`를 실행하고 보고를 보류한다.
