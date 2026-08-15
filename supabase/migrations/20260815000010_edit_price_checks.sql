-- A tela de histórico permite corrigir um registro sem precisar apagá-lo e
-- cadastrá-lo novamente. O escopo continua sendo o item/lista do workspace.
grant update on price_checks to authenticated;

create policy "Participante edita preços" on price_checks
  for update to authenticated
  using (private.can_access_item(item_id))
  with check (private.can_access_item(item_id));
