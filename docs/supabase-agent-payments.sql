create table if not exists public.agent_payment_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  payment_id text not null,
  agent_name text not null,
  service_name text not null,
  recipient_name text,
  payment_type text not null,
  amount text not null,
  token text not null default 'USDC',
  destination text not null,
  network text not null,
  rail text not null,
  status text not null,
  execution_mode text not null,
  resource_url text,
  description text,
  schedule_date text,
  approval_time timestamptz,
  rejection_time timestamptz,
  rejection_reason text,
  execution_started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  tx_hash text,
  transfer_id text,
  retry_count integer not null default 0,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wallet_address, payment_id)
);

create index if not exists agent_payment_requests_wallet_created_idx
  on public.agent_payment_requests (wallet_address, created_at desc);

alter table public.agent_payment_requests enable row level security;

-- Recommended production setup:
-- 1. Set SUPABASE_SERVICE_ROLE_KEY only in Vercel server-side environment vars.
-- 2. Keep this table behind Velora API routes; do not expose direct browser
--    writes unless you add Supabase Auth policies that match your auth model.
-- 3. The service role bypasses RLS from API routes after Velora wallet-session
--    verification.
