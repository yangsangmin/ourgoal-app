-- 2026-09-16 아워골 인앱 1:1 고객 문의 및 오류 제보 원장 (TASK-ES-123)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT,
  user_nickname TEXT,
  inquiry_type TEXT NOT NULL,
  reply_email TEXT,
  content TEXT NOT NULL,
  user_agent TEXT,
  app_version TEXT DEFAULT 'v1.0.0',
  status TEXT NOT NULL DEFAULT '접수',
  notion_page_id TEXT
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 1) 문의 제출: 인증 회원 및 비회원/게스트 모두 접수 허용
CREATE POLICY inquiries_insert_policy ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- 2) 문의 조회: 본인 문의만 조회 가능 (관리자는 service_role_key로 전체 조회)
CREATE POLICY inquiries_select_policy ON public.inquiries
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id)
    OR (auth.role() = 'service_role')
  );
