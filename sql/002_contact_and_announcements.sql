-- ============================================
-- 002_contact_and_announcements.sql
-- Rodar no SQL Editor do Supabase, depois do schema principal (themes/ebooks/etc)
-- ============================================

-- MENSAGENS DE CONTATO (convite p/ pregar, oração, aconselhamento, ajuda, doação)
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  category text not null
    check (category in ('convite_pregar','pedido_oracao','aconselhamento','oferta_ajuda','doacao','outro')),
  name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  message text not null,
  status text not null default 'new'
    check (status in ('new','read','replied','archived')),
  created_at timestamptz default now()
);

create index idx_contact_messages_category on contact_messages(category);
create index idx_contact_messages_status on contact_messages(status);

alter table contact_messages enable row level security;

-- Qualquer visitante pode ENVIAR (insert), ninguém de fora pode LER as mensagens
create policy "qualquer um pode enviar mensagem"
  on contact_messages for insert
  with check (true);
-- Sem policy de select para anon/authenticated = só o painel admin (service_role) lê

-- ============================================
-- ANÚNCIOS (lives, campanhas — conteúdo dinâmico da home)
-- ============================================
create table announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('live','campanha','aviso')),
  title text not null,
  description text,
  image_url text,
  link_url text,          -- ex: link do YouTube da live, ou link da campanha
  starts_at timestamptz,  -- horário da live, se aplicável
  is_active boolean default true,
  created_at timestamptz default now()
);

create index idx_announcements_active on announcements(is_active, type);

alter table announcements enable row level security;

create policy "anuncios ativos sao publicos"
  on announcements for select
  using (is_active = true);
