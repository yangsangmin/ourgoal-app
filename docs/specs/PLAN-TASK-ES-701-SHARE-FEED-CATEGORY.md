# TASK-ES-701 — 실행 계약

목표·범위·원 지시 귀속의 정본은 REQ-TASK-ES-701-SHARE-FEED-CATEGORY.md다. 작업참고 기준 PR #968; 라우팅 alias 보존, canonical ID701 선점. 예상은 실제 측정 전 추정이며 운영 writebudget0이다.

## 1. [원칙 ①] 문제 정확히 파악

원 source의 openShareToFeedModal selectedCat, #shareGoalSelect change, [data-shcat] click, #shareConfirmBtn submit과 post/extra를 각각 pin한다. 원 category-map의 fromGoal/feedPostMeta/withMeta/insertFeedPost 계약과 처리되는 SDK error shape를 읽었다. TASK696 R6의 담당 보류 원문은 변경하지 않고 이번 root assignment와 나누어 기록한다.

## 2. [원칙 ②] 본질·원인·중심·핵심

본질은 선택→분류→post metadata→insert에서 같은 입력을 유지하는 것이며 원인은 현재 caller의 mapping/helper 누락이다. 중심은 records/share-to-feed의 기존 closure이고 핵심은 manual flag와 submit captured scalar frame이다. server 설정/가중치나 분류표 주인을 바꾸지 않는다. 새로운 작업 source를 원 대표 승인으로 합성하지 않는다.

## 3. [원칙 ③] 해결방식

기존 FEED_CATEGORIES_10 validation을 life fallback으로 바꾸고 실제 map fromGoal을 사용한다. 수동 칩 클릭 여부를 별도 boolean으로 기록하여 목표 교체에 기본값만 재매핑한다. submit은 selected goal scalar 복사와 selectedCat/pct/caption을 첫 await 전에 고정하고 기존 helper의 결과 post를 local cache/profile에도 동일하게 사용한다. SDK result.error는 기존 catch/fallback으로 연결하고 successful remote 효과를 새로 주장하지 않는다.

## 4. [원칙 ④] 재검토

목표와 칩을 바꾸는 실제 events에서 manual 선택은 살아 있어야 한다. insert가 지연되거나 missing-column retry가 생겨도 captureFrame/메타/id를 다시 만들지 않는다. old extra-only pending object는 변환·제거하지 않고 원 caller 밖 replay는 변경0이다. category-map이 없거나 error를 반환하는 경우의 동일 cache 참조와 추가 효과0을 검사한다.

## 5. [원칙 ⑤] 절차

- [ ] 1단계: REQ/PLAN 원 고정·최초 독립 사전 검토 · 추정10분 · exact SHA 및 root 원 각1회 의견 인수.
- [ ] 2단계: 원 부정·caller 교정 · 추정15분 · 원 source/입력/실패 보존, current default/manual/captured metadata/helper seam 연결.
- [ ] 3단계: 영향시험·Claims · 추정15분 · 전후 source-bound local/browser 의미검사와 관련 원시험/공식guard, unsupported 실제 서버 범위 명시.
- [ ] 4단계: draft PR·Court 심사 청구 · 추정10분 · source 고정·actual external verdict와 raw 인계; main merge/rootreview 전 완료 표시0.

## 6. [원칙 ⑥] 절차 재검증

원 source를 고정해 동일 oracle로 health/러닝→running, mind/명상→mental, unknown→life, manual dev→goal change 유지, delayed captured frame 불변, missing-columns→retry2 같은id/extra, nonmissing permission→retry0을 검사한다. 목업 서버로 realE2E를 증명하지 않는다. 기존 tests/기대값을 수정하지 않고 추가 source-bound 검증은 자기 reports 또는 새 좁은 검사만 둔다. 새로운 UI 요소/행동은 없어 기존 4위1체를 연결하는 수정이다.

## 7. [원칙 ⑦] 단계별 실행

자기 private attempt 폴더는 wx로 최초 input/script/source/PID/stdout/stderr/exit를 보존한다. production diff allowlist는 js/tabs/records/share-to-feed.js이고 shared category-map과 author files는 readonly다. metadata 생성은 scripts/module-specs.js --write만 쓰고 manual 손칸과 baseline bytes를 지킨다. 실제 원격 계정·SQL·posts·model은 호출0. root가 중앙 tasklink/author reply를 처리한다.

## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정

local library setup/guest 화면에서 실제 함수에 도달하지 못하면 초기 실패 원시와 한계를 그대로 둔다. file800·old source assertions·unsupported helper/readback는 원 기대를 지우거나 잣대를 낮춰 넘기지 않는다. writebudget0에서 운영 persistence 확인은 null이고 external Court가 재는 범위와 분리한다. source pin/Claims/PR 완료는 운영 사용이나 효과 인증이 아니다.
