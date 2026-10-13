# 소통-피드 알고리즘 3단계 — 주간 유익함 지표·피드 출처 기록 (#TASK-ES-700)

- 티켓: #TASK-ES-700 (E3 · 본질 ③) · 선행: #TASK-ES-696(0단계) · 698(1단계) · 699(2단계, PR #972)
- 작성: 클로드코드(세션 54f461e5) · 2026-10-13
- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 5-2·5-3절 — https://claude.ai/code/artifact/37614418-4671-4c70-bd5b-49a714ffb35c

## 지시 항목 (claims.json R1~R4)

1. 주 1회 실데이터 지표 7개(도움돼요 비율·노하우 비율·같은 카테고리 응답률·off_topic 비율·도달·피드발 연결·설정 스냅샷). 체류시간·조회수 없음. 못 재면 null.
2. 경보 5종(5-2절 기준).
3. 피드에서 시작된 동반자 추가·팀 초대에 출처 기록.
4. service_role 로만 집계, 자격 없으면 measured=false.

## 구현

| 파일 | 무엇 |
| --- | --- |
| `scripts/feed-weekly-metrics.js` (신설) | compute(rows) 순수 계산 + fetchRows(sb) + CLI(`--out`, `--vault`, `--days`). 지난 7일 vs 그 앞 7일. 봇·본인·시뮬 제외. 경보 ALERT 한 곳. 출력 reports/feed-metrics/<주>.json, --vault 면 latest.json 도 |
| `js/tabs/comm/feed-list.js` | 동반자 추가·팀 영입 userObj 에 source:'feed'(각 1줄 안, 줄 수 증가 0) |
| `js/team-recruit.js` | 팀 초대 insert 에 source (같은 줄, 800줄 상한 영향 0) |
| `tests/feed-weekly-metrics.test.js` | 5절: 체류시간류 0 · 제외 규칙·비율 · 분모 0 → null · 경보 · 자격 없음 · 배선 |

## 운영 루프(보고서 5-3절)에서 이번에 들어간 것 / 남은 것

- 들어간 것: 월요일에 사람 PC(service_role)에서 `node scripts/feed-weekly-metrics.js --vault "C:/dev/vault/아워골_총괄 지식기반/피드지표"` → 볼트에 주간 JSON + latest.json. 경보는 JSON 의 alerts 에.
- 남은 것(이 PR 밖): 양비스 상태창 「피드 유익함」 줄과 소환 규칙(lib/rules.js)은 커맨드센터 쪽 변경이라 생각 맞추기 페이지가 끝난 뒤에 넣는다(2026-10-13 제약). 그때까지는 latest.json 을 사람이 읽는다. 동반자 추가 수는 profile JSON 이라 서버에서 못 세며(null), 세려면 서버 테이블이 필요하다(별도 제안).

## [손 필요]

스크립트 첫 실행(service_role 키가 있는 PC). 순서는 claims.json C5. 결과 한 줄과 alerts 를 알려 주시면 보고서 5-2 기준선(1단계 배포 전 2주 평균) 칸을 채운다.
