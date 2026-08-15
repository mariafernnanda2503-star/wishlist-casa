"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { createClient } from "@/shared/lib/supabase/client";
import { Button, Field } from "@/ui/primitives";

export function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    // Confirmação igual em qualquer caso: dizer "esse e-mail não existe"
    // entregaria a quem está tentando adivinhar quais contas existem.
    setSent(true);
    setSubmitting(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="border-line bg-surface shadow-control rounded-lg px-3 py-2.5 text-sm">
          Se existe uma conta com esse e-mail, o link para criar uma nova senha já está a caminho.
        </p>
        <Link href="/login" className="text-accent text-sm underline-offset-2 hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" disabled={submitting} className="text-[15px]">
        {submitting ? "Enviando..." : "Enviar link"}
      </Button>
      <Link
        href="/login"
        className="text-ink-soft focus-visible:outline-accent self-center rounded-sm text-[13px] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
