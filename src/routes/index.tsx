import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircleHeart, PiggyBank, Sprout } from "lucide-react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wise Money — organize seu dinheiro conversando" },
      {
        name: "description",
        content:
          "Um assistente financeiro que anota seus gastos por conversa, explica sem jargão e acompanha suas metas.",
      },
      { property: "og:title", content: "Wise Money — organize seu dinheiro conversando" },
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
  const { t } = useIdioma();

  const destaques = [
    {
      icon: MessageCircleHeart,
      titulo: t("Registre falando", "Record by talking"),
      texto: t(
        "“Gastei 35 reais no mercado” já vira um gasto organizado.",
        "“I spent $35 at the market” instantly becomes an organized expense.",
      ),
    },
    {
      icon: Sprout,
      titulo: t("Aprenda sem susto", "Learn without fear"),
      texto: t(
        "Juros, orçamento e reserva explicados em português claro.",
        "Interest, budgeting and savings explained in plain, simple language.",
      ),
    },
    {
      icon: PiggyBank,
      titulo: t("Chegue nas metas", "Reach your goals"),
      texto: t(
        "Guardar um pouquinho por mês, com acompanhamento simples.",
        "Save a little each month, with simple tracking along the way.",
      ),
    },
  ];

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
            <div className="size-11 overflow-hidden rounded-2xl shadow-sm">
              <img src="/icons/icon-192.png" alt="Wise Money" className="size-full object-cover" />
            </div>
            <div>
              <p className="font-display text-xl leading-none">Wise Money</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary/70">
                {t("assessor financeiro", "financial advisor")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/entrar"
              className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {t("Entrar", "Sign in")}
            </Link>
          </div>
        </header>

        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              {t("Bem-vindo", "Welcome")}
            </p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-6xl">
              {t("Vamos ", "Let's ")}
              <em className="italic text-primary">{t("organizar", "organize")}</em>
              {t(
                " seu dinheiro, uma conversa de cada vez.",
                " your money, one conversation at a time.",
              )}
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              {t(
                "Eu sou o seu agente financeiro. Fale comigo como com um amigo: eu anoto seus gastos, explico o que eles significam e ajudo você a chegar nas suas metas.",
                "I'm your financial agent. Talk to me like a friend: I'll record your expenses, explain what they mean, and help you reach your goals.",
              )}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/entrar"
                className="rounded-full bg-primary px-7 py-4 text-lg font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
              >
                {t("Começar conversa", "Start chatting")}
              </Link>
              <Link
                to="/instalar"
                className="rounded-full bg-primary/10 px-6 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                {t("Instalar no celular", "Install on your phone")}
              </Link>
              <p className="text-sm text-muted-foreground">
                {t("Leva menos de um minuto.", "It takes less than a minute.")}
              </p>

            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {destaques.map((item) => (
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
                <p className="text-sm font-semibold">
                  {t("Conversa com o agente", "Chat with the agent")}
                </p>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t("online agora", "online now")}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
                    {t("Gastei 35 reais no mercado hoje.", "I spent $35 at the market today.")}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    <img src="/icons/icon-192.png" alt="Nina" className="size-5 object-cover" />
                  </span>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-secondary px-4 py-3 text-sm">
                    {t("Anotei! ", "Got it! ")}
                    <strong>{t("Supermercado — R$ 35,00", "Supermarket — $35.00")}</strong>
                    {t(
                      " em Alimentação. Quer que eu guarde assim?",
                      " under Food. Want me to save it this way?",
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
              <p className="font-display text-lg">{t("O que eu nunca faço", "What I never do")}</p>
              <p className="mt-3 text-sm leading-relaxed opacity-85">
                {t(
                  "Nunca indico um investimento específico. Eu explico os tipos que existem — como Tesouro, CDB e fundos simples — para você decidir com calma e segurança.",
                  "I never recommend a specific investment. I explain the types that exist — like Treasury bonds, CDs and simple funds — so you can decide calmly and safely.",
                )}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
