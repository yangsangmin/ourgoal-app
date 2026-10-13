-- D22 최소 개인정보 교정. 서버 적용 전 root의 별도 고정 소스 검토 필수.
-- 사전 metadata d49d82ac06f8a604e6c482d243813ecfc39bc17c74dbc8ad55b15456728bd83d; 원행/setting/credit 보존. exposure/credit/category/backfill 0.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
lock table public.content_reactions,public.helpful_reasons,public.feed_settings,public.feed_settings_log in share row exclusive mode;

-- owner OIDs are captured inside this actual transaction; historical preflight owner baseline is unknown.
create temporary table __og_feed_owner_frame on commit drop as
 select 'function'::text as kind,p.oid,p.proowner as owner from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('unreact_content','count_content_reactions','poor_reason_breakdown','react_content','moderate_advice','my_content_reactions','list_content_advice','save_helpful_reason','helpful_reason_summary','feed_settings_get','feed_settings_log_trigger','feed_value_counts','my_helpful_tag_profile')
 union all select 'table',c.oid,c.relowner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('content_reactions','helpful_reasons','feed_settings','feed_settings_log');
do $seams$
declare actual jsonb;
begin
 select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid))),'[]'::jsonb) into actual from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('content_reactions','helpful_reasons','feed_settings','feed_settings_log') and not t.tgisinternal;
 if exists(select value from jsonb_array_elements(actual) except select value from jsonb_array_elements('[{"name":"trg_feed_settings_log","table":"feed_settings","enabled":"O","definition":"CREATE TRIGGER trg_feed_settings_log BEFORE INSERT OR DELETE OR UPDATE ON public.feed_settings FOR EACH ROW EXECUTE FUNCTION feed_settings_log_trigger()"}]'::jsonb)) or exists(select value from jsonb_array_elements('[{"name":"trg_feed_settings_log","table":"feed_settings","enabled":"O","definition":"CREATE TRIGGER trg_feed_settings_log BEFORE INSERT OR DELETE OR UPDATE ON public.feed_settings FOR EACH ROW EXECUTE FUNCTION feed_settings_log_trigger()"}]'::jsonb) except select value from jsonb_array_elements(actual)) then raise exception 'CURRENT_TRIGGER_CHANGED'; end if;
 if (select md5(pg_get_viewdef(c.oid,true)) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='helpful_reason_stats') is distinct from '4b42bcdc6531c02619fed375644f5fa7' then raise exception 'CURRENT_RELATED_VIEW_CHANGED'; end if;
end;
$seams$;

