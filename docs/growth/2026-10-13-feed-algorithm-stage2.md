# 소통-피드 알고리즘 2단계 — 서버 설정표·유익성 집계 (#TASK-ES-699)

- 티켓: #TASK-ES-699 (E3 · 본질 ③) · 선행: #TASK-ES-696(0단계, PR #969 병합) · #TASK-ES-698(1단계, PR #971) · 규범 #TASK-ES-697(PR #970 병합)
- 작성: 클로드코드(세션 54f461e5) · 2026-10-13
- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 3-2·5-1·4절 — https://claude.ai/code/artifact/37614418-4671-4c70-bd5b-49a714ffb35c

## 지시 항목 (claims.json R1~R5)

1. 가중치·상한·반감기는 서버 설정표 feed_settings 에서만, 변경 기록(누가·언제·전후값) 필수. 클라이언트는 받아서 기본값 위에 덮어쓴다.
2. 유익성 V = 같은 카테고리 안 도움돼요 + 이유 태그 가중(노하우·새 정보 1.0, 같은 처지·용기 0.8, 기타 0.5) + 내 이유 분포(p_u) 개인화.
3. 가드: 글쓴이 본인·봇·신규 7일(0.5)·상호 맞주고받기(50% 초과) 제외. 라벨 숫자는 가드 전 실데이터.
4. RPC 없음·feed.enabled=false → 즉시 예전 동작(되돌릴 수 있게).
5. 정렬 식은 클라이언트 feed-rank.js 한 곳. 서버는 설정·집계만.

## 보고서와 달라진 점 한 가지

보고서 4절 2단계는 "RPC feed_rank_posts 가 R×V×F 와 사유 코드를 돌려준다"로 적었다. 구현에서는 **서버가 정렬하지 않는다**. 이유: 같은 점수식을 SQL 과 JS 두 곳에 두면 둘이 어긋날 때 어느 쪽이 맞는지 알 수 없고(1단계 시험지가 재는 규범도 한 곳만 잰다), 1단계가 이미 클라이언트에서 정렬한다. 서버는 식의 **입력**(설정·가드 적용 집계·내 이유 분포)만 준다. 되돌릴 수 있는 선택이며 보고서 8절 다음 줄에 기록한다.

## 구현

| 파일 | 무엇 |
| --- | --- |
| `docs/sql/2026-10-13-feed-settings-and-value.sql` | feed_settings(6키, 읽기 전원·쓰기 service_role) · feed_settings_log + 트리거(set_config('feed.change_reason') 로 사유) · feed_settings_get() · feed_value_counts(ids, days)(30일·태그별·가드) · my_helpful_tag_profile() |
| `js/tabs/comm/feed-rank-server.js` (신설) | 세 RPC 를 캐시(10·5·10분)로 읽고, 값이 오면 rerender 1회. RPC 없으면 재시도 없이 1단계 그대로 |
| `js/tabs/comm/feed-rank.js` | DEFAULTS 에 tagW·a, value() 가 helpfulTags·p_u·helpfulAdj 반영, 서버 settings 덮어쓰기·sections 병합, feed.enabled=false → null |
| `js/tabs/comm/feed-list.js` | arrange 에 서버 설정·집계·이유 분포 주입(서버 집계 없으면 reactions.js 집계) |
| `index.html` | feed-rank-server.js 태그 |
| `tests/feed-rank-server.test.js` | 8절: 설정 평탄화·집계 변환·태그 가중/p_u/가드·설정 덮어쓰기·enabled=false·RPC 3종+TTL+rerender 1회·RPC 없음·SQL 기본값=DEFAULTS·배선 |

## [손 필요] SQL 실행

Supabase SQL Editor 에 `docs/sql/2026-10-13-feed-settings-and-value.sql` 전체 Run 1회. 확인 순서는 claims.json C7. 설정을 바꿀 때는 사유를 먼저 적는다:

```sql
select set_config('feed.change_reason', '주간 리뷰: 사유', true);
update public.feed_settings set value = value || '{"wTeam":1.0}' where key = 'feed.weights';
select key, before, after, reason, changed_at from public.feed_settings_log order by changed_at desc limit 5;
```

## 하지 않은 것

- 주간 지표 스크립트·운영 경보·동반자/팀 초대 source='feed' 기록 — 3단계
- 노출 로그 — 결심 ②(집계만)
