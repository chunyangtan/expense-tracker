-- The expenses table: the AppSheet columns plus currency and import-source fields.
-- Schema notes are in ROADMAP.md.

create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  date            date not null,
  item_name       text,
  category        text,
  sub_category    text,
  payment_method  text,
  amount          numeric(12, 2) not null,
  currency        text not null check (currency in ('JPY', 'MYR')),
  notes           text,
  photos          text,
  source          text not null default 'manual',  -- appsheet, manual, statement:<bank>
  raw_description text,
  receipt_url     text,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  modified_at     timestamptz not null default now()
);

create index expenses_date_idx on public.expenses (date);

-- New tables aren't exposed to the Data API automatically, and RLS is on.
-- Until auth lands in M3, only the server (secret key) reads and writes.
alter table public.expenses enable row level security;
grant select, insert, update, delete on public.expenses to service_role;
