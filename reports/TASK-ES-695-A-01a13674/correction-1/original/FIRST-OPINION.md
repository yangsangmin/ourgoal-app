### 🔍 [MODE_1] 분석 및 영향도 검토 보고서
* **작업 대상**: TASK-ES-695-A-REVIEW-01a13674 / K18-A exact714
* **검토 목적**: 기기 저장과 후속 입력의 무손실·현재 귀속 독립 확인. 최초 의견이며 Court 최종 판정이 아니다.

#### 1. 구조 및 영향도 분석
- **수정/영향 대상 파일**: 제품 수정0. js/tabs/records/checkin-capture.js의 bindCaptureSave, 최초 text 포착→await saveProfile(deviceFirst)→t.value 비움 경계. 원 working SHA a7aeca0b8b37b0a0f3fa76a7a29569c6c78d3deeead8f8004329356381f44f80。
- **연관 모듈 및 컴포넌트**: 실제 navigator.locks, 기기 backup/pending, #captureInput/#captureSave. 원 readback-order는 actual Chrome CDP mouse/keyboard로 별도 확인했다.

#### 2. 사이드 이펙트 및 위헌 리스크
- **데이터 영속성 영향**: D1 저장 대기 중 후속 입력 손실. 새 private Chrome의 정식 guest entry에서 실제 마우스/키보드로 제출하고, 같은 기기의 원 브라우저 잠금이 저장을 기다리게 했다. 기다리는 동안 두 번째 원문을 타이핑했다. 먼저 제출한 body는 백업에 있지만 그 뒤 새 입력은 비워지고 memory/backup 어느 쪽에도 남지 않았다.
- **기존 방어 코드 영향**: 제품/원P0/원시험/원raw 변경0. 잘못된 첫 locator 도구 실패는 first-critical.json에 남았으며 제품 결함으로 세지 않는다. exact714 source에서 측정했다.
- **실물 출처**: followup-03-late-typed-input.json SHA256 1dc289fac34842e5daf0ebd1a67224131466efb6fa0731ef3e69d0d86adf6f67 / waiting·typedWhileWaiting·afterRelease·trace·actual CDP actions·Chrome version. 결함 관측 true。 실계정/서버CAS/여러기기/XP서버원장/운영/사용효과null.

#### 3. 추천 구현 방향 및 선택지
- **선택지 A**: 저장에 제출한 draft/version과 현재 DOM 입력을 대조하고 제출된 부분만 비운다. 새 입력은 남기며 현재 draft와 원 기록 id 귀속도 분리한다.
- **선택지 B**: 기기 저장 대기 동안 입력 변경을 잠가 늦은 입력을 막는다. 입력 접근성·사진 선택까지 묶이는 영향이 있다.
- **최종 권장안**: A. root에 독립 지적으로 전달하며 구현자에게 직접 판정을 제출하지 않는다. 최초 의견/실패 raw는 불변이며 후속 교정은 defect별 별도 source와 증거로 확인한다.
