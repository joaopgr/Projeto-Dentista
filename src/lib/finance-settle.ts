import type { SupabaseClient } from "@supabase/supabase-js";

/** Baixa parcelas vencidas (pending + due_date <= hoje) como recebidas */
export async function settleDueInstallments(supabase: SupabaseClient) {
  await supabase.rpc("settle_due_installments");
}
