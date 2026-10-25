-- To check (docs/data-model.md, rule 10): when I confirmed a row; null means still to check.
-- Every row so far was typed in (AppSheet, the form) or reviewed before insert (Rakuten Card),
-- so they all start confirmed. A default on the new column fills them without rewriting rows,
-- so no UPDATE runs and the history trigger isn't fired for every row. The default is then
-- dropped, so new rows (imports) start as to check.
alter table public.expenses add column confirmed_at timestamptz default now();
alter table public.expenses alter column confirmed_at drop default;
