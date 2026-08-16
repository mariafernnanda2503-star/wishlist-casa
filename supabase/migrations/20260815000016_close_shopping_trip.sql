-- Fechar a ida ao mercado.
--
-- São quatro escritas que precisam valer juntas: criar a ida, congelar as
-- linhas, alimentar o histórico de preço e devolver a lista ao estado inicial.
-- Feito no cliente, uma falha no meio deixaria lista zerada sem histórico — ou
-- histórico sem lista zerada. Por isso uma função só, numa transação.

/**
 * @param p_lines Linhas conferidas na saída do mercado, em JSON:
 *   `[{ "item_id": uuid|null, "name": text, "quantity": num, "unit": text|null,
 *      "unit_price": num|null }]`
 *   `item_id` nulo é avulso — o que se comprou sem estar na lista.
 */
create or replace function public.close_shopping_trip(
  p_list_id uuid,
  p_store text,
  p_shopped_at timestamptz,
  p_note text,
  p_lines jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_trip_id uuid;
  v_kind text;
begin
  select kind into v_kind from public.lists where id = p_list_id;

  if v_kind is null then
    raise exception 'Lista não encontrada' using errcode = '22023';
  end if;

  if v_kind <> 'shopping' then
    raise exception 'Só lista de compras pode ser fechada' using errcode = '22023';
  end if;

  -- `security invoker`: a RLS de cada tabela continua valendo, então quem não
  -- participa do espaço não fecha compra nenhuma.
  insert into public.shopping_trips (list_id, store, shopped_at, note)
  values (p_list_id, nullif(trim(coalesce(p_store, '')), ''), coalesce(p_shopped_at, now()), p_note)
  returning id into v_trip_id;

  insert into public.shopping_trip_items (trip_id, item_id, name, quantity, unit, unit_price)
  select
    v_trip_id,
    (line ->> 'item_id')::uuid,
    line ->> 'name',
    coalesce((line ->> 'quantity')::numeric, 1),
    line ->> 'unit',
    (line ->> 'unit_price')::numeric
  from jsonb_array_elements(p_lines) as line
  where coalesce(trim(line ->> 'name'), '') <> '';

  -- O que dá diferencial: cada linha com preço vira observação no histórico do
  -- item, com a loja e a data da ida. É daí que sai "arroz custou R$ 24,90 no
  -- Assaí e R$ 28,50 no Carrefour".
  insert into public.price_checks (item_id, price, store, source, checked_at)
  select
    (line ->> 'item_id')::uuid,
    (line ->> 'unit_price')::numeric,
    nullif(trim(coalesce(p_store, '')), ''),
    'manual',
    coalesce(p_shopped_at, now())
  from jsonb_array_elements(p_lines) as line
  where (line ->> 'item_id') is not null
    and (line ->> 'unit_price') is not null
    and (line ->> 'unit_price')::numeric >= 0;

  -- A lista volta ao início: comprar reinicia, não encerra.
  update public.items
  set status = 'wanted', purchased_at = null
  where list_id = p_list_id and deleted_at is null and status <> 'wanted';

  return v_trip_id;
end;
$$;

revoke all on function public.close_shopping_trip(uuid, text, timestamptz, text, jsonb) from public;
grant execute on function public.close_shopping_trip(uuid, text, timestamptz, text, jsonb) to authenticated;
