import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BRAND } from "@/lib/branding";
import type { AppointmentWithPatient } from "@/types/database";

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getConfirmUrl(token: string): string {
  return `${getAppBaseUrl()}/c/${token}`;
}

export function getCancelUrl(token: string): string {
  return `${getAppBaseUrl()}/c/${token}?acao=cancelar`;
}

export function phoneToWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `55${digits}`;
  if (digits.length === 13 && digits.startsWith("55")) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phoneToWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildReminderMessage(
  appointment: Pick<
    AppointmentWithPatient,
    "scheduled_at" | "procedure_type" | "confirmation_token"
  > & {
    patients: Pick<AppointmentWithPatient["patients"], "full_name">;
  }
): string {
  const token = appointment.confirmation_token;
  const date = format(new Date(appointment.scheduled_at), "dd/MM/yyyy", {
    locale: ptBR,
  });
  const time = format(new Date(appointment.scheduled_at), "HH:mm", {
    locale: ptBR,
  });
  const procedure = appointment.procedure_type || "Consulta";

  return (
    `Olá, ${appointment.patients.full_name}! 👋\n\n` +
    `Lembrete da *${BRAND.name}*:\n` +
    `Você tem *${procedure}* agendada para *${date}* às *${time}*.\n\n` +
    `Por favor, confirme ou cancele:\n` +
    `✅ Confirmar: ${getConfirmUrl(token)}\n` +
    `❌ Cancelar: ${getCancelUrl(token)}\n\n` +
    `${BRAND.tagline}`
  );
}
