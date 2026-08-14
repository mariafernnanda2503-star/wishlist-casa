import { z } from "zod";

const schema = z.object({
  supabaseUrl: z.url("NEXT_PUBLIC_SUPABASE_URL precisa ser uma URL válida."),
  supabaseAnonKey: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY não pode ficar vazia."),
});

// As variáveis precisam ser lidas literalmente: o Next substitui
// `process.env.NEXT_PUBLIC_*` em tempo de build, e acesso dinâmico não é trocado.
const parsed = schema.safeParse({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const detalhes = parsed.error.issues.map((issue) => issue.message).join(" ");
  throw new Error(`Variáveis de ambiente inválidas. ${detalhes} Confira o .env.example.`);
}

export const env = parsed.data;
