import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, CalendarX, Shield } from "lucide-react";
import { respondToAppointmentByToken } from "@/lib/appointments/confirm";
import { BRAND } from "@/lib/branding";
import { APPOINTMENT_STATUS_LABELS } from "@/types/database";

export default async function ConfirmAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ acao?: string }>;
}) {
  const { token } = await params;
  const { acao } = await searchParams;

  const isCancel = acao === "cancelar";
  const action = isCancel ? "cancel" : "confirm";

  const result = await respondToAppointmentByToken(token, action);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-lg font-bold text-white">
            {BRAND.initials}
          </div>
          <div>
            <p className="font-bold text-slate-900">{BRAND.name}</p>
            <p className="text-xs text-slate-500">{BRAND.tagline}</p>
          </div>
        </div>

        {!result.ok && (
          <>
            {result.error === "not_found" && (
              <ResultBlock
                icon={<Shield className="h-10 w-10 text-slate-400" />}
                title="Link inválido"
                message="Este link não existe ou já expirou. Entre em contato com a clínica."
              />
            )}
            {result.error === "rpc_error" && (
              <ResultBlock
                icon={<Shield className="h-10 w-10 text-amber-500" />}
                title="Sistema indisponível"
                message="Execute a migração 005_appointment_reminders.sql no Supabase. Use o link enviado pelo site (projeto-dentista-beige.vercel.app), não localhost."
              />
            )}
            {result.error === "already_final" && (
              <ResultBlock
                icon={<CalendarCheck className="h-10 w-10 text-teal-600" />}
                title="Consulta já processada"
                message={
                  <>
                    {result.patientName && (
                      <span className="block font-medium text-slate-800">
                        {result.patientName}
                      </span>
                    )}
                    Status atual:{" "}
                    <strong>
                      {APPOINTMENT_STATUS_LABELS[
                        result.status as keyof typeof APPOINTMENT_STATUS_LABELS
                      ] || result.status}
                    </strong>
                  </>
                }
              />
            )}
            {result.error === "invalid_action" && (
              <ResultBlock
                icon={<Shield className="h-10 w-10 text-slate-400" />}
                title="Ação inválida"
                message="Use o link de confirmar ou cancelar enviado na mensagem."
              />
            )}
          </>
        )}

        {result.ok && (
          <ResultBlock
            icon={
              result.status === "confirmed" ? (
                <CalendarCheck className="h-10 w-10 text-teal-600" />
              ) : (
                <CalendarX className="h-10 w-10 text-red-500" />
              )
            }
            title={
              result.status === "confirmed"
                ? "Consulta confirmada!"
                : "Consulta cancelada"
            }
            message={
              <>
                <span className="block font-medium text-slate-800">
                  {result.patientName}
                </span>
                <span className="mt-2 block text-slate-600">
                  {format(new Date(result.scheduledAt), "EEEE, d 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
                {result.procedureType && (
                  <span className="mt-1 block text-sm text-slate-500">
                    {result.procedureType}
                  </span>
                )}
                <span
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    result.status === "confirmed"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {APPOINTMENT_STATUS_LABELS[
                    result.status as keyof typeof APPOINTMENT_STATUS_LABELS
                  ]}
                </span>
              </>
            }
          />
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Em caso de dúvida, fale com a clínica.
        </p>
      </div>
    </div>
  );
}

function ResultBlock({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex justify-center">{icon}</div>
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <div className="mt-3 text-sm text-slate-600">{message}</div>
    </div>
  );
}
