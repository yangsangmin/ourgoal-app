# REQ — #TASK-ES-612 생성 지도 일괄 갱신(main f0af028f, PR #883 병합 뒤)

- 근거: 병합 뒤 의무(scripts/cell-map-sync.md) — PR #883(#TASK-ES-610 세포 등록 기관 B1)이 새 세포 core/cell-registry 를 더했으나 생성 지도는 분열·신설 PR 이 커밋하지 않는다(충돌 왕복 방지, 경험칙 L009).
- 범위: 생성 파일 3개(cell-map.json · inline-script-map.json · INLINE-SCRIPT-MAP.md) + REQ·claims·dev_log·TICKETS. module-baseline.json 은 module-guard --update 가 바꾸지 않아(기준선과 같다) 제외. 제품 코드(index.html, js/**)·생성기 변경 0.

## 1. 지시 요지
main(f0af028f) 기준으로 생성 지도를 지금 코드와 맞춘다.

## 2. 본질·원인
- 본질: 세포지도·인라인 지도가 main 실물을 가리켜야 구조도가 맞다.
- 원인: #883 이 js/core/cell-registry.js 를 새로 더했고 생성 파일은 따로 갱신한다.

## 3. 절차
1. `node scripts/module-guard.js --update`(사유 없음 — 기준선과 같다고 출력) → `node scripts/cell-map-export.js` → `node scripts/inline-script-map.js --write`.
2. 검증: `inline-script-map --check`·`module-guard`·`tests/cell-map-export-es414.test.js`(17/17)·`npm test`.
3. 병합 뒤: 웹 저장본·노션 세포지도·허브 갱신 시각·jsDelivr purge.

## 4. 한계
PR 병합 전에 다른 분열 PR 이 main 에 들어오면 다시 뒤처진다. 그때는 main 을 합친 뒤 생성 파일을 손으로 풀지 않고 다시 생성한다(L010). 전체 수치는 주장하지 않는다(L002).
