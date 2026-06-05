import { addDays, startOfDay, endOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { normalizeRelation } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/types/database";

export type ReminderAppointment = AppointmentWithPatient & {
  confirmation_token: string;
  reminder_sent_at: string | null;
};

export async function fetchTomorrowReminders(): Promise<ReminderAppointment[]> {
  const tomorrow = addDays(startOfDay(new Date()), 1);
  const dayStart = startOfDay(tomorrow);
  const dayEnd = endOfDay(tomorrow);

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name, phone)")
    .gte("scheduled_at", dayStart.toISOString())
    .lte("scheduled_at", dayEnd.toISOString())
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
