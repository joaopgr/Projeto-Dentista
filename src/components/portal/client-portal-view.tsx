"use client";

import { useState } from "react";
import { Calendar, CreditCard, User } from "lucide-react";
import { getPaymentMethodLabel, sumPaid, sumPending } from "@/lib/finance";
import { BRAND } from "@/lib/branding";
import { cn, formatCPF, formatCurrency, formatPhone, splitScheduledAt } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  formatDurationMinutes,
  type Appointment,
  type Patient,
} from "@/types/database";
import type { PortalPayment } from "@/lib/portal/data";

type Tab = "dados" | "consultas" | "pagamentos";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "dados", label: "Meus dados", icon: User },
  { id: "consultas", label: "Consultas", icon: Calendar },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
];

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { date, time } = splitScheduledAt(appointment.scheduled_at);
  const [y, m, d] = date.split("-");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">
            {appointment.procedure_type || "Consulta"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {d}/{m}/{y} às {time} · {formatDurationMinutes(appointment.duration_minutes)}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </span>
      </div>
    </div>
  );
}

export function ClientPortalView({
  patient,
  upcomingAppointments,
  pastAppointments,
  payments,
}: {
  patient: Patient;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  payments: PortalPayment[];
}) {
  const [tab, setTab] = useState<Tab>("dados");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
        <p className="text-sm font-medium text-teal-800">
          Bem-vindo(a), <span className="font-semibold">{patient.full_name}</span>!
        </p>
        <p className="mt-1 text-xs text-teal-700/70">{BRAND.name}</p>
        <p className="mt-2 text-sm text-slate-600">
          Acompanhe suas consultas e pagamentos
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              tab === id
                ? "bg-white text-teal-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Telefone
              </dt>
              <dd className="mt-1 text-slate-900">{formatPhone(patient.phone)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                CPF
              </dt>
              <dd className="mt-1 text-slate-900">
                {patient.cpf ? formatCPF(patient.cpf) : "—"}
              </dd>
            </div>
            {patient.birth_date && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Data de nascimento
                </dt>
                <dd className="mt-1 text-slate-900">
                  {new Date(patient.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}
                </dd>
              </div>
            )}
            {patient.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Endereço
                </dt>
                <dd className="mt-1 text-slate-900">{patient.address}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {tab === "consultas" && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Próximas consultas
            </h2>
            {!upcomingAppointments.length ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhuma consulta agendada no momento.
              </p>
            ) : (
              upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Histórico de atendimentos
            </h2>
            {!pastAppointments.length ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum atendimento registrado ainda.
              </p>
            ) : (
              pastAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))
            )}
          </section>
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="space-y-3">
          {!payments.length ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Nenhum pagamento registrado.
            </p>
          ) : (
            payments.map((payment) => {
              const installments = payment.payment_installments || [];
              const paid = sumPaid(installments);
              const pending = sumPending(installments);

              return (
                <div
                  key={payment.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{payment.description}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {getPaymentMethodLabel(payment.payment_method)}
                        {payment.installments_count > 1 &&
                          ` · ${payment.installments_count}x`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(Number(payment.total_amount))}
                      </p>
                      {paid > 0 && (
                        <p className="text-sm text-teal-600">
                          Pago: {formatCurrency(paid)}
                        </p>
                      )}
                      {pending > 0 && (
                        <p className="text-sm text-amber-600">
                          Pendente: {formatCurrency(pending)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
