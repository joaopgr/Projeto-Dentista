import { createClient } from "@/lib/supabase/server";

export type AppointmentRespondResult =
  | {
      ok: true;
      status: string;
      patientName: string;
      scheduledAt: string;
      procedureType: string | null;
    }
  | {
      ok: false;
      error: "not_found" | "already_final" | "invalid_action" | "rpc_error";
      status?: string;
      patientName?: string;
      scheduledAt?: string;
    };

export async function respondToAppointmentByToken(
  token: string,
  action: "confirm" | "cancel"
): Promise<AppointmentRespondResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("appointment_respond_by_token", {
    p_token: token,
    p_action: action,
  });

  if (error || !data) {
    return { ok: false, error: "rpc_error" };
  }

  const result = data as {
    ok: boolean;
    error?: string;
    status?: string;
    patient_name?: string;
    scheduled_at?: string;
    procedure_type?: string | null;
  };

  if (!result.ok) {
    const err = result.error;
    if (err === "not_found" || err === "already_final" || err === "invalid_action") {
      return {
        ok: false,
        error: err,
        status: result.status,
        patientName: result.patient_name,
        scheduledAt: result.scheduled_at,
      };
    }
    return { ok: false, error: "rpc_error" };
  }

  return {
    ok: true,
    status: result.status!,
    patientName: result.patient_name!,
    scheduledAt: result.scheduled_at!,
    procedureType: result.procedure_type ?? null,
  };
}
