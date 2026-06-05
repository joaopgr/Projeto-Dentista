"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, CreditCard, User } from "lucide-react";
import { getPaymentMethodLabel, sumPaid } from "@/lib/finance";
import { cn, formatCurrency, splitScheduledAt } from "@/lib/utils";
import { PatientForm } from "@/components/patients/patient-form";
import {
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
  type Patient,
  type Payment,
  type PaymentInstallment,
} from "@/types/database";

type PaymentWithInstallments = Payment & {
  payment_installments: PaymentInstallment[];
};

type Tab = "dados" | "atendimentos" | "pagamentos";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "dados", label: "Dados", icon: User },
  { id: "atendimentos", label: "Atendimentos", icon: Calendar },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
];

export function PatientDetailView({
  patient,
  appointments,
  payments,
}: {
  patient: Patient;
  appointments: Appointment[];
  payments: PaymentWithInstallments[];
}) {
  const [tab, setTab] = useState<Tab>("dados");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/agenda/novo?paciente=${patient.id}`}
          className="btn-soft"
        >
          Agendar consulta
        </Link>
        <Link
          href={`/financeiro/novo?paciente=${patient.id}`}
          className="btn-ghost"
        >
          Novo lançamento
        </Link>
      </div>

      <div className="pill-tabs w-full">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "pill-tab flex flex-1 items-center justify-center gap-2",
              tab === id && "pill-tab-active"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "dados" && <PatientForm patient={patient} />}

      {tab === "atendimentos" && (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          {!appointments.length ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Nenhum atendimento registrado.{" "}
              <Link
                href={`/agenda/novo?paciente=${patient.id}`}
                className="font-medium text-teal-600 hover:underline"
              >
                Agendar consulta
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => {
                const { date, time } = splitScheduledAt(apt.scheduled_at);
                const [y, m, d] = date.split("-");
                return (
                  <Link
                    key={apt.id}
                    href={`/agenda/${apt.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {apt.procedure_type || "Consulta"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {d}/{m}/{y} às {time}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/90 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          {!payments.length ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Nenhum pagamento registrado.{" "}
              <Link
                href={`/financeiro/novo?paciente=${patient.id}`}
                className="font-medium text-teal-600 hover:underline"
              >
                Registrar lançamento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const paid = sumPaid(payment.payment_installments || []);
                const pending = (payment.payment_installments || [])
                  .filter((i) => i.status === "pending")
                  .reduce((s, i) => s + Number(i.amount), 0);

                return (
                  <Link
                    key={payment.id}
                    href={`/financeiro/${payment.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {payment.description}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getPaymentMethodLabel(payment.payment_method)}
                        {payment.installments_count > 1 &&
                          ` · ${payment.installments_count}x`}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(payment.net_amount))}
                      </p>
                      {pending > 0 && (
                        <p className="text-amber-600">
                          A receber: {formatCurrency(pending)}
                        </p>
                      )}
                      {paid > 0 && pending === 0 && (
                        <p className="text-teal-600">Recebido</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
