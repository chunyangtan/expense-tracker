-- AppSheet had two labels for the same category; keep the fuller one.
update public.expenses
set category = 'Special (特別出費・年数回)', modified_at = now()
where category = 'Special (年数回)';
