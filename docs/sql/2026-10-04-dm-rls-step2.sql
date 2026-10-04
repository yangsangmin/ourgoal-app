-- 2026-10-04 #TASK-ES-347 2단계 — 행 종류별로 "그 행을 볼 정당한 사람"만 읽고, 본인 행만 쓰게 좁힌다
-- 전제: 1단계(2026-10-04-dm-rls-step1.sql)를 실행하고 앱에서 DM·피드 댓글·마니또·팀 채팅이 정상인지 확인한 뒤 실행.
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
-- 되돌리기: docs/sql/2026-10-04-dm-rls-step2-rollback.sql
--
-- 방식
--   1단계와 같이 기존 정책은 지우지 않고 RESTRICTIVE 정책만 더한다(기존 허용 정책과 AND).
--   그래서 되돌리기는 이 파일이 만든 정책을 지우는 것만으로 끝난다.
--   정책은 그 행 자신의 칸과 auth.uid() 만 본다(다른 표 조회 없음 → Realtime 구독이 느려지지 않는다).
--   id 칸이 text 로 쓰이므로(게스트 'guest-…', 'u_…' 도 들어 있다) 비교는 양쪽을 ::text 로 맞춘다.
--
-- 행 종류(앱 코드 전수 조사 결과 — docs/specs/REQ-TASK-ES-347-DM-RLS.md 표 참조)
--   team_pings
--     A. 1:1 DM 대화방 부모 행      group_id='dm_direct', target_type='dm'           → 보낸 사람·받는 사람
--     B. 1:1 선물(갓생 카드·템플릿)  group_id like 'dm\_%'                            → 보낸 사람·받는 사람
--     C. 마니또 익명 응원           group_id='manito', target_type='manito_cheer'    → 보낸 사람·받는 사람
--     D. 피드 댓글                  group_id='feed', target_type='feed_comment'      → 로그인 사용자 전체(feed_posts 와 같은 규칙)
--     E. 공개 팀 목록               group_id='shared_groups', target_type='team_group' → 로그인 사용자 전체(팀 찾기 화면)
--     F. 마니또 참가자 풀           group_id='manito_pool', target_type='manito_member' → 로그인 사용자 전체(짝 찾기에 필요)
--     G. 팀 채팅                    group_id=<팀 id>, target_type='team_chat'        → 로그인 사용자 전체
--        ※ 팀 구성원 정보가 서버에 없다(state.profile.settings.groupState 는 users 표에 저장되지 않음).
--          그래서 "그 팀 구성원만"은 지금 표현할 수 없고 로그인 사용자로 좁히는 것이 한계다.
--     H. 그 밖의 팀 활동 기록(체크인 인증·팀장 도장·응원·찌르기·팀 공유 카드)
--        target_type in ('checkin_certification','leader_action','member_nudge','member_ping','team_group'(팀 id 아래))
--        → 앱 어디에서도 다시 읽지 않는다(쓰기 전용). 보낸 사람 본인만.
--   team_ping_replies (1:1 DM 메시지)
--     보낸 사람·받는 사람만 읽기, 보낸 사람만 쓰기·지우기, 받는 사람은 읽음 표시(update) 가능.
--
-- 이 단계가 바꾸는 것(의도된 영향)
--   - anon(로그인 세션 없음)은 두 표에 읽기·쓰기 모두 못 한다. 게스트·구글 직접 로그인·빠른 복구 입장·테스터 B 의
--     팀 채팅/체크인 인증/댓글 서버 저장이 조용히 실패한다(화면에는 로컬로 남는다). 남의 이름으로 DM·댓글을
--     써 넣는 위조(sender_id 를 아무 값으로 넣는 insert)를 막기 위해 필요하다.
--   - 로그인 사용자는 sender_id 가 자기 id 인 행만 쓸 수 있다.

begin;

do $guard$
begin
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'team_pings' and c.relrowsecurity)
     or not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname = 'public' and c.relname = 'team_ping_replies' and c.relrowsecurity) then
    raise exception 'RLS 가 꺼진 표가 있습니다. 이 스크립트를 멈춥니다(세션에 알려 주세요).';
  end if;
end
$guard$;

-- ============================================================
-- [1] anon — 읽기·쓰기 전부 차단 (1단계의 select 차단을 쓰기까지 넓힌다)
-- ============================================================
drop policy if exists es347_anon_no_access on public.team_pings;
create policy es347_anon_no_access on public.team_pings
  as restrictive for all to anon using (false) with check (false);

