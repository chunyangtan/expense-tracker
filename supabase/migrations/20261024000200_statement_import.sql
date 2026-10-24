-- Statement import (M3): a stable ID per statement row so re-uploads add nothing,
-- and a kind so card payments and top-ups can be kept out of spending totals.
alter table public.expenses
  add column external_id text,
  add column kind text not null default 'expense' check (kind in ('expense', 'refund', 'transfer'));

-- Rows without an external_id (manual, AppSheet) are NULL and never collide.
create unique index expenses_source_external_id_key on public.expenses (source, external_id);
