-- Change history for expenses: every insert, update and delete, with the row
-- before and after as JSON. Written by a trigger, so edits from the app, imports
-- and the Supabase dashboard are all recorded. Append-only.

create table public.expenses_history (
  id          bigint generated always as identity primary key,
  expense_id  uuid not null,
  operation   text not null check (operation in ('BASELINE', 'INSERT', 'UPDATE', 'DELETE')),
  old_row     jsonb,
  new_row     jsonb,
  changed_at  timestamptz not null default now()
);

create index expenses_history_expense_idx on public.expenses_history (expense_id, changed_at);

alter table public.expenses_history enable row level security;
grant select on public.expenses_history to service_role;

create function public.record_expense_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.expenses_history (expense_id, operation, old_row, new_row)
  values (
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger expenses_history_trigger
after insert or update or delete on public.expenses
for each row execute function public.record_expense_change();

-- Keep modified_at honest for every update, whoever makes it.
create function public.touch_modified_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modified_at = now();
  return new;
end;
$$;

create trigger expenses_touch_modified_at
before update on public.expenses
for each row execute function public.touch_modified_at();

-- History starts here: snapshot every existing row so later changes have a "before".
insert into public.expenses_history (expense_id, operation, new_row)
select id, 'BASELINE', to_jsonb(e) from public.expenses e;
