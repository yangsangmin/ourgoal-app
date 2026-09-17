-- ==============================================================================
-- OurGoal Migration: 전역 7일 유예 통합 휴지통(Recycle Bin) 시스템 DDL
-- 파일: docs/sql/migration_20260917_recycle_bin.sql
-- 설명: 목표, 일정, 기록, 구글 삭제 일정을 7일간 안전하게 보관하고 100% 원복(Restore)을 보장하는 users.trash JSONB 컬럼 증설
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'trash'
  ) THEN
    ALTER TABLE public.users ADD COLUMN trash JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN public.users.trash IS '전역 7일 유예 통합 휴지통 데이터 보관 배열 (목표, 일정, 기록, 구글 연동 일정 원본)';
  END IF;
END $$;
