# Projeto Dentista — OdontoClinic

Sistema web gratuito para gestão de consultório odontológico: login de dentistas, cadastro de pacientes e agenda de atendimentos.

**Stack:** Next.js 15 · Supabase (auth + banco) · Vercel (hospedagem) · GitHub (código)

Repositório: [github.com/joaopgr/Projeto-Dentista](https://github.com/joaopgr/Projeto-Dentista)

---

## Arquitetura (importante)

**Não é necessário separar front-end e back-end na Vercel.**

| Parte | Onde roda | Função |
|-------|-----------|--------|
| **Front-end + rotas** | Vercel (1 deploy) | Interface, páginas, login |
| **Back-end** | Supabase (grátis) | Banco PostgreSQL, autenticação, segurança |

O Next.js na Vercel se comunica diretamente com o Supabase. Você faz **apenas 1 projeto na Vercel** e aponta as variáveis de ambiente do Supabase. Pronto.

---

## Acesso — apenas dentistas autorizados

Não há cadastro público. Contas são criadas manualmente no Supabase.

Guia completo: [`supabase/CRIAR-DENTISTAS.md`](supabase/CRIAR-DENTISTAS.md)

Resumo rápido:
1. Supabase → **Authentication** → **Providers** → **Email** → desativar **Enable Sign Up**
2. Supabase → **Authentication** → **Users** → **Add user** → criar e-mail e senha de cada dentista

---

## Funcionalidades

- Login exclusivo para dentistas
- Cadastro e busca de pacientes
- Agenda semanal com agendamentos
- Painel com resumo do dia
- Interface responsiva (celular e desktop)

---

## Configuração local

### Pré-requisito

Node.js LTS — [nodejs.org](https://nodejs.org)

### Comandos

```bash
npm install
copy .env.example .env.local
# Edite .env.local com URL e anon key do Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

### Banco de dados

Execute `supabase/schema.sql` no **SQL Editor** do Supabase (se ainda não executou).

---

## Deploy na Vercel (1 projeto só)

1. Acesse [vercel.com](https://vercel.com) → login com GitHub
2. **Add New Project** → importe `joaopgr/Projeto-Dentista`
3. Framework: **Next.js** (detectado automaticamente)
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://rnekgtijxmwwuutbajex.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon public
5. Clique em **Deploy**

### Configurar URL no Supabase

**Authentication** → **URL Configuration**

- **Site URL:** `https://sua-url.vercel.app`
- **Redirect URLs:** `https://sua-url.vercel.app/**`

---

## Estrutura do projeto

```
src/app/
├── page.tsx              → Página inicial
├── login/                → Login dos dentistas
└── (dashboard)/
    ├── dashboard/        → Painel
    ├── pacientes/        → CRUD pacientes
    └── agenda/           → Agendamentos
supabase/
├── schema.sql            → Script do banco
└── CRIAR-DENTISTAS.md    → Como criar contas
```

---

## Plano gratuito

| Serviço | Plano free |
|---------|------------|
| Supabase | 500 MB banco, auth |
| Vercel | Deploy ilimitado |
| GitHub | Repositórios públicos |

Suficiente para um consultório com 1–2 dentistas.
