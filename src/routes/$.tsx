import { createFileRoute, Link, redirect } from "@tanstack/react-router";

const ATALHOS: Record<string, string> = {
  auth: "/entrar",
  login: "/entrar",
  entrar: "/entrar",
  signin: "/entrar",
  cadastro: "/entrar",
  chat: "/conversa",
  conversar: "/conversa",
  dashboard: "/resumo",
  home: "/",
  inicio: "/",
  gastos: "/resumo",
  goals: "/metas",
  market: "/mercado",
  insight: "/insights",
};

export const Route = createFileRoute("/$")({
  beforeLoad: ({ params }) => {
    const primeiro = (params._splat ?? "").split("/")[0]?.toLowerCase() ?? "";
    const destino = ATALHOS[primeiro];
    if (destino) throw redirect({ to: destino });
  },
  head: () => ({
    meta: [
      { title: "Página não encontrada — mergulho" },
      {
        name: "description",
        content: "Este endereço não existe no mergulho. Volte para a conversa com seu agente.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NaoEncontrada,
});

function NaoEncontrada() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-primary">404</p>
        <h1 className="mt-4 font-display text-3xl">Não encontrei esta página</h1>
        <p className="mt-2 text-muted-foreground">
          O endereço pode ter mudado. Sem problema — escolha por onde continuar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/conversa"
            className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            Abrir conversa
          </Link>
          <Link
            to="/"
            className="rounded-full border border-input bg-card px-6 py-3 text-base font-semibold transition-colors hover:bg-secondary"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
