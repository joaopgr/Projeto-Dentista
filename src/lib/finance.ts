import { addMonths, format } from "date-fns";

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
  totalAmount: number,
  feePercent: number
) {
  const feeAmount = Math.round(totalAmount * (feePercent / 100) * 100) / 100;
  const netAmount = Math.round((totalAmount - feeAmount) * 100) / 100;
  return { feeAmount, netAmount };
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
