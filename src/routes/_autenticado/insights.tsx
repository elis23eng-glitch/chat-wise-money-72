import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getOverview } from "@/lib/finance.functions";
import { brl } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/_autenticado/insights")({
  head: () => ({
    meta: [
      { title: "Insights do seu dinheiro — mergulho" },
      {
        name: "description",
        content:
          "Observações personalizadas sobre seus hábitos de gasto, com dicas práticas para economizar.",
      },
      { property: "og:title", content: "Insights sobre os seus gastos" },
      {
        property: "og:description",
        content: "Onde seu dinheiro está indo e o que dá para ajustar, explicado de forma simples.",
      },
    ],
  }),
  component: Insights,
});

type Insight = { titulo: string; texto: string; tom: "bom" | "atencao" | "neutro" };

function gerarInsights(
  data: {
    totalMes: number;
    totalAnterior: number;
    porCategoria: Record<string, number>;
    porCategoriaAnterior: Record<string, number>;
    metas: { titulo: string; valor_alvo: number; valor_atual: number }[];
  },
  t: (pt: string, en: string) => string,
): Insight[] {
  const lista: Insight[] = [];
  const { totalMes, totalAnterior, porCategoria, porCategoriaAnterior, metas } = data;

  if (totalMes === 0) {
    lista.push({
      tom: "neutro",
      titulo: t("Vamos começar pelo básico", "Let's start with the basics"),
      texto: t(
        "Ainda não há gastos anotados neste mês. Anote os próximos três gastos e eu já consigo mostrar para onde seu dinheiro está indo.",
        "There are no expenses recorded this month yet. Log your next three expenses and I'll be able to show you where your money is going.",
      ),
    });
    return lista;
  }

  const ordenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const [maiorNome, maiorValor] = ordenadas[0]!;
  lista.push({
    tom: "neutro",
    titulo: t(`Sua maior despesa é ${maiorNome}`, `Your biggest expense is ${maiorNome}`),
    texto: t(
      `Você gastou ${brl(maiorValor)} com ${maiorNome} neste mês — cerca de ${Math.round(
        (maiorValor / totalMes) * 100,
      )}% de tudo. Vale olhar com carinho se todos esses gastos eram necessários.`,
      `You spent ${brl(maiorValor)} on ${maiorNome} this month — about ${Math.round(
        (maiorValor / totalMes) * 100,
      )}% of everything. It's worth checking if all of that spending was necessary.`,
    ),
  });

  if (totalAnterior > 0) {
    const dif = totalMes - totalAnterior;
    lista.push(
      dif > 0
        ? {
            tom: "atencao",
            titulo: t("Este mês está mais caro", "This month is pricier"),
            texto: t(
              `Você já gastou ${brl(dif)} a mais do que no mês passado. Reduzir uma saída pequena por semana costuma resolver boa parte dessa diferença.`,
              `You've already spent ${brl(dif)} more than last month. Cutting one small expense per week usually closes most of that gap.`,
            ),
          }
        : {
            tom: "bom",
            titulo: t("Você economizou", "You saved money"),
            texto: t(
              `Seus gastos caíram ${brl(Math.abs(dif))} em relação ao mês passado. Se puder, guarde essa diferença numa meta.`,
              `Your spending dropped ${brl(Math.abs(dif))} compared to last month. If you can, put that difference toward a goal.`,
            ),
          },
    );
  }

  for (const [nome, valor] of ordenadas.slice(0, 4)) {
    const antes = porCategoriaAnterior[nome] ?? 0;
    if (antes > 0 && valor > antes * 1.4) {
      lista.push({
        tom: "atencao",
        titulo: t(`${nome} subiu bastante`, `${nome} went up a lot`),
        texto: t(
          `De ${brl(antes)} para ${brl(valor)}. Pode ser algo pontual, mas se repetir vale definir um limite mensal.`,
          `From ${brl(antes)} to ${brl(valor)}. It might be a one-off, but if it repeats, it's worth setting a monthly limit.`,
        ),
      });
    }
  }

  const lazer = porCategoria["lazer"] ?? 0;
  if (lazer > totalMes * 0.25) {
    lista.push({
      tom: "atencao",
      titulo: t("Lazer está pesando", "Leisure is taking a toll"),
      texto: t(
        "Lazer é importante, ninguém precisa cortar tudo. Experimente definir um valor fixo por semana e se manter nele.",
        "Leisure matters, you don't need to cut it all. Try setting a fixed weekly amount and sticking to it.",
      ),
    });
  }

  const semProgresso = metas.filter((m) => m.valor_atual === 0);
  if (metas.length === 0) {
    lista.push({
      tom: "neutro",
      titulo: t("Que tal criar uma meta?", "How about creating a goal?"),
      texto: t(
        "Guardar 10% do que você gasta por mês já seria um bom começo. Uma reserva pequena evita dívidas em imprevistos.",
        "Saving 10% of what you spend each month is already a great start. A small reserve helps you avoid debt in emergencies.",
      ),
    });
  } else if (semProgresso.length > 0) {
    lista.push({
      tom: "neutro",
      titulo: t(
        `“${semProgresso[0]!.titulo}” ainda não começou`,
        `“${semProgresso[0]!.titulo}” hasn't started yet`,
      ),
      texto: t(
        "Comece com um valor pequeno, mesmo R$ 20. O importante é criar o hábito, não o tamanho do valor.",
        "Start with a small amount, even $20. What matters is building the habit, not the size of the amount.",
      ),
    });
  }

  return lista;
}

const ESTILO = {
  bom: "border-primary/30 bg-primary/5",
  atencao: "border-accent/40 bg-accent/10",
  neutro: "border-primary/10 bg-card",
} as const;

function Insights() {
  const { t } = useIdioma();
  const overview = useServerFn(getOverview);
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: () => overview() });

  const insights = data ? gerarInsights(data, t) : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Insights", "Insights")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("O que eu percebi por aqui", "What I noticed here")}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {t(
            "São observações sobre os seus próprios hábitos — sem julgamento, só para ajudar você a decidir melhor.",
            "These are observations about your own habits — no judgment, just here to help you decide better.",
          )}
        </p>
      </header>

      {isLoading && (
        <p className="text-muted-foreground">
          {t("Analisando seus gastos…", "Analyzing your spending…")}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((i) => (
          <article key={i.titulo} className={`rounded-3xl border p-6 ${ESTILO[i.tom]}`}>
            <h2 className="font-display text-xl">{i.titulo}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{i.texto}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
        <p className="font-display text-xl">
          {t("Quer conversar sobre isso?", "Want to talk about it?")}
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed opacity-85">
          {t(
            "Me pergunte na conversa: “como posso gastar menos com alimentação?” e eu explico caminhos práticos, do seu jeito.",
            "Ask me in the chat: “how can I spend less on food?” and I'll explain practical ways, at your own pace.",
          )}
        </p>
        <Link
          to="/conversa"
          className="mt-4 inline-flex rounded-full bg-primary-deep-foreground px-5 py-2.5 text-sm font-semibold text-primary-deep"
        >
          {t("Abrir conversa", "Open chat")}
        </Link>
      </div>
    </div>
  );
}
