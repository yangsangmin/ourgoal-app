-- 2026-09-08 숨김 처리된 게시물·댓글의 REST 노출 차단 (PR #52 후속, AUD-7). Supabase SQL Editor에서 1회 실행.
--
-- 문제: PR #52가 hidden 컬럼과 클라이언트 필터(filterHidden)를 추가했지만, team_comments/feed_posts의
-- select 정책(team_comments_select_all/feed_posts_select_all, PR #41)은 auth.role()='authenticated'만
-- 검사해 hidden=true 행도 REST API로 그대로 조회된다 — 클라이언트 필터는 화면 표시만 막을 뿐 API 응답
-- 자체를 막지 못한다.
--
-- 선택(작성자 예외, (a) 정책변경+세션당 1회 재조회 대신): 정책에 순수 `and hidden is not true`만 추가하면
-- Supabase Realtime의 postgres_changes는 변경된 행(NEW)이 각 구독자의 select 정책을 통과해야만 그
-- 구독자에게 이벤트를 전달하므로, hidden=true로 바뀌는 순간 그 UPDATE 이벤트는 "그 글을 볼 수 있는 사람이
-- 아무도 없는" 상태가 되어 어떤 정책을 쓰든(작성자 예외 유무와 무관) 신고 대상 글을 이미 보고 있던
-- 목격자에게는 동일하게 전달되지 않는다(다음 재조회 시 정상적으로 걸러짐, PR #52의 회귀 아님 — 그
-- 경우도 실시간 반영이 아니라 재조회로 해결됨). 즉 두 방식 모두 목격자 관점의 실시간성 한계는 동일하므로,
-- 클라이언트 재조회 로직을 새로 추가하는 (a) 대신 SQL만으로 끝나는 (b) 작성자 예외를 택해 변경 범위를
-- 최소화한다. 작성자 예외를 두는 이유는 부수 효과일 뿐 목적이 아님 — 본인 글이므로 REST로 보여도 보안
-- 문제가 아니다.

drop policy if exists "team_comments_select_all" on public.team_comments;
create policy "team_comments_select_visible" on public.team_comments
  for select using (auth.role() = 'authenticated' and (hidden is not true or auth.uid() = user_id));

drop policy if exists "feed_posts_select_all" on public.feed_posts;
create policy "feed_posts_select_visible" on public.feed_posts
  for select using (auth.role() = 'authenticated' and (hidden is not true or auth.uid() = user_id));
