-- ============================================
-- 003_videos_catalog.sql
-- Rodar no SQL Editor do Supabase
-- ============================================

create table videos (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('pregacao', 'estudo_biblico', 'infantil')),
  title text not null,
  author_name text,              -- nome do pregador/canal original (quando não for o seu)
  source_platform text not null default 'youtube'
    check (source_platform in ('youtube', 'facebook', 'outro')),
  video_id text,                 -- ID extraído do link do YouTube, usado para incorporar o player
  video_url text not null,       -- link original completo (funciona como fallback também)
  pdf_url text,                  -- material de estudo em PDF, opcional (usado em "estudo_biblico")
  thumbnail_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_videos_category on videos(category, is_active);

alter table videos enable row level security;

create policy "videos ativos sao publicos"
  on videos for select
  using (is_active = true);
