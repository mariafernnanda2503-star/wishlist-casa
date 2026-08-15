import { AuthShell, LoginForm } from "@/features/auth/components";

type LoginPageProps = {
  searchParams: Promise<{ erro?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;

  return (
    <AuthShell>
      {erro === "link" ? (
        <p className="border-danger-line bg-danger-soft text-danger mb-2 rounded-lg border px-3 py-2.5 text-[13px]">
          Esse link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      ) : null}
      <LoginForm />
    </AuthShell>
  );
}
