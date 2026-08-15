import { AuthShell, RequestResetForm } from "@/features/auth/components";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      subtitle="Informe o e-mail da conta e enviamos um link para criar uma nova senha."
    >
      <RequestResetForm />
    </AuthShell>
  );
}
