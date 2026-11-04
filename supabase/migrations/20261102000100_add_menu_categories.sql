create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint menu_categories_owner_name_key unique (owner_id, name)
);

create index if not exists menu_categories_owner_id_idx
  on public.menu_categories(owner_id);

alter table public.menu_categories enable row level security;

create policy "Allow menu category access"
  on public.menu_categories
  for all
  using (true)
  with check (true);

insert into public.menu_categories (owner_id, name)
select distinct owner_id, category
from public.menu_items
where owner_id is not null
  and category is not null
  and trim(category) <> ''
on conflict (owner_id, name) do nothing;