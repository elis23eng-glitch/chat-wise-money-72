import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getMarket } from "@/lib/finance.functions";

export const Route = createFileRoute("/_autenticado/mercado")({
  head: () => ({
    meta: [
      { title: "Mercado em linguagem simples — mergulho" },
      {
        name: "description",
        content:
          "Cotação do dólar e do euro e explicações claras sobre os tipos de investimento mais comuns.",
      },
      { property: "og:title", content: "Mercado em linguagem simples" },
      {
        property: "og:description",
        content: "Cotações atualizadas e explicações sobre poupança, Tesouro, CDB e fundos.",
      },
    ],
  }),
  component: Mercado,
});

const EDUCACAO = [
  {
    titulo: "Poupança",
    texto:
      "O mais conhecido e o mais simples. O dinheiro fica disponível, mas costuma render pouco — muitas vezes menos que a inflação.",
  },
  {
    titulo: "Tesouro Direto",
    texto:
      "São títulos do governo. Existem opções que acompanham a inflação e outras com juros fixos. É considerado bem seguro.",
  },
  {
    titulo: "CDB",
    texto:
      "É um empréstimo que você faz ao banco e ele devolve com juros. Tem proteção do FGC até certo valor por banco.",
  },
  {
    titulo: "Fundos de investimento",
    texto:
      "Um grupo de pessoas junta dinheiro e um gestor investe por todos. Preste atenção nas taxas cobradas.",
  },
];

function Mercado() {
  const market = useServerFn(getMarket);
  const { data, isLoading } = useQuery({
    queryKey: ["market"],
    queryFn: () => market(),
    refetchInterval: 5 * 60 * 1000,
  });

  const variacao = data?.variacaoPct ?? null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Mercado</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">O que está acontecendo hoje</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Aqui você acompanha números gerais e aprende o básico. Eu não indico nenhum investimento
          específico — a decisão é sempre sua, com calma.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Dólar comercial</p>
          <p className="mt-2 font-display text-4xl">
            {isLoading ? "…" : data?.dolar ? `R$ ${data.dolar.toFixed(2)}` : "indisponível"}
          </p>
          {variacao !== null && (
            <p
              className={`mt-1 text-sm font-semibold ${variacao >= 0 ? "text-destructive" : "text-primary"}`}
            >
              {variacao >= 0 ? "▲" : "▼"} {Math.abs(variacao).toFixed(2)}% hoje
            </p>
          )}
        </div>
        <div className="surface-card p-6">
          <p className="text-sm text-muted-foreground">Euro</p>
          <p className="mt-2 font-display text-4xl">
            {isLoading ? "…" : data?.euro ? `R$ ${data.euro.toFixed(2)}` : "indisponível"}
          </p>
        </div>
        <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
          <p className="font-display text-lg">Em palavras simples</p>
          <p className="mt-2 text-sm leading-relaxed opacity-85">
            Quando o dólar sobe, produtos importados e viagens ficam mais caros. No dia a dia, isso
            costuma aparecer aos poucos nos preços do mercado.
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-2xl">Tipos de investimento, explicados</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {EDUCACAO.map((item) => (
            <article key={item.titulo} className="surface-card p-6">
              <h3 className="font-display text-xl">{item.titulo}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.texto}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Conteúdo educativo. Nada aqui é recomendação de compra ou venda de um ativo específico.
        </p>
      </section>
    </div>
  );
}
