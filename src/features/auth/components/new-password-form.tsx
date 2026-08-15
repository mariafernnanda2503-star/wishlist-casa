"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";
import { Button, PasswordField } from "@/ui/primitives";

import { MIN_PASSWORD_LENGTH } from "../lib";

export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmation) {
      setError("As duas senhas não são iguais.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      feedback.error("Não consegui salvar a nova senha. Peça um link novo e tente de novo.", {
        event: "auth.password_update_failed",
        error: updateError,
      });
      setSubmitting(false);
      return;
    }

    feedback.success("Senha atualizada.", { event: "auth.password_update_succeeded" });
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <p className="border-danger-line bg-danger-soft text-danger rounded-lg border px-3 py-2.5 text-[13px]">
          {error}
        </p>
      ) : null}
      <PasswordField
        label="Nova senha"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordField
        label="Repita a nova senha"
        autoComplete="new-password"
        required
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />
      <Button type="submit" disabled={submitting} className="text-[15px]">
        {submitting ? "Salvando..." : "Salvar senha"}
      </Button>
    </form>
  );
}
