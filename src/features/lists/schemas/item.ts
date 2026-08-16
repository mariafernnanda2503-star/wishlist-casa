import { z } from "zod";

import { parsePriceInput, parseQuantityInput } from "../lib";

const emptyToNull = (value: string) => value.trim() || null;

const optionalUrl = z
  .string()
  .transform(emptyToNull)
  .refine((value) => value === null || z.url().safeParse(value).success, {
    message: "O link precisa ser uma URL válida (comece com https://).",
  });

/** Recebe os valores crus do formulário (tudo string) e devolve um `ItemDraft`. */
export const itemDraftSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao item."),
  price: z.string().transform(parsePriceInput),
  /** Faixa aceitável: "vale a pena abaixo disso". Opcional. */
  priceTarget: z.string().transform(parsePriceInput),
  /** Fracionária desde a lista de mercado: "1,5 kg" não cabe em inteiro. */
  quantity: z.string().transform(parseQuantityInput),
  unit: z.string().transform(emptyToNull),
  /** Já chega como ids escolhidos, não como texto: o seletor resolve os nomes. */
  wanterIds: z.array(z.string()),
  priority: z.enum(["alta", "media", "baixa"]),
  link: optionalUrl,
  note: z.string().transform(emptyToNull),
  groupId: z.string().transform(emptyToNull),
  typeId: z.string().transform(emptyToNull),
});

export type ItemFormValues = z.input<typeof itemDraftSchema>;
