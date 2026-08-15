"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";
import { Button, Checkbox, Field, PasswordField } from "@/ui/primitives";

const REMEMBERED_EMAIL_KEY = "wishlist:email-lembrado";

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);

  // Os campos são não-controlados de propósito: o e-mail salvo só existe no
  // navegador, então preenchê-lo durante o render quebraria a hidratação (o
  // servidor renderizaria vazio). Preenchendo por ref depois da montagem, o
  // HTML do servidor e o do cliente batem.
  useEffect(() => {
    const saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (!saved) return;
    if (emailRef.current) emailRef.current.value = saved;
    if (rememberRef.current) rememberRef.current.checked = true;
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const remember = form.get("remember") === "on";

    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // A mensagem do Supabase é genérica de propósito (não revela se o e-mail
      // existe). Traduzimos mantendo essa característica.
      feedback.error("E-mail ou senha inválidos.", {
        event: "auth.sign_in_failed",
        error: signInError,
      });
      setSubmitting(false);
      return;
    }

    // Só grava depois de dar certo, para não memorizar um e-mail digitado errado.
    if (remember) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);

    feedback.success("Bem-vindo de volta.", { event: "auth.sign_in_succeeded" });
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        ref={emailRef}
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        required
      />
      <PasswordField label="Senha" name="password" autoComplete="current-password" required />

      <div className="text-ink-soft flex items-center justify-between gap-3 text-[12.5px]">
        <Checkbox ref={rememberRef} name="remember" defaultChecked label="Lembrar meu e-mail" />
        <Link
          href="/esqueci-senha"
          className="text-accent focus-visible:outline-accent rounded-sm font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Esqueci a senha
        </Link>
      </div>

      <Button type="submit" disabled={submitting} className="mt-3 text-[15px]">
        {submitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
