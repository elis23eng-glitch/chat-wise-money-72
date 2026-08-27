import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleHeart, PiggyBank, Sprout } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "mergulho — organize seu dinheiro conversando" },
      {
        name: "description",
        content:
          "Um assistente financeiro que anota seus gastos por conversa, explica sem jargão e acompanha suas metas.",
      },
      { property: "og:title", content: "mergulho — organize seu dinheiro conversando" },
      {
        property: "og:description",
        content:
          "Registre gastos falando naturalmente, veja resumos claros e aprenda a economizar no seu ritmo.",
      },
    ],
  }),
  component: BoasVindas,
});

function BoasVindas() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="floaty absolute -top-24 right-[-6rem] size-[26rem] bg-primary/10"
          style={{ borderRadius: "42% 58% 63% 37%/45% 42% 58% 55%" }}
        />
        <div
          className="floaty absolute bottom-[-8rem] left-[-6rem] size-[24rem] bg-accent/20"
          style={{
            borderRadius: "55% 45% 40% 60%/60% 40% 55% 40%",
            animationDelay: "-3s",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-display text-xl">m</span>
            </div>
            <div>
              <p className="font-display text-xl leading-none">mergulho</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
                assessor financeiro
              </p>
            </div>
          </div>
          <Link
            to="/entrar"
            className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            Entrar
          </Link>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Bem-vindo
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
              Vamos <em className="italic text-primary">organizar</em> seu dinheiro, uma conversa de
              cada vez.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Eu sou o seu agente financeiro. Fale comigo como com um amigo: eu anoto seus gastos,
              explico o que eles significam e ajudo você a chegar nas suas metas.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/entrar"
                className="rounded-full bg-primary px-7 py-4 text-lg font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
              >
                Começar conversa
              </Link>
              <p className="text-sm text-muted-foreground">Leva menos de um minuto.</p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: MessageCircleHeart,
                  titulo: "Registre falando",
                  texto: "“Gastei 35 reais no mercado” já vira um gasto organizado.",
                },
                {
                  icon: Sprout,
                  titulo: "Aprenda sem susto",
                  texto: "Juros, orçamento e reserva explicados em português claro.",
                },
                {
                  icon: PiggyBank,
                  titulo: "Chegue nas metas",
                  texto: "Guardar um pouquinho por mês, com acompanhamento simples.",
                },
              ].map((item) => (
                <div key={item.titulo} className="surface-card p-6">
                  <item.icon className="size-6 text-primary" strokeWidth={1.6} />
                  <p className="mt-4 font-display text-lg">{item.titulo}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.texto}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="surface-card p-5 shadow-soft">
              <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
                <span className="size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-semibold">Conversa com o agente</p>
                <span className="ml-auto text-xs text-muted-foreground">online agora</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
                    Gastei 35 reais no mercado hoje.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-xs text-primary">
                    m
                  </span>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-secondary px-4 py-3 text-sm">
                    Anotei! <strong>Supermercado — R$ 35,00</strong> em Alimentação. Quer que eu
                    guarde assim?
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
              <p className="font-display text-lg">O que eu nunca faço</p>
              <p className="mt-3 text-sm leading-relaxed opacity-85">
                Nunca indico um investimento específico. Eu explico os tipos que existem — como
                Tesouro, CDB e fundos simples — para você decidir com calma e segurança.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
