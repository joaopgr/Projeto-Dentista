-- ============================================================
-- Migração: Lembretes de consulta (Fase 1 — links + WhatsApp manual)
-- Execute no SQL Editor do Supabase
-- ============================================================

alter table public.appointments
  add column if not exists confirmation_token uuid default gen_random_uuid(),
  add column if not exists reminder_sent_at timestamptz;

update public.appointments
set confirmation_token = gen_random_uuid()
where confirmation_token is null;

alter table public.appointments
  alter column confirmation_token set not null;

create unique index if not exists appointments_confirmation_token_idx
  on public.appointments (confirmation_token);

-- Paciente confirma ou cancela pelo link (sem login)
create or replace function public.appointment_respond_by_token(
  p_token uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  apt record;
  new_status text;
begin
  select
    a.id,
    a.status,
    a.scheduled_at,
    a.procedure_type,
    p.full_name as patient_name
  into apt
  from public.appointments a
  join public.patients p on p.id = a.patient_id
  where a.confirmation_token = p_token;

  if apt.id is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if apt.status in ('completed', 'cancelled', 'no_show') then
    return jsonb_build_object(
      'ok', false,
      'error', 'already_final',
      'status', apt.status,
      'patient_name', apt.patient_name,
      'scheduled_at', apt.scheduled_at
    );
  end if;

  if p_action = 'cancel' then
    new_status := 'cancelled';
  elsif p_action = 'confirm' then
    new_status := 'confirmed';
  else
    return jsonb_build_object('ok', false, 'error', 'invalid_action');
  end if;

  update public.appointments
  set status = new_status, updated_at = now()
  where id = apt.id;

  return jsonb_build_object(
    'ok', true,
    'status', new_status,
    'patient_name', apt.patient_name,
    'scheduled_at', apt.scheduled_at,
    'procedure_type', apt.procedure_type
  );
end;
$$;

grant execute on function public.appointment_respond_by_token(uuid, text) to anon, authenticated;
