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

export async function authenticateClientByCpf(
  cpfInput: string,
  cpfPassword: string
): Promise<{ patientId: string } | { error: string }> {
  const cpf = cpfInput.replace(/\D/g, "");
  const password = cpfPassword.replace(/\D/g, "");

  if (cpf.length !== 11) {
    return { error: "Informe um CPF válido com 11 dígitos." };
  }

  if (cpf !== password) {
    return { error: "CPF e senha não conferem." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Portal do cliente indisponível. Contate a clínica." };
  }

  const { data: patient, error } = await admin
    .from("patients")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();

  if (error || !patient) {
    return {
      error:
        "CPF não encontrado. Verifique se está cadastrado na clínica ou contate o consultório.",
    };
  }

  return { patientId: patient.id };
}

export async function getPortalData(patientId: string): Promise<PortalData | null> {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }

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

  const now = new Date();
  const allAppointments = appointments || [];
  const upcomingAppointments = allAppointments
    .filter(
      (a) =>
        new Date(a.scheduled_at) >= now &&
        !["cancelled", "no_show"].includes(a.status)
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

  const pastAppointments = allAppointments.filter(
    (a) =>
      new Date(a.scheduled_at) < now ||
      ["completed", "cancelled", "no_show"].includes(a.status)
  );

  return {
    patient,
    upcomingAppointments,
    pastAppointments,
    payments: (payments || []) as PortalPayment[],
  };
}