do $guard$
declare expected jsonb := '[{"signature":"public.count_content_reactions(text[])","definitionMD5":"c6568add2b99e228ca0f64e01c00ffb0","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.feed_settings_get()","definitionMD5":"290eaff5a62d9c785360e3f54bdc29ba","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.feed_settings_log_trigger()","definitionMD5":"8855a66b4142bbce27fff298662e70f2","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"v"},{"signature":"public.feed_value_counts(text[],integer)","definitionMD5":"443c6dbf9eb8c309317cb49f37b0989a","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.helpful_reason_summary(text,text)","definitionMD5":"27421125d33f553896388f7e54cee6fe","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.list_content_advice(text[])","definitionMD5":"d34d28be11c4f2fe3146d0558462531a","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.moderate_advice(bigint,text)","definitionMD5":"56f5e2321d4fedde31556f52bbdb1aa4","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"v"},{"signature":"public.my_content_reactions(text[])","definitionMD5":"faf7206e4e070cd111999d3db1bac922","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.my_helpful_tag_profile()","definitionMD5":"dba9a8bc4b4580e643e1500b0a40d309","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":false,"volatility":"s"},{"signature":"public.poor_reason_breakdown(text)","definitionMD5":"57b3ee1c91233d1868bf4b0a2081ee00","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"s"},{"signature":"public.react_content(text,text,text,text,text,text,text,text)","definitionMD5":"36b1a342ce507ff4d892516c9e8c10c4","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"v"},{"signature":"public.save_helpful_reason(text,text,text,text)","definitionMD5":"43db5917f9c32342ff5c8483402bc922","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"v"},{"signature":"public.unreact_content(text,text,text)","definitionMD5":"38818e1b98347316cc3c47ae77d2ff31","acl":["=X/postgres","postgres=X/postgres","anon=X/postgres","authenticated=X/postgres","service_role=X/postgres"],"settings":["search_path=public"],"securityDefiner":true,"volatility":"v"}]'::jsonb; row jsonb; actual jsonb; policies jsonb;
begin
 for row in select value from jsonb_array_elements(expected) loop
  select jsonb_build_object('definitionMD5',md5(pg_get_functiondef(p.oid)),'acl',p.proacl,'settings',p.proconfig,'securityDefiner',p.prosecdef,'volatility',p.provolatile) into actual from pg_proc p where p.oid=to_regprocedure(row->>'signature');
  if actual is null or actual is distinct from row-'signature' then raise exception 'CURRENT_FUNCTION_CHANGED: %',row->>'signature'; end if;
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'command',cmd,'roles',roles,'permissive',permissive,'using',qual,'check',with_check)),'[]'::jsonb) into policies from pg_policies where schemaname='public' and tablename in ('content_reactions','helpful_reasons','feed_settings','feed_settings_log');
 if exists(select value from jsonb_array_elements(policies) except select value from jsonb_array_elements('[{"name":"content_reactions_select_own","check":null,"roles":["public"],"table":"content_reactions","using":"(auth.uid() = user_id)","command":"SELECT","permissive":"PERMISSIVE"},{"name":"feed_settings_read_all","check":null,"roles":["public"],"table":"feed_settings","using":"true","command":"SELECT","permissive":"PERMISSIVE"},{"name":"feed_settings_log_read_all","check":null,"roles":["public"],"table":"feed_settings_log","using":"true","command":"SELECT","permissive":"PERMISSIVE"},{"name":"helpful_reasons_select_own","check":null,"roles":["public"],"table":"helpful_reasons","using":"(auth.uid() = user_id)","command":"SELECT","permissive":"PERMISSIVE"}]'::jsonb)) or exists(select value from jsonb_array_elements('[{"name":"content_reactions_select_own","check":null,"roles":["public"],"table":"content_reactions","using":"(auth.uid() = user_id)","command":"SELECT","permissive":"PERMISSIVE"},{"name":"feed_settings_read_all","check":null,"roles":["public"],"table":"feed_settings","using":"true","command":"SELECT","permissive":"PERMISSIVE"},{"name":"feed_settings_log_read_all","check":null,"roles":["public"],"table":"feed_settings_log","using":"true","command":"SELECT","permissive":"PERMISSIVE"},{"name":"helpful_reasons_select_own","check":null,"roles":["public"],"table":"helpful_reasons","using":"(auth.uid() = user_id)","command":"SELECT","permissive":"PERMISSIVE"}]'::jsonb) except select value from jsonb_array_elements(policies)) then raise exception 'CURRENT_POLICY_CHANGED'; end if;
 for row in select value from jsonb_array_elements('[{"acl":["postgres=arwdDxtm/postgres","anon=arwdDxtm/postgres","authenticated=arwdDxtm/postgres","service_role=arwdDxtm/postgres"],"rls":true,"kind":"r","name":"content_reactions","columns":[{"name":"id","type":"bigint","default":null,"notNull":true,"identity":"a"},{"name":"target_type","type":"text","default":"''feed_post''::text","notNull":true,"identity":""},{"name":"target_id","type":"text","default":null,"notNull":true,"identity":""},{"name":"user_id","type":"uuid","default":null,"notNull":true,"identity":""},{"name":"reactor_name","type":"text","default":null,"notNull":false,"identity":""},{"name":"type","type":"text","default":null,"notNull":true,"identity":""},{"name":"reason_tag","type":"text","default":null,"notNull":false,"identity":""},{"name":"reason_text","type":"text","default":null,"notNull":false,"identity":""},{"name":"advice_text","type":"text","default":null,"notNull":false,"identity":""},{"name":"advice_visibility","type":"text","default":null,"notNull":false,"identity":""},{"name":"hidden_by_owner","type":"boolean","default":"false","notNull":true,"identity":""},{"name":"deleted_at","type":"timestamp with time zone","default":null,"notNull":false,"identity":""},{"name":"deleted_by","type":"text","default":null,"notNull":false,"identity":""},{"name":"created_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""},{"name":"updated_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""}],"indexes":["CREATE UNIQUE INDEX content_reactions_pkey ON public.content_reactions USING btree (id)","CREATE UNIQUE INDEX content_reactions_user_id_target_type_target_id_type_key ON public.content_reactions USING btree (user_id, target_type, target_id, type)","CREATE INDEX idx_content_reactions_target ON public.content_reactions USING btree (target_type, target_id) WHERE (deleted_at IS NULL)","CREATE INDEX idx_content_reactions_user ON public.content_reactions USING btree (user_id) WHERE (deleted_at IS NULL)"],"forcedRls":false,"privileges":[{"role":"authenticated","delete":true,"insert":true,"select":true,"update":true},{"role":"anon","delete":true,"insert":true,"select":true,"update":true},{"role":"service_role","delete":true,"insert":true,"select":true,"update":true}],"constraints":[{"name":"content_reactions_advice_text_check","definition":"CHECK (((advice_text IS NULL) OR (char_length(advice_text) <= 600)))"},{"name":"content_reactions_advice_visibility_check","definition":"CHECK (((advice_visibility IS NULL) OR (advice_visibility = ANY (ARRAY[''author_only''::text, ''everyone''::text]))))"},{"name":"content_reactions_deleted_by_check","definition":"CHECK (((deleted_by IS NULL) OR (deleted_by = ANY (ARRAY[''author''::text, ''reactor''::text, ''system''::text]))))"},{"name":"content_reactions_pkey","definition":"PRIMARY KEY (id)"},{"name":"content_reactions_reactor_name_check","definition":"CHECK (((reactor_name IS NULL) OR (char_length(reactor_name) <= 60)))"},{"name":"content_reactions_reason_tag_check","definition":"CHECK (((reason_tag IS NULL) OR (reason_tag = ANY (ARRAY[''ai_suspect''::text, ''wrong_info''::text, ''ad''::text, ''off_topic''::text, ''other''::text]))))"},{"name":"content_reactions_reason_text_check","definition":"CHECK (((reason_text IS NULL) OR (char_length(reason_text) <= 300)))"},{"name":"content_reactions_shape","definition":"CHECK ((((type = ''poor''::text) AND (reason_tag IS NOT NULL) AND (advice_text IS NULL) AND (advice_visibility IS NULL)) OR ((type = ''advice''::text) AND (advice_text IS NOT NULL) AND (advice_visibility IS NOT NULL) AND (reason_tag IS NULL)) OR ((type = ANY (ARRAY[''cheer''::text, ''helpful''::text])) AND (reason_tag IS NULL) AND (reason_text IS NULL) AND (advice_text IS NULL) AND (advice_visibility IS NULL))))"},{"name":"content_reactions_target_type_check","definition":"CHECK ((target_type = ANY (ARRAY[''feed_post''::text, ''checkin''::text, ''goal_template''::text])))"},{"name":"content_reactions_type_check","definition":"CHECK ((type = ANY (ARRAY[''cheer''::text, ''helpful''::text, ''poor''::text, ''advice''::text])))"},{"name":"content_reactions_user_id_fkey","definition":"FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"},{"name":"content_reactions_user_id_target_type_target_id_type_key","definition":"UNIQUE (user_id, target_type, target_id, type)"}]},{"acl":["postgres=arwdDxtm/postgres","anon=arwdDxtm/postgres","authenticated=arwdDxtm/postgres","service_role=arwdDxtm/postgres"],"rls":true,"kind":"r","name":"feed_settings","columns":[{"name":"key","type":"text","default":null,"notNull":true,"identity":""},{"name":"value","type":"jsonb","default":null,"notNull":true,"identity":""},{"name":"updated_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""}],"indexes":["CREATE UNIQUE INDEX feed_settings_pkey ON public.feed_settings USING btree (key)"],"forcedRls":false,"privileges":[{"role":"authenticated","delete":true,"insert":true,"select":true,"update":true},{"role":"anon","delete":true,"insert":true,"select":true,"update":true},{"role":"service_role","delete":true,"insert":true,"select":true,"update":true}],"constraints":[{"name":"feed_settings_pkey","definition":"PRIMARY KEY (key)"}]},{"acl":["postgres=arwdDxtm/postgres","anon=arwdDxtm/postgres","authenticated=arwdDxtm/postgres","service_role=arwdDxtm/postgres"],"rls":true,"kind":"r","name":"feed_settings_log","columns":[{"name":"id","type":"bigint","default":null,"notNull":true,"identity":"a"},{"name":"key","type":"text","default":null,"notNull":true,"identity":""},{"name":"before","type":"jsonb","default":null,"notNull":false,"identity":""},{"name":"after","type":"jsonb","default":null,"notNull":false,"identity":""},{"name":"changed_by","type":"text","default":null,"notNull":false,"identity":""},{"name":"reason","type":"text","default":null,"notNull":false,"identity":""},{"name":"changed_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""}],"indexes":["CREATE UNIQUE INDEX feed_settings_log_pkey ON public.feed_settings_log USING btree (id)"],"forcedRls":false,"privileges":[{"role":"authenticated","delete":true,"insert":true,"select":true,"update":true},{"role":"anon","delete":true,"insert":true,"select":true,"update":true},{"role":"service_role","delete":true,"insert":true,"select":true,"update":true}],"constraints":[{"name":"feed_settings_log_pkey","definition":"PRIMARY KEY (id)"}]},{"acl":["postgres=arwdDxtm/postgres","anon=arwdDxtm/postgres","authenticated=arwdDxtm/postgres","service_role=arwdDxtm/postgres"],"rls":true,"kind":"r","name":"helpful_reasons","columns":[{"name":"id","type":"bigint","default":null,"notNull":true,"identity":"a"},{"name":"target_type","type":"text","default":"''feed_post''::text","notNull":true,"identity":""},{"name":"target_id","type":"text","default":null,"notNull":true,"identity":""},{"name":"user_id","type":"uuid","default":null,"notNull":true,"identity":""},{"name":"reason_tag","type":"text","default":null,"notNull":true,"identity":""},{"name":"reason_text","type":"text","default":null,"notNull":false,"identity":""},{"name":"quality_pass","type":"boolean","default":"false","notNull":true,"identity":""},{"name":"credit_granted","type":"integer","default":"0","notNull":true,"identity":""},{"name":"deleted_at","type":"timestamp with time zone","default":null,"notNull":false,"identity":""},{"name":"created_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""},{"name":"updated_at","type":"timestamp with time zone","default":"now()","notNull":true,"identity":""}],"indexes":["CREATE UNIQUE INDEX helpful_reasons_pkey ON public.helpful_reasons USING btree (id)","CREATE UNIQUE INDEX helpful_reasons_user_id_target_type_target_id_key ON public.helpful_reasons USING btree (user_id, target_type, target_id)","CREATE INDEX idx_helpful_reasons_target ON public.helpful_reasons USING btree (target_type, target_id) WHERE (deleted_at IS NULL)","CREATE INDEX idx_helpful_reasons_user ON public.helpful_reasons USING btree (user_id) WHERE (deleted_at IS NULL)"],"forcedRls":false,"privileges":[{"role":"authenticated","delete":true,"insert":true,"select":true,"update":true},{"role":"anon","delete":true,"insert":true,"select":true,"update":true},{"role":"service_role","delete":true,"insert":true,"select":true,"update":true}],"constraints":[{"name":"helpful_reasons_pkey","definition":"PRIMARY KEY (id)"},{"name":"helpful_reasons_reason_tag_check","definition":"CHECK ((reason_tag = ANY (ARRAY[''how_to''::text, ''same_situation''::text, ''motivation''::text, ''new_info''::text, ''other''::text])))"},{"name":"helpful_reasons_reason_text_check","definition":"CHECK (((reason_text IS NULL) OR (char_length(reason_text) <= 300)))"},{"name":"helpful_reasons_target_type_check","definition":"CHECK ((target_type = ANY (ARRAY[''feed_post''::text, ''checkin''::text, ''goal_template''::text])))"},{"name":"helpful_reasons_user_id_fkey","definition":"FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"},{"name":"helpful_reasons_user_id_target_type_target_id_key","definition":"UNIQUE (user_id, target_type, target_id)"}]}]'::jsonb) loop
  select jsonb_build_object('acl',c.relacl,'rls',c.relrowsecurity,'forcedRls',c.relforcerowsecurity,'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'notNull',a.attnotnull,'identity',a.attidentity,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped)) into actual from pg_class c where c.oid=to_regclass('public.'||(row->>'name'));
  if actual is null or actual is distinct from jsonb_build_object('acl',row->'acl','rls',row->'rls','forcedRls',row->'forcedRls','columns',row->'columns') then raise exception 'CURRENT_TABLE_CHANGED: %',row->>'name'; end if;
 end loop;
end;
$guard$;

-- 본인 원행 읽기만; 원래 RPC 쓰기 입구 유지. private audit는 운영자 기존 역할만.
revoke all on public.content_reactions,public.helpful_reasons,public.feed_settings,public.feed_settings_log from public,anon,authenticated;
grant select on public.content_reactions,public.helpful_reasons to authenticated;
grant select(key,value) on public.feed_settings to anon,authenticated;
drop policy if exists feed_settings_log_read_all on public.feed_settings_log;
create or replace function public.unreact_content(p_target_type text, p_target_id text, p_type text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $fn$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  update public.content_reactions
     set deleted_at = now(), deleted_by = 'reactor', updated_at = now()
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id and type = p_type
     and deleted_at is null;
  get diagnostics v_n = row_count;
  if v_n > 0 and p_type = 'cheer' and p_target_type = 'feed_post' then
    update public.feed_posts set cheers_count = greatest(0, coalesce(cheers_count, 0) - 1) where id = p_target_id;
  end if;
  return jsonb_build_object('active', false, 'changed', v_n);
end;
$fn$;

create or replace function public.count_content_reactions(p_target_ids text[])
returns table(target_id text, type text, cnt int)
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $fn$
  select r.target_id, r.type, count(*)::int
    from public.content_reactions r
    left join public.users u on u.id = r.user_id
   where r.target_id = any(p_target_ids)
     and r.deleted_at is null
     and r.target_id not like 'sim\_%' escape '\'
     and coalesce(u.is_bot, false) = false
   group by r.target_id, r.type;
$fn$;

create or replace function public.poor_reason_breakdown(p_target_id text)
returns table(reason_tag text, cnt int)
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $fn$
  select r.reason_tag, count(*)::int
    from public.content_reactions r
    join public.feed_posts p on p.id = r.target_id and r.target_type = 'feed_post'
   where r.type = 'poor' and r.deleted_at is null and r.target_id = p_target_id
     and p.user_id = auth.uid()
   group by r.reason_tag;
$fn$;

create or replace function public.react_content(
  p_target_type text, p_target_id text, p_type text,
  p_reason_tag text default null, p_reason_text text default null,
  p_advice_text text default null, p_advice_visibility text default null,
  p_reactor_name text default null
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_id bigint;
  v_was_active boolean := false;
  v_bot boolean := false;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type is null or p_target_id is null or trim(p_target_id) = '' then raise exception 'bad target'; end if;
  if p_type not in ('cheer','helpful','poor','advice') then raise exception 'bad type'; end if;
  if p_target_id like 'sim\_%' escape '\' then raise exception 'bot target'; end if;
  if p_type = 'poor' and (p_reason_tag is null or p_reason_tag = '') then raise exception 'reason required'; end if;
  if p_type = 'advice' and (p_advice_text is null or trim(p_advice_text) = '') then raise exception 'advice required'; end if;
  if p_type = 'advice' and coalesce(p_advice_visibility,'') not in ('author_only','everyone') then raise exception 'visibility required'; end if;

  if p_target_type <> 'feed_post' then raise exception 'unsupported target'; end if;
  if not exists (select 1 from public.feed_posts p where p.id=p_target_id) then raise exception 'target not found'; end if;
  if exists (select 1 from public.feed_posts p join public.users u on u.id=p.user_id where p.id=p_target_id and coalesce(u.is_bot,false)) then raise exception 'bot target'; end if;
  select coalesce(u.is_bot, false) into v_bot from public.users u where u.id = v_uid;
  if v_bot then raise exception 'bot reactor'; end if;

  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
    if v_owner is not null and v_owner = v_uid and p_type in ('helpful','poor') then
      raise exception 'cannot rate own content';
    end if;
  end if;

  select id, (deleted_at is null) into v_id, v_was_active
    from public.content_reactions
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id and type = p_type;

  if v_id is null then
    insert into public.content_reactions
      (target_type, target_id, user_id, reactor_name, type, reason_tag, reason_text, advice_text, advice_visibility)
    values
      (p_target_type, p_target_id, v_uid, null, p_type,
       case when p_type = 'poor' then p_reason_tag else null end,
       case when p_type = 'poor' then left(p_reason_text, 300) else null end,
       case when p_type = 'advice' then left(p_advice_text, 600) else null end,
       case when p_type = 'advice' then 'author_only' else null end)
    returning id into v_id;
  else
    update public.content_reactions
       set deleted_at = null, deleted_by = null, hidden_by_owner = false, updated_at = now(),
           reactor_name = reactor_name, -- 원값 보존; 새 이름 수집 없음
           reason_tag = case when p_type = 'poor' then p_reason_tag else null end,
           reason_text = case when p_type = 'poor' then left(p_reason_text, 300) else null end,
           advice_text = case when p_type = 'advice' then left(p_advice_text, 600) else advice_text end,
           advice_visibility = case when p_type = 'advice' then 'author_only' else advice_visibility end
     where id = v_id;
  end if;

  -- 응원해요는 기존 feed_posts.cheers_count 와 호환(새로 활성화될 때만 +1)
  if p_type = 'cheer' and p_target_type = 'feed_post' and not coalesce(v_was_active, false) then
    update public.feed_posts set cheers_count = coalesce(cheers_count, 0) + 1 where id = p_target_id;
  end if;

  return jsonb_build_object('id', v_id, 'active', true);
end;
$fn$;

create or replace function public.moderate_advice(p_reaction_id bigint, p_action text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $fn$
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 if not exists(select 1 from public.content_reactions where id=p_reaction_id and user_id=auth.uid() and type='advice') then raise exception 'forbidden'; end if;
 if p_action='delete' then
  update public.content_reactions set deleted_at=now(),deleted_by='reactor',updated_at=now() where id=p_reaction_id and user_id=auth.uid() and type='advice';
 elsif p_action in ('everyone','author_only') then raise exception 'private advice only';
 else raise exception 'bad action'; end if;
 return jsonb_build_object('ok',true);
end;
$fn$;

create or replace function public.my_content_reactions(p_target_ids text[])
returns table(target_id text, type text, reason_tag text)
language sql stable security invoker set search_path = pg_catalog, public, pg_temp as $fn$
  select r.target_id, r.type, r.reason_tag
    from public.content_reactions r
   where r.user_id = auth.uid()
     and r.target_id = any(p_target_ids)
     and r.deleted_at is null;
$fn$;

create or replace function public.list_content_advice(p_target_ids text[])
returns table(id bigint,target_id text,user_id uuid,reactor_name text,advice_text text,
 advice_visibility text,created_at timestamptz,is_owner boolean,is_mine boolean)
language sql stable security invoker set search_path = pg_catalog, public, pg_temp as $fn$
 select r.id,r.target_id,r.user_id,null::text,r.advice_text,'author_only'::text,r.created_at,false,true
 from public.content_reactions r
 where r.user_id=auth.uid() and r.target_type='feed_post' and r.type='advice' and r.deleted_at is null and r.target_id=any(p_target_ids)
 order by r.created_at;
$fn$;

create or replace function public.save_helpful_reason(
  p_target_type text, p_target_id text, p_reason_tag text, p_reason_text text default null
) returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_bot boolean := false;
  v_min int;
  v_text text := nullif(trim(coalesce(p_reason_text, '')), '');
  v_pass boolean := false;
  v_dup boolean := false;
  v_id bigint;
  v_granted int := 0;
  v_prev_granted int := 0;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type is null or p_target_id is null or trim(p_target_id) = '' then raise exception 'bad target'; end if;
  if p_target_id like 'sim\_%' escape '\' then raise exception 'bot target'; end if;
  if p_reason_tag not in ('how_to','same_situation','motivation','new_info','other') then raise exception 'bad tag'; end if;

  select coalesce(u.is_bot, false) into v_bot from public.users u where u.id = v_uid;
  if v_bot then raise exception 'bot reactor'; end if;

  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
    if v_owner is not null and v_owner = v_uid then raise exception 'cannot rate own content'; end if;
  end if;

  -- 도움돼요를 누른 사람만 이유를 남길 수 있다
  if not exists (
    select 1 from public.content_reactions r
     where r.user_id = v_uid and r.target_type = p_target_type and r.target_id = p_target_id
       and r.type = 'helpful' and r.deleted_at is null
  ) then raise exception 'helpful reaction required'; end if;

  -- 최소 글자 수: 설정값, 없으면 기본값 10
  select case when jsonb_typeof(value) = 'number' then (value)::int else null end
    into v_min from public.credit_settings where key = 'min_reason_chars';
  v_min := coalesce(v_min, 10);

  if v_text is not null then
    v_text := left(v_text, 300);
    -- 같은 사람이 최근 30일 안에 같은 문장을 다른 글에 또 적으면 복붙으로 본다
    select exists (
      select 1 from public.helpful_reasons h
       where h.user_id = v_uid and h.deleted_at is null
         and not (h.target_type = p_target_type and h.target_id = p_target_id)
         and h.created_at > now() - interval '30 days'
         and lower(regexp_replace(coalesce(h.reason_text,''), '\s+', '', 'g')) = lower(regexp_replace(v_text, '\s+', '', 'g'))
    ) into v_dup;
    v_pass := (char_length(v_text) >= v_min) and not v_dup;
  end if;

  select id, credit_granted into v_id, v_prev_granted
    from public.helpful_reasons
   where user_id = v_uid and target_type = p_target_type and target_id = p_target_id;

  if v_id is null then
    insert into public.helpful_reasons (target_type, target_id, user_id, reason_tag, reason_text, quality_pass)
    values (p_target_type, p_target_id, v_uid, p_reason_tag, v_text, v_pass)
    returning id into v_id;
  else
    update public.helpful_reasons
       set reason_tag = p_reason_tag, reason_text = v_text, quality_pass = v_pass,
           deleted_at = null, updated_at = now()
     where id = v_id;
  end if;

  -- D22: 기존 원장/값 보존, 이번 저장에서 크레딧 지급 호출 없음.
  return jsonb_build_object('id', v_id, 'quality_pass', v_pass, 'duplicate', v_dup,
                            'min_chars', v_min, 'credit_granted', coalesce(v_granted, 0));
end;
$fn$;

create or replace function public.helpful_reason_summary(p_target_type text, p_target_id text)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $fn$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_tags jsonb;
  v_texts jsonb;
begin
  if v_uid is null then raise exception 'unauthorized'; end if;
  if p_target_type = 'feed_post' then
    select user_id into v_owner from public.feed_posts where id = p_target_id;
  end if;
  if v_owner is null or v_owner <> v_uid then raise exception 'forbidden'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('tag', t.reason_tag, 'cnt', t.cnt) order by t.cnt desc), '[]'::jsonb)
    into v_tags
    from (
      select h.reason_tag, count(*)::int as cnt
        from public.helpful_reasons h
        left join public.users u on u.id = h.user_id
       where h.target_type = p_target_type and h.target_id = p_target_id and h.deleted_at is null
         and coalesce(u.is_bot, false) = false
       group by h.reason_tag
    ) t;

  v_texts := '[]'::jsonb; -- 작성자에게 태그 집계만 반환; 개인 원사유 반환 없음.

  return jsonb_build_object('tags', v_tags, 'texts', v_texts);
end;
$fn$;

create or replace function public.feed_settings_get()
returns jsonb language sql stable security definer set search_path = pg_catalog, public, pg_temp as $fn$
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.feed_settings;
$fn$;

create or replace function public.feed_settings_log_trigger()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $fn$
begin
  if tg_op = 'INSERT' then
    insert into public.feed_settings_log(key, before, after, changed_by, reason)
    values (new.key, null, new.value, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
    return new;
  elsif tg_op = 'UPDATE' then
    if new.value is distinct from old.value then
      insert into public.feed_settings_log(key, before, after, changed_by, reason)
      values (new.key, old.value, new.value, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
      new.updated_at := now();
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.feed_settings_log(key, before, after, changed_by, reason)
    values (old.key, old.value, null, coalesce(auth.uid()::text, current_user), current_setting('feed.change_reason', true));
    return old;
  end if;
  return null;
end;
$fn$;

create or replace function public.feed_value_counts(p_target_ids text[], p_days int default null)
returns table(target_id text, helpful int, helpful_adj numeric, helpful_tags jsonb, poor int, cheer int, advice int)
language sql stable security definer set search_path = pg_catalog, public, pg_temp as $fn$
  with g as (
    select coalesce((select (value->>'newAccountDays')::int from public.feed_settings where key = 'feed.guards'), 7) as new_days,
           coalesce((select (value->>'newAccountW')::numeric from public.feed_settings where key = 'feed.guards'), 0.5) as new_w,
           coalesce((select (value->>'reciprocalMax')::numeric from public.feed_settings where key = 'feed.guards'), 0.5) as recip_max,
           coalesce(p_days, (select (value->>'windowDays')::int from public.feed_settings where key = 'feed.guards'), 30) as days
  ),
  rx as (
    select r.target_id, r.user_id as reactor, p.user_id as author, r.type, r.created_at,
           case when au.created_at > now() - make_interval(days => (select new_days from g)) then (select new_w from g) else 1.0 end as w
      from public.content_reactions r
      join public.feed_posts p on p.id = r.target_id
      left join public.users u on u.id = r.user_id
      left join auth.users au on au.id = r.user_id
     where r.target_id = any(p_target_ids)
       and r.target_type = 'feed_post'
       and r.deleted_at is null
       and r.created_at >= now() - make_interval(days => (select days from g))
       and r.target_id not like 'sim\_%' escape '\'
       and coalesce(u.is_bot, false) = false
       and r.user_id <> p.user_id                       -- 글쓴이 본인 반응 제외
  ),
  given as (                                            -- 반응자가 창 안에 준 도움돼요 전체(상호성 분모)
    select r.user_id as reactor, count(*)::numeric as total
      from public.content_reactions r
     where r.type = 'helpful' and r.deleted_at is null
       and r.created_at >= now() - make_interval(days => (select days from g))
     group by r.user_id
  ),
  pair as (                                             -- 반응자 → 글쓴이 도움돼요 수 + 글쓴이 → 반응자 도움돼요 수
    select a.reactor, a.author,
           count(*)::numeric as a_to_b,
           (select count(*) from public.content_reactions r2 join public.feed_posts p2 on p2.id = r2.target_id
             where r2.type = 'helpful' and r2.deleted_at is null and r2.user_id = a.author and p2.user_id = a.reactor
               and r2.created_at >= now() - make_interval(days => (select days from g)))::numeric as b_to_a
      from rx a where a.type = 'helpful'
     group by a.reactor, a.author
  ),
  recip as (                                            -- 상호 맞주고받기: 둘 다 주고받았고, 이 쌍이 반응자 전체의 recip_max 초과
    select p.reactor, p.author
      from pair p join given gv on gv.reactor = p.reactor
     where p.b_to_a > 0 and (p.a_to_b / nullif(gv.total, 0)) > (select recip_max from g)
  ),
  hx as (
    select x.target_id, x.reactor, x.w,
           coalesce(h.reason_tag, 'other') as tag,
           case when exists (select 1 from recip rc where rc.reactor = x.reactor and rc.author = x.author) then 0 else 1 end as keep
      from rx x
      left join public.helpful_reasons h on h.target_type = 'feed_post' and h.target_id = x.target_id and h.user_id = x.reactor and h.deleted_at is null
     where x.type = 'helpful'
  ),
  tags as (
    select target_id, jsonb_object_agg(tag, s) as helpful_tags
      from (select target_id, tag, sum(w * keep) as s from hx group by target_id, tag) t
     group by target_id
  )
  select ids.id as target_id,
         (select count(*)::int from hx where hx.target_id = ids.id) as helpful,
         coalesce((select sum(w * keep) from hx where hx.target_id = ids.id), 0)::numeric as helpful_adj,
         coalesce((select helpful_tags from tags where tags.target_id = ids.id), '{}'::jsonb) as helpful_tags,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'poor') as poor,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'cheer') as cheer,
         (select count(*)::int from rx where rx.target_id = ids.id and rx.type = 'advice') as advice
    from unnest(p_target_ids) as ids(id);
$fn$;

create or replace function public.my_helpful_tag_profile()
returns jsonb language sql stable security invoker set search_path = pg_catalog, public, pg_temp as $fn$
  with mine as (
    select reason_tag, count(*)::numeric as n
      from public.helpful_reasons
     where user_id = auth.uid() and deleted_at is null
     group by reason_tag
  ), tot as (select sum(n) as t from mine)
  select coalesce((select jsonb_object_agg(reason_tag, round(n / nullif((select t from tot), 0), 3)) from mine), '{}'::jsonb);
$fn$;

-- PUBLIC 기본 EXECUTE를 제거한다. service_role 기존 권한을 보존하며 확장하지 않는다.
revoke all on function public.count_content_reactions(text[]) from public,anon,authenticated;
revoke all on function public.feed_settings_get() from public,anon,authenticated;
revoke all on function public.feed_settings_log_trigger() from public,anon,authenticated;
revoke all on function public.feed_value_counts(text[],integer) from public,anon,authenticated;
revoke all on function public.helpful_reason_summary(text,text) from public,anon,authenticated;
revoke all on function public.list_content_advice(text[]) from public,anon,authenticated;
revoke all on function public.moderate_advice(bigint,text) from public,anon,authenticated;
revoke all on function public.my_content_reactions(text[]) from public,anon,authenticated;
revoke all on function public.my_helpful_tag_profile() from public,anon,authenticated;
revoke all on function public.poor_reason_breakdown(text) from public,anon,authenticated;
revoke all on function public.react_content(text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.save_helpful_reason(text,text,text,text) from public,anon,authenticated;
revoke all on function public.unreact_content(text,text,text) from public,anon,authenticated;
grant execute on function public.count_content_reactions(text[]) to service_role;
grant execute on function public.feed_settings_get() to service_role;
grant execute on function public.feed_settings_log_trigger() to service_role;
grant execute on function public.feed_value_counts(text[],integer) to service_role;
grant execute on function public.helpful_reason_summary(text,text) to service_role;
grant execute on function public.list_content_advice(text[]) to service_role;
grant execute on function public.moderate_advice(bigint,text) to service_role;
grant execute on function public.my_content_reactions(text[]) to service_role;
grant execute on function public.my_helpful_tag_profile() to service_role;
grant execute on function public.poor_reason_breakdown(text) to service_role;
grant execute on function public.react_content(text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.save_helpful_reason(text,text,text,text) to service_role;
grant execute on function public.unreact_content(text,text,text) to service_role;
grant execute on function public.count_content_reactions(text[]) to authenticated;
grant execute on function public.feed_settings_get() to authenticated;
grant execute on function public.feed_value_counts(text[],integer) to authenticated;
grant execute on function public.helpful_reason_summary(text,text) to authenticated;
grant execute on function public.list_content_advice(text[]) to authenticated;
grant execute on function public.moderate_advice(bigint,text) to authenticated;
grant execute on function public.my_content_reactions(text[]) to authenticated;
grant execute on function public.my_helpful_tag_profile() to authenticated;
grant execute on function public.poor_reason_breakdown(text) to authenticated;
grant execute on function public.react_content(text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.save_helpful_reason(text,text,text,text) to authenticated;
grant execute on function public.unreact_content(text,text,text) to authenticated;
grant execute on function public.feed_settings_get(),public.count_content_reactions(text[]) to anon;

-- 적용 중 권한 readback 실패는 전체 transaction을 되돌린다.
do $oracle$
begin
 if has_table_privilege('anon','public.feed_settings_log','SELECT') or has_table_privilege('authenticated','public.feed_settings_log','SELECT') then raise exception 'AUDIT_PUBLIC_PRIVILEGE'; end if;
 if exists(select 1 from pg_policies where schemaname='public' and tablename='feed_settings_log' and cmd in ('SELECT','ALL') and roles && array['public','anon','authenticated']::name[]) then raise exception 'AUDIT_PUBLIC_POLICY'; end if;
 if has_function_privilege('anon','public.list_content_advice(text[])','EXECUTE') or has_function_privilege('anon','public.save_helpful_reason(text,text,text,text)','EXECUTE') or has_function_privilege('anon','public.feed_value_counts(text[],integer)','EXECUTE') then raise exception 'RAW_OR_PRIVATE_ANON_EXECUTE'; end if;
 if not has_column_privilege('anon','public.feed_settings','value','SELECT') or has_column_privilege('anon','public.feed_settings','updated_at','SELECT') then raise exception 'SETTINGS_PRIVILEGE'; end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='content_reactions' and cmd='SELECT' and qual='(auth.uid() = user_id)') or not exists(select 1 from pg_policies where schemaname='public' and tablename='helpful_reasons' and cmd='SELECT' and qual='(auth.uid() = user_id)') then raise exception 'SELF_POLICY_CHANGED'; end if;
end;
$oracle$;
do $owner$
begin
 if exists(select 1 from __og_feed_owner_frame f left join pg_proc p on f.kind='function' and p.oid=f.oid left join pg_class c on f.kind='table' and c.oid=f.oid where f.owner is distinct from case when f.kind='function' then p.proowner else c.relowner end) then raise exception 'OWNER_CHANGED_DURING_APPLY'; end if;
end;
$owner$;
commit;
