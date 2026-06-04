# Como criar contas dos dentistas

O sistema **não permite cadastro público**. Apenas contas criadas manualmente no Supabase podem entrar.

## 1. Desativar cadastro público no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto
2. Vá em **Authentication** → **Providers** → **Email**
3. **Desative** a opção **Enable Sign Up** (ou "Allow new users to sign up")
4. Salve

Assim, mesmo que alguém tente criar conta pela API, o Supabase bloqueia.

## 2. Criar conta de um dentista

1. No Supabase: **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - **Email:** e-mail do dentista (ex: `dr.joao@clinica.com`)
   - **Password:** senha inicial (o dentista pode trocar depois, se habilitar)
   - Marque **Auto Confirm User** (confirma o e-mail automaticamente)
4. Clique em **Create user**

O trigger do banco cria automaticamente o perfil em `profiles` com o nome padrão "Profissional".

## 3. Personalizar nome e consultório (opcional)

No **SQL Editor**, execute substituindo o e-mail:

```sql
update public.profiles
set
  full_name = 'Dr. João Silva',
  clinic_name = 'Clínica Sorriso'
where id = (
  select id from auth.users where email = 'dr.joao@clinica.com'
);
```

## 4. Criar o segundo dentista

Repita o passo 2 com outro e-mail. Cada dentista terá seus próprios pacientes e agenda (dados isolados por usuário).

## Resumo

| Onde | O quê |
|------|--------|
| Supabase → Auth → Email | Desativar sign up |
| Supabase → Auth → Users | Criar 1–2 usuários manualmente |
| SQL Editor (opcional) | Ajustar nome e nome do consultório |

Não é necessário rodar nenhum script extra além do `schema.sql` que você já executou.
