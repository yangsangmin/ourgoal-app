# REQ — #TASK-ES-621 생성 지도 일괄 갱신(main 11ae1374, PR #891 병합 뒤)

- 근거: 병합 뒤 의무(scripts/cell-map-sync.md) — PR #891(#TASK-ES-618, 설정 키트 1차 철거, index.html 143줄 삭제)이 인라인 덩어리를 줄였다. 생성 지도는 해당 PR 이 커밋하지 않는다(경험칙 L009).
- 범위: 생성 파일 3개(cell-map.json · inline-script-map.json · INLINE-SCRIPT-MAP.md) + REQ·claims·dev_log·TICKETS. module-baseline.json 은 #891 이 이미 기록했고 module-guard --update 가 「기준선과 같다」라 제외. 세포 설명 대기 0. 제품 코드(index.html, js/**)·생성기 변경 0.

## 1. [원칙 ①] 문제 정확히 파악 — 지시 요지

1. main(11ae1374) 기준으로 생성 지도를 지금 코드와 맞춘다.

## 2. [원칙 ②] 본질 · 원인 · 중심 · 핵심

- **본질**: 세포지도·인라인 지도가 main 실물을 가리켜야 구조도가 맞다.
- **원인**: #891 이 index.html 의 배선 줄을 지워 인라인 지도(IIFE 줄 수·window 이름 수)가 낡았다.
- **중심**: 생성 파일은 결정적 생성기가 만든다. 손으로 고치지 않는다.
- **핵심**: 세 생성기를 한 번에 돌려 한 PR 로 올린다.

## 3. [원칙 ③] 해결방식

- `node scripts/module-guard.js --update`(사유 없음) → `node scripts/cell-map-export.js` → `node scripts/inline-script-map.js --write`.

## 4. [원칙 ④] 재검토 — 한계

- 병합 전에 다른 PR 이 main 에 들어오면 다시 뒤처진다. 그때는 main 을 합친 뒤 다시 생성한다(L010). 전체 수치는 주장하지 않는다(L002).

## 5. [원칙 ⑤] 절차

1. 위 생성기 3개 실행 → `inline-script-map --check`·`module-guard`·`tests/cell-map-export-es414.test.js`·`npm test`(서류를 다 쓴 뒤 마지막, 전경).
2. 서류(REQ·claims·dev_log·TICKETS) → PR → 법정 판정 → 병합 뒤 웹 저장본·노션 세포지도·허브 갱신 시각·jsDelivr purge.

## 6. [원칙 ⑥] 절차 재검증 · 반론 격파

- 반론 「생성 파일을 다시 믿을 수 있는가」 → 생성기를 다시 돌려 `--check`(최신)·인라인 지도 `--check` 로 대조한다.

## 7. [원칙 ⑦] 단계별 실행 — 식별자

- 스크립트: `scripts/module-guard.js`(--update) · `scripts/cell-map-export.js` · `scripts/inline-script-map.js`(--write). 산출: 위 3개 파일.

## 8. [원칙 ⑧] 막힐 지점 예상 · 성과 측정

- 예상한 막힘: 서류가 8원칙 린터(npm test 검증 5/5)를 통과해야 한다. 성과 수치는 스크립트 출력만 인용하고 판정은 법정이 낸다.
