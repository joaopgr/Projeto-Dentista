"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Shield, User, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCPF } from "@/lib/utils";
import { Button, Card, Input } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type LoginMode = "client" | "staff";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfPassword, setCpfPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStaffSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    await fetch("/api/client/logout", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  async function handleClientSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/client/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf, password: cpfPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "CPF ou senha incorretos.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">OdontoClinic</h1>
          <p className="mt-2 text-teal-200/80">
            Gestão do seu consultório odontológico
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-black/20">
          <h2 className="mb-1 text-xl font-bold text-slate-900">Entrar</h2>
          <p className="mb-4 text-sm text-slate-500">
            {mode === "client"
              ? "Acompanhe suas consultas e pagamentos"
              : "Acesso para dentistas e funcionários"}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("client");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                mode === "client"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <User className="h-4 w-4" />
              Sou Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("staff");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                mode === "staff"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Users className="h-4 w-4" />
              Sou Funcionário
            </button>
          </div>

          {mode === "client" ? (
            <form onSubmit={handleClientSubmit} className="space-y-4">
              <Input
                label="CPF"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="username"
              />
              <Input
                label="Senha (CPF)"
                required
                value={cpfPassword}
                onChange={(e) => setCpfPassword(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="current-password"
              />
              <p className="text-xs text-slate-500">
                Use seu CPF como usuário e senha para acessar.
              </p>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full py-3">
                Acessar área do paciente
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              <Input
                label="Senha"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full py-3">
                Acessar sistema
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
