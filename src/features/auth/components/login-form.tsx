"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient } from "@/shared/lib/supabase/client";
import { Button, Input } from "@/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // A mensagem do Supabase é genérica de propósito (não revela se o e-mail
      // existe). Traduzimos mantendo essa característica.
      setError("E-mail ou senha inválidos.");
      setSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      {error ? (
        <p className="border-danger-line bg-danger-soft text-danger mb-1 rounded-lg border px-3 py-2.5 text-[13px]">
          {error}
        </p>
      ) : null}
      <Input
        type="email"
        autoComplete="email"
        placeholder="E-mail"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        type="password"
        autoComplete="current-password"
        placeholder="Senha"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button type="submit" disabled={submitting} className="mt-1 text-[15px]">
        {submitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
