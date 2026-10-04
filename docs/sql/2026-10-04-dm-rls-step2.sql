-- 2026-10-04 #TASK-ES-347 2단계 — 행 종류별로 "그 행을 볼 정당한 사람"만 읽고, 본인 행만 쓰게 좁힌다
-- 2026-10-05 #TASK-ES-381 재확정 — #680(TASK-ES-366) 뒤의 앱 요청·og_dm_mark 와 대조해 고침(아래 [ES-381 변경]). 아직 운영 미적용.
-- 전제: 1단계(2026-10-04-dm-rls-step1.sql)·읽음 열(2026-10-04-dm-read-columns.sql)이 운영에 적용된 상태.
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
-- 되돌리기: docs/sql/2026-10-04-dm-rls-step2-rollback.sql (정책 이름이 그대로라 같은 파일로 지워진다)
--
-- 방식
--   1단계와 같이 기존 정책은 지우지 않고 RESTRICTIVE 정책만 더한다(기존 허용 정책과 AND).
--   그래서 이 파일은 지금 허용된 것을 좁히기만 하고, 새로 허용하는 것은 없다.
--   되돌리기는 이 파일이 만든 정책을 지우는 것만으로 끝난다.
--   정책은 그 행 자신의 칸과 auth.uid() 만 본다(다른 표 조회 없음 → Realtime 구독이 느려지지 않는다).
--   id 칸이 text 로 쓰이므로(게스트 'guest-…', 'u_…' 도 들어 있다) 비교는 양쪽을 ::text 로 맞춘다.
--   대화방 id 는 앱이 JS 문자열 비교(<)로 두 id 를 정렬해 만든다 → SQL 은 collate "C"(바이트 순)로 같은 순서를 낸다.
--
-- 행 종류(앱 코드 전수 조사 — docs/specs/REQ-TASK-ES-347-DM-RLS.md, docs/specs/REQ-TASK-ES-381-DM-RLS-STEP2.md 표 참조)
--   team_pings
--     A. 1:1 DM 대화방 부모 행      group_id='dm_direct', target_type='dm'           → 보낸 사람·받는 사람
--        id = 'dm_'||작은id||'_'||큰id (js/team-invite-comm.js getDmThreadId) 또는 작은id||'_'||큰id (피드 공유 DM 경로)
--     B. 1:1 선물(갓생 카드·템플릿)  group_id like 'dm\_%'                            → 보낸 사람·받는 사람
--     C. 마니또 익명 응원           group_id='manito', target_type='manito_cheer'    → 보낸 사람·받는 사람
--     D. 피드 댓글                  group_id='feed', target_type='feed_comment'      → 로그인 사용자 전체(feed_posts 와 같은 규칙)
--     E. 공개 팀 목록               group_id='shared_groups', target_type='team_group' → 로그인 사용자 전체(팀 찾기 화면)
--     F. 마니또 참가자 풀           group_id='manito_pool', target_type='manito_member' → 로그인 사용자 전체(짝 찾기에 필요)
--        id = 'mn_pool_'||본인 id (index.html 마니또 참여 upsert)
--     G. 팀 채팅                    group_id=<팀 id>, target_type='team_chat'        → 로그인 사용자 전체
--        ※ 팀 구성원 정보가 서버에 없다(state.profile.settings.groupState 는 users 표에 저장되지 않음).
--          그래서 "그 팀 구성원만"은 지금 표현할 수 없고 로그인 사용자로 좁히는 것이 한계다.
--     H. 그 밖의 팀 활동 기록(체크인 인증·팀장 도장·응원·찌르기·팀 공유 카드)
--        target_type in ('checkin_certification','leader_action','member_nudge','member_ping','team_group'(팀 id 아래))
--        → 앱 어디에서도 다시 읽지 않는다(쓰기 전용). 보낸 사람 본인만.
--   team_ping_replies (1:1 DM 메시지)
--     보낸 사람·받는 사람만 읽기, 보낸 사람만 쓰기·고치기·지우기.
--     ping_id 는 (보낸 사람, 받는 사람) 두 사람의 대화방 id 여야 한다.
--     받는 사람의 읽음·도착 표시는 표를 직접 update 하지 않고 함수 og_dm_mark(security definer, 2026-10-04-dm-read-columns.sql)로만 한다.
--     ※ og_dm_mark 는 표 주인 권한으로 돌아 아래 정책(to anon / to authenticated)의 적용을 받지 않는다.
--       단, 표에 FORCE ROW LEVEL SECURITY 가 켜져 있으면 주인도 정책을 받아 함수가 0행이 된다 → check.sql [사전-6] 에서 rls_강제=false 확인.
--
-- [ES-381 변경] (2026-10-04 판 대비 — 모두 "더 좁히는" 방향, 지금 앱이 실제로 보내는 요청은 그대로 통과)
--   1) team_ping_replies insert: sender_id 만 보던 것을 ping_id 가 두 사람의 대화방 id 인지까지 본다.
--      전에는 B 가 sender_id=B, receiver_id=A, ping_id='dm_A_C' 로 넣으면 A 의 C 대화방 안에 C 가 쓴 것처럼 보였다(대화방 끼워 넣기).
--   2) team_ping_replies update: "보낸 사람·받는 사람" → "보낸 사람만"(+대화방 id 유지). 받는 사람이 직접 update 하면 본문까지 고칠 수 있어서다.
--      운영엔 이 표의 update 허용 정책이 원래 없어(#680 실측 0행) 지금 앱 동작은 바뀌지 않는다. 읽음은 og_dm_mark 가 한다.
--   3) team_pings insert·update: 대화방 부모 행(dm_direct)은 id 가 (보낸 사람, 받는 사람)의 대화방 id, 마니또 풀 행은 id='mn_pool_'||보낸 사람.
--      전에는 B 가 'dm_A_C'·'mn_pool_C' 를 먼저 만들어 두면 C 의 upsert(충돌 시 update)가 막혔다(선점).
--   4) 조건은 is distinct from 으로 써서 group_id 가 null 인 행도 의도대로 판정한다(restrictive 는 null 을 거절로 본다).
--
-- 이 단계가 바꾸는 것(의도된 영향)
--   - anon(로그인 세션 없음)은 두 표에 읽기·쓰기 모두 못 한다. 게스트·구글 직접 로그인·빠른 복구 입장·테스터 B 의
--     팀 채팅/체크인 인증/댓글 서버 저장이 조용히 실패한다(화면에는 로컬로 남는다). 남의 이름으로 DM·댓글을
--     써 넣는 위조(sender_id 를 아무 값으로 넣는 insert)를 막기 위해 필요하다.
--   - 로그인 사용자는 sender_id 가 자기 id 인 행만 쓸 수 있다.
--   - 표시 이름(sender_name)은 누구나 아무 글자나 넣을 수 있다(이름은 신원이 아니다 — 앱은 sender_id 로 사람을 가린다).

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

