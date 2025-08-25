-- Migration: Create withdrawals table
-- Run this in your Supabase SQL editor

create schema if not exists app;

create table if not exists app.withdrawals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending',                         -- pending | processing | completed | failed
  category text not null check (category in ('usd_bank','crypto','local_currency')),
  method text null check (method in ('ach','wire')),              -- solo aplica a usd_bank
  amount_numeric numeric(18,2) null,                              -- derivado de amount string si se puede
  currency text not null default 'USD',
  requester_email text null,                                      -- si lo tenemos
  user_id uuid null,                                              -- si lo tenemos del auth
  payload jsonb not null                                          -- JSON crudo del formulario validado por Zod
);

create index if not exists idx_withdrawals_created_at on app.withdrawals (created_at desc);
create index if not exists idx_withdrawals_status on app.withdrawals (status);
create index if not exists idx_withdrawals_category on app.withdrawals (category);
create index if not exists idx_withdrawals_payload_gin on app.withdrawals using gin (payload);

alter table app.withdrawals enable row level security;

-- Políticas: por defecto nadie escribe. Solo el server (service role) insertará.
-- (Opcional) lectura para usuarios autenticados solo de sus propios registros:
-- create policy read_own_withdrawals on app.withdrawals
-- for select using (auth.uid() = user_id);
