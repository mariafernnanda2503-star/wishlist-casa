/**
 * Moldura comum das telas de autenticação. Centraliza de verdade: o padding é
 * simétrico, senão `justify-center` alinha pelo espaço que sobra e o conteúdo
 * sobe.
 *
 * O cabeçalho é opcional — o login dispensa título, as telas de senha precisam
 * dele para explicar onde a pessoa caiu.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[340px] flex-col justify-center px-5 py-10">
      {title ? (
        <header className="mb-6 text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-ink-soft mt-1 text-[13px]">{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </main>
  );
}
