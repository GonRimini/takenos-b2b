# Supabase Setup for Withdrawals

## 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Retool API Keys
RETOOL_API_KEY=retool_wk_d9ad90ef3bab430d81a76f632a0544bb

# Email Service (Resend)
RESEND_API_KEY=re_RnKdazdv_EVhepzWEK6wVwDeMPZxFdZ9b

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nqhzaiuumlaqkszxikcz.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaHphaXV1bWxhcWtzenhpa2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0NzM4OSwiZXhwIjoyMDcxNzIzMzg5fQ.uSi0XqxyJHjsXes6gvQXwapKziFcBO5EhvTRSanYA6U
```

## 2. Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Migration: Create withdrawals table
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
```

## 3. Test the Setup

After running the migration, test the database connection:

```bash
curl http://localhost:3000/api/test-db
```

## 4. Test Withdrawal Creation

Test creating a withdrawal:

```bash
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Content-Type: application/json" \
  -H "x-user-email: test@example.com" \
  -d '{
    "category": "crypto",
    "walletAlias": "Test Wallet",
    "walletAddress": "0x123456789",
    "walletNetwork": "BEP20",
    "amount": "500",
    "reference": "Test with Supabase"
  }'
```

## 5. Verify in Database

Check the created records in Supabase:

```sql
select id, status, category, method, amount_numeric, created_at 
from app.withdrawals 
order by created_at desc 
limit 10;
```
