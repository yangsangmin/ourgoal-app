-- 2026-09-06 체크인 분야(category) 영속화 결함 수정 (감사 AUD-5 발견). Supabase SQL Editor에서 1회 실행.
-- 배경: 기록 카드에서 고른 분야가 클라이언트 메모리(records[].category)에만 있고 checkins 테이블에 컬럼이 없어
--       새로고침·다른 기기에서 분야가 사라지고 분야별 리포트·CSV가 부정확했다.
-- 실행 시점: 이 PR 병합 전후 어느 때나 안전(if not exists). 컬럼이 없는 동안에는 클라이언트가 자동으로 기존 형식으로 재시도한다.

alter table public.checkins add column if not exists category text;   -- TOPICS 키(study/exercise/business/exam/travel/etc) 또는 null

-- 확인: select category, count(*) from public.checkins group by 1;
