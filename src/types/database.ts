export type Profile = {
  id: string;
  full_name: string;
  clinic_name: string | null;
  created_at: string;
};

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  procedure_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentWithPatient = Appointment & {
  patients: Pick<Patient, "id" | "full_name" | "phone">;
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Faltou",
};

export const PROCEDURE_TYPES = [
  "Consulta",
  "Limpeza",
  "Restauração",
  "Canal",
  "Extração",
  "Clareamento",
  "Ortodontia",
  "Implante",
  "Prótese",
  "Avaliação",
  "Retorno",
  "Outro",
] as const;

export type Material = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string;
  min_quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const MATERIAL_UNITS = [
  { value: "un", label: "Unidade" },
  { value: "cx", label: "Caixa" },
  { value: "pct", label: "Pacote" },
  { value: "ml", label: "ml" },
  { value: "g", label: "g" },
  { value: "par", label: "Par" },
] as const;

export const MATERIAL_CATEGORIES = [
  "Anestésicos",
  "Descartáveis",
  "Restauradores",
  "Endodontia",
  "Próteses",
  "Ortodontia",
  "Instrumentos",
  "Higiene",
  "Medicamentos",
  "Outros",
] as const;

export function getUnitLabel(unit: string): string {
  return MATERIAL_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

export function isLowStock(material: Pick<Material, "quantity" | "min_quantity">): boolean {
  return material.min_quantity > 0 && material.quantity <= material.min_quantity;
}
