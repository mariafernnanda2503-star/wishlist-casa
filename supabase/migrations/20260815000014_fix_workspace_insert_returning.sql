-- Criar workspace pela tela devolvia 403.
--
-- `insert ... returning` — que é o que o PostgREST faz quando o cliente encadeia
-- `.select()` — também avalia a policy de SELECT na linha devolvida. A de
-- `workspaces` exigia ser participante, mas a inscrição como dono vem de um
-- trigger `AFTER INSERT`: a função `is_workspace_member` é `stable` e não
-- enxerga, no mesmo statement, a linha que o trigger acabou de inserir.
--
-- Sem `returning` o insert passava; com, falhava. Daí o erro só aparecer pela
-- interface e não nos testes que eu tinha feito em SQL.
--
-- A saída é reconhecer quem criou como leitor legítimo, o que é verdade
-- independentemente da tabela de participantes.

drop policy if exists "Participante lê workspace" on workspaces;

create policy "Participante lê workspace" on workspaces
  for select to authenticated
  using (private.is_workspace_member(id) or created_by = (select auth.uid()));