drop policy if exists es347_anon_no_access on public.team_ping_replies;
create policy es347_anon_no_access on public.team_ping_replies
  as restrictive for all to anon using (false) with check (false);

-- ============================================================
-- [2] team_pings — 로그인 사용자
-- ============================================================
drop policy if exists es347_auth_select on public.team_pings;
create policy es347_auth_select on public.team_pings
  as restrictive for select to authenticated using (
       sender_id::text   = (select auth.uid())::text                                   -- 내가 보낸 모든 행
    or receiver_id::text = (select auth.uid())::text                                   -- A·B·C: 나에게 온 DM·선물·마니또 응원
    or (group_id = 'feed'          and target_type = 'feed_comment')                   -- D
    or (group_id = 'shared_groups' and target_type = 'team_group')                     -- E
    or (group_id = 'manito_pool'   and target_type = 'manito_member')                  -- F
    or (target_type = 'team_chat'                                                      -- G
        and group_id not in ('dm_direct', 'manito', 'manito_pool', 'feed', 'shared_groups')
        and group_id not like 'dm\_%')
  );

drop policy if exists es347_auth_insert on public.team_pings;
create policy es347_auth_insert on public.team_pings
  as restrictive for insert to authenticated
  with check (sender_id::text = (select auth.uid())::text);

-- DM 대화방 부모 행은 두 사람이 같은 id 로 번갈아 upsert 한다(js/team-invite-comm.js getDmThreadId).
-- 그래서 수정은 보낸 사람뿐 아니라 받는 사람에게도 열고, 수정 뒤에도 두 사람 중 하나가 남아 있어야 한다.
drop policy if exists es347_auth_update on public.team_pings;
create policy es347_auth_update on public.team_pings
  as restrictive for update to authenticated
  using      ((select auth.uid())::text in (sender_id::text, receiver_id::text))
  with check ((select auth.uid())::text in (sender_id::text, receiver_id::text));

drop policy if exists es347_auth_delete on public.team_pings;
create policy es347_auth_delete on public.team_pings
  as restrictive for delete to authenticated
  using (sender_id::text = (select auth.uid())::text);

-- ============================================================
-- [3] team_ping_replies — 로그인 사용자 (1:1 DM 메시지)
-- ============================================================
drop policy if exists es347_auth_select on public.team_ping_replies;
create policy es347_auth_select on public.team_ping_replies
  as restrictive for select to authenticated
  using ((select auth.uid())::text in (sender_id::text, receiver_id::text));

drop policy if exists es347_auth_insert on public.team_ping_replies;
create policy es347_auth_insert on public.team_ping_replies
  as restrictive for insert to authenticated
  with check (sender_id::text = (select auth.uid())::text);

-- 받는 사람이 읽음 표시(is_read·status·read_at)를 바꾼다(markDmThreadAsRead).
drop policy if exists es347_auth_update on public.team_ping_replies;
create policy es347_auth_update on public.team_ping_replies
  as restrictive for update to authenticated
  using      ((select auth.uid())::text in (sender_id::text, receiver_id::text))
  with check ((select auth.uid())::text in (sender_id::text, receiver_id::text));

drop policy if exists es347_auth_delete on public.team_ping_replies;
create policy es347_auth_delete on public.team_ping_replies
  as restrictive for delete to authenticated
  using (sender_id::text = (select auth.uid())::text);

commit;

-- [확인 1] 정책 수: team_pings 5, team_ping_replies 5
select tablename as 표, count(*) as es347_2단계_정책_수
  from pg_policies
 where schemaname = 'public' and tablename in ('team_pings', 'team_ping_replies')
   and policyname in ('es347_anon_no_access', 'es347_auth_select', 'es347_auth_insert', 'es347_auth_update', 'es347_auth_delete')
 group by tablename order by tablename;

-- [확인 2] anon 으로 보이는 행 수: 0, 0
begin;
set local role anon;
select 'team_pings (anon)' as 확인, count(*) as 수 from public.team_pings
union all
select 'team_ping_replies (anon)', count(*) from public.team_ping_replies;
rollback;

-- [확인 3] 로그인 사용자 A·B 로 보이는 것 — docs/sql/2026-10-04-dm-rls-check.sql 의 [사후-3] 을 사용한다.
