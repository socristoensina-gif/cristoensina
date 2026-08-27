-- ============================================
-- 004_equipamentos.sql
-- Lista de equipamentos necessários para o estúdio (doação em bens)
-- ============================================

create table equipment_needs (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,           -- ex: "Microfone condensador"
  description text,                  -- ex: "Para gravação de voz com qualidade de estúdio"
  priority text not null default 'media'
    check (priority in ('alta', 'media', 'baixa')),
  is_fulfilled boolean default false, -- marca quando alguém já doou esse item
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table equipment_needs enable row level security;

create policy "equipamentos ativos sao publicos"
  on equipment_needs for select
  using (is_active = true);
