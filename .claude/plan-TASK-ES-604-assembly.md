목표: TASK-ES-604 원6 산출물과 원시를 보존하고, 별도 root 역사적 재측정의 독립 보강을 공개 가능한 최소 assembly 후보로 추가해 root에 동결 인계한다.

- [x] 최소계약·정본·원6·19입력 SHA 대조 · 예상 3분 · 계약/actual-review/rootmeasurement/sourceBindings 해시 모두 일치하며 새 원본 수정 없음.
- [x] 공개 source-context/독립재측정/보존/실행/동일raw/한계 6그룹 구성 · 예상 4분 · private snapshot·prompt·identity·auth 없이 역사적 증거를 새 additive 후보에 연결한다.
- [x] 후보 내용·sourcehash·출처/한계 검사 · 예상 3분 · 원6 SHA 유지와 역사적713 vs 최신872/56 차이, actualmodel/effort null, noportableclaim 확인.
- [x] 동결 인계 · 예상 1분 · 후보목록·SHA·실제 검사·미검증을 root에 전달하며 stage/commit/PR/merge/Notion 작업 없음.

결정 요약: 과도한 portable 재실행기 신설 없이 local exact replay의 역사적 정본과 독립한계를 보강한다. 원script 보존 상수는 측정으로 채택하지 않고 원script는 실행하지 않는다.

## 1. [원칙 ①] 문제 정확히 파악
원6 산출물의 세포 의미 대조 기여와 root의 실제 독립 보존 측정을 구분해야 한다. 계약에 맞는 공개 보강은 새 reports 파일로만 만든다.
## 2. [원칙 ②] 본질·원인·중심·핵심
본질은 검증 근거의 정직한 분리다. 원인은 원script standalone preservation의 상수0/true가 실제 측정을 대신한 점이다. 중심은 원6 바이트 보존과 독립 실제 baseline, 핵심은 역사적 맥락·실행영수증·원시/hash·한계를 함께 싣는 것이다.
## 3. [원칙 ③] 해결방식
최소계약 여섯 그룹으로 별도 공개 assembly를 구성한다. 실제 root exporter/기준 전후 측정·실패gate·원raw동일SHA를 역사적 사실로 연결하며 portable 동작을 새로 주장하지 않는다.
## 4. [원칙 ④] 재검토
재측정 당시 canonical713은 역사적 맥락으로 보존한다. 현재 WORK-REFERENCE는 PR872/56이며 오래된 exact replay 조건을 지금 성공이라고 말하지 않는다. privateinput/snapshot/raw명령주소/identity/config값은 공개하지 않는다.
## 5. [원칙 ⑤] 절차
정본/contractSHA 읽기→원6/입력/hash 확인→필요 공개 fields만 추출→새 additive source-context/measurement/한계 작성→원6 재검사→candidate freeze 인계.
## 6. [원칙 ⑥] 절차 재검증·반론 격파
반론1: 보존상수 결과가 들어 있으니 성공으로 써도 된다. 대응: 원시를 보존하되 보존측정으로 수용하지 않고 실제 독립 baseline 전후만 근거로 쓴다. 반론2: 미래portableprobe를 새로 만들면 더 완전하다. 대응: 현재 업무종결 하한은 역사적 exact replay와 독립한계이며 최신 canonical drift로 옛 replay는 차단돼야 한다. 기능 범위 확대를 하지 않는다.
## 7. [원칙 ⑦] 단계별 실행
별도 source/context/addendum 후보만 생성한다. root계약을 쓴 읽기 전용 assembly 검사만 실행하고 원measure-map.cjs는 재실행하지 않는다. 원claims/6개본문 수정 금지.
## 8. [원칙 ⑧] 막히는 지점 예상·성과 측정
현canonical변경으로 옛정확조건 실패, snapshot비공개, exporter 재실행이 원시를덮을 위험을 예상한다. historical srcSHA/hashrefs로 맥락을 고정하고 현재환경성공/모델/effort/제품E2E/Court/web/Notion완료를 추측하지 않는다.
준비 실물 검사: preparation-checks.json의 source/hash/field 대조 및 verify-and-freeze.cjs의 내용/연결/보존 대조. 실제 exporter/audit/worker 재실행·Git stage/commit/PR/merge·Notion 작업은 하지 않았다. 후보는 독립 검토 대상이며 Court 판정은 null이다.
