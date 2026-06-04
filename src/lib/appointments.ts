import { addHours, endOfDay, startOfDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { combineDateAndTime } from "@/lib/utils";
import { formatDurationMinutes } from "@/types/database";

export type AppointmentSlot = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  patients?: { full_name: string } | null;
};

function getEndTime(scheduledAt: string, durationMinutes: number): Date {
  return new Date(
    new Date(scheduledAt).getTime() + durationMinutes * 60 * 1000
  );
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function formatConflictMessage(conflict: AppointmentSlot): string {
  const start = new Date(conflict.scheduled_at);
  const end = getEndTime(conflict.scheduled_at, conflict.duration_minutes);
  const patient = conflict.patients?.full_name ?? "outro paciente";
  const startStr = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Horário ocupado: ${patient} já está agendado das ${startStr} às ${endStr} (${formatDurationMinutes(conflict.duration_minutes)}).`;
}

export async function checkAppointmentConflict(
  supabase: SupabaseClient,
  params: {
    date: string;
    time: string;
    durationMinutes: number;
    excludeId?: string;
  }
): Promise<{ conflict: AppointmentSlot | null; error?: string }> {
  const slotStart = new Date(combineDateAndTime(params.date, params.time));
  const slotEnd = getEndTime(slotStart.toISOString(), params.durationMinutes);

  const searchStart = addHours(startOfDay(slotStart), -6);
  const searchEnd = endOfDay(slotStart);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, patients(full_name)")
    .neq("status", "cancelled")
    .gte("scheduled_at", searchStart.toISOString())
    .lte("scheduled_at", searchEnd.toISOString());

  if (error) {
    return { conflict: null, error: "Erro ao verificar disponibilidade." };
  }

  for (const row of data ?? []) {
    const apt: AppointmentSlot = {
      id: row.id,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      status: row.status,
      patients: Array.isArray(row.patients) ? row.patients[0] : row.patients,
    };

    if (params.excludeId && apt.id === params.excludeId) continue;

    const existStart = new Date(apt.scheduled_at);
    const existEnd = getEndTime(apt.scheduled_at, apt.duration_minutes);

    if (overlaps(slotStart, slotEnd, existStart, existEnd)) {
      return { conflict: apt };
    }
  }

  return { conflict: null };
}
