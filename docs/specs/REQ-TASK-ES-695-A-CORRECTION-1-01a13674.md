# PR980 교정 1 — 제출 초안 보존과 전문기록 상태 안내

실행 `TASK-ES-695-A-01a13674`, 원티켓 `TASK-ES-695`, 공통 `TASK-CC-CELL-UNWIRE-RUN-309dca5d`를 승계한다. 기준은 PR980 첫 HEAD `71429cb3a06a86106c1d14d8d28f6294d50fa3f2`, 작업참고 기준 PR #979다. 최초 공식 Court `4A23BBCD`의 돌려보냄 1회와 독립 D1 원의견은 덮지 않는다. 단독 제품 writer는 `/root/contracts`; 독립 검토·재청구·병합 결정은 총괄이 맡는다. 요청/실제 모델 근거는 `reports/TASK-ES-695-A-01a13674/correction-1/source-intake.json`에 있다.

## 1. [원칙 ①] 파악

`#captureInput`에서 `#captureSave`를 누른 뒤 native 저장 잠금 대기 중 새로 쓴 글이 저장 완료 때 소거됐다. 독립 raw SHA `1dc289fac34842e5daf0ebd1a67224131466efb6fa0731ef3e69d0d86adf6f67`와 첫 source는 correction-1/original에 그대로 있다. 전문 `#proRecMemo`·`#proGeneralSaveBtn` 경계도 같은 결박이 필요하다. C2 전문 시나리오 10번의 저장 안내를 기존 AI 안내가 곧 덮는 trace를 추가 측정했다.

## 2. [원칙 ②] 본질·원인·중심·핵심

기기 확인은 제출분의 보존 확인이다. 확인 뒤 현재 초안을 무조건 비우거나 현재 전문창을 닫는 것은 다른 세대의 입력을 지운다. 문자열이 같아도 새 입력 이벤트는 새 세대다. 확인된 첫 기록 ID를 다음 초안에 재사용하면 덮어쓰기가 된다. 자료를 못 쓴 경우는 성공이 아니며 XP를 주지 않는다.

## 3. [원칙 ③] 해결방식

`js/tabs/records/checkin-capture.js` 기존 `bindCaptureLiveMeta` 입력 처리기 안에서 텍스트 세대를 센다. 같은 저장 카드의 다른 필드는 별도 세대 감지만 연결하며 기존 사진/슬라이더 사업 처리기를 중복하지 않는다. 제출 문자열·입력 요소·세대·File/사진 identity가 같은 부분만 비운다. 새 초안은 ID를 분리한다. `js/tabs/records/pro-record-save.js`는 원 메모/버튼 DOM identity, 필드 이벤트 세대와 값, 사진을 결박하고 제출 rows/columns를 복사한다. 현재 창이 다른 초안이면 닫지 않는다. 늦은 AI는 원계정/기록 객체/본문에 귀속하고 새 초안을 침범하지 않는다.

## 4. [원칙 ④] 재검토

반론 1: 값 대조만 하면 같은 글을 재입력한 경우를 놓친다. 따라서 실제 입력/변경 이벤트 세대를 함께 비교한다. 반론 2: 입력을 막으면 소거를 막을 수 있다. 기존 정상 입력 기능을 제한하므로 채택하지 않는다. 제출 snapshot 보존과 ID 수명 분리로 해결한다. 변경되지 않은 사진 재시도는 같은 ID·원 XP 표시를 유지한다.

## 5. [원칙 ⑤] 절차

원 실패/원자료 봉인 → 실제 Chrome의 보이는 게스트 입구·마우스·키보드·native lock로 재현 → 같은 책임 두 파일 최소 교정 → 변경 경계 탐침·변하지 않은 C2 시나리오·정합 검사 → 정상 훅 commit → 총괄과 독립 검토자에게 새 HEAD를 넘긴다. 총괄 검토 전 push/Court 재청구하지 않는다. C4는 실제 로그인 원격 원장만 `tool-cannot-measure/needs-login`로 한정한다. PC 게스트와 local 부품 반례는 공개된 실제 측정이며 도구 한계로 숨기지 않는다.

## 6. [원칙 ⑥] 절차 재검증

HOME 새 본문·같은 글 재입력·첫 ID/다음 ID 분리, 전문 새 메모·같은 글·새 창 열기, 기기 쓰기 실패+새 입력 뒤 XP 0/입력 유지/원 제출 snapshot 보유와 재시도 후 두 ID를 각각 확인한다. 실패 제출분은 같은 세션의 원 profile/record snapshot으로만 보유하고 다음 같은 책임 저장 때 자료+목록을 먼저 확인한다. 장치 영구 실패 또는 확인 전 페이지 종료까지의 영속 보존은 미확인이다. 최초 시나리오·C2 expectation/step/assertion/id/kind·원 시험지·원 raw의 변경은 0이어야 한다.

## 7. [원칙 ⑦] 단계별 실행

측정은 correction-1 아래 새 파일에만 적는다. 실제 native Chrome 탐침은 게스트와 국소 저장/AI fault 경계이며 실계정 E2E·실기기 사진 보장·운영 사용이라고 부르지 않는다. 원 최초 작업자의 hidden span JS click와 새 보이는 입구 CDP mouse를 구분한다. `module-specs --write`, `module-guard`, claims schema, syntax, 변경 범위/원 바이트 대조와 필수 훅을 실행한다. 생성 기준선 손수 수정·기대값 수정·훅 우회는 하지 않는다.

## 8. [원칙 ⑧] 막히는 지점 예상

기기 영구 저장 실패에는 영속 보존을 약속하지 않는다. 원격 로그인·서버 CAS·여러기기·XP 원장은 미확인이다. 사진/AI/energy/focus 서버 확장, 새 비용, SQL·원 한 건 운영시험 재사용은 0이다. 규범·Court·게이트·ACTIVE·TICKETS·중앙 metadata 쓰기는 0이다. 반려가 3회 누적되면 해당 작업만 PIN_02로 중단한다. 원격 병합·운영 사용·효과·최종 Court 판정은 총괄의 별도 실물 측정 전 null이다.
