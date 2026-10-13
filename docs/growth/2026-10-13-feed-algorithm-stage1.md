# 소통-피드 알고리즘 1단계 — 묶음·정렬·사유 라벨 (#TASK-ES-698)

- 티켓: #TASK-ES-698 (E3 · 본질 ③ 동류 발견·소통) · 선행: #TASK-ES-696(0단계, PR #969) · 규범: #TASK-ES-697(PR #970, 상민님 병합용)
- 작성: 클로드코드(세션 54f461e5) · 2026-10-13
- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 3-1~3-7·4-1·4-2절 — https://claude.ai/code/artifact/37614418-4671-4c70-bd5b-49a714ffb35c

## 지시 항목 (claims.json R1~R7 과 같다)

1. 피드는 사용자별 목표·가입 팀에 맞는 글을 먼저. 점수 = R(관련성) × V(유익성) × F(신선도). 체류시간·조회수 없음.
2. 다섯 묶음: 내 팀 소식 · 내 목표에 도움될 글 · 같은 길 가는 사람들 · 넓히기 · 마감선(아래는 전체 최신순).
3. 추천 카드마다 "왜 보이나요" 사유 라벨 1개. 사유 없는 글은 추천하지 않음. 상대 비교 수치 금지.
4. 봇·시뮬·차단·내 글은 추천 묶음에 없음.
5. 하루 추천 상한(기기 기록)·마감선·콜드스타트(묶음 2 가 3건 미만이면 2·4 숨김).
6. 가중치는 feed-rank.js DEFAULTS 한 곳(1단계 임시 — 2단계 feed_settings 가 덮어씀).
7. '전체' 칩·'전체' 피드일 때만. 목표·팀 없는 사용자는 예전 그대로.

## 구현

| 파일 | 무엇 |
| --- | --- |
| `js/tabs/comm/feed-rank.js` (신설, 순수 함수) | buildContext(profile) · score = R×V×F · reasonFor · arrange(items, ctx, {counts, storage}) → {items, render(마커 포함), sections, hidden, daily} · markerHtml · reasonHtml |
| `js/tabs/comm/feed-list.js` | 카드 객체에 0단계 메타 칸(groupId·topic·goalId·contentType·authorPct·createdAt) · '전체'일 때 arrange 호출 · 렌더 목록에 묶음 머리·마감선 마커 · 카드 위 사유 라벨 |
| `index.html` | feed-rank.js script 태그(category-map.js 뒤, feed-list.js 앞) |
| `tests/feed-rank.test.js` | 12절: 체류시간류 변수 0 · 컨텍스트 · 목표 0 → null · 러닝>공부 · 팀 묶음 48h · 봇/내 글/차단 제외 · 사유 라벨 전부·상대 수치 0 · V 와 베이즈 축소 · F 72h · 콜드스타트 · 하루 상한·재렌더 안정 · 넓히기 인접 · 마크업 이스케이프·feed-list 가중치 0 |

## 유익성 V 의 데이터 (1단계)

`js/reactions.js` 가 서버 RPC `count_content_reactions` 로 받아 둔 집계(`_state().counts`)를 그대로 쓴다. 첫 렌더에는 집계가 아직 없을 수 있어 V=1(R·F 만으로 정렬)이고, 반응 모듈이 집계를 받으면 다음 렌더부터 반영된다. 이유 태그 가중(how_to 등)과 개인화 p_u 는 2단계(RPC `feed_rank_posts`)에서.

## 하지 않은 것

- feed_settings 서버 설정표·변경 로그, 유익성 RPC, 이유 태그 가중 — 2단계
- 동반자 추가·팀 초대의 source='feed' 기록, 주간 지표 스크립트 — 3단계
- 노출 로그 — 결심 ②(집계만, 4주 뒤 재상기)

## 검증

- `node tests/feed-rank.test.js`, `node tests/feed-category-map.test.js` 통과
- `npm test` 결과는 PR 본문에 기록