-- 쓰기: 본인 이름 + (대화방 부모 행이면 id 가 두 사람의 대화방 id) + (마니또 풀 행이면 id 가 본인 풀 id)
drop policy if exists es347_auth_insert on public.team_pings;
create policy es347_auth_insert on public.team_pings
  as restrictive for insert to authenticated
  with check (
    sender_id::text = (select auth.uid())::text
    and (group_id is distinct from 'dm_direct'
         or id::text in ('dm_' || least(sender_id::text collate "C", receiver_id::text collate "C")
                               || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"),
                         least(sender_id::text collate "C", receiver_id::text collate "C")
                               || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C")))
    and (group_id is distinct from 'manito_pool' or id::text = 'mn_pool_' || sender_id::text)
  );

-- DM 대화방 부모 행은 두 사람이 같은 id 로 번갈아 upsert 한다(js/team-invite-comm.js getDmThreadId).
-- 그래서 수정은 보낸 사람뿐 아니라 받는 사람에게도 열고, 수정 뒤에도 두 사람 중 하나가 남아 있어야 하며 id 규칙도 지켜야 한다.
drop policy if exists es347_auth_update on public.team_pings;
create policy es347_auth_update on public.team_pings
  as restrictive for update to authenticated
  using      ((select auth.uid())::text in (sender_id::text, receiver_id::text))
  with check (
    (select auth.uid())::text in (sender_id::text, receiver_id::text)
    and (group_id is distinct from 'dm_direct'
         or id::text in ('dm_' || least(sender_id::text collate "C", receiver_id::text collate "C")
                               || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"),
                         least(sender_id::text collate "C", receiver_id::text collate "C")
                               || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C")))
    and (group_id is distinct from 'manito_pool' or id::text = 'mn_pool_' || sender_id::text)
  );

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

-- 본인 이름 + 두 사람의 대화방 안에만(남의 대화방에 끼워 넣기 차단)
drop policy if exists es347_auth_insert on public.team_ping_replies;
create policy es347_auth_insert on public.team_ping_replies
  as restrictive for insert to authenticated
  with check (
    sender_id::text = (select auth.uid())::text
    and ping_id::text in ('dm_' || least(sender_id::text collate "C", receiver_id::text collate "C")
                                || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"),
                          least(sender_id::text collate "C", receiver_id::text collate "C")
                                || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"))
  );

-- 고치기는 보낸 사람만. 받는 사람의 읽음·도착 표시는 og_dm_mark(본인이 받는 사람인 행의 읽음·도착 열만)로 한다.
drop policy if exists es347_auth_update on public.team_ping_replies;
create policy es347_auth_update on public.team_ping_replies
  as restrictive for update to authenticated
  using (sender_id::text = (select auth.uid())::text)
  with check (
    sender_id::text = (select auth.uid())::text
    and ping_id::text in ('dm_' || least(sender_id::text collate "C", receiver_id::text collate "C")
                                || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"),
                          least(sender_id::text collate "C", receiver_id::text collate "C")
                                || '_' || greatest(sender_id::text collate "C", receiver_id::text collate "C"))
  );

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
