import { addMonths, format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "debito"
  | "credito"
  | "boleto"
  | "transferencia";

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  defaultFee: number;
}[] = [
  { value: "dinheiro", label: "Dinheiro", defaultFee: 0 },
  { value: "pix", label: "PIX", defaultFee: 0 },
  { value: "debito", label: "Cartão débito", defaultFee: 1.5 },
  { value: "credito", label: "Cartão crédito", defaultFee: 3.5 },
  { value: "boleto", label: "Boleto", defaultFee: 0 },
  { value: "transferencia", label: "Transferência", defaultFee: 0 },
];

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function calculatePaymentAmounts(
  procedureAmount: number,
  feePercent: number,
  passFeeToClient = false
) {
  const feeAmount =
    Math.round(procedureAmount * (feePercent / 100) * 100) / 100;

  if (passFeeToClient) {
    const chargeAmount =
      Math.round((procedureAmount + feeAmount) * 100) / 100;
    return { feeAmount, netAmount: procedureAmount, chargeAmount };
  }

  const netAmount = Math.round((procedureAmount - feeAmount) * 100) / 100;
  return { feeAmount, netAmount, chargeAmount: procedureAmount };
}

export type CreatePaymentParams = {
  userId: string;
  patientId: string;
  appointmentId?: string | null;
  description: string;
  procedureAmount: number;
  paymentMethod: PaymentMethod;
  feePercent: number;
  passFeeToClient: boolean;
  installmentsCount: number;
  firstDueDate: string;
  notes?: string | null;
};

export async function createPaymentRecord(
  supabase: SupabaseClient,
  params: CreatePaymentParams
): Promise<{ paymentId: string } | { error: string }> {
  const {
    userId,
    patientId,
    appointmentId,
    description,
    procedureAmount,
    paymentMethod,
    feePercent,
    passFeeToClient,
    installmentsCount,
    firstDueDate,
    notes,
  } = params;

  if (procedureAmount <= 0) {
    return { error: "Informe um valor válido." };
  }

  const { feeAmount, netAmount, chargeAmount } = calculatePaymentAmounts(
    procedureAmount,
    feePercent,
    passFeeToClient
  );

  const installmentBase = passFeeToClient ? chargeAmount : netAmount;
  const installments = buildInstallments(
    installmentBase,
    installmentsCount,
    firstDueDate
  );

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      patient_id: patientId,
      appointment_id: appointmentId ?? null,
      description,
      total_amount: chargeAmount,
      payment_method: paymentMethod,
      fee_percent: feePercent,
      fee_amount: feeAmount,
      net_amount: netAmount,
      installments_count: installmentsCount,
      notes: notes?.trim() || null,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return {
      error: paymentError?.message.includes("relation")
        ? "Execute a migração financeira no Supabase (002_finance.sql)."
        : "Erro ao registrar pagamento.",
    };
  }

  const { error: installmentsError } = await supabase
    .from("payment_installments")
    .insert(
      installments.map((inst) => ({
        user_id: userId,
        payment_id: payment.id,
        ...inst,
      }))
    );

  if (installmentsError) {
    return { error: "Erro ao criar parcelas." };
  }

  return { paymentId: payment.id };
}

export function getPaymentPreview(
  procedureAmount: number,
  feePercent: number,
  passFeeToClient: boolean,
  installmentsCount: number
) {
  const { feeAmount, netAmount, chargeAmount } = calculatePaymentAmounts(
    procedureAmount,
    feePercent,
    passFeeToClient
  );
  const count = installmentsCount || 1;
  const installmentBase = passFeeToClient ? chargeAmount : netAmount;
  const installmentValue = count > 0 ? installmentBase / count : 0;

  return { feeAmount, netAmount, chargeAmount, count, installmentValue };
}

export function buildInstallments(
  netAmount: number,
  count: number,
  firstDueDate: string
) {
  const base = Math.floor((netAmount / count) * 100) / 100;
  const installments = [];

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast
      ? Math.round((netAmount - base * (count - 1)) * 100) / 100
      : base;

    installments.push({
      installment_number: i + 1,
      amount,
      due_date: format(addMonths(new Date(firstDueDate + "T12:00:00"), i), "yyyy-MM-dd"),
      status: "pending" as const,
    });
  }

  return installments;
}

export function sumPaid(installments: { amount: number; status: string }[]) {
  return installments
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);
}

export function sumPending(installments: { amount: number; status: string }[]) {
  return installments
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + Number(i.amount), 0);
}
