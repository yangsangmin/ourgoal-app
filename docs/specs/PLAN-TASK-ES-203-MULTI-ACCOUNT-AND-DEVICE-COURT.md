# 작업계획서 (PLAN-TASK-ES-203-MULTI-ACCOUNT-AND-DEVICE-COURT)

> **문서 버전**: v1.0  
> **작성 일자**: 2026-09-22  
> **티켓 번호**: #TASK-ES-203  
> **본질 축**: INFRA (품질 및 자동 사법 검증 인프라)  
> **요구사항 정의서**: [`docs/specs/REQ-TASK-ES-203-MULTI-ACCOUNT-AND-DEVICE-COURT.md`](file:///C:/dev/ourgoal-app/docs/specs/REQ-TASK-ES-203-MULTI-ACCOUNT-AND-DEVICE-COURT.md)

---

## 1. 엔지니어링 아키텍처 및 변경 범위 파악

- **REQ 핵심 요약**:
  - 현재 법정이 PC 화면 단일 클릭(`L3`)까지만 직접 재고, 진짜 2개 계정 상호작용(`L4`)과 모바일 하드웨어 뒤로가기/키보드(`L5`)를 사람 손(`[손 필요]`)으로 미루던 한계를 해소.
  - 상민님께서 제공해 주신 `ourgoaltest` 및 테스터 B 진입 자산을 활용하여, 법정이 2개 브라우저 세션을 동시에 띄워 실시간 상호 도달성을 검증하고 모바일 OS 이벤트를 에뮬레이션하여 `L4` 및 `L5` 등급을 100% 무인 자동 판정하도록 업그레이드.
- **영향받는 파일 전수 목록**:
  1. `court/lib/scenario.js`: 멀티 액터(`actor: 'main' | 'peer'`), `spawnPeer`, `hardwareBack`, `virtualKeyboard` 닫힌 어휘 등록 및 듀얼 브라우저 런타임 배선.
  2. `court/claims.js`: `MEASURABLE_TOP` 상한선을 `L3`에서 `L5`로 상향, 시나리오 증거 기반 `L4`/`L5` 등급 부여 분기 추가.
  3. `court/lib/grade.js`: 등급 부여 및 달성도 비교 무결성 검증.
  4. `court/README.md`: 5단계(L4 듀얼 계정) 및 6단계(L5 실기기 이벤트) 시나리오 작성법 및 어휘 가이드 반영.
  5. `court/selftest/cases.js`: 신규 듀얼 액터 및 하드웨어 이벤트 검증 사례 등록.
  6. `docs/rules/TICKETS.md`: `#TASK-ES-203` 승인 티켓 등록.

---

## 2. 본질 · 원인 · 중심 · 핵심 배선(Wire) 식별

- **본질 (Essence)**: 법정 엔진이 사람 손으로 미루지 않고 듀얼 세션으로 직접 검증함.
- **원인 (Root Cause)**: 단일 브라우저 인스턴스 제약 및 L3 상한선 하드코딩으로 인한 병목.
- **중심 (Core Bottleneck)**: 듀얼 브라우저 런타임 및 하드웨어 CDP 이벤트 라우팅.
- **핵심 (Critical Anchor)**: 신규 어휘 기반 시나리오 실행 및 L4/L5 등급 부여.

- **핵심 상태 및 배선 다이어그램**:

```
[시나리오 파일 (.json)]
  ├── step 1: { do: "goto", path: "/index.html" }                 ➔ Page Main
  ├── step 2: { do: "spawnPeer", path: "/index.html" }           ➔ Page Peer 신규 기동 & 테스터B 로그인
  ├── step 3: { do: "click", selector: "#btnCheer", actor: "main" } ➔ Page Main 마우스 실클릭
  ├── step 4: { expect: "visible", selector: "#notifBadge", actor: "peer" } ➔ Page Peer 실시간 수신 검증!
  └── step 5: { do: "hardwareBack", actor: "main" }              ➔ Page Main 안드로이드 뒤로가기 키 전송!
```

- **상태 관리**:
  - `scenario.js` 내에 `let activePage = pageMain;` 및 `let peerSession = null;` 관리.
  - `actor === 'peer'` 지정 시 `peerSession.page`로 라우팅.
  - 시나리오 종료 시 `finally` 블록에서 `peerSession.close()`를 반드시 호출하여 브라우저 누수 0% 보장.

---

## 3. 효과적 해결방식 및 파일별 변경 예산 (Diff Budget)

| 파일 경로 | 추가 줄 수 | 삭제 줄 수 | 핵심 변경 내용 |
| :--- | :--- | :--- | :--- |
| `court/lib/scenario.js` | ~120줄 | ~10줄 | `ALLOWED_KEYS`, `spawnPeer`, `actor` 라우팅, `hardwareBack`, `virtualKeyboard` 구현 |
| `court/claims.js` | ~25줄 | ~5줄 | `MEASURABLE_TOP = 'L5'`, multi-actor / hardware device 감지 및 등급 상향 |
| `court/README.md` | ~40줄 | ~5줄 | 멀티 액터 시나리오 작성법 및 닫힌 어휘 문서화 |
| `court/selftest/cases.js` | ~60줄 | ~0줄 | 듀얼 브라우저 정상 판정 및 가짜 멀티유저 차단 자가시험 추가 |
| `docs/rules/TICKETS.md` | ~5줄 | ~0줄 | `#TASK-ES-203` 공식 등록 |

---

## 4. 1~3 재검토 및 기존 기능 불파괴 보증

1. **기존 단일 브라우저 시나리오 100% 보존**:
   - `actor` 필드가 없는 기존 모든 시나리오는 내부적으로 `actor: 'main'`으로 자동 처리되므로, 기존 표준 점검(`std-*.json`) 및 단위 테스트가 단 1개도 깨지지 않음.
2. **금고(Vault) 독립성 엄수**:
   - 본 작업은 제품 코드(`index.html`, `js/**`, `api/**`)를 일절 건드리지 않고 오직 검증 인프라(`court/**`)만을 정밀 보강하는 **순수 금고 PR** 규격을 엄수함.
3. **자원 정리 불파괴 보증**:
   - 피어 세션 기동 중 예외가 발생하더라도 `process.on('exit')`와 `finally`에서 임시 사용자 데이터 디렉터리와 프로세스 트리가 100% 회수되도록 설계.

---

## 5. 구현 상세 순서 (Step-by-Step Sequence)

1. **Step 1 (`docs/rules/TICKETS.md`)**:
   - `#TASK-ES-203` 티켓을 공식 대장에 등록.
2. **Step 2 (`court/lib/scenario.js`)**:
   - `DO_KINDS`에 `spawnPeer`, `hardwareBack`, `virtualKeyboard` 추가.
   - `ALLOWED_KEYS`에 신규 키 및 `actor`(`main` | `peer`) 허용 속성 등록.
   - `validateScenario` 유효성 검증 로직 확장.
   - 런타임에 듀얼 브라우저 세션 생성 및 액터별 CDP 명령 분기 배선.
   - `hardwareBack` 시 CDP `Input.dispatchKeyEvent`(Keycode 4) 및 브라우저 뒤로가기 이벤트 발송.
   - `virtualKeyboard` 시 `Emulation.setDeviceMetricsOverride`로 뷰포트 높이 축소/복원.
3. **Step 3 (`court/claims.js`)**:
   - `const MEASURABLE_TOP = 'L5';`로 상향.
   - 시나리오 증거(`H.multiActor`, `H.hardwareBack`)를 감지하여 `achieved: 'L4'` 및 `achieved: 'L5'` 부여 로직 추가.
4. **Step 4 (`court/README.md`)**:
   - 법정 한 장 설명서에 L4 듀얼 액터 시나리오 및 L5 실기기 이벤트 명세 갱신.
5. **Step 5 (자가시험 검증)**:
   - `node court/selftest/run.js --unit-only` 및 단위 테스트 실행.
   - `node court/appendix.js --check docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md` 별표 대조 일치 확인.

---

## 6. 절차 재검증: 법정 주장(claims) 설계

- **지시 항목 (Requirements)**:
  - `R1`: 법정 시나리오에서 2개 계정(ourgoaltest, 테스터 B)의 듀얼 브라우저 상호작용을 실행할 수 있어야 한다.
  - `R2`: 듀얼 계정 상호작용 검증 성공 시 법정은 `L4(진짜 계정끼리 주고받아 봄)` 등급을 자동 부여해야 한다.
  - `R3`: 모바일 하드웨어 뒤로가기 및 가상 키보드 이벤트를 에뮬레이션할 수 있고, 성공 시 `L5(진짜 폰에서 해 봄)` 등급을 자동 부여해야 한다.
- **주장 (Claims)**:
  - `C1`: `court/lib/scenario.js`에 `spawnPeer`와 `actor` 분기가 탑재되어 2개 세션이 격리 실행된다.
  - `C2`: `court/claims.js`의 `MEASURABLE_TOP`이 `L5`로 확장되어 상한선이 해제된다.
  - `C3`: `court/selftest/run.js`가 신규 기능을 포함하여 100% 무결 통과한다.

---

## 7. 단계별 실행 체크리스트

- [ ] `docs/rules/TICKETS.md` 티켓 등록 완료
- [ ] `court/lib/scenario.js` 멀티 액터 및 하드웨어 이벤트 배선 완료
- [ ] `court/claims.js` MEASURABLE_TOP = 'L5' 및 등급 판정 배선 완료
- [ ] `court/README.md` 문서 갱신 완료
- [ ] `node court/selftest/run.js` 전체 통과 검증
- [ ] `node C:/dev/command-center/lib/tri-sync.js check` 무결성 검증

---

## 8. 막히는 지점 예상 및 롤백 계획

- **잠재 오류 1: 듀얼 브라우저 동시 실행 시 포트 경합**:
  - `remote-debugging-port=0`으로 동적 할당하여 충돌을 완벽히 방지.
- **잠재 오류 2: 피어 세션의 오프라인 격리 정책**:
  - 피어 브라우저도 메인 브라우저와 동일한 격리 룰(`host-resolver-rules`)을 상속받아 외부 통신에 흔들리지 않도록 보장.
- **롤백 계획**:
  - Git 커밋 단위로 격리되어 있으므로, 예기치 않은 문제 발생 시 `git checkout main`으로 즉시 안전 롤백 가능.
