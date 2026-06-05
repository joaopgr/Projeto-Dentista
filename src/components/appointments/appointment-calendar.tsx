"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Plus } from "lucide-react";
import {
  APPOINTMENT_BLOCK_STYLES,
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatAppointmentRange,
  getAppointmentPosition,
  getFreeSlotsForDay,
  getHourLabels,
  getWeekDays,
} from "@/lib/appointments/calendar";
import { cn } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_LABELS,
  formatDurationMinutes,
  type AppointmentWithPatient,
} from "@/types/database";

const HOUR_HEIGHT = 56;
const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

export function AppointmentCalendar({
  weekStart,
  appointments,
}: {
  weekStart: string;
  appointments: AppointmentWithPatient[];
}) {
  const router = useRouter();
  const weekStartDate = new Date(weekStart + "T12:00:00");
  const days = getWeekDays(weekStartDate);
  const hourLabels = getHourLabels();

  const activeAppointments = appointments.filter((a) => a.status !== "cancelled");

  function appointmentsForDay(dayKey: string) {
    return activeAppointments.filter(
      (a) => format(new Date(a.scheduled_at), "yyyy-MM-dd") === dayKey
    );
  }

  function handleEmptySlotClick(dayKey: string, hour: number) {
    const time = `${String(hour).padStart(2, "0")}:00`;
    router.push(`/agenda/novo?data=${dayKey}&hora=${time}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Legenda:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-100 ring-1 ring-slate-200" />
          Livre
        </span>
        {Object.entries(APPOINTMENT_STATUS_LABELS)
          .filter(([key]) => key !== "cancelled")
          .map(([key, label]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "h-3 w-3 rounded-full border",
                  APPOINTMENT_BLOCK_STYLES[key]?.split(" ").slice(0, 2).join(" ") ||
                    "bg-slate-400"
                )}
              />
              {label}
            </span>
          ))}
      </div>

      <div className="data-table overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-slate-200/80 bg-slate-50/80">
            <div className="p-2" />
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const today = isToday(day);
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "border-l border-slate-200/60 px-2 py-3 text-center",
                    today && "bg-teal-50/60"
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-lg font-bold",
                      today ? "text-teal-700" : "text-slate-900"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grade horária */}
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
            {/* Coluna de horas */}
            <div className="relative" style={{ height: GRID_HEIGHT }}>
              {hourLabels.map((label, i) => (
                <div
                  key={label}
                  className="absolute right-2 -translate-y-1/2 text-xs font-medium text-slate-400"
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayAppts = appointmentsForDay(dayKey);
              const today = isToday(day);

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "relative border-l border-slate-200/60",
                    today && "bg-teal-50/20"
                  )}
                  style={{ height: GRID_HEIGHT }}
                >
                  {/* Linhas de hora */}
                  {hourLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: i * HOUR_HEIGHT }}
                    />
                  ))}
                  <div
                    className="absolute bottom-0 left-0 right-0 border-t border-slate-200/80"
                  />

                  {/* Slots vazios clicáveis (por hora) */}
                  {hourLabels.map((_, i) => (
                    <button
                      key={`slot-${i}`}
                      type="button"
                      title={`Agendar às ${format(new Date(2000, 0, 1, CALENDAR_START_HOUR + i, 0), "HH:mm")}`}
                      className="absolute left-0 right-0 z-0 opacity-0 transition hover:bg-teal-100/30 hover:opacity-100"
                      style={{
                        top: i * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                      }}
                      onClick={() =>
                        handleEmptySlotClick(
                          dayKey,
                          CALENDAR_START_HOUR + i
                        )
                      }
                    />
                  ))}

                  {/* Blocos de consulta */}
                  {dayAppts.map((apt) => {
                    const { topPercent, heightPercent } = getAppointmentPosition(
                      apt.scheduled_at,
                      apt.duration_minutes
                    );
                    const range = formatAppointmentRange(
                      apt.scheduled_at,
                      apt.duration_minutes
                    );

                    return (
                      <Link
                        key={apt.id}
                        href={`/agenda/${apt.id}`}
                        className={cn(
                          "absolute left-1 right-1 z-10 overflow-hidden rounded-xl border px-2 py-1.5 text-xs shadow-md transition hover:brightness-110 hover:shadow-lg",
                          APPOINTMENT_BLOCK_STYLES[apt.status] ||
                            "bg-slate-500 text-white"
                        )}
                        style={{
                          top: `${topPercent}%`,
                          height: `${heightPercent}%`,
                          minHeight: "2.5rem",
                        }}
                        title={`${apt.patients.full_name}: ${range}`}
                      >
                        <p className="truncate font-bold leading-tight">
                          {range}
                        </p>
                        <p className="truncate font-semibold leading-tight opacity-95">
                          {apt.patients.full_name}
                        </p>
                        <p className="truncate opacity-80">
                          {formatDurationMinutes(apt.duration_minutes)}
                          {apt.procedure_type ? ` · ${apt.procedure_type}` : ""}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Passe o mouse sobre um horário vazio e clique para agendar. Cada bloco
        mostra o intervalo completo — ex.: 08:00 – 12:00 significa ocupado até
        meio-dia.
      </p>

      <FreeSlotsSummary days={days} appointments={activeAppointments} />
    </div>
  );
}

function FreeSlotsSummary({
  days,
  appointments,
}: {
  days: Date[];
  appointments: AppointmentWithPatient[];
}) {
  const daysWithInfo = days.map((day) => ({
    day,
    dayKey: format(day, "yyyy-MM-dd"),
    free: getFreeSlotsForDay(day, appointments),
    occupied: appointments.filter(
      (a) => format(new Date(a.scheduled_at), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    ),
  }));

  const hasAnyOccupied = daysWithInfo.some((d) => d.occupied.length > 0);

  if (!hasAnyOccupied) return null;

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-teal-600" />
        <h2 className="font-semibold text-slate-900">Horários livres da semana</h2>
      </div>
      <p className="text-sm text-slate-500">
        Intervalos disponíveis entre {CALENDAR_START_HOUR}:00 e {CALENDAR_END_HOUR}:00,
        já descontando as consultas agendadas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {daysWithInfo.map(({ day, dayKey, free, occupied }) => {
          if (occupied.length === 0 && free.length === 1 && free[0].start === `${String(CALENDAR_START_HOUR).padStart(2, "0")}:00`) {
            return (
              <div
                key={dayKey}
                className="rounded-[1.25rem] border border-emerald-200/60 bg-emerald-50/50 p-3"
              >
                <p className="font-medium capitalize text-slate-900">
                  {format(day, "EEEE, d/MM", { locale: ptBR })}
                  {isToday(day) && (
                    <span className="ml-1 text-xs text-teal-600">(hoje)</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Dia inteiro livre ({free[0].label})
                </p>
                <Link
                  href={`/agenda/novo?data=${dayKey}&hora=08:00`}
                  className="btn-soft mt-2 px-3 py-1.5 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Agendar
                </Link>
              </div>
            );
          }

          if (occupied.length === 0) return null;

          return (
            <div
              key={dayKey}
              className="rounded-[1.25rem] border border-slate-200/60 bg-slate-50/40 p-3"
            >
              <p className="font-medium capitalize text-slate-900">
                {format(day, "EEEE, d/MM", { locale: ptBR })}
                {isToday(day) && (
                  <span className="ml-1 text-xs text-teal-600">(hoje)</span>
                )}
              </p>
              {free.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Sem intervalos livres</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {free.map((slot) => (
                    <li key={slot.label}>
                      <Link
                        href={`/agenda/novo?data=${dayKey}&hora=${slot.start}`}
                        className="text-sm font-medium text-teal-700 hover:underline"
                      >
                        Livre: {slot.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 border-t border-slate-200/60 pt-2">
                <p className="text-xs font-medium text-slate-500">Ocupado:</p>
                <ul className="mt-1 space-y-0.5">
                  {occupied.map((apt) => (
                    <li key={apt.id} className="text-xs text-slate-600">
                      <Link
                        href={`/agenda/${apt.id}`}
                        className="hover:text-teal-700 hover:underline"
                      >
                        {formatAppointmentRange(apt.scheduled_at, apt.duration_minutes)}{" "}
                        — {apt.patients.full_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-white/60 bg-white/90 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      {children}
    </div>
  );
}
