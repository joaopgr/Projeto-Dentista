import Link from "next/link";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { normalizeRelation } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS, type AppointmentWithPatient } from "@/types/database";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; dia?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "semana" ? "semana" : "hoje";

  if (view === "hoje") {
    return <TodayView dia={params.dia} />;
  }

  return <WeekView semana={params.semana} />;
}

async function TodayView({ dia }: { dia?: string }) {
  const baseDate = dia ? new Date(dia + "T12:00:00") : new Date();
  const dayStart = startOfDay(baseDate);
  const dayEnd = endOfDay(baseDate);

  const prevDay = format(subDays(dayStart, 1), "yyyy-MM-dd");
  const nextDay = format(addDays(dayStart, 1), "yyyy-MM-dd");
  const dayParam = format(dayStart, "yyyy-MM-dd");

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name, phone)")
    .gte("scheduled_at", dayStart.toISOString())
    .lte("scheduled_at", dayEnd.toISOString())
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true });

  const list = normalizeAppointments(appointments);

  return (
    <div className="space-y-6">
      <AgendaHeader
        title="Agenda"
        subtitle={format(dayStart, "EEEE, d 'de' MMMM", { locale: ptBR })}
        isToday={isToday(dayStart)}
      />

      <ViewTabs active="hoje" />

      <DayNavigation
        prevHref={`/agenda?view=hoje&dia=${prevDay}`}
        nextHref={`/agenda?view=hoje&dia=${nextDay}`}
        currentHref="/agenda?view=hoje"
        currentLabel={isToday(dayStart) ? "Hoje" : format(dayStart, "d/MM", { locale: ptBR })}
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            {list.length} consulta(s) neste dia
          </h2>
        </div>

        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhuma consulta agendada para este dia.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((apt) => (
              <li key={apt.id}>
                <Link
                  href={`/agenda/${apt.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                      <span className="text-lg font-bold leading-none">
                        {format(new Date(apt.scheduled_at), "HH:mm")}
                      </span>
                      <span className="mt-0.5 text-[10px] font-medium">
                        {apt.duration_minutes}min
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {apt.patients.full_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {apt.procedure_type || "Consulta"} · {apt.patients.phone}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function WeekView({ semana }: { semana?: string }) {
  const baseDate = semana ? new Date(semana + "T12:00:00") : new Date();
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

  const grouped = groupByDay(normalizeAppointments(appointments));

  return (
    <div className="space-y-6">
      <AgendaHeader
        title="Agenda"
        subtitle={`${format(weekStart, "d MMM", { locale: ptBR })} — ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`}
      />

      <ViewTabs active="semana" />

      <DayNavigation
        prevHref={`/agenda?view=semana&semana=${prevWeek}`}
        nextHref={`/agenda?view=semana&semana=${nextWeek}`}
        currentHref="/agenda?view=semana"
        currentLabel="Semana atual"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 7 }, (_, i) => {
          const day = addDays(weekStart, i);
          const dayKey = format(day, "yyyy-MM-dd");
          const dayAppointments = grouped.get(dayKey) || [];
          const today = isToday(day);

          return (
            <Card
              key={dayKey}
              className={today ? "ring-2 ring-teal-200" : dayAppointments.length === 0 ? "opacity-80" : ""}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold capitalize text-slate-900">
                  {format(day, "EEEE, d/MM", { locale: ptBR })}
                  {today && (
                    <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                      Hoje
                    </span>
                  )}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {dayAppointments.length} consulta(s)
                </span>
              </div>

              {dayAppointments.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">Sem consultas</p>
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

function AgendaHeader({
  title,
  subtitle,
  isToday,
}: {
  title: string;
  subtitle: string;
  isToday?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="capitalize text-slate-600">
          {subtitle}
          {isToday && (
            <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
              Hoje
            </span>
          )}
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
  );
}

function ViewTabs({ active }: { active: "hoje" | "semana" }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      <Link
        href="/agenda?view=hoje"
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          active === "hoje"
            ? "bg-teal-600 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Hoje
      </Link>
      <Link
        href="/agenda?view=semana"
        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
          active === "semana"
            ? "bg-teal-600 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        Semana
      </Link>
    </div>
  );
}

function DayNavigation({
  prevHref,
  nextHref,
  currentHref,
  currentLabel,
}: {
  prevHref: string;
  nextHref: string;
  currentHref: string;
  currentLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href={prevHref}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Link>
      <Link
        href={currentHref}
        className="text-sm font-medium text-teal-600 hover:underline"
      >
        {currentLabel}
      </Link>
      <Link
        href={nextHref}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Próximo
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function normalizeAppointments(raw: unknown): AppointmentWithPatient[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const apt = row as AppointmentWithPatient & { patients: unknown };
    return {
      ...apt,
      patients: normalizeRelation(apt.patients) ?? {
        id: "",
        full_name: "Paciente",
        phone: "",
      },
    };
  });
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
