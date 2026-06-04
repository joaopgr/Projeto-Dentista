import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AppointmentForm,
  AppointmentHeader,
} from "@/components/appointments/appointment-form";
import type { AppointmentWithPatient } from "@/types/database";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, patients(id, full_name, phone)")
    .eq("id", id)
    .single();

  if (!appointment) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AppointmentHeader date={appointment.scheduled_at} />
      <AppointmentForm appointment={appointment as AppointmentWithPatient} />
    </div>
  );
}
