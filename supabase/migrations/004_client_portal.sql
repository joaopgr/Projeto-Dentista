-- ============================================================
-- Migração: Portal do cliente (login por CPF)
-- Execute no SQL Editor do Supabase (pode rodar de novo com CREATE OR REPLACE)
-- ============================================================

create or replace function public.client_portal_login(
  cpf_input text,
  cpf_password text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_input text;
  normalized_password text;
  found_id uuid;
begin
  normalized_input := regexp_replace(cpf_input, '\D', '', 'g');
  normalized_password := regexp_replace(cpf_password, '\D', '', 'g');

  if length(normalized_input) != 11 or normalized_input != normalized_password then
    return null;
  end if;

  select id into found_id
  from public.patients
  where cpf = normalized_input
  limit 1;

  return found_id;
end;
$$;

create or replace function public.client_portal_get_data(
  patient_id uuid,
  cpf_input text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_cpf text;
  result jsonb;
begin
  normalized_cpf := regexp_replace(cpf_input, '\D', '', 'g');

  if not exists (
    select 1 from public.patients p
    where p.id = client_portal_get_data.patient_id
      and p.cpf = normalized_cpf
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'patient', (
      select to_jsonb(p.*)
      from public.patients p
      where p.id = client_portal_get_data.patient_id
    ),
    'appointments', coalesce(
      (
        select jsonb_agg(to_jsonb(a.*) order by a.scheduled_at desc)
        from public.appointments a
        where a.patient_id = client_portal_get_data.patient_id
      ),
      '[]'::jsonb
    ),
    'payments', coalesce(
      (
        select jsonb_agg(
          to_jsonb(pay.*) || jsonb_build_object(
            'payment_installments',
            coalesce(
              (
                select jsonb_agg(to_jsonb(pi.*) order by pi.installment_number)
                from public.payment_installments pi
                where pi.payment_id = pay.id
              ),
              '[]'::jsonb
            )
          )
          order by pay.created_at desc
        )
        from public.payments pay
        where pay.patient_id = client_portal_get_data.patient_id
      ),
      '[]'::jsonb
    )
  ) into result;

  return result;
exception
  when undefined_table then
    select jsonb_build_object(
      'patient', (
        select to_jsonb(p.*)
        from public.patients p
        where p.id = client_portal_get_data.patient_id
      ),
      'appointments', coalesce(
        (
          select jsonb_agg(to_jsonb(a.*) order by a.scheduled_at desc)
          from public.appointments a
          where a.patient_id = client_portal_get_data.patient_id
        ),
        '[]'::jsonb
      ),
      'payments', '[]'::jsonb
    ) into result;

    return result;
end;
$$;

grant execute on function public.client_portal_login(text, text) to anon, authenticated;
grant execute on function public.client_portal_get_data(uuid, text) to anon, authenticated;
