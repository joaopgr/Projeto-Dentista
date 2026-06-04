import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentDetail } from "@/components/finance/payment-detail";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*, patients(full_name), payment_installments(*)")
    .eq("id", id)
    .single();

  if (!payment) {
    notFound();
  }

  return <PaymentDetail payment={payment} />;
}
