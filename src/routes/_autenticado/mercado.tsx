import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getMarket } from "@/lib/finance.functions";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/_autenticado/mercado")({
  head: () => ({
    meta: [
      { title: "Mercado em linguagem simples — Wise Money" },
      {
        name: "description",
        content:
          "Cotação do dólar e do euro e explicações claras sobre os tipos de investimento mais comuns.",
      },
      { property: "og:title", content: "Mercado em linguagem simples — Wise Money" },
      {
        property: "og:description",
        content: "Cotações atualizadas e explicações sobre poupança, Tesouro, CDB e fundos.",
      },
      { name: "twitter:title", content: "Mercado em linguagem simples — Wise Money" },
      {
        name: "twitter:description",
        content: "Cotações atualizadas e explicações sobre poupança, Tesouro, CDB e fundos.",
      },
    ],
  }),
  component: Mercado,
});

function Mercado() {
  const market = useServerFn(getMarket);
  const { t } = useIdioma();
  const { data, isLoading } = useQuery({
    queryKey: ["market"],
    queryFn: () => market(),
    refetchInterval: 5 * 60 * 1000,
  });

  const EDUCACAO = [
    {
      titulo: t("Poupança", "Savings account"),
      texto: t(
        "O mais conhecido e o mais simples. O dinheiro fica disponível, mas costuma render pouco — muitas vezes menos que a inflação.",
        "The best known and simplest option. The money stays available, but it usually earns little — often less than inflation.",
      ),
    },
    {
      titulo: t("Tesouro Direto", "Government bonds"),
      texto: t(
        "São títulos do governo. Existem opções que acompanham a inflação e outras com juros fixos. É considerado bem seguro.",
        "These are government bonds. Some options track inflation, others have fixed interest rates. Considered quite safe.",
      ),
    },
    {
      titulo: t("CDB", "CDs"),
      texto: t(
        "É um empréstimo que você faz ao banco e ele devolve com juros. Tem proteção do FGC até certo valor por banco.",
        "It's a loan you make to the bank, and it pays you back with interest. It's protected up to a certain amount per bank.",
      ),
    },
    {
      titulo: t("Fundos de investimento", "Investment funds"),
      texto: t(
        "Um grupo de pessoas junta dinheiro e um gestor investe por todos. Preste atenção nas taxas cobradas.",
        "A group of people pool their money and a manager invests on everyone's behalf. Pay attention to the fees charged.",
      ),
    },
  ];

  const variacao = data?.variacaoPct ?? null;
  const indisponivel = t("indisponível", "unavailable");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Mercado", "Market")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("O que está acontecendo hoje", "What's happening today")}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {t(
            "Aqui você acompanha números gerais e aprende o básico. Eu não indico nenhum investimento específico — a decisão é sempre sua, com calma.",
            "Here you follow general numbers and learn the basics. I don't recommend any specific investment — the decision is always yours, take your time.",
          )}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">{t("Dólar comercial", "US Dollar")}</p>
          <p className="mt-2 font-display text-4xl">
            {isLoading ? "…" : data?.dolar ? `R$ ${data.dolar.toFixed(2)}` : indisponivel}
          </p>
          {variacao !== null && (
            <p
              className={`mt-1 text-sm font-semibold ${variacao >= 0 ? "text-destructive" : "text-primary"}`}
            >
              {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(2)}% {t("hoje", "today")}
            </p>
          )}
        </div>
        <div className="surface-card p-6">
          <p className="text-sm text-muted-foreground">{t("Euro", "Euro")}</p>
          <p className="mt-2 font-display text-4xl">
            {isLoading ? "…" : data?.euro ? `R$ ${data.euro.toFixed(2)}` : indisponivel}
          </p>
        </div>
        <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
          <p className="font-display text-lg">{t("Em palavras simples", "In simple words")}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-85">
            {t(
              "Quando o dólar sobe, produtos importados e viagens ficam mais caros. No dia a dia, isso costuma aparecer aos poucos nos preços do mercado.",
              "When the dollar goes up, imported products and travel become more expensive. In everyday life, this tends to appear gradually in market prices.",
            )}
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-2xl">
          {t("Tipos de investimento, explicados", "Types of investments, explained")}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {EDUCACAO.map((item) => (
            <article key={item.titulo} className="surface-card p-6">
              <h3 className="font-display text-xl">{item.titulo}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.texto}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t(
            "Conteúdo educativo. Nada aqui é recomendação de compra ou venda de um ativo específico.",
            "Educational content. Nothing here is a recommendation to buy or sell any specific asset.",
          )}
        </p>
      </section>
    </div>
  );
}
