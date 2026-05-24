-- Orders table for paywall
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  worksheet_hash text not null,
  payload_json jsonb not null,
  stripe_session_id text unique,
  status text not null default 'pending' check (status in ('pending','paid','delivered','failed')),
  unlock_token text not null default encode(gen_random_bytes(24), 'hex'),
  pdf_storage_path text,
  amount_cents integer not null default 9900,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  delivered_at timestamptz
);

create index orders_worksheet_hash_idx on public.orders (worksheet_hash);
create index orders_stripe_session_idx on public.orders (stripe_session_id);
create index orders_unlock_token_idx on public.orders (unlock_token);

alter table public.orders enable row level security;

-- No client-side policies. Only the service role (used in server functions
-- and server routes) can read or write. Browsers cannot touch this table.

-- Storage bucket for generated PDFs
insert into storage.buckets (id, name, public)
values ('worksheet-pdfs', 'worksheet-pdfs', false)
on conflict (id) do nothing;