import Link from "next/link";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/form";
import { APPOINTMENT_STATUS_LABELS, type AppointmentWithPatient } from "@/types/database";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const baseDate = semana ? new Date(semana) : new Date();
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  const prevWeek = format(subWeeks(weekStart, 1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(weekStart, 1), "yyyy-MM-dd");

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name, phone)")
    .gte("scheduled_at", weekStart.toISOString())
    .lte("scheduled_at", weekEnd.toISOString())
    .order("scheduled_at", { ascending: true });

  const grouped = groupByDay(appointments as AppointmentWithPatient[] | null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-600">
            {format(weekStart, "d MMM", { locale: ptBR })} —{" "}
            {format(weekEnd, "d MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link
          href="/agenda/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Novo agendamento
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/agenda?semana=${prevWeek}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Semana anterior
        </Link>
        <Link
          href="/agenda"
          className="text-sm font-medium text-teal-600 hover:underline"
        >
          Semana atual
        </Link>
        <Link
          href={`/agenda?semana=${nextWeek}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Próxima semana
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 7 }, (_, i) => {
          const day = new Date(weekStart);
          day.setDate(day.getDate() + i);
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = grouped.get(dayKey) || [];

          return (
            <Card key={dayKey} className={dayAppointments.length === 0 ? "opacity-80" : ""}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold capitalize text-slate-900">
                  {format(day, "EEEE, d/MM", { locale: ptBR })}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {dayAppointments.length} consulta(s)
                </span>
              </div>

              {dayAppointments.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Sem consultas
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayAppointments.map((apt) => (
                    <li key={apt.id}>
                      <Link
                        href={`/agenda/${apt.id}`}
                        className="block rounded-lg border border-slate-100 p-3 transition hover:border-teal-200 hover:bg-teal-50/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {format(new Date(apt.scheduled_at), "HH:mm")} —{" "}
                              {apt.patients.full_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {apt.procedure_type || "Consulta"} · {apt.duration_minutes} min
                            </p>
                          </div>
                          <StatusBadge status={apt.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function groupByDay(appointments: AppointmentWithPatient[] | null) {
  const map = new Map<string, AppointmentWithPatient[]>();
  appointments?.forEach((apt) => {
    const key = format(new Date(apt.scheduled_at), "yyyy-MM-dd");
    const list = map.get(key) || [];
    list.push(apt);
    map.set(key, list);
  });
  return map;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-teal-100 text-teal-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-slate-100 text-slate-700"}`}
    >
      {APPOINTMENT_STATUS_LABELS[status as keyof typeof APPOINTMENT_STATUS_LABELS] || status}
    </span>
  );
}
