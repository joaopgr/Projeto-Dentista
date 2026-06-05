"use client";

import { useMemo } from "react";
import {
  PAYMENT_METHODS,
  getPaymentPreview,
  type PaymentMethod,
} from "@/lib/finance";
import { formatCurrency, parseMoneyInput } from "@/lib/utils";
import { Input, Select, Textarea } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";

export type PaymentFormState = {
  total_amount: string;
  payment_method: PaymentMethod;
  fee_percent: string;
  pass_fee_to_client: boolean;
  installments_count: string;
  first_due_date: string;
  notes: string;
};

export function defaultPaymentFormState(): PaymentFormState {
  return {
    total_amount: "",
    payment_method: "pix",
    fee_percent: "0",
    pass_fee_to_client: false,
    installments_count: "1",
    first_due_date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

type PaymentFormSectionProps = {
  form: PaymentFormState;
  onChange: (field: keyof PaymentFormState, value: string | boolean) => void;
  showNotes?: boolean;
};

export function PaymentFormSection({
  form,
  onChange,
  showNotes = true,
}: PaymentFormSectionProps) {
  const preview = useMemo(() => {
    const procedureAmount = parseMoneyInput(form.total_amount);
    const feePercent = parseFloat(form.fee_percent) || 0;
    const count = parseInt(form.installments_count, 10) || 1;
    return getPaymentPreview(
      procedureAmount,
      feePercent,
      form.pass_fee_to_client,
      count
    );
  }, [
    form.total_amount,
    form.fee_percent,
    form.pass_fee_to_client,
    form.installments_count,
  ]);

  function updatePaymentMethod(value: string) {
    onChange("payment_method", value);
    const method = PAYMENT_METHODS.find((m) => m.value === value);
    if (method) onChange("fee_percent", String(method.defaultFee));
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <MoneyInput
        label="Valor do procedimento *"
        required
        value={form.total_amount}
        onChange={(value) => onChange("total_amount", value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Forma de pagamento *"
          value={form.payment_method}
          onChange={(e) => updatePaymentMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
        <Input
          label="Taxa (%)"
          type="number"
          min="0"
          step="0.01"
          value={form.fee_percent}
          onChange={(e) => onChange("fee_percent", e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-[1.35rem] border border-slate-200/60 bg-slate-50/40 p-4 transition hover:border-teal-200 hover:bg-teal-50/30">
        <input
          type="checkbox"
          checked={form.pass_fee_to_client}
          onChange={(e) => onChange("pass_fee_to_client", e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="text-sm text-slate-700">
          <span className="font-medium text-slate-900">
            Repassar taxa ao cliente
          </span>
          <span className="mt-0.5 block text-slate-500">
            O paciente paga a taxa do cartão; você recebe o valor integral do
            procedimento.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Parcelas"
          value={form.installments_count}
          onChange={(e) => onChange("installments_count", e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={String(n)}>
              {n}x {n === 1 ? "(à vista)" : ""}
            </option>
          ))}
        </Select>
        <Input
          label="Vencimento da 1ª parcela *"
          type="date"
          required
          value={form.first_due_date}
          onChange={(e) => onChange("first_due_date", e.target.value)}
        />
      </div>

      <div className="rounded-xl bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Resumo</p>
        <div className="mt-2 space-y-1">
          <p>
            Valor do procedimento:{" "}
            {formatCurrency(parseMoneyInput(form.total_amount))}
          </p>
          {form.pass_fee_to_client ? (
            <p>Taxa repassada ({form.fee_percent}%): + {formatCurrency(preview.feeAmount)}</p>
          ) : (
            <p>Taxa ({form.fee_percent}%): − {formatCurrency(preview.feeAmount)}</p>
          )}
          <p className="font-semibold text-teal-700">
            {form.pass_fee_to_client ? (
              <>Cliente paga: {formatCurrency(preview.chargeAmount)} · Você recebe: {formatCurrency(preview.netAmount)}</>
            ) : (
              <>Valor líquido: {formatCurrency(preview.netAmount)}</>
            )}
          </p>
          {preview.count > 1 && (
            <p>
              {preview.count}x de {formatCurrency(preview.installmentValue)} (aprox.)
            </p>
          )}
        </div>
      </div>

      {showNotes && (
        <Textarea
          label="Observações do pagamento"
          rows={2}
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
        />
      )}
    </div>
  );
}
