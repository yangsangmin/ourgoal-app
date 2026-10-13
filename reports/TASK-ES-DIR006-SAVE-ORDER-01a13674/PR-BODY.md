### 🚀 [MODE_4A] 5대 고정 블록 표준 구현 보고서
* **PR 번호**: 978 (https://github.com/yangsangmin/ourgoal-app/pull/978)
* **Task ID**: TASK-ES-DIR006-SAVE-ORDER-01a13674 / 공통 TASK-CC-CELL-UNWIRE-RUN-309dca5d

#### [블록 1] 개요
- **작업 내용**: [결심 필요] DIR006에 한정하여 기기 자료+재전송 항목을 먼저 쓰고 되읽은 뒤 입력·잠금·XP기기반영/축하·기존 피드백 요청을 진행할 수 있게 하는 헌법15.1 예외 초안이다. **대표 명시 헌법 개정 승인 확인·root 최종검토/병합 전·efficacy=false.** 정상 구현 재허락을 구하는 PR가 아니며, 대표가 이 정확 문구에 대해 「헌법 개정 승인」이라고 답했다. 실제 원문 시각 2026-10-13T22:45:42.725Z이며 앞의 「권장안대로」와 분리해 reports/TASK-ES-DIR006-SAVE-ORDER-01a13674/approval-evidence.json에 기록했다. 최종HEAD/법정부족을 독립 확인하고 병합하는 담당은 root다. 원격main 병합 전 제품/운영에 적용하지 않는다.

현행15.1 첫 문장을 그대로 남긴다:
> 모든 상태 변경은 서버 원장 우선(Server-First)으로 저장 및 반영한다.

붙이는 문구는 최초 독립 비교 `b01c80d8`의 제안 그대로다:
> 다만 DIR-006의 저장 안정화에 한하여, 기기 보존 자료와 재전송 항목을 계정·대상·변경 세대별로 서버 호출 전에 쓰고 되읽어 확인할 수 있다. 그 확인 뒤에는 보존된 부분의 입력 비움·잠금 해제와 경험치의 기기 반영·축하·AI 피드백 요청을 서버 반영 확인을 기다리지 않고 진행할 수 있다. 이때 기기 보관과 원격 미확정을 원격 반영 확인과 구분하며, 경험치의 원격 확정도 해당 서버 원장의 확인으로만 판단한다. 원격 원장의 최종 권위·동기화·무손실·경험치 중복 지급 방지와 기존 승인선은 그대로 유지한다.

원격정본 `7a4dcea9`의 DIR006 A는 정상 저장에서 기기 먼저/서버답을 기다리지 않는 후속을 요구한다. 전문15.1/15.6/15.7의 임시보존 허용은 최대 양립근거지만, #967은 커널bytes 불변이고 #925는arguments·#881은위계 정합이다. 최초 독립 비교 시점에는 정확한 이번 순서 예외의 명시개정승인/효력이 입증되지 않았다. 이번 새승인만 별도로 인수했고 원비교는 덮지 않는다. 이 초안은 Server-First 뜻을 임의로 device-first로 바꾸지 않고 한정예외를 새로 명시한다. 최초비교의 불확실성과 원판은 reports의 first-independent-comparison.md/original-proposal.md로 보존했다.

#### [블록 2] REQ / PLAN 및 구체적 식별자
- **구체적 식별자**: DOM #captureSyncStatus/#captureSyncAction/#a11yLiveAnnouncer(영향식별만), 함수 saveProfile/awardXP/ledgerRecord(제품수정 없음), 파일 [REQ](https://github.com/yangsangmin/ourgoal-app/blob/draft/dir006-save-order-exception-01a13674/docs/specs/REQ-TASK-ES-DIR006-SAVE-ORDER-01a13674.md), [PLAN](https://github.com/yangsangmin/ourgoal-app/blob/draft/dir006-save-order-exception-01a13674/.claude/plan-K16-draft.md), kernel clause15.1, 전문15.1 대응 설명, 대장 새행, 직전ARGUMENTS archive.
- **PLAN 체크리스트**: [4단계: 심사 청구] 초안 제출 준비를 측정했다. 실제 draft번호 확보 뒤 최소규범diff/claims와 정확검사 결과를 연결했다. 명시 개정 승인만 확인했고 병합·배포·제품 사용/효과 완료 표시는 없다.

#### [블록 3] 핵심 변경사항
- **수정 파일 목록**: 규범/티켓 차이는 아래 스크립트 산출이다. 원문 bytearchive는 추가된 직전판이며 기존 조문 수정은15.1과 버전머리뿐이다.

| 파일 | 추가 | 삭제 |
|---|---:|---:|
| 01_OURGOAL_SUPREME_CONSTITUTION_FULL.md | 4 | 4 |
| docs/rules/CONSTITUTION_VERSIONS.md | 1 | 0 |
| docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md | 5 | 3 |
| docs/rules/TICKETS.md | 2 | 0 |
| docs/rules/archive/AGENTS_KERNEL_v2026.10.11-ARGUMENTS.md | 601 | 0 |

상세는 [measurement.json](https://github.com/yangsangmin/ourgoal-app/blob/draft/dir006-save-order-exception-01a13674/reports/TASK-ES-DIR006-SAVE-ORDER-01a13674/measurement.json) 및 같은 폴더 normative.diff.patch다.
- **소블록 자가분열 준수**: 제품js/화면/API 변경 없음. reports cjs는 source/문서 측정 도구이며 제품 부품이 아니다.
- **세포 영향**: 제품·세포신고서·슬롯·ACTIVE·Court/gate/훅코드 변경 없음, 기준선갱신 없음. 공통tasklink는 root 중앙 단독으로 관리한다.

| 영향 | 유지할 경계 |
|---|---|
| 입력/잠금 | 보존된 부분의 기기 되읽기 확인 뒤만 후속. 기기 실패·미보존 사진을 성공으로 비우지 않음 |
| 미확정/timeout | 기기보관≠원격반영. 취소≠서버되돌림. 0행/읽기거절/늦은응답≠확인 |
| XP/축하 | 기기선반영 가능, 원격확정은 XP 서버원장 확인만. 여러탭/기기의 중복방지를 기기표식만으로 주장하지 않음 |
| 원격권위 | 최종원장·동기화·무손실·확인된세대만 queue제거 유지 |
| 승인/운영 | 새비용/개인정보/사진·피드백 원격보존 확대·삭제·SQL·운영시험 권한 없음 |

이번 명시승인은 K18 A의 서버호출전 저장순서 전환/원격확인전 완료성 후속에 필요한 한정 개정에만 연결하며, 효력은 실제 원격main 병합 뒤다. 기존 원격보존·P0·pending archive·계정/읽기guard는 담당/source확인후 독립 진행할 수 있다. 이 PR가 저장 안전/출시/사용·효과를 판정하지 않는다.

#### [블록 4] Claims (주장)
-  reports/TASK-ES-DIR006-SAVE-ORDER-01a13674/claims.json 기록 완료
- **주장 항목**: claims.json은 정확문구·원15.1·버전/전문/대장·archive 존재/원문과 효력false의 정적 항목만 청구한다. 운영/E2E/사용 가능/효과의 긍정 주장은 없다. appendix --versions와 --check(전문 대상)는 raw exit0이며 첫문장/정확추가/허용외본문/기존대장행 불변·직전판byte동일·원21pin불변을 스크립트로 대조했다. 초기 --check를 별표 marker없는 kernel에 호출해 실패한 도구사용기록은 initial-wrong-target-reproduced.json에 보존했고, 검사코드/원규범을 고치지 않고 실제 별표가 있는 전문을 대상으로 교정했다. 모든 로컬 diff/check는 작업자 측정이며 Court판정이 아니다.

#### [블록 5] 독립 법정 판정서 (GitHub Court Verdict)

원Court90079533/HEAD f314342는 확인 부족 — 상민님 결심 필요였으며 원문 보존. 실제 대표 명시 승인 뒤 새HEAD를 다시 심사받고 원출력을 후속보고에 인수한다. 로컬예비검사를 판정으로 옮기지 않는다. 이번 담당 자동병합·approve·merge0. 병합 전 efficacy=false, 제품/운영/use/effect 미확인.
