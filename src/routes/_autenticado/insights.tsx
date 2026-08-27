import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getOverview } from "@/lib/finance.functions";
import { brl } from "@/lib/format";

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

function gerarInsights(data: {
  totalMes: number;
  totalAnterior: number;
  porCategoria: Record<string, number>;
  porCategoriaAnterior: Record<string, number>;
  metas: { titulo: string; valor_alvo: number; valor_atual: number }[];
}): Insight[] {
  const lista: Insight[] = [];
  const { totalMes, totalAnterior, porCategoria, porCategoriaAnterior, metas } = data;

  if (totalMes === 0) {
    lista.push({
      tom: "neutro",
      titulo: "Vamos começar pelo básico",
      texto:
        "Ainda não há gastos anotados neste mês. Anote os próximos três gastos e eu já consigo mostrar para onde seu dinheiro está indo.",
    });
    return lista;
  }

  const ordenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  const [maiorNome, maiorValor] = ordenadas[0]!;
  lista.push({
    tom: "neutro",
    titulo: `Sua maior despesa é ${maiorNome}`,
    texto: `Você gastou ${brl(maiorValor)} com ${maiorNome} neste mês — cerca de ${Math.round(
      (maiorValor / totalMes) * 100,
    )}% de tudo. Vale olhar com carinho se todos esses gastos eram necessários.`,
  });

  if (totalAnterior > 0) {
    const dif = totalMes - totalAnterior;
    lista.push(
      dif > 0
        ? {
            tom: "atencao",
            titulo: "Este mês está mais caro",
            texto: `Você já gastou ${brl(dif)} a mais do que no mês passado. Reduzir uma saída pequena por semana costuma resolver boa parte dessa diferença.`,
          }
        : {
            tom: "bom",
            titulo: "Você economizou",
            texto: `Seus gastos caíram ${brl(Math.abs(dif))} em relação ao mês passado. Se puder, guarde essa diferença numa meta.`,
          },
    );
  }

  for (const [nome, valor] of ordenadas.slice(0, 4)) {
    const antes = porCategoriaAnterior[nome] ?? 0;
    if (antes > 0 && valor > antes * 1.4) {
      lista.push({
        tom: "atencao",
        titulo: `${nome} subiu bastante`,
        texto: `De ${brl(antes)} para ${brl(valor)}. Pode ser algo pontual, mas se repetir vale definir um limite mensal.`,
      });
    }
  }

  const lazer = porCategoria["lazer"] ?? 0;
  if (lazer > totalMes * 0.25) {
    lista.push({
      tom: "atencao",
      titulo: "Lazer está pesando",
      texto:
        "Lazer é importante, ninguém precisa cortar tudo. Experimente definir um valor fixo por semana e se manter nele.",
    });
  }

  const semProgresso = metas.filter((m) => m.valor_atual === 0);
  if (metas.length === 0) {
    lista.push({
      tom: "neutro",
      titulo: "Que tal criar uma meta?",
      texto:
        "Guardar 10% do que você gasta por mês já seria um bom começo. Uma reserva pequena evita dívidas em imprevistos.",
    });
  } else if (semProgresso.length > 0) {
    lista.push({
      tom: "neutro",
      titulo: `“${semProgresso[0]!.titulo}” ainda não começou`,
      texto:
        "Comece com um valor pequeno, mesmo R$ 20. O importante é criar o hábito, não o tamanho do valor.",
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
  const overview = useServerFn(getOverview);
  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: () => overview() });

  const insights = data ? gerarInsights(data) : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Insights</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">O que eu percebi por aqui</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          São observações sobre os seus próprios hábitos — sem julgamento, só para ajudar você a
          decidir melhor.
        </p>
      </header>

      {isLoading && <p className="text-muted-foreground">Analisando seus gastos…</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((i) => (
          <article key={i.titulo} className={`rounded-3xl border p-6 ${ESTILO[i.tom]}`}>
            <h2 className="font-display text-xl">{i.titulo}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{i.texto}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
        <p className="font-display text-xl">Quer conversar sobre isso?</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed opacity-85">
          Me pergunte na conversa: “como posso gastar menos com alimentação?” e eu explico caminhos
          práticos, do seu jeito.
        </p>
        <Link
          to="/conversa"
          className="mt-4 inline-flex rounded-full bg-primary-deep-foreground px-5 py-2.5 text-sm font-semibold text-primary-deep"
        >
          Abrir conversa
        </Link>
      </div>
    </div>
  );
}
