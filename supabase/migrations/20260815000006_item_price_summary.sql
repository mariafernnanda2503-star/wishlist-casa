-- Resumo de preço por item, para os totais da lista.
--
-- Sem isto, somar o valor da lista exigiria carregar todo o histórico de todos
-- os itens no cliente só para pegar dois números por item.

create view item_price_summary
-- `security_invoker` faz a view respeitar a RLS de quem consulta, em vez de
-- rodar com os privilégios de quem a criou. Sem isso ela viraria um contorno
-- das policies de `price_checks`.
with (security_invoker = on) as
select
  item_id,
  (array_agg(price order by checked_at desc))[1] as latest_price,
  min(price) as best_price,
  count(*)::int as check_count
from price_checks
group by item_id;

grant select on item_price_summary to authenticated;
