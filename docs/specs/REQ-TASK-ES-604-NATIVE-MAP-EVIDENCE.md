# [REQ-TASK-ES-604] 정식 main 일곱 세포 손 이름·역할·hand출처 및 보존 재현 검증 요구명세서

> **기준 PR**: PR #871 (`c8b8ddfb`)  
> **과업 ID**: TASK-ES-604  
> **상위 과업**: TASK-YANGVIS-OURGOAL-REBUILD-01a11bfe  
> **작업 성격**: 정식 main 7개 세포 지도 대조, 원시 산출물 생성, 재현 가능한 측정기 및 법정 주장 작성 (제품 변경 없음)  

---

## 1. [원칙 ①] 문제 정확히 파악

- **증상 및 배경**:
  현재 정식 main 코드베이스의 세포지도 시스템(`docs/architecture/cell-map.json`)에 보완된 7개 세포(`auth-social`, `avatar/level-badge`, `core/modal-open`, `creator-templates-legacy`, `goals/curated-market-data`, `goals/template-encyclopedia-modal`, `records/vision-table-input`)가 존재한다.
  이들 7개 세포가 공식 생성기(`scripts/cell-map-export.js --stdout`) 실행 시 실제 소스 파일, 신고서(`modules.json`), 설명서(`cell-descriptions.json`)와 완벽히 일치하여 `name`, `does`, `nameSource: hand`, `doesSource: hand`로 추출되는지 검증하고, 기존 등록·설명 및 제품 코드가 훼손 없이 보존되었음을 재현 가능한 측정 코드와 원시 데이터로 입증해야 한다.
- **측정 대상 식별자**:
  - `auth-social` (`js/auth-social.js`)
  - `avatar/level-badge` (`js/avatar/level-badge.js`)
  - `core/modal-open` (`js/core/modal-open.js`)
  - `creator-templates-legacy` (`js/creator-templates-legacy.js`)
  - `goals/curated-market-data` (`js/tabs/goals/curated-market-data.js`)
  - `goals/template-encyclopedia-modal` (`js/tabs/goals/template-encyclopedia-modal.js`)
  - `records/vision-table-input` (`js/tabs/records/vision-table-input.js`)

---

## 2. [원칙 ②] 본질·원인·중심·핵심 구분

- **본질 (Essence)**:
  세포지도의 신뢰성은 임의의 선언이 아니라 공식 생성기의 실행과 정적 검증 스크립트를 통한 **객관적 측정**에서 나온다. 7개 세포가 사람 손으로 정의한 이름(`names`)과 역할(`cells`)을 정확한 출처(`hand`)로 유지하고 있는지를 측정으로 입증하는 것이 본질이다.
- **원인 (Root Cause)**:
  Git 작업 트리 환경 및 병합 이력의 시점에 따라 `cell-map.json`의 메타데이터(`source.commit`, `source.committedAt`, `prs` 등)가 최신 생성기 실행 결과와 미세하게 다를 수 있다. 이를 코드 훼손으로 오인하여 기존 정본 지도를 강제 덮어쓰거나 반대로 불일치로 오판하는 것이 과거 혼선의 원인이었다.
- **중심 (Core Axis)**:
  변동 가능한 메타데이터(커밋 해시, 시각, PR 목록)와 불변이어야 하는 의미 칸(세포 ID, 표시 이름, 역할 설명, 출처 플래그)을 엄격히 분리하여, 의미 칸의 100% 일치를 검증의 중심으로 삼는다.
- **핵심 (Crux)**:
  제품 코드 변경 0, 기존 지도 파일 무변경 보존 원칙을 지키면서, Node.js 단독으로 누구나 재실행하여 동일한 결과를 얻을 수 있는 재현 가능한 측정기(`reports/TASK-ES-604/measure-map.cjs`)와 원시 증거(`measurement.json`, `raw/generator.stdout.json`)를 산출하는 것이 핵심이다.

---

## 3. [원칙 ③] 해결 방식 후보 검토

- **후보 A (생성기 재실행 후 기존 cell-map.json 덮어쓰기)**:
  - 장점: 바이트 일치성 검증이 단순해짐.
  - 단점: 금고/정본 무단 변경 금지 지침 위반 및 PR 병합 충돌 유발 (L009 위반). 즉시 기각.
- **후보 B (독립 측정기 작성 및 의미 칸 분리 대조 방식, 권장)**:
  - 장점: 기존 `cell-map.json`을 보존한 채 공식 생성기의 표준 출력을 캡처하여 7개 세포의 의미 칸(ID, name, does, nameSource, doesSource)을 동일 ID로 정밀 비교. 변동 메타데이터는 별도 목록으로 기록하여 추적 가능성 확보.
  - 단점: 대조 스크립트 작성 공수 필요. 그러나 가장 안전하고 헌법에 부합함.

