-- 2026-09-16 동반자(companions) 실서버 영속화 (TASK-ES-120 후속)
-- Supabase SQL Editor 에 전체 붙여넣고 Run 1회. 여러 번 돌려도 안전하다.
--
-- 왜 필요한가
--   #TASK-ES-104/105/106이 "동반자 추가"를 완료로 표기했지만, 실제로는
--   js/team-invite-comm.js가 companions를 state.profile.companions(메모리)에만
--   push하고, saveProfile()의 upsert 목록에 companions 필드가 아예 없었다.
--   즉 "추가했어요! 🎉" 토스트는 뜨지만 새로고침/재접속하면 사라졌다
--   (users 테이블에 저장할 컬럼 자체가 없었음).
--
--   동반자 카드는 이미 검색 결과에서 스냅샷(닉네임·아바타·소개 등)으로
--   만들어지므로, 별도 관계형 테이블 대신 본인 행에만 쓰는 jsonb 컬럼
--   하나로 충분하다 — 기존 RLS(auth.uid()=본인 id만 select/update)를
--   그대로 재사용하고 새 테이블·RLS·RPC를 추가하지 않는다.

alter table public.users add column if not exists companions jsonb not null default '[]'::jsonb;

-- [확인] 아래 행이 나오면 성공
select 'users.companions 컬럼' as 확인, count(*) as 수 from information_schema.columns
  where table_schema = 'public' and table_name = 'users' and column_name = 'companions';
