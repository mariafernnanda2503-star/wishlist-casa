import { z } from "zod";

import { parsePriceInput } from "../lib";

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
  quantity: z.string().transform((value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  priority: z.enum(["alta", "media", "baixa"]),
  link: optionalUrl,
  note: z.string().transform(emptyToNull),
  areaId: z.string().transform(emptyToNull),
  categoryId: z.string().transform(emptyToNull),
});

export type ItemFormValues = z.input<typeof itemDraftSchema>;
