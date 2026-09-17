-- 2026-09-17 아바타 보관함(saved_avatars) 실서버 영속화 (TASK-ES-135)
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
--
-- 왜 필요한가:
--   #TASK-ES-119에서 "생성 아바타 누적 보관함(서랍)"을 도입했으나,
--   users 테이블에 saved_avatars 컬럼이 없어 클라이언트 localStorage에만 저장되었다.
--   이로 인해 기기 변경(PC ↔ 모바일), 브라우저 변경, 캐시 삭제 시 생성한 아바타가 모두 유실되었다.
--   본 컬럼을 신설하여 유저가 제작한 최대 10개의 만화 아바타를 영구 영속화한다.
--   기존 RLS(auth.uid() = id 본인 행만 update)를 그대로 재사용하므로 안전하다.

alter table public.users add column if not exists saved_avatars jsonb not null default '[]'::jsonb;

-- [확인] 아래 행이 나오면 성공
select 'users.saved_avatars 컬럼' as 확인, count(*) as 수 from information_schema.columns
  where table_schema = 'public' and table_name = 'users' and column_name = 'saved_avatars';
