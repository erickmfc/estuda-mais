# P1 — Hospedagem e banco em nuvem

## Arquitetura publicada

```text
Expo / React Native Web → Vercel → Supabase Auth + PostgreSQL
```

O enunciado permite escolher os provedores. O Estuda+ usa Supabase em vez de
Render + MongoDB porque o projeto já possui autenticação, API REST, PostgreSQL
e políticas RLS integradas no mesmo serviço.

## Frontend

- URL pública: https://estuda-mais-mauve.vercel.app/
- Build: `npx expo export --platform web`
- Saída: `dist`
- Configuração versionada em `vercel.json`.
- Repositório: https://github.com/erickmfc/estuda-mais
 
O deploy é feito pela integração do repositório GitHub com a Vercel. Cada
alteração na branch `main` pode gerar uma nova publicação.

### Referência visual do login

O layout visual inicial da tela de login foi inspirado no CodePen **Animated
Login Form - CSS**, de Vincent Van Goggles:

https://codepen.io/Gogh/pen/gOqVqBx

O Estuda+ adaptou a ideia dos anéis animados e a composição visual para o
próprio fluxo de autenticação com Supabase.

## Banco de dados e autenticação

O banco está no Supabase/PostgreSQL. O schema está em `supabase/schema.sql` e
cria as tabelas de disciplinas, faltas, lembretes, atividades, estágio, dias de
estágio e preferências de clima.

As tabelas têm RLS habilitado e as políticas restringem os registros ao usuário
autenticado. O cliente usa somente `EXPO_PUBLIC_SUPABASE_URL` e a chave pública.
Nunca publicar `service_role`, `sb_secret` ou o arquivo `.env`.

Variáveis configuradas no ambiente da Vercel:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave-publica>
```

## Checklist da P1

- [x] Projeto no GitHub.
- [x] Frontend publicado em URL pública.
- [x] Banco de dados em nuvem.
- [x] Autenticação em nuvem.
- [x] Persistência de dados implementada.
- [x] Políticas RLS por usuário.
- [x] Tratamento de erros nas operações do app.
- [x] Layout responsivo para web e celular.
- [x] Health check automático em `.github/workflows/health-check.yml`.
- [x] Teste de gravação autenticada com uma conta de avaliação.

Validação realizada em 16/09/2026 pelo Chrome na URL pública: foi criado o
lembrete `P1 - teste de persistência no Supabase`. O registro apareceu na lista
e permaneceu visível após recarregar a página, confirmando leitura e gravação
autenticadas no Supabase.
