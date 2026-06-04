import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { settleDueInstallments } from "@/lib/finance-settle";
import { Card } from "@/components/ui/card";
import { getPaymentMethodLabel } from "@/lib/finance";
import { formatCurrency, normalizeRelation } from "@/lib/utils";

export default async function FinanceiroPage() {
  const supabase = await createClient();
  await settleDueInstallments(supabase);

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const [{ data: installments }, { data: payments }, { data: pendingInstallments }] =
    await Promise.all([
    supabase.from("payment_installments").select("*"),
    supabase
      .from("payments")
      .select("*, patients(full_name), payment_installments(*)")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("payment_installments")
      .select("*, payments(description, patients(full_name))")
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(8),
  ]);

  const all = installments ?? [];
  const receivedTotal = all
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);
  const pendingTotal = all
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + Number(i.amount), 0);
  const receivedThisMonth = all
    .filter(
      (i) =>
        i.status === "paid" &&
        i.paid_at &&
        i.paid_at >= monthStart &&
        i.paid_at <= monthEnd
    )
    .reduce((s, i) => s + Number(i.amount), 0);

  const pendingList = (pendingInstallments ?? []).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="capitalize text-slate-600">
            {format(now, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link
          href="/financeiro/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Link>
      </div>

      <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 px-4 py-3 text-sm text-teal-800">
        Parcelas com vencimento no dia ou antes de hoje são contabilizadas
        automaticamente em <strong>Recebidos</strong>. Ex.: 10x de R$ 100 — ao
        chegar 01/07, R$ 100 sai de &quot;a receber&quot; e entra em recebidos.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FinanceStat
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total recebido"
          value={formatCurrency(receivedTotal)}
          variant="teal"
        />
        <FinanceStat
          icon={<TrendingDown className="h-5 w-5" />}
          label="A receber"
          value={formatCurrency(pendingTotal)}
          variant="slate"
        />
        <FinanceStat
          icon={<DollarSign className="h-5 w-5" />}
          label="Recebido este mês"
          value={formatCurrency(receivedThisMonth)}
          variant="blue"
        />
      </div>

      {pendingList.length > 0 && (
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Próximos recebimentos</h2>
          <ul className="divide-y divide-slate-100">
            {pendingList.map((inst) => {
              const payment = normalizeRelation(
                (inst as { payments?: unknown }).payments
              ) as { description?: string; patients?: unknown } | null;
              const patient = payment
                ? normalizeRelation(payment.patients) as { full_name?: string } | null
                : null;
              return (
                <li key={inst.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {payment?.description ?? "Procedimento"} — {patient?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Parcela {inst.installment_number} · Vence{" "}
                      {format(new Date(inst.due_date + "T12:00:00"), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(Number(inst.amount))}
                    </span>
                    <Link
                      href={`/financeiro/${inst.payment_id}`}
                      className="text-sm text-teal-600 hover:underline"
                    >
                      Ver
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Lançamentos recentes</h2>
        {!payments?.length ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhum lançamento financeiro ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Paciente</th>
                  <th className="pb-2 font-medium">Procedimento</th>
                  <th className="pb-2 font-medium">Pagamento</th>
                  <th className="pb-2 font-medium">Líquido</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const insts = p.payment_installments ?? [];
                  const paid = insts.filter((i: { status: string }) => i.status === "paid").length;
                  const total = insts.length;
                  const patient = normalizeRelation(p.patients);
                  const status =
                    paid === total
                      ? "Quitado"
                      : paid > 0
                        ? "Parcial"
                        : "Pendente";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium">{patient?.full_name}</td>
                      <td className="py-3">{p.description}</td>
                      <td className="py-3">{getPaymentMethodLabel(p.payment_method)}</td>
                      <td className="py-3 font-medium">
                        {formatCurrency(Number(p.net_amount))}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {status} ({paid}/{total})
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/financeiro/${p.id}`} className="text-teal-600 hover:underline">
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function FinanceStat({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: "teal" | "slate" | "blue";
}) {
  const styles = {
    teal: "from-teal-500 to-teal-600",
    slate: "from-slate-600 to-slate-700",
    blue: "from-sky-500 to-blue-600",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${styles[variant]} p-5 text-white shadow-lg`}>
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
        {icon}
      </div>
      <p className="text-xs text-white/80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
