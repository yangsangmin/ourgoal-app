-- 2026-10-04 #TASK-ES-366 되돌리기 — og_dm_mark 함수와 DM 상태 열 5개를 없앤다.
-- 주의: 열을 지우면 그동안 쌓인 읽음·도착 시각도 함께 사라진다(메시지 본문·보낸 사람·받는 사람은 그대로).
--       함수만 끄고 싶으면 [1] 만 실행한다. 앱은 열·함수가 없어도 메시지 전송은 계속된다(읽음 표시만 멈춤).

begin;

-- [1] 함수 제거
drop function if exists public.og_dm_mark(text, boolean);

-- [2] 열 제거
alter table public.team_ping_replies drop column if exists is_read;
alter table public.team_ping_replies drop column if exists read_at;
alter table public.team_ping_replies drop column if exists delivered_at;
alter table public.team_ping_replies drop column if exists sent_at;
alter table public.team_ping_replies drop column if exists status;

commit;

notify pgrst, 'reload schema';
