import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Appointment, Patient, Payment, PaymentInstallment } from "@/types/database";

export type PortalPayment = Payment & {
  payment_installments: PaymentInstallment[];
};

export type PortalData = {
  patient: Patient;
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
  payments: PortalPayment[];
};

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

async function loginViaRpc(
  cpf: string,
  password: string
): Promise<{ patientId: string | null; rpcMissing: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("client_portal_login", {
    cpf_input: cpf,
    cpf_password: password,
  });

  if (error) {
    const rpcMissing =
      error.code === "42883" ||
      error.message.includes("client_portal_login") ||
      error.message.includes("Could not find the function");
    return { patientId: null, rpcMissing };
  }

  return { patientId: (data as string | null) ?? null, rpcMissing: false };
}

async function loginViaAdmin(cpf: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data: patient } = await admin
      .from("patients")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();
    return patient?.id ?? null;
  } catch {
    return null;
  }
}

export async function authenticateClientByCpf(
  cpfInput: string,
  cpfPassword: string
): Promise<{ patientId: string; cpf: string } | { error: string }> {
  const cpf = normalizeCpf(cpfInput);
  const password = normalizeCpf(cpfPassword);

  if (cpf.length !== 11) {
    return { error: "Informe um CPF válido com 11 dígitos." };
  }

  if (cpf !== password) {
    return { error: "CPF e senha não conferem." };
  }

  let patientId: string | null = null;
  let rpcMissing = false;

  const rpcResult = await loginViaRpc(cpf, password);
  patientId = rpcResult.patientId;
  rpcMissing = rpcResult.rpcMissing;

  if (!patientId) {
    patientId = await loginViaAdmin(cpf);
  }

  if (!patientId) {
    if (rpcMissing) {
      return {
        error:
          "Portal do cliente não configurado. Execute a migração 004_client_portal.sql no Supabase.",
      };
    }

    return {
      error:
        "CPF não encontrado. Verifique se está cadastrado na clínica ou contate o consultório.",
    };
  }

  return { patientId, cpf };
}

type RpcPortalResponse = {
  patient: Patient;
  appointments: Appointment[];
  payments: PortalPayment[];
};

function splitAppointments(appointments: Appointment[]) {
  const now = new Date();
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        new Date(a.scheduled_at) >= now &&
        !["cancelled", "no_show"].includes(a.status)
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

  const pastAppointments = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) < now ||
      ["completed", "cancelled", "no_show"].includes(a.status)
  );

  return { upcomingAppointments, pastAppointments };
}

async function getPortalDataViaRpc(
  patientId: string,
  cpf: string
): Promise<PortalData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("client_portal_get_data", {
    patient_id: patientId,
    cpf_input: cpf,
  });

  if (error || !data) return null;

  const parsed = data as RpcPortalResponse;
  const { upcomingAppointments, pastAppointments } = splitAppointments(
    parsed.appointments || []
  );

  return {
    patient: parsed.patient,
    upcomingAppointments,
    pastAppointments,
    payments: parsed.payments || [],
  };
}

async function getPortalDataViaAdmin(patientId: string): Promise<PortalData | null> {
  try {
    const admin = createAdminClient();

    const { data: patient } = await admin
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (!patient) return null;

    const { data: appointments } = await admin
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false });

    const { data: payments } = await admin
      .from("payments")
      .select("*, payment_installments(*)")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    const { upcomingAppointments, pastAppointments } = splitAppointments(
      appointments || []
    );

    return {
      patient,
      upcomingAppointments,
      pastAppointments,
      payments: (payments || []) as PortalPayment[],
    };
  } catch {
    return null;
  }
}

export async function getPortalData(
  patientId: string,
  cpf: string
): Promise<PortalData | null> {
  const viaRpc = await getPortalDataViaRpc(patientId, cpf);
  if (viaRpc) return viaRpc;

  return getPortalDataViaAdmin(patientId);
}
