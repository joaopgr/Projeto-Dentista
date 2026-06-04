"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPaymentMethodLabel, sumPaid, sumPending } from "@/lib/finance";
import { formatCurrency, normalizeRelation } from "@/lib/utils";
import { Card } from "@/components/ui/form";
import { INSTALLMENT_STATUS_LABELS, type PaymentInstallment } from "@/types/database";

export function PaymentDetail({
  payment,
}: {
  payment: {
    id: string;
    description: string;
    total_amount: number;
    net_amount: number;
    fee_percent: number;
    fee_amount: number;
    payment_method: string;
    installments_count: number;
    patients: { full_name: string } | { full_name: string }[] | null;
    payment_installments: PaymentInstallment[];
  };
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const patient = normalizeRelation(payment.patients);
  const installments = [...(payment.payment_installments || [])].sort(
    (a, b) => a.installment_number - b.installment_number
  );

  const received = sumPaid(installments);
  const pending = sumPending(installments);

  async function markPaid(installment: PaymentInstallment) {
    if (installment.status === "paid") return;
    setLoadingId(installment.id);

    const supabase = createClient();
    await supabase
      .from("payment_installments")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", installment.id);

    setLoadingId(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Excluir este lançamento financeiro?")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("payments").delete().eq("id", payment.id);
    router.push("/financeiro");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{payment.description}</h1>
          <p className="text-sm text-slate-600">{patient?.full_name}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-teal-50/50">
          <p className="text-xs font-medium uppercase text-teal-600">Recebido</p>
          <p className="mt-1 text-xl font-bold text-teal-800">{formatCurrency(received)}</p>
        </Card>
        <Card className="bg-slate-50">
          <p className="text-xs font-medium uppercase text-slate-500">A receber</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{formatCurrency(pending)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-slate-500">Líquido total</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {formatCurrency(Number(payment.net_amount))}
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>
            <span className="font-medium text-slate-800">Valor bruto:</span>{" "}
            {formatCurrency(Number(payment.total_amount))}
          </p>
          <p>
            <span className="font-medium text-slate-800">Pagamento:</span>{" "}
            {getPaymentMethodLabel(payment.payment_method)}
          </p>
          <p>
            <span className="font-medium text-slate-800">Taxa:</span>{" "}
            {payment.fee_percent}% (− {formatCurrency(Number(payment.fee_amount))})
          </p>
          <p>
            <span className="font-medium text-slate-800">Parcelas:</span>{" "}
            {payment.installments_count}x
          </p>
        </div>

        <h2 className="mb-3 font-semibold text-slate-900">Parcelas</h2>
        <ul className="space-y-2">
          {installments.map((inst) => (
            <li
              key={inst.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {inst.installment_number}/{payment.installments_count} —{" "}
                  {formatCurrency(Number(inst.amount))}
                </p>
                <p className="text-sm text-slate-500">
                  Vencimento:{" "}
                  {format(new Date(inst.due_date + "T12:00:00"), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                  {inst.paid_at && (
                    <> · Recebido em {format(new Date(inst.paid_at), "dd/MM/yyyy")}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    inst.status === "paid"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {INSTALLMENT_STATUS_LABELS[inst.status]}
                </span>
                {inst.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => markPaid(inst)}
                    disabled={loadingId === inst.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Receber
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-6 inline-flex items-center gap-2 text-sm text-red-600 hover:underline disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Excluir lançamento
        </button>
      </Card>
    </div>
  );
}
