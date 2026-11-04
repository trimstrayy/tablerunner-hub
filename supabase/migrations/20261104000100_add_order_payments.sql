    create table if not exists public.order_payments (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.users(id) on delete cascade,
    order_id uuid not null references public.orders(id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    payment_method text not null check (payment_method in ('cash', 'online')),
    note text,
    paid_at timestamptz not null default now()
    );

    create index if not exists order_payments_owner_id_idx
    on public.order_payments(owner_id);

    create index if not exists order_payments_order_id_idx
    on public.order_payments(order_id);

    alter table public.order_payments enable row level security;

    drop policy if exists "Allow order payment access" on public.order_payments;

    create policy "Allow order payment access"
    on public.order_payments
    for all
    using (true)
    with check (true);