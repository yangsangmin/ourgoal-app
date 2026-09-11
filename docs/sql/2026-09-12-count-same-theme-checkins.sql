-- ============================================================
-- 아워골 — 오늘 같은 테마 실사용자 수 집계 RPC + 봇/시뮬 계정 제외
-- 2026-09-12 준비. (T01-S02, #TASK-ES-001)
--
-- 왜 필요한가: 본질 ③ 동류 발견 배지("오늘 나와 같은 테마로 기록한 사람 N명")의
-- 데이터 원천으로, 봇/시뮬 계정을 제외하고 실제 유저 수(distinct user_id)만
-- KST(한국 표준시) 오늘 기준으로 카운트하여 신뢰를 보장한다.
--
-- 전부 if not exists / or replace 구문으로 여러 번 실행해도 안전하다.
-- ============================================================

-- 1) users 및 checkins 테이블에 봇 계정 식별 컬럼 추가 (멱등성 보장)
alter table public.users add column if not exists is_bot boolean default false;
alter table public.checkins add column if not exists is_bot boolean default false;

-- 2) 검색 성능을 위한 복합 인덱스 생성
create index if not exists idx_checkins_theme_start_at on public.checkins(theme, start_at);
create index if not exists idx_users_is_bot on public.users(id) where is_bot = true;

-- 3) 오늘 같은 테마 실사용자 수 집계 RPC 함수
--    보안 정의자(security definer)로 동작하여 RLS 정책과 무관하게
--    동일 테마 실유저 distinct 카운트(정수 1개)만 안전하게 반환하고,
--    개별 유저 식별자나 민감정보는 일절 반환하지 않는다.
create or replace function count_same_theme_checkins_today(p_theme text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_theme is null or trim(p_theme) = '' then
    return 0;
  end if;

  select count(distinct c.user_id)
  into v_count
  from public.checkins c
  left join public.users u on c.user_id = u.id
  where c.theme = trim(p_theme)
    and coalesce(c.is_bot, false) = false
    and coalesce(u.is_bot, false) = false
    and c.start_at is not null
    and (c.start_at::timestamptz at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date;

  return coalesce(v_count, 0);
end;
$$;

-- 4) 호출 권한 부여 (인증 유저 및 익명 유저 모두 집계 수 열람 가능)
grant execute on function count_same_theme_checkins_today(text) to authenticated, anon;

-- ────────────────────────────────────────────────
-- [확인] 아래 쿼리를 실행했을 때 에러 없이 결과가 반환되면 성공
-- ────────────────────────────────────────────────
-- select count_same_theme_checkins_today('exercise') as sample_count;
