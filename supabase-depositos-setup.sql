-- =====================================================
-- TABLAS DE DEPÓSITOS PARA SUPABASE
-- =====================================================
-- Este script crea las tablas para los métodos de depósito:
-- ACH/Wire, SWIFT, Crypto, y Moneda Local

-- =====================================================
-- 1. TABLA: depositos_ach
-- =====================================================
create table if not exists public.depositos_ach (
  id uuid not null default gen_random_uuid(),
  email text not null,
  numero_cuenta text null,
  routing_number text null,
  nombre_beneficiario text null,
  banco_receptor text null,
  tipo_cuenta text null,
  direccion_beneficiario text null,
  direccion_banco text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint depositos_ach_pkey primary key (id)
) tablespace pg_default;

-- =====================================================
-- 2. TABLA: depositos_swift
-- =====================================================
create table if not exists public.depositos_swift (
  id uuid not null default gen_random_uuid(),
  email text not null,
  swift_bic_code text null,
  numero_cuenta text null,
  nombre_beneficiario text null,
  banco_receptor text null,
  tipo_cuenta text null,
  direccion_beneficiario text null,
  direccion_banco text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint depositos_swift_pkey primary key (id)
) tablespace pg_default;

-- =====================================================
-- 3. TABLA: depositos_crypto
-- =====================================================
create table if not exists public.depositos_crypto (
  id uuid not null default gen_random_uuid(),
  email text not null,
  wallet_name text null,
  direccion_deposito text null,
  red_network text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint depositos_crypto_pkey primary key (id)
) tablespace pg_default;

-- =====================================================
-- 4. TABLA: depositos_local
-- =====================================================
create table if not exists public.depositos_local (
  id uuid not null default gen_random_uuid(),
  email text not null,
  beneficiario text null,
  banco text null,
  numero_cuenta text null,
  nit_carnet text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint depositos_local_pkey primary key (id)
) tablespace pg_default;

-- =====================================================
-- DESHABILITAR RLS TEMPORALMENTE (para desarrollo)
-- =====================================================
alter table public.depositos_ach disable row level security;
alter table public.depositos_swift disable row level security;
alter table public.depositos_crypto disable row level security;
alter table public.depositos_local disable row level security;

-- =====================================================
-- ÍNDICES para búsquedas rápidas por email
-- =====================================================
create index if not exists depositos_ach_email_idx on public.depositos_ach (lower(email));
create index if not exists depositos_swift_email_idx on public.depositos_swift (lower(email));
create index if not exists depositos_crypto_email_idx on public.depositos_crypto (lower(email));
create index if not exists depositos_local_email_idx on public.depositos_local (lower(email));

-- =====================================================
-- DATOS DE PRUEBA
-- =====================================================
-- IMPORTANTE: Reemplaza 'test@example.com' con tu email real

-- ACH
insert into public.depositos_ach (email, numero_cuenta, routing_number, nombre_beneficiario, banco_receptor, tipo_cuenta, direccion_beneficiario, direccion_banco)
values 
  ('test@example.com', '1234567890', '021000021', 'John Doe', 'Chase Bank', 'Checking', '123 Main St, New York, NY 10001', '270 Park Ave, New York, NY 10017')
on conflict (id) do nothing;

-- SWIFT
insert into public.depositos_swift (email, swift_bic_code, numero_cuenta, nombre_beneficiario, banco_receptor, tipo_cuenta, direccion_beneficiario, direccion_banco)
values 
  ('test@example.com', 'CHASUS33', 'US1234567890', 'John Doe', 'Chase Bank', 'Checking', '123 Main St, New York, NY 10001', '270 Park Ave, New York, NY 10017')
on conflict (id) do nothing;

-- Crypto (puede haber múltiples wallets por usuario)
insert into public.depositos_crypto (email, wallet_name, direccion_deposito, red_network)
values 
  ('test@example.com', 'USDT', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'ERC20'),
  ('test@example.com', 'USDC', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Polygon')
on conflict (id) do nothing;

-- Local
insert into public.depositos_local (email, beneficiario, banco, numero_cuenta, nit_carnet)
values 
  ('test@example.com', 'Juan Pérez', 'Banco Nacional', '1234567890', '12345678')
on conflict (id) do nothing;

-- =====================================================
-- VERIFICAR DATOS
-- =====================================================
select 'ACH' as tabla, count(*) as registros from public.depositos_ach
union all
select 'SWIFT' as tabla, count(*) as registros from public.depositos_swift
union all
select 'Crypto' as tabla, count(*) as registros from public.depositos_crypto
union all
select 'Local' as tabla, count(*) as registros from public.depositos_local;

