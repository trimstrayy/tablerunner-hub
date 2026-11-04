alter table public.menu_categories enable row level security;

drop policy if exists "Allow menu category access" on public.menu_categories;

create policy "Allow menu category access"
  on public.menu_categories
  for all
  using (true)
  with check (true);