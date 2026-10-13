# 소통-피드 알고리즘 0단계 — 바닥 수리 (#TASK-ES-696)

- 티켓: #TASK-ES-696 (E3 · 본질 ③ 동류 발견·소통)
- 작성: 클로드코드(세션 54f461e5) · 2026-10-13
- 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 (Claude Docs, 2026-10-13) — https://claude.ai/code/artifact/37614418-4671-4c70-bd5b-49a714ffb35c
- 결심(상민님 2026-10-13 「다 권장안으로 진행해」): ② 노출 로그는 수집하지 않고 집계만(4주 뒤 재상기) · ⑤ 피드 노출 규범 신설 승인

## 이 PR 이 하는 것 (보고서 4절 0단계)

| 항목 | 파일 | 왜 |
| --- | --- | --- |
| 목표 topic ↔ 피드 카테고리 매핑표 (대범위 6 / 중범위 35 / 라벨 정규화 / 제목 정규식) | `js/data/category-map.js` | 목표 category 값은 한글 라벨까지 섞인 값이라 피드 사전 18키와 안 맞고, 공유 글 대부분이 기본값 'study' 로 올라갔다(share-to-feed.js 103~106행) |
| 글 메타 7칸 + 연결 출처 칸 + 18키 SQL 함수 + 과거 글 채우기 RPC + 글쓴이 카테고리 수정 RPC | `docs/sql/2026-10-13-feed-posts-category-columns.sql` | 서버가 "어느 목표·어느 팀에서 나온 어떤 글인지" 알아야 정렬·집계가 가능. feed_posts 에 UPDATE 정책이 없어 채우기는 SECURITY DEFINER RPC |
| 글 생성 3곳이 메타를 기록, 칸 없는 서버면 떼고 재시도 | `checkin-feedback.js` · `focus-autopilot.js` · `team-goals-screen.js` | SQL 실행 전에도 글쓰기가 끊기지 않게. extra 에 같은 값을 남겨 나중에 복원 |
| 내 카테고리 글 추가 조회(최신 50건 + 내 카테고리 50건) | `js/tabs/comm/feed-posts-sync.js` | 최신 50건만으로는 내 목표 카테고리 글이 거의 안 잡힘(독립 검토 B1) |
| 피드 노출 규범 8줄 + 기계 검사 2건 | `docs/rules/ESSENCE_OURGOAL.md` ③ · `docs/rules/rules.json` FEED_DWELL_SIGNALS·FEED_WEIGHTS_OUTSIDE_SETTINGS | 승인선 ⑤ — 상민님 승인 |
| 시험지 | `tests/feed-category-map.test.js` | 매핑 41건, JS·SQL 사본 일치, 재시도 insert, 규범 존재 |

## 이 PR 이 하지 않는 것

- `js/tabs/records/share-to-feed.js` 의 카테고리 기본값 줄(103~106행)은 고치지 않았다. 저장 경로 파일이라 DIR-006 담당(코덱스 세션 01a1310c, TASK-ES-695 검증 중)이 순서대로 고친다. 넘긴 내용: `selectedCat = (window.OurgoalCategoryMap && window.OurgoalCategoryMap.fromGoal(curGoal)) || 'life'` 로 바꾸고 insert 를 `OurgoalCategoryMap.insertFeedPost(L.sb, OurgoalCategoryMap.withMeta(post, OurgoalCategoryMap.feedPostMeta(curGoal, null, { categoryOverride: selectedCat, contentType: 'record', pct: goalPct })))` 로.
- 정렬·묶음·사유 라벨(1단계), 유익성 RPC·feed_settings(2단계), 주간 지표(3단계)는 다음 PR.

## [손 필요] SQL 실행

Supabase SQL Editor 에 `docs/sql/2026-10-13-feed-posts-category-columns.sql` 전체를 붙여 Run 1회. 그 뒤 `select * from public.feed_posts_backfill_category(500);` 를 remaining 이 0 이 될 때까지 반복. 실행 전까지 앱은 예전과 똑같이 동작한다(칸이 없으면 메타를 떼고 저장, 추가 조회는 건너뜀).

## 검증

- `node tests/feed-category-map.test.js` 통과(매핑 35+6, 라벨 정규화, 재시도 insert, SQL 사본 대조)
- `npm test` 결과는 PR 본문에 기록
