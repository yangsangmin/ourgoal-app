-- Deferred until root source review and actual privacy apply. Never execute as a write-route permission probe before apply.
-- TEST_A_UUID/TEST_B_UUID are existing authorized test-account auth results, bound transiently by executor, never logged.
-- This real-server transaction fixture tests policies/functions; it is not normal UI/account E2E or product-use certification.
begin;
set local lock_timeout='5s'; set local statement_timeout='30s';
create temporary table __og_feed_test_counts(k text primary key,n bigint) on commit drop;
grant select,insert on __og_feed_test_counts to authenticated;
-- New temporary rows only; no feed_posts, public posts, events, settings or credit changes. Always rollback.
insert into public.content_reactions(target_type,target_id,user_id,type,advice_text,advice_visibility)
values ('feed_post','__private_permission_fixture__','TEST_A_UUID'::uuid,'advice','own fixture A','author_only'),
       ('feed_post','__private_permission_fixture__','TEST_B_UUID'::uuid,'advice','own fixture B','everyone');
insert into public.helpful_reasons(target_type,target_id,user_id,reason_tag,reason_text)
values ('feed_post','__private_permission_fixture__','TEST_A_UUID'::uuid,'how_to','own fixture A'),
       ('feed_post','__private_permission_fixture__','TEST_B_UUID'::uuid,'other','own fixture B');
select set_config('request.jwt.claim.sub','TEST_A_UUID',true);
set local role authenticated;
insert into __og_feed_test_counts select 'self_reactions',count(*) from public.content_reactions where target_id='__private_permission_fixture__';
insert into __og_feed_test_counts select 'self_reasons',count(*) from public.helpful_reasons where target_id='__private_permission_fixture__';
insert into __og_feed_test_counts select 'self_advice_rpc',count(*) from public.list_content_advice(array['__private_permission_fixture__']) where user_id=auth.uid();
insert into __og_feed_test_counts select 'other_advice_rpc',count(*) from public.list_content_advice(array['__private_permission_fixture__']) where user_id<>auth.uid();
reset role;
do $check$
begin
 if (select n from __og_feed_test_counts where k='self_reactions')<>1 or (select n from __og_feed_test_counts where k='self_reasons')<>1 or (select n from __og_feed_test_counts where k='self_advice_rpc')<>1 or (select n from __og_feed_test_counts where k='other_advice_rpc')<>0 then raise exception 'SELF_ISOLATION'; end if;
 if has_table_privilege('anon','public.feed_settings_log','SELECT') or has_table_privilege('authenticated','public.feed_settings_log','SELECT') then raise exception 'AUDIT_PRIVATE'; end if;
 if has_function_privilege('anon','public.list_content_advice(text[])','EXECUTE') or has_function_privilege('anon','public.react_content(text,text,text,text,text,text,text,text)','EXECUTE') then raise exception 'ANON_PRIVATE_EXECUTE'; end if;
 if not has_function_privilege('anon','public.feed_settings_get()','EXECUTE') or not has_function_privilege('authenticated','public.feed_value_counts(text[],integer)','EXECUTE') then raise exception 'AGGREGATE_SIGNATURE'; end if;
 if not has_column_privilege('anon','public.feed_settings','value','SELECT') or has_column_privilege('anon','public.feed_settings','updated_at','SELECT') then raise exception 'SETTINGS_VALUES_ONLY'; end if;
 if (select pg_get_function_result(to_regprocedure('public.feed_value_counts(text[],integer)')))~'(user_id|reactor_name|reason_text|advice_text)' then raise exception 'AGGREGATE_RAW_FIELD'; end if;
end;
$check$;
-- Output contains only named booleans/counts, not user IDs or fixture text.
select jsonb_build_object('selfIsolation',true,'auditPrivate',true,'aggregateSignatures',true,'rowsPersisted',0) as permission_result;
rollback;
