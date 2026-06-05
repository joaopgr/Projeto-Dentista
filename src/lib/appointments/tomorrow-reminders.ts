import { addDays, endOfDay, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { normalizeRelation } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/types/database";

export type ReminderAppointment = AppointmentWithPatient & {
  confirmation_token: string;
  reminder_sent_at: string | null;
};

/** Consultas agendadas (pendentes de confirmação) para hoje e amanhã. */
export async function fetchReminderAppointments(): Promise<ReminderAppointment[]> {
  const todayStart = startOfDay(new Date());
  const tomorrowEnd = endOfDay(addDays(todayStart, 1));

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name, phone)")
    .gte("scheduled_at", todayStart.toISOString())
    .lte("scheduled_at", tomorrowEnd.toISOString())
    .eq("status", "scheduled")
    .order("scheduled_at", { ascending: true });

  if (!data?.length) return [];

  return data.map((row) => {
    const apt = row as ReminderAppointment & { patients: unknown };
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

/** @deprecated Use fetchReminderAppointments */
export const fetchTomorrowReminders = fetchReminderAppointments;
