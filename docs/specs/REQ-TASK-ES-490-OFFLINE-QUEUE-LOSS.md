# REQ — #TASK-ES-490 오프라인 동기화 큐 데이터 손실 수정

- 근거: 코디네이터 지시(2026-10-05) — 기관 빌더(#TASK-ES-471, #776)가 발견: 오프라인 큐가 동기화 오류를 삼키고 자기를 비운다(GUARD_03). #776 병합 뒤 옮겨진 세포 `js/core/virtual-user-helpers.js` 에서 고친다. 같은 세포의 `calculateWeeklyFocusStats` 25분 대체값도 허상지표 정리에 포함.
- 범위: `js/core/virtual-user-helpers.js`(OfflineSyncManager), `index.html`(online 처리기 1줄), `tests/offline-sync-queue-retain.test.js`(새), `reports/TASK-ES-490/**`.

## 1. [원칙 ①] 문제 정확히 파악
1. 온라인 복귀 처리기(index.html `window.addEventListener('online', …)`)가 `OfflineSyncManager.flush()` 를 처리기 없이 불러, 아무것도 보내지 않고 큐(`ourgoal_offline_sync_queue`)를 지운다.
2. `flush(syncHandler)` 는 처리기가 throw 해도 `catch(e){}` 로 삼키고 큐를 통째로 지운다 — 실패한 기록이 큐에서 사라진다.
3. `calculateWeeklyFocusStats` 는 종료 시간 없는 기록(진행 중 기록·템플릿 기록)을 25분 몰입으로 센다 → 홈 오늘 요약(#todayGlancePill) 「0시간 25분 몰입」.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심
- 본질: 큐는 "아직 못 보낸 것"의 장부다. 보냈다는 확인 없이 지우면 장부가 거짓이 된다. 몰입 시간도 잰 값만 센다.
- 원인: 위 1·2(처리기 없는 호출 + 오류 삼킴 + 무조건 clear), 3(`else { totalMins += 25; }`).
- 중심: 저장의 주인은 `saveProfile`(기기 사본 + 로그인 사용자는 서버 goals·checkins upsert). 큐는 그 저장이 끝난 뒤에만 비운다.
- 핵심: 성공한 항목만 지우고, 실패는 남기고 알리고 다시 시도한다.

## 3. [원칙 ③] 해결방식
- `flush(handler)`: 처리기 없으면 0 반환·삭제 없음. 처리기 성공 항목만 id 로 빼고 실패 항목은 남김(처리 중 새로 들어온 항목도 보존). `lastResult` 기록.
- `restoreItem(item)`: 큐의 기록이 상태에 없으면 되살림(같은 id 있으면 그대로).
- `syncOnline()`: 큐 기록 되살림 → `saveProfile()` → 성공 뒤 큐 비움·화면 갱신·「오프라인 기록 N건을 동기화했어요」. 실패하면 큐 유지·「아직 보내지 못했어요」·30초 뒤 재시도(온라인일 때).
- online 처리기: `flush()` → `syncOnline()`.
- `calculateWeeklyFocusStats` 25분 대체값: **바꾸지 않음** — `scripts/smoke-test.js` 검사 「calculateWeeklyFocusStats: endAt 누락 기록은 기본 몰입시간(25분)을 반영한다」(기대값 25)가 이 동작을 정답으로 고정한다. 법정은 기준 시험지로 채점하므로 바꾸면 이 검사가 깨지고, 제품 함수를 돌리는 검사의 폐기는 상민님 결심 사항이다. 시나리오(진행 중 기록 → 홈 요약 「0시간 25분 몰입」)로 증상은 재현해 두었다(로컬: 기준 실패·수정판 통과).
- 대안: 서버에 바로 기록 1건씩 upsert — saveProfile 이 이미 기록 원장(OurgoalRecordLedger.upsertCheckinRows) 경로를 가진다. 두 길로 쓰지 않는다.

## 4. [원칙 ④] 재검토 — 한계
- `saveProfile` 이 내부에서 서버 오류를 삼키는 경로가 있으면 syncOnline 은 성공으로 본다(saveProfile 의 오류 보고 개선은 별도). 게스트는 서버로 보내지 않으므로 실패 경로는 노드 시험으로만 잰다(needs-login).
- 실기기 오프라인·로그인 계정은 재지 않았다.

## 5. [원칙 ⑤] 절차
기준 사본 → 시나리오 2개·노드 시험 1개 기준 실패 확인 → 수정 → 작업 통과 → npm test·module-guard → REQ·claims → push·PR·법정.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파
- 반론 1: "기록은 state·기기 사본에도 있어 큐를 비워도 손실이 아니다." → 격파: 로그인 사용자의 서버 원장에는 다음 saveProfile 전까지 없고, 기기 사본이 지워지면(캐시 삭제·계정 전환) 되살릴 근거는 큐뿐이다. 보내지 못한 것을 보냈다고 지우는 것이 GUARD_03 위반이다.
- 반론 2: "25분 대체값도 같은 허상지표이니 함께 고쳐야 한다." → 격파: 맞지만 기존 시험이 그 값을 정답으로 고정해, 바꾸면 시험 기대값 변경(상민님 결심)이 된다. 결심 요청으로 넘긴다.

## 7. [원칙 ⑦] 측정(작업자, 판정 아님)
- 시나리오 1개 기준 실패·작업 통과(`reports/TASK-ES-490/scenario-local.json`), 노드 시험 기준 실패(「실패한 항목(r2)은 큐에 남는다 — 남은 큐: []」)·작업 통과.

## 8. [원칙 ⑧] 막히는 지점 · 성과
- 법정 setOffline 은 Network.emulateNetworkConditions — 브라우저 online/offline 이벤트가 실제로 난다(로컬 실측).
