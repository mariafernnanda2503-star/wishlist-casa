import { LoginForm } from "@/features/auth/components";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 pb-16">
      <h1 className="mb-1 text-[22px] font-semibold">🏠 Wishlist da Casa</h1>
      <p className="text-ink-soft mb-6 text-sm">Entre para ver e editar a lista.</p>
      <LoginForm />
    </main>
  );
}
