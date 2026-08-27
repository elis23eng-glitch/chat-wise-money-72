import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Legend,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboard } from "@/lib/dashboard.functions";
import { brl, dataCurta } from "@/lib/format";

export const Route = createFileRoute("/_autenticado/painel")({
  head: () => ({
    meta: [
      { title: "Painel financeiro — mergulho" },
      {
        name: "description",
        content:
          "Visão geral dos seus gastos: total do mês, evolução, categorias, metas e média diária.",
      },
      { property: "og:title", content: "Painel financeiro" },
      {
        property: "og:description",
        content: "Gráficos simples com a evolução dos seus gastos, categorias e metas.",
      },
    ],
  }),
  component: Painel,
});

const CORES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function Caixa({ children }: { children: React.ReactNode }) {
  return <div className="surface-card p-6">{children}</div>;
}

function DicaGrafico({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold capitalize">{label}</p>
      <p className="text-muted-foreground">{brl(Number(payload[0].value))}</p>
    </div>
  );
}

function DicaComparativo({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-card px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold capitalize">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey === "entrada" ? "Entrou" : "Saiu"}: {brl(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

function Painel() {
  const carregar = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => carregar() });

  const total = data?.totalMes ?? 0;
  const entradas = data?.totalEntradas ?? 0;
  const saldo = data?.saldo ?? 0;
  const anterior = data?.totalAnterior ?? 0;
  const variacao = anterior > 0 ? ((total - anterior) / anterior) * 100 : 0;
  const subiu = total >= anterior;

  const categorias = Object.entries(data?.porCategoria ?? {})
    .map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor);

  const semDados = !isLoading && (data?.quantidadeLancamentos ?? 0) === 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Painel</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Sua vida financeira num olhar</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Aqui você vê tudo junto: quanto gastou, com o quê, como está evoluindo e quanto falta para
          suas metas.
        </p>
      </header>

      {isLoading && <p className="text-muted-foreground">Carregando seus números…</p>}

      {semDados && (
        <Caixa>
          <h2 className="font-display text-2xl">Ainda não há gastos neste mês</h2>
          <p className="mt-2 text-muted-foreground">
            Assim que você anotar o primeiro gasto, os gráficos aparecem aqui automaticamente.
          </p>
          <Link
            to="/conversa"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-deep"
          >
            Anotar conversando
          </Link>
        </Caixa>
      )}

      {!isLoading && (
        <>
          <div
            className={`rounded-3xl p-6 sm:p-8 ${
              saldo >= 0
                ? "bg-primary-deep text-primary-deep-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            <div className="flex items-center gap-2 text-sm opacity-90">
              {saldo >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              Saldo deste mês
            </div>
            <p className="mt-3 font-display text-4xl sm:text-5xl">{brl(saldo)}</p>
            <p className="mt-2 max-w-xl text-base opacity-90">
              {entradas === 0 && total === 0
                ? "Ainda não há entradas nem gastos anotados neste mês."
                : saldo >= 0
                  ? `Você recebeu ${brl(entradas)} e gastou ${brl(total)}. Está sobrando dinheiro — que tal guardar um pouco numa meta?`
                  : `Você recebeu ${brl(entradas)} e gastou ${brl(total)}. Atenção: você está no vermelho em ${brl(Math.abs(saldo))} neste mês.`}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PiggyBank className="size-4" /> Entradas do mês
              </div>
              <p className="mt-3 font-display text-3xl text-primary-deep">{brl(entradas)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.quantidadeEntradas ?? 0} entrada(s) registrada(s)
              </p>
            </Caixa>

            <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
              <div className="flex items-center gap-2 text-sm opacity-80">
                <Wallet className="size-4" /> Gasto do mês
              </div>
              <p className="mt-3 font-display text-3xl">{brl(total)}</p>
              <p className="mt-1 flex items-center gap-1 text-sm opacity-80">
                {anterior === 0 ? (
                  "Primeiro mês registrado"
                ) : (
                  <>
                    {subiu ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                    {Math.abs(variacao).toFixed(0)}% {subiu ? "a mais" : "a menos"} que o mês passado
                  </>
                )}
              </p>
            </div>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" /> Média por dia
              </div>
              <p className="mt-3 font-display text-3xl">{brl(data?.mediaDiaria ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.quantidadeLancamentos ?? 0} lançamentos no mês
              </p>
            </Caixa>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="size-4" /> Projeção do mês
              </div>
              <p className="mt-3 font-display text-3xl">{brl(data?.projecaoMes ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Se continuar no ritmo de hoje até o fim do mês
              </p>
            </Caixa>

            <Caixa>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="size-4" /> Guardado nas metas
              </div>
              <p className="mt-3 font-display text-3xl">
                {brl((data?.metas ?? []).reduce((s, m) => s + m.valor_atual, 0))}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(data?.metas ?? []).length} meta(s) ativa(s)
              </p>
            </Caixa>
          </div>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Caixa>
              <h2 className="font-display text-2xl">Entradas e saídas nos últimos 6 meses</h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.meses ?? []}>
                    <defs>
                      <linearGradient id="areaGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="areaEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="rotulo"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis hide />
                    <Tooltip content={<DicaComparativo />} />
                    <Legend
                      verticalAlign="top"
                      height={28}
                      iconType="circle"
                      formatter={(v) => (
                        <span className="text-sm text-muted-foreground">
                          {v === "entrada" ? "Entrou" : "Saiu"}
                        </span>
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="entrada"
                      stroke="var(--chart-2)"
                      strokeWidth={3}
                      fill="url(#areaEntrada)"
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary-deep)"
                      strokeWidth={3}
                      fill="url(#areaGasto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Caixa>

            <Caixa>
              <h2 className="font-display text-2xl">Onde o dinheiro foi</h2>
              {categorias.length === 0 ? (
                <p className="mt-4 text-muted-foreground">Sem gastos neste mês.</p>
              ) : (
                <>
                  <div className="mt-2 h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorias}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {categorias.map((c, i) => (
                            <Cell key={c.nome} fill={CORES[i % CORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<DicaGrafico />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {categorias.slice(0, 5).map((c, i) => (
                      <li key={c.nome} className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ background: CORES[i % CORES.length] }}
                        />
                        <span className="capitalize">{c.nome}</span>
                        <span className="ml-auto text-muted-foreground">{brl(c.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Caixa>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Caixa>
              <h2 className="font-display text-2xl">Gastos dia a dia deste mês</h2>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.diario ?? []}>
                    <XAxis
                      dataKey="dia"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis hide />
                    <Tooltip content={<DicaGrafico />} cursor={{ fill: "var(--secondary)" }} />
                    <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Caixa>

            <Caixa>
              <h2 className="font-display text-2xl">Suas metas</h2>
              {(data?.metas ?? []).length === 0 ? (
                <p className="mt-4 text-muted-foreground">
                  Você ainda não criou metas.{" "}
                  <Link to="/metas" className="font-semibold text-primary underline">
                    Criar agora
                  </Link>
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {(data?.metas ?? []).slice(0, 4).map((m) => {
                    const pct = Math.min(100, (m.valor_atual / Math.max(1, m.valor_alvo)) * 100);
                    return (
                      <div key={m.id}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium">{m.titulo}</span>
                          <span className="text-muted-foreground">
                            {brl(m.valor_atual)} de {brl(m.valor_alvo)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className="mt-8 font-display text-xl">Últimas entradas</h3>
              {(data?.entradasRecentes ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma entrada anotada ainda.{" "}
                  <Link to="/resumo" className="font-semibold text-primary underline">
                    Anotar entrada
                  </Link>
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-primary/10 text-sm">
                  {(data?.entradasRecentes ?? []).map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.descricao}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {e.categoria} · {dataCurta(e.data)}
                        </p>
                      </div>
                      <span className="ml-auto font-display text-base text-primary-deep">
                        + {brl(e.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-8 font-display text-xl">Últimas saídas</h3>
              <ul className="mt-2 divide-y divide-primary/10 text-sm">
                {(data?.recentes ?? []).map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{g.descricao}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {g.categoria} · {dataCurta(g.data)}
                      </p>
                    </div>
                    <span className="ml-auto font-display text-base">{brl(g.valor)}</span>
                  </li>
                ))}
              </ul>
            </Caixa>
          </section>
        </>
      )}
    </div>
  );
}
