-- ============================================================
-- Projeto Dentista - Schema Supabase
-- Execute no SQL Editor do Supabase: Dashboard > SQL > New query
-- ============================================================

-- Perfil do profissional (vinculado ao auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  clinic_name text,
  created_at timestamptz default now() not null
);

-- Pacientes
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  email text,
  phone text not null,
  cpf text,
  birth_date date,
  address text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Agendamentos
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  patient_id uuid references public.patients on delete cascade not null,
  scheduled_at timestamptz not null,
  duration_minutes integer default 60 not null,
  status text default 'scheduled' not null
    check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  procedure_type text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Índices
create index if not exists patients_user_id_idx on public.patients (user_id);
create index if not exists patients_full_name_idx on public.patients (full_name);
create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index if not exists appointments_patient_id_idx on public.appointments (patient_id);

-- Trigger: atualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.handle_updated_at();

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function public.handle_updated_at();

-- Trigger: criar perfil ao registrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, clinic_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Profissional'),
    new.raw_user_meta_data->>'clinic_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;

-- Políticas: profiles
create policy "Usuários veem apenas o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários atualizam apenas o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Políticas: patients
create policy "Usuários veem seus pacientes"
  on public.patients for select
  using (auth.uid() = user_id);

create policy "Usuários inserem pacientes"
  on public.patients for insert
  with check (auth.uid() = user_id);

create policy "Usuários atualizam seus pacientes"
  on public.patients for update
  using (auth.uid() = user_id);

create policy "Usuários excluem seus pacientes"
  on public.patients for delete
  using (auth.uid() = user_id);

-- Políticas: appointments
create policy "Usuários veem seus agendamentos"
  on public.appointments for select
  using (auth.uid() = user_id);

create policy "Usuários inserem agendamentos"
  on public.appointments for insert
  with check (auth.uid() = user_id);

create policy "Usuários atualizam seus agendamentos"
  on public.appointments for update
  using (auth.uid() = user_id);

create policy "Usuários excluem seus agendamentos"
  on public.appointments for delete
  using (auth.uid() = user_id);
