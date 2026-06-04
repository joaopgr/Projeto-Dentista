-- ============================================================
-- Migração: Controle financeiro
-- Execute no SQL Editor do Supabase
-- ============================================================

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  patient_id uuid references public.patients on delete cascade not null,
  appointment_id uuid references public.appointments on delete set null,
  description text not null,
  total_amount numeric(12, 2) not null,
  payment_method text not null,
  fee_percent numeric(5, 2) default 0 not null,
  fee_amount numeric(12, 2) default 0 not null,
  net_amount numeric(12, 2) not null,
  installments_count integer default 1 not null check (installments_count >= 1),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.payment_installments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  payment_id uuid references public.payments on delete cascade not null,
  installment_number integer not null check (installment_number >= 1),
  amount numeric(12, 2) not null,
  due_date date not null,
  paid_at timestamptz,
  status text default 'pending' not null check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (payment_id, installment_number)
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_patient_id_idx on public.payments (patient_id);
create index if not exists payment_installments_user_id_idx on public.payment_installments (user_id);
create index if not exists payment_installments_payment_id_idx on public.payment_installments (payment_id);
create index if not exists payment_installments_due_date_idx on public.payment_installments (due_date);
create index if not exists payment_installments_status_idx on public.payment_installments (status);

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

drop trigger if exists payment_installments_updated_at on public.payment_installments;
create trigger payment_installments_updated_at
  before update on public.payment_installments
  for each row execute function public.handle_updated_at();

alter table public.payments enable row level security;
alter table public.payment_installments enable row level security;

drop policy if exists "Usuários veem seus pagamentos" on public.payments;
create policy "Usuários veem seus pagamentos"
  on public.payments for select using (auth.uid() = user_id);

drop policy if exists "Usuários inserem pagamentos" on public.payments;
create policy "Usuários inserem pagamentos"
  on public.payments for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam seus pagamentos" on public.payments;
create policy "Usuários atualizam seus pagamentos"
  on public.payments for update using (auth.uid() = user_id);

drop policy if exists "Usuários excluem seus pagamentos" on public.payments;
create policy "Usuários excluem seus pagamentos"
  on public.payments for delete using (auth.uid() = user_id);

drop policy if exists "Usuários veem suas parcelas" on public.payment_installments;
create policy "Usuários veem suas parcelas"
  on public.payment_installments for select using (auth.uid() = user_id);

drop policy if exists "Usuários inserem parcelas" on public.payment_installments;
create policy "Usuários inserem parcelas"
  on public.payment_installments for insert with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam suas parcelas" on public.payment_installments;
create policy "Usuários atualizam suas parcelas"
  on public.payment_installments for update using (auth.uid() = user_id);

drop policy if exists "Usuários excluem suas parcelas" on public.payment_installments;
create policy "Usuários excluem suas parcelas"
  on public.payment_installments for delete using (auth.uid() = user_id);
