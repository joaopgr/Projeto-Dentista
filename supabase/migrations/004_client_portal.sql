-- ============================================================
-- Migração: Portal do cliente (login por CPF)
-- Execute no SQL Editor do Supabase
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
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_cpf text;
  patient_json json;
  appointments_json json;
  payments_json json;
begin
  normalized_cpf := regexp_replace(cpf_input, '\D', '', 'g');

  if not exists (
    select 1 from public.patients p
    where p.id = patient_id and p.cpf = normalized_cpf
  ) then
    return null;
  end if;

  select row_to_json(p) into patient_json
  from public.patients p
  where p.id = patient_id;

  select coalesce(
    json_agg(row_to_json(a) order by a.scheduled_at desc),
    '[]'::json
  ) into appointments_json
  from public.appointments a
  where a.patient_id = patient_id;

  begin
    select coalesce(
      json_agg(
        to_jsonb(pay) || jsonb_build_object(
          'payment_installments',
          coalesce(
            (
              select json_agg(row_to_json(pi) order by pi.installment_number)
              from public.payment_installments pi
              where pi.payment_id = pay.id
            ),
            '[]'::json
          )
        )
        order by pay.created_at desc
      ),
      '[]'::json
    ) into payments_json
    from public.payments pay
    where pay.patient_id = patient_id;
  exception
    when undefined_table then
      payments_json := '[]'::json;
  end;

  return json_build_object(
    'patient', patient_json,
    'appointments', appointments_json,
    'payments', payments_json
  );
end;
$$;

grant execute on function public.client_portal_login(text, text) to anon, authenticated;
grant execute on function public.client_portal_get_data(uuid, text) to anon, authenticated;
