"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  PAYMENT_METHODS,
  buildInstallments,
  calculatePaymentAmounts,
  type PaymentMethod,
} from "@/lib/finance";
import { formatCurrency, parseMoneyInput } from "@/lib/utils";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/form";
import { PROCEDURE_TYPES, type Patient } from "@/types/database";

export default function NewPaymentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patient_id: "",
    description: "",
    total_amount: "",
    payment_method: "pix" as PaymentMethod,
    fee_percent: "0",
    installments_count: "1",
    first_due_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("patients").select("*").order("full_name");
      setPatients(data || []);
    }
    load();
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "payment_method") {
        const method = PAYMENT_METHODS.find((m) => m.value === value);
        if (method) next.fee_percent = String(method.defaultFee);
      }
      return next;
    });
  }

  const preview = useMemo(() => {
    const total = parseMoneyInput(form.total_amount);
    const feePercent = parseFloat(form.fee_percent) || 0;
    const { feeAmount, netAmount } = calculatePaymentAmounts(total, feePercent);
    const count = parseInt(form.installments_count, 10) || 1;
    const installmentValue = count > 0 ? netAmount / count : 0;
    return { total, feeAmount, netAmount, count, installmentValue };
  }, [form.total_amount, form.fee_percent, form.installments_count]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }

    const totalAmount = parseMoneyInput(form.total_amount);
    if (totalAmount <= 0) {
      setError("Informe um valor válido.");
      setLoading(false);
      return;
    }

    const feePercent = parseFloat(form.fee_percent) || 0;
    const { feeAmount, netAmount } = calculatePaymentAmounts(totalAmount, feePercent);
    const installmentsCount = parseInt(form.installments_count, 10) || 1;
    const installments = buildInstallments(
      netAmount,
      installmentsCount,
      form.first_due_date
    );

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        patient_id: form.patient_id,
        description: form.description.trim(),
        total_amount: totalAmount,
        payment_method: form.payment_method,
        fee_percent: feePercent,
        fee_amount: feeAmount,
        net_amount: netAmount,
        installments_count: installmentsCount,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      setError(
        paymentError?.message.includes("relation")
          ? "Execute a migração financeira no Supabase (002_finance.sql)."
          : "Erro ao registrar pagamento."
      );
      setLoading(false);
      return;
    }

    const { error: installmentsError } = await supabase
      .from("payment_installments")
      .insert(
        installments.map((inst) => ({
          user_id: user.id,
          payment_id: payment.id,
          ...inst,
        }))
      );

    if (installmentsError) {
      setError("Erro ao criar parcelas.");
      setLoading(false);
      return;
    }

    router.push(`/financeiro/${payment.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo lançamento</h1>
          <p className="text-sm text-slate-600">Registre procedimento e forma de pagamento</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Paciente *"
            required
            value={form.patient_id}
            onChange={(e) => update("patient_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </Select>

          <Select
            label="Procedimento *"
            required
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          >
            <option value="">Selecione</option>
            {PROCEDURE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          <Input
            label="Valor do procedimento *"
            required
            value={form.total_amount}
            onChange={(e) => update("total_amount", e.target.value)}
            placeholder="R$ 0,00"
            inputMode="numeric"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Forma de pagamento *"
              value={form.payment_method}
              onChange={(e) => update("payment_method", e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
            <Input
              label="Taxa (%)"
              type="number"
              min="0"
              step="0.01"
              value={form.fee_percent}
              onChange={(e) => update("fee_percent", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Parcelas"
              value={form.installments_count}
              onChange={(e) => update("installments_count", e.target.value)}
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
              onChange={(e) => update("first_due_date", e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Resumo</p>
            <div className="mt-2 space-y-1">
              <p>Valor bruto: {formatCurrency(preview.total)}</p>
              <p>Taxa ({form.fee_percent}%): − {formatCurrency(preview.feeAmount)}</p>
              <p className="font-semibold text-teal-700">
                Valor líquido: {formatCurrency(preview.netAmount)}
              </p>
              {preview.count > 1 && (
                <p>
                  {preview.count}x de {formatCurrency(preview.installmentValue)} (aprox.)
                </p>
              )}
            </div>
          </div>

          <Textarea
            label="Observações"
            rows={2}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Registrar</Button>
            <Link
              href="/financeiro"
              className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
