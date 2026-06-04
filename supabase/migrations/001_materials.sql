-- ============================================================
-- Migração: Estoque de materiais
-- Execute no SQL Editor do Supabase se o schema.sql já foi rodado antes
-- ============================================================

create table if not exists public.materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text,
  quantity numeric(10, 2) default 0 not null,
  unit text default 'un' not null,
  min_quantity numeric(10, 2) default 0 not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists materials_user_id_idx on public.materials (user_id);
create index if not exists materials_name_idx on public.materials (name);

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at
  before update on public.materials
  for each row execute function public.handle_updated_at();

alter table public.materials enable row level security;

drop policy if exists "Usuários veem seus materiais" on public.materials;
create policy "Usuários veem seus materiais"
  on public.materials for select
  using (auth.uid() = user_id);

drop policy if exists "Usuários inserem materiais" on public.materials;
create policy "Usuários inserem materiais"
  on public.materials for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam seus materiais" on public.materials;
create policy "Usuários atualizam seus materiais"
  on public.materials for update
  using (auth.uid() = user_id);

drop policy if exists "Usuários excluem seus materiais" on public.materials;
create policy "Usuários excluem seus materiais"
  on public.materials for delete
  using (auth.uid() = user_id);
