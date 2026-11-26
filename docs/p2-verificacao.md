# Verificação da P2

Executada em 26/11/2026 no projeto Supabase `erpysbhdajaaniipmxhv`. As consultas de escrita usadas para testar RLS foram feitas dentro de transações revertidas (`ROLLBACK`), sem deixar registros artificiais.

| Verificação | Resultado |
| --- | --- |
| Aluno cria atividade vinculada ao seu orientador | Permitido; aluno leu 1 registro. |
| Orientador cria uma revisão e aluno a consulta | Permitido; aluno leu 1 revisão. |
| Orientador tenta criar atividade como aluno | Negado por RLS (`42501`). |
| Aluno tenta criar revisão | Negado por RLS (`42501`). |
| Aluno tenta promover seu perfil a orientador | Negado por falta de privilégio `UPDATE` (`42501`). |
| Acesso anônimo pela API REST | HTTP 401, privilégio de consulta negado. |
| Token inválido pela API REST | HTTP 401, `PGRST301`. |
| `absence_records` e três tabelas P2 | RLS ativada. |
| Expo Doctor | 21/21 verificações aprovadas. |
| Exportação web e Android | Compilação dos bundles concluída. |

## Testes restantes no dispositivo

É necessário abrir o app em um celular ou emulador com biometria e com as duas contas de teste para observar o prompt nativo, a notificação local, a alternância entre usuários e o ciclo de desconectar e reconectar. Este ambiente não tinha `adb` ou emulador instalado e as senhas das contas existentes não foram fornecidas. Os testes de banco acima verificam as permissões, mas não substituem essa demonstração.

## Dependências

`npm audit fix` eliminou o alerta crítico de `shell-quote`. Restam três alertas moderados ligados a `minimatch` dentro da cadeia de ferramentas do Expo. O comando sugere trocar o Expo 57 por Expo 52 para eliminá-los, o que quebraria a compatibilidade do projeto. Nenhum segredo foi adicionado ao repositório.
