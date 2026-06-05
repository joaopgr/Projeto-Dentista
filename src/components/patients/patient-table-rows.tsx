"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCPF, formatPhone } from "@/lib/utils";
import type { Patient } from "@/types/database";

export function PatientTableRows({ patients }: { patients: Patient[] }) {
  const router = useRouter();

  return (
    <>
      {patients.map((patient) => (
        <tr
          key={patient.id}
          className="cursor-pointer hover:bg-slate-50"
          onClick={() => router.push(`/pacientes/${patient.id}`)}
        >
          <td className="px-4 py-3 font-medium text-slate-900">
            {patient.full_name}
          </td>
          <td className="px-4 py-3 text-slate-600">
            {formatPhone(patient.phone)}
          </td>
          <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
            {patient.email || "—"}
          </td>
          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
            {patient.cpf ? formatCPF(patient.cpf) : "—"}
          </td>
          <td className="px-4 py-3 text-right">
            <Link
              href={`/pacientes/${patient.id}`}
              className="text-sm font-medium text-teal-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Ver / Editar
            </Link>
          </td>
        </tr>
      ))}
    </>
  );
}
