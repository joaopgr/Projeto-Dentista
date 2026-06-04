-- ============================================================
-- Migração: Baixa automática de parcelas na data de vencimento
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Marca como "recebido" toda parcela pendente cuja data de vencimento
-- já passou (due_date <= hoje). Assim, ao virar o mês, o valor sai de
-- "a receber" e entra em "recebidos" automaticamente.
create or replace function public.settle_due_installments()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  affected integer;
begin
  update public.payment_installments
  set
    status = 'paid',
    paid_at = timezone('America/Sao_Paulo', due_date::timestamp + time '08:00:00')
  where
    status = 'pending'
    and due_date <= current_date;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.settle_due_installments() to authenticated;
