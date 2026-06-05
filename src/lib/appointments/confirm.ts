import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function mapRpcResult(data: {
  ok: boolean;
  error?: string;
  status?: string;
  patient_name?: string;
  scheduled_at?: string;
  procedure_type?: string | null;
}): AppointmentRespondResult {
  if (!data.ok) {
    const err = data.error;
    if (err === "not_found" || err === "already_final" || err === "invalid_action") {
      return {
        ok: false,
        error: err,
        status: data.status,
        patientName: data.patient_name,
        scheduledAt: data.scheduled_at,
      };
    }
    return { ok: false, error: "rpc_error" };
  }

  return {
    ok: true,
    status: data.status!,
    patientName: data.patient_name!,
    scheduledAt: data.scheduled_at!,
    procedureType: data.procedure_type ?? null,
  };
}

async function respondViaAdmin(
  token: string,
  action: "confirm" | "cancel"
): Promise<AppointmentRespondResult | null> {
  try {
    const admin = createAdminClient();
    const { data: apt, error } = await admin
      .from("appointments")
      .select("id, status, scheduled_at, procedure_type, patients(full_name)")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (error || !apt) return null;

    const patient = Array.isArray(apt.patients)
      ? apt.patients[0]
      : apt.patients;
    const patientName =
      (patient as { full_name?: string } | null)?.full_name ?? "Paciente";

    if (["completed", "cancelled", "no_show"].includes(apt.status)) {
      return {
        ok: false,
        error: "already_final",
        status: apt.status,
        patientName,
        scheduledAt: apt.scheduled_at,
      };
    }

    const newStatus = action === "cancel" ? "cancelled" : "confirmed";

    const { error: updateError } = await admin
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", apt.id);

    if (updateError) return null;

    return {
      ok: true,
      status: newStatus,
      patientName,
      scheduledAt: apt.scheduled_at,
      procedureType: apt.procedure_type,
    };
  } catch {
    return null;
  }
}

export async function respondToAppointmentByToken(
  token: string,
  action: "confirm" | "cancel"
): Promise<AppointmentRespondResult> {
  if (!UUID_RE.test(token)) {
    return { ok: false, error: "not_found" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("appointment_respond_by_token", {
    p_token: token,
    p_action: action,
  });

  if (!error && data) {
    return mapRpcResult(
      data as {
        ok: boolean;
        error?: string;
        status?: string;
        patient_name?: string;
        scheduled_at?: string;
        procedure_type?: string | null;
      }
    );
  }

  const viaAdmin = await respondViaAdmin(token, action);
  if (viaAdmin) return viaAdmin;

  return { ok: false, error: "rpc_error" };
}
