-- ==============================================================================
-- OurGoal Migration: 목표(goals) 및 실천기록(checkins) 소프트 삭제(deleted_at) DDL
-- 파일: docs/sql/goals-checkins-softdelete.sql
-- 근거: 상민님 확정 결심 8호 (소프트삭제 + 백업 SQL) & 헌법 제15조(유저 자산 영속성)
-- ==============================================================================

-- 1. goals 테이블 deleted_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'goals' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.goals ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    COMMENT ON COLUMN public.goals.deleted_at IS '소프트 삭제 시각 (NULL이면 활성, 값이 있으면 휴지통/보존 상태)';
  END IF;
END $$;

-- 2. checkins 테이블 deleted_at 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'checkins' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.checkins ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    COMMENT ON COLUMN public.checkins.deleted_at IS '소프트 삭제 시각 (NULL이면 활성, 값이 있으면 휴지통/보존 상태)';
  END IF;
END $$;

-- 3. 활성 데이터 고속 조회를 위한 조건부 인덱스 (Partial Index)
CREATE INDEX IF NOT EXISTS idx_goals_active ON public.goals (user_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkins_active ON public.checkins (user_id, start_at) WHERE deleted_at IS NULL;
