-- 2026-09-22 CRM 캘린더(온보딩·스트릭유지·윈백 3개 저니) — Supabase SQL Editor에서 1회 실행.
-- 배경: T045(실행 로드맵 2026-09-18 예정). OneSignal 대신 기존 자체 Web Push 인프라
--       (push_subscriptions + api/push-dispatch.js, docs/sql/2026-09-05-push-subscriptions.sql)를 확장한다.
--       events 테이블은 설계상 user_id 를 저장하지 않으므로(익명 계측 원칙, 2026-09-06-events.sql 주석),
--       저니 진행상태·빈도상한 로그는 이미 user_id 를 보유한 push_subscriptions 행에 둔다
--       (service_role 전용 테이블 — RLS 켜져 있고 anon/authenticated 정책 없음, 새 정책 추가하지 않음).
-- 실행 전에는 컬럼이 없어 저니 디스패치 쪽 update 가 조용히 무시/에러 처리되고 기존 체크인 리마인더 발송에는 영향 없음.

alter table public.push_subscriptions
  add column if not exists crm_onboarding_sent jsonb not null default '[]'::jsonb,   -- ["d0","d1","d3","d7"] 이미 보낸 온보딩 단계
  add column if not exists crm_winback_sent     jsonb not null default '[]'::jsonb,   -- ["d3","d7","d14"] 이미 보낸 윈백 단계(재활성 시 초기화)
  add column if not exists crm_streak_last_warned text,                              -- 'YYYY-MM-DD' 스트릭유지 20시 경고를 마지막으로 보낸 날짜(로컬 tz)
  add column if not exists crm_freeze_available boolean not null default true,       -- 스트릭 프리즈 1회 — 사용 여부는 클라이언트 스트릭 로직과 별개로 "안내 문구"용 플래그
  add column if not exists crm_notif_log jsonb not null default '[]'::jsonb;         -- 최근 발송 로그 [{"at":ISO8601,"kind":"behavioral|non_transactional"}] 최근 20건, 빈도상한(비트랜잭션 3회/24h · 행동형 2회+4시간 간격) 판정에 사용. 기존 체크인 리마인더(kind 없음)는 이 로그에 남기지 않고 그대로 sent_slots 로만 관리(선례 보존)

-- 확인: select endpoint, user_id, crm_onboarding_sent, crm_winback_sent, crm_streak_last_warned, crm_notif_log from public.push_subscriptions limit 5;
