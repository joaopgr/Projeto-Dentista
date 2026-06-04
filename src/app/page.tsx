import Link from "next/link";
import { Calendar, Shield, Users, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-primary-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-800">OdontoClinic</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Gestão simples para seu{" "}
            <span className="text-teal-600">consultório odontológico</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Cadastre pacientes, organize sua agenda e acompanhe atendimentos em
            um só lugar. Acesso exclusivo para profissionais autorizados.
          </p>
          <div className="mt-10">
            <Link
              href="/login"
              className="rounded-xl bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/25 hover:bg-teal-700"
            >
              Acessar o sistema
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Cadastro de Pacientes"
            description="Registre dados completos dos pacientes de forma rápida e organizada."
          />
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Agenda Online"
            description="Marque consultas, visualize o dia e controle status dos atendimentos."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Acesso Seguro"
            description="Login protegido apenas para dentistas autorizados do consultório."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
