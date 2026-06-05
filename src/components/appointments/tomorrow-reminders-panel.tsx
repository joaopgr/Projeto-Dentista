"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Copy, MessageCircle } from "lucide-react";
import {
  buildReminderMessage,
  buildWhatsAppUrl,
} from "@/lib/appointment-reminders";
import type { ReminderAppointment } from "@/lib/appointments/tomorrow-reminders";

export function TomorrowRemindersPanel({
  appointments,
  appUrl,
}: {
  appointments: ReminderAppointment[];
  appUrl: string;
}) {
  if (!appointments.length) return null;

  const tomorrowLabel = format(addDays(new Date(), 1), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  });

  const pending = appointments.filter((a) => !a.reminder_sent_at);

  return (
    <div className="rounded-[1.75rem] border border-amber-200/50 bg-gradient-to-br from-amber-50/90 via-white to-white p-6 shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Lembretes para amanhã</h2>
          <p className="text-sm capitalize text-slate-600">{tomorrowLabel}</p>
          <p className="mt-1 text-xs text-slate-500">
            Copie a mensagem ou abra o WhatsApp. O paciente confirma ou cancela pelo link.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-semibold text-amber-900 shadow-sm">
            {pending.length} pendente(s)
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {appointments.map((apt) => (
          <ReminderRow key={apt.id} appointment={apt} appUrl={appUrl} />
        ))}
      </ul>
    </div>
  );
}

function ReminderRow({
  appointment,
  appUrl,
}: {
  appointment: ReminderAppointment;
  appUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sent, setSent] = useState(!!appointment.reminder_sent_at);

  const message = buildReminderMessage(appointment, appUrl);
  const whatsappUrl = buildWhatsAppUrl(appointment.patients.phone, message);
  const time = format(new Date(appointment.scheduled_at), "HH:mm");

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkSent() {
    setMarking(true);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/reminder-sent`, {
        method: "POST",
      });
      if (res.ok) setSent(true);
    } finally {
      setMarking(false);
    }
  }

  return (
    <li
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        sent
          ? "border-teal-200/60 bg-teal-50/50 shadow-sm"
          : "border-slate-200/50 bg-white/80 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {appointment.patients.full_name}
          </p>
          <p className="text-sm text-slate-600">
            {time} · {appointment.procedure_type || "Consulta"}
          </p>
          {sent && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-teal-700">
              <Check className="h-3.5 w-3.5" />
              Lembrete enviado
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="btn-ghost px-3 py-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (!sent) void handleMarkSent();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[#25D366]/30 transition hover:bg-[#20bd5a] hover:shadow-lg"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          {!sent && (
            <button
              type="button"
              onClick={handleMarkSent}
              disabled={marking}
              className="btn-soft px-3 py-2 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {marking ? "..." : "Marcar enviado"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