---

## 4. [원칙 ④] 재검토 (반례 및 부작용 분석)

- **반례 1: `cell-descriptions.json`의 기존 344개 세포 설명 훼손 여부**:
  - 점검: 7개 세포 외에 기존에 등록되어 있던 모든 `names` 및 `cells` 키와 값이 유지되고 있는지 전수 키-값 대조를 수행하여 훼손 0건임을 입증해야 함.
- **반례 2: Git 설정 및 금고 파일 오염 여부**:
  - 점검: 세션 실행 중 `git config`, `.githooks/`, `court/`, `AGENTS.md` 등 금고 파일이 전혀 변경되지 않았음을 SHA256 해시 대조로 입증해야 함.

---

## 5. [원칙 ⑤] 실행 절차 명세

1. **사전 준비**: 작업계획서 및 요구명세서 작성, 작업연계 local pending 파일 등록.
2. **원시 생성**: 공식 생성기 `node scripts/cell-map-export.js --stdout`를 전경 실행하여 `reports/TASK-ES-604/raw/generator.stdout.json`, `generator.stderr.txt`에 저장.
3. **측정기 작성**: `reports/TASK-ES-604/measure-map.cjs` 작성 (외부 의존성 없이 순수 node 내장 모듈 사용).
4. **측정 실행**: `node reports/TASK-ES-604/measure-map.cjs`를 실행하여 `reports/TASK-ES-604/measurement.json` 생성.
5. **법정 주장 등록**: `reports/TASK-ES-604/claims.json` 작성 (R1, R2를 leaf claim으로 연결, config 도메인).

---

## 6. [원칙 ⑥] 절차 재검증 및 반론 격파

- **반론 1**: "저장된 `cell-map.json`과 생성기 stdout이 완전히 바이트 단위로 동일해야만 합격이므로, 지도를 재생성하여 덮어써야 한다."
  - **[격파]**: 지시서 및 헌법 v2026.10.07-PRESERVATION에 명시된 원칙에 위배된다. 지시서에 "파일을 같게 만들기 위해 기존 지도를 덮어쓰지 않는다", "저장 지도의 생성 시각/출처HEAD/최근PR metadata가 최신 생성기와 다를 수 있으므로 의미 칸(ID/name/does/nameSource/doesSource)을 동일 ID로 비교하고 변동metadata는 별도 목록에 남긴다"라고 규정되어 있다. 의미 칸이 완전 일치함을 입증하고 변동 메타데이터를 분리 기록하는 것이 참된 측정이다.
- **반론 2**: "보고서에 Court PASS 및 노션/웹 동기화 완료를 표기해야 업무가 완료된 것으로 간주된다."
  - **[격파]**: GUARD_01(자가채점 금지) 및 GUARD_05(상태는 측정이다) 위반이다. 법정 판정은 오직 GitHub Actions에서 도는 Court만이 내릴 수 있으며, 작업자는 오직 자신의 측정(주장)만 기록할 수 있다. Court 판정과 웹/노션 동기화는 `null`로 기록해야 정직한 보고서이다.

---

## 7. [원칙 ⑦] 단계별 실행 계획

- **단계 1**: `.claude/plan-TASK-ES-604.md` 및 `docs/specs/REQ-TASK-ES-604-NATIVE-MAP-EVIDENCE.md` 작성.
- **단계 2**: `.task-links/TASK-ES-604.json`에 local pending 등록.
- **단계 3**: `node C:/dev/wt/yangvis-ourgoal-agy-01a11bfe/scripts/cell-map-export.js --stdout` 실행 및 raw 파일 저장.
- **단계 4**: `reports/TASK-ES-604/measure-map.cjs` 구현 및 검증 실행.
- **단계 5**: `reports/TASK-ES-604/claims.json` 작성 및 최종 검토.

---

## 8. [원칙 ⑧] 막히는 지점 예상 및 성과 측정

- **예상 막힘 지점**:
  - child_process 호출 시 버퍼 크기 부족 -> `maxBuffer: 64 * 1024 * 1024`로 설정하여 해결.
  - Windows 파일 경로 역슬래시 vs 슬래시 혼선 -> `path.posix` 또는 슬래시 정규화 처리.
- **성과 측정 기준**:
  - 대상 7개 세포의 ID, name, does, nameSource, doesSource 불일치 수: **0**
  - 대상 7개 세포의 실제 소스 파일 존재 및 modules.json 등록 누락 수: **0**
  - 기존 `cell-descriptions.json` 키/값 훼손 수: **0**
  - 제품/금고/시험/Git config 변경 수: **0**
  - `measure-map.cjs`의 재실행 성공 및 동일 수치 산출 여부: **100% 재현 가능**
