-- ==============================================================================
-- OurGoal Migration: 목표 및 실천기록 일일 백업 스냅샷 스키마 및 백업 함수 DDL
-- 파일: docs/sql/daily-backup.sql
-- 근거: 상민님 확정 결심 8호 (일일 백업 SQL) & 헌법 제15조(비파괴 합집합 보존)
-- ==============================================================================

-- 1. goals_backup 스냅샷 테이블 생성
CREATE TABLE IF NOT EXISTS public.goals_backup (
  backup_id BIGSERIAL PRIMARY KEY,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  due_date TEXT,
  visibility TEXT,
  archived_at TEXT,
  milestones JSONB,
  topic TEXT,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  raw_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_goals_backup_user_date ON public.goals_backup (user_id, backed_up_at);

-- 2. checkins_backup 스냅샷 테이블 생성
CREATE TABLE IF NOT EXISTS public.checkins_backup (
  backup_id BIGSERIAL PRIMARY KEY,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT,
  text TEXT,
  start_at TEXT,
  end_at TEXT,
  category TEXT,
  theme TEXT,
  photo TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  raw_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_checkins_backup_user_date ON public.checkins_backup (user_id, backed_up_at);

-- 3. 일일 백업 실행 함수 (수동 실행 또는 pg_cron 연동 가능)
CREATE OR REPLACE FUNCTION public.execute_daily_backup_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_goal_count INT := 0;
  v_checkin_count INT := 0;
BEGIN
  -- goals 테이블 백업 복사
  INSERT INTO public.goals_backup (id, user_id, title, category, due_date, visibility, archived_at, milestones, topic, created_at, deleted_at, raw_snapshot)
  SELECT 
    id, user_id, title, category, due_date, visibility, archived_at, milestones, topic, created_at, deleted_at, to_jsonb(g.*)
  FROM public.goals g;
  GET DIAGNOSTICS v_goal_count = ROW_COUNT;

  -- checkins 테이블 백업 복사
  INSERT INTO public.checkins_backup (id, user_id, type, text, start_at, end_at, category, theme, photo, feedback, created_at, deleted_at, raw_snapshot)
  SELECT 
    id, user_id, type, text, start_at, end_at, category, theme, photo, feedback, created_at, deleted_at, to_jsonb(c.*)
  FROM public.checkins c;
  GET DIAGNOSTICS v_checkin_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'success',
    'timestamp', NOW(),
    'backed_up_goals', v_goal_count,
    'backed_up_checkins', v_checkin_count
  );
END;
$$;
