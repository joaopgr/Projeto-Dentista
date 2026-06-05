import { addDays, format } from "date-fns";
import type { AppointmentWithPatient } from "@/types/database";

export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 20;
export const CALENDAR_SLOT_MINUTES = 15;

export function getAppointmentEnd(
  scheduledAt: string,
  durationMinutes: number
): Date {
  return new Date(
    new Date(scheduledAt).getTime() + durationMinutes * 60 * 1000
  );
}

export function formatTimeHHmm(date: Date): string {
  return format(date, "HH:mm");
}

/** Ex.: "08:00 – 12:00" */
export function formatAppointmentRange(
  scheduledAt: string,
  durationMinutes: number
): string {
  const start = new Date(scheduledAt);
  const end = getAppointmentEnd(scheduledAt, durationMinutes);
  return `${formatTimeHHmm(start)} – ${formatTimeHHmm(end)}`;
}

export function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getCalendarTotalMinutes(): number {
  return (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
}

export function getAppointmentPosition(
  scheduledAt: string,
  durationMinutes: number
): { topPercent: number; heightPercent: number } {
  const start = new Date(scheduledAt);
  const startMinutes = getMinutesFromMidnight(start);
  const dayStartMinutes = CALENDAR_START_HOUR * 60;
  const total = getCalendarTotalMinutes();

  const top = Math.max(0, startMinutes - dayStartMinutes);
  const duration = Math.min(durationMinutes, total - top);

  return {
    topPercent: (top / total) * 100,
    heightPercent: Math.max((duration / total) * 100, 2),
  };
}

export function getHourLabels(): string[] {
  return Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
    (_, i) => formatTimeHHmm(new Date(2000, 0, 1, CALENDAR_START_HOUR + i, 0))
  );
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export type FreeSlot = { start: string; end: string; label: string };

export function getFreeSlotsForDay(
  day: Date,
  appointments: AppointmentWithPatient[]
): FreeSlot[] {
  const dayKey = format(day, "yyyy-MM-dd");

  const occupied = appointments
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        format(new Date(a.scheduled_at), "yyyy-MM-dd") === dayKey
    )
    .map((a) => ({
      start: new Date(a.scheduled_at),
      end: getAppointmentEnd(a.scheduled_at, a.duration_minutes),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const dayStart = new Date(day);
  dayStart.setHours(CALENDAR_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(CALENDAR_END_HOUR, 0, 0, 0);

  const free: FreeSlot[] = [];
  let cursor = dayStart;

  for (const block of occupied) {
    const blockStart = block.start < dayStart ? dayStart : block.start;
    const blockEnd = block.end > dayEnd ? dayEnd : block.end;

    if (blockStart > cursor) {
      free.push({
        start: formatTimeHHmm(cursor),
        end: formatTimeHHmm(blockStart),
        label: `${formatTimeHHmm(cursor)} – ${formatTimeHHmm(blockStart)}`,
      });
    }
    if (blockEnd > cursor) cursor = blockEnd;
  }

  if (cursor < dayEnd) {
    free.push({
      start: formatTimeHHmm(cursor),
      end: formatTimeHHmm(dayEnd),
      label: `${formatTimeHHmm(cursor)} – ${formatTimeHHmm(dayEnd)}`,
    });
  }

  return free;
}

export const APPOINTMENT_BLOCK_STYLES: Record<string, string> = {
  scheduled: "bg-blue-500/90 border-blue-600 text-white",
  confirmed: "bg-teal-600/95 border-teal-700 text-white",
  completed: "bg-green-600/85 border-green-700 text-white",
  no_show: "bg-orange-500/90 border-orange-600 text-white",
};
