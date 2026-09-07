create table if not exists public.user_module_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('teaching', 'homeroom', 'workspace')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.user_module_data enable row level security;

create policy "users can read their own module data"
  on public.user_module_data for select
  using (auth.uid() = user_id);

create policy "users can insert their own module data"
  on public.user_module_data for insert
  with check (auth.uid() = user_id);

create policy "users can update their own module data"
  on public.user_module_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own module data"
  on public.user_module_data for delete
  using (auth.uid() = user_id);
