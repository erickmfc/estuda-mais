# Estuda+

O **Estuda+** é um aplicativo pensado para facilitar a organização da rotina acadêmica. A proposta é reunir, em um só lugar, informações que o aluno costuma acompanhar separadamente, como faltas, lembretes e horas de estágio.

## Sobre o projeto

Durante a graduação, é comum precisar consultar diferentes sistemas, anotações e aplicativos para acompanhar a vida acadêmica. Pensando nisso, o Estuda+ foi criado como uma ferramenta complementar ao portal da faculdade, com foco na organização pessoal do estudante.

O aplicativo não substitui os sistemas oficiais da instituição. A ideia é permitir que o próprio aluno registre e acompanhe informações importantes da sua rotina de forma mais simples.

## Público-alvo

Estudantes de graduação que precisam organizar disciplinas, faltas, compromissos acadêmicos e atividades relacionadas ao estágio.

## Objetivo

Centralizar informações importantes da rotina acadêmica e facilitar a visualização do que precisa de atenção.

## Funcionalidades do MVP

Nesta primeira versão, o aplicativo conta com:

* dashboard com resumo de faltas, lembretes e estágio;
* acompanhamento de faltas por disciplina;
* registro de novas faltas;
* calendário mensal com histórico de faltas por disciplina e data;
* criação de lembretes pessoais;
* opção para marcar lembretes como concluídos;
* acompanhamento das horas realizadas no estágio;
* cálculo do percentual de conclusão do estágio;
* histórico dos dias e atividades realizadas;
* cadastro de atividades;
* validação dos dados preenchidos;
* listagem e remoção de registros.

## Estrutura utilizada

A organização inicial do projeto segue a estrutura trabalhada em aula:

* `src/components/ItemLista.js`
  Componente reutilizável responsável pela exibição dos itens da lista.

* `src/screens/CadastroScreen.js`
  Tela responsável pelo formulário, gerenciamento de estado e exibição dos registros utilizando `FlatList`.

* `src/services/`
  Serviços de integração, incluindo clima e autenticação com Supabase.

## Tecnologias

O projeto utiliza:

* React Native;
* Expo;
* JavaScript;
* Git;
* GitHub.
* Supabase Auth e Postgres.

## Configuração do login

O login usa o Supabase Auth. Para ativá-lo localmente:

1. Copie `.env.example` para `.env`.
2. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os dados do seu projeto.
3. Reinicie o Expo depois de salvar o arquivo.

Antes do primeiro cadastro, execute o conteúdo de `supabase/schema.sql` no SQL Editor do projeto. Ele cria as tabelas do aplicativo, libera o Data API para usuários autenticados e ativa as políticas RLS por usuário. Em projetos já em uso, aplique `supabase/migrations/20261030000000_absence_calendar.sql` no SQL Editor para habilitar o histórico e o calendário de faltas. Faltas anteriores à migração continuam no contador, mas não aparecem no calendário porque a data original não foi armazenada.

A chave usada no aplicativo é a chave pública do Supabase. Nunca coloque uma chave `service_role` ou `sb_secret_` no aplicativo.

## Diferencial

O principal diferencial do Estuda+ é reunir informações acadêmicas e pessoais em uma interface simples.

Enquanto o portal da faculdade continua sendo a fonte oficial das informações, o Estuda+ funciona como uma ferramenta de acompanhamento diário, permitindo que cada estudante organize sua rotina de acordo com suas próprias necessidades.

## Status do projeto

O projeto está atualmente em fase de **MVP**, com as principais funcionalidades e interações da primeira versão já implementadas.

Novas funcionalidades e melhorias poderão ser adicionadas conforme o desenvolvimento do aplicativo avançar.

## Como executar o projeto

Primeiro, instale as dependências:

```bash
npm install
```

Depois, inicie o projeto com o Expo:

```bash
npx expo start
```

Com o Expo iniciado, o projeto poderá ser executado no Android, iOS ou navegador.

## Avaliação P2: estágio compartilhado

Na aba **Compart.**, o aluno envia um relato de estágio e o orientador aprova ou rejeita. Os dados ficam no Supabase; as tabelas `p2_profiles`, `p2_submissions` e `p2_reviews` usam RLS para validar as ações no servidor. O aplicativo usa apenas a chave pública do Supabase. O serviço de backend é a API REST do Supabase em `https://erpysbhdajaaniipmxhv.supabase.co/rest/v1/`.

### Preparação

1. Execute `npm install`, copie `.env.example` para `.env` e coloque a URL e a chave pública do projeto Supabase. A chave de serviço **nunca** vai para o app.
2. Execute `supabase/schema.sql` em um projeto novo e depois a migração `supabase/migrations/20261126025145_p2_shared_internship_reviews.sql`. No projeto Supabase vinculado a este repositório, a migração da P2 já foi aplicada.
3. Entre com duas contas de teste confirmadas. No projeto vinculado, `matheusfc777@gmail.com` está como aluno e `nichofyoficial@gmail.com` como orientador. As senhas não ficam no repositório.
4. Para configurar outras contas, um administrador do banco deve inserir o orientador em `p2_profiles` com `role='advisor'` e vincular o aluno por `advisor_id`. O próprio app só permite criar perfil de aluno sem orientador; não permite que o usuário se promova.
5. No Android, use `npx expo start` e abra no Expo Go ou gere um build de desenvolvimento. No iOS, Face ID precisa de um build de desenvolvimento. Configure biometria no aparelho. No navegador, a aba abre sem biometria para permitir inspeção, mas a demonstração do recurso nativo deve ocorrer no celular.

### Demonstração da prova

| Cenário | Passos esperados |
| --- | --- |
| A: fluxo completo | Entre como aluno, abra **Compart.**, cadastre atividade e horas, sincronize; entre como orientador e aprove; volte ao aluno e atualize. O resultado vem do banco. |
| B: segurança | Tente consultar a API sem sessão e tente inserir revisão como aluno ou atividade como orientador. O banco deve negar. |
| C: recurso nativo | Abra **Compart.** no celular, conclua a biometria; saia da aba e repita cancelando ou falhando. O conteúdo só aparece após êxito e com sessão ativa. |
| D: falta de rede | Após entrar e carregar o perfil, desligue a rede, salve uma atividade e veja a atividade marcada **Pendente de envio**. Ligue a rede; **Atualizar e sincronizar** envia o mesmo UUID, sem duplicar. Não recarregue a página do navegador enquanto estiver sem conexão. |
| E: resiliência | Tente horas inválidas, encerre a sessão, e teste a API indisponível. O app deve mostrar erro e manter a fila local para nova tentativa. |

Ao detectar uma nova revisão na consulta periódica, o app solicita permissão e agenda uma notificação local; se a permissão for negada, mostra aviso na tela. A notificação depende de o app consultar a revisão; não é push remoto.

### Evidências de verificação

Os resultados de RLS, API e compilação estão em [`docs/p2-verificacao.md`](docs/p2-verificacao.md). Execute `npm run test:p2` para verificar a fila offline, o reenvio sem duplicação e a preservação de uma nova atividade durante a sincronização. A demonstração de biometria e notificação exige um aparelho ou emulador e duas contas com senhas válidas.
