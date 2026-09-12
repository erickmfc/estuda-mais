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
  Diretório reservado para uma futura integração com API ou banco de dados.

## Tecnologias

O projeto utiliza:

* React Native;
* Expo;
* JavaScript;
* Git;
* GitHub.

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
