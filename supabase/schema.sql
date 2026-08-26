create table if not exists public.sessions (
  code text primary key,
  teacher_token text not null,
  state jsonb not null,
  updated_at bigint not null default 1
);

alter table public.sessions enable row level security;

-- 브라우저는 이 테이블에 직접 접근하지 않습니다.
-- Vercel 서버의 SUPABASE_SECRET_KEY만 행을 읽고 수정합니다.
revoke all on table public.sessions from anon, authenticated;
grant select, insert, update, delete on table public.sessions to service_role;
