-- ============================================
-- 005_partners.sql
-- Parceiros com contribuição mensal recorrente (via Stripe Subscriptions)
-- ============================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  email text not null,
  name text,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  amount_cents int not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled')),
  started_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now()
);

create index idx_partners_status on partners(status);
create index idx_partners_subscription on partners(stripe_subscription_id);

alter table partners enable row level security;
-- Sem policy de select pública — só o admin (service_role) acessa a lista de parceiros
