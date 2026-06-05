import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionToken,
} from "@/lib/client-session";
import { getPortalData } from "@/lib/portal/data";
import { ClientPortalView } from "@/components/portal/client-portal-view";
import { ClientSignOutButton } from "@/components/portal/client-sign-out-button";

function PortalLoadError() {
  return (
    <div className="alert-banner p-8 text-center">
      <p className="font-medium text-amber-900">
        Não foi possível carregar seus dados.
      </p>
      <p className="mt-2 text-sm text-amber-800">
        Saia e entre novamente. Se o problema continuar, a clínica precisa
        executar a migração <strong>004_client_portal.sql</strong> no Supabase.
      </p>
      <div className="mt-4 flex justify-center">
        <ClientSignOutButton />
      </div>
    </div>
  );
}

export default async function PortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  const session = token ? await verifyClientSessionToken(token) : null;

  if (!session) {
    return <PortalLoadError />;
  }

  const data = await getPortalData(session.patientId, session.cpf);

  if (!data?.patient?.full_name) {
    return <PortalLoadError />;
  }

  return (
    <ClientPortalView
      patient={data.patient}
      upcomingAppointments={data.upcomingAppointments}
      pastAppointments={data.pastAppointments}
      payments={data.payments}
    />
  );
}
