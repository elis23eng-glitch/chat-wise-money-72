import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  addExpense,
  addIncome,
  deleteExpense,
  deleteIncome,
  getOverview,
} from "@/lib/finance.functions";
import { brl, dataCurta, CORES_CATEGORIA } from "@/lib/format";

export const Route = createFileRoute("/_autenticado/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo dos gastos — mergulho" },
      {
        name: "description",
        content: "Veja quanto você gastou no mês, por categoria, e compare com o mês anterior.",
      },
      { property: "og:title", content: "Resumo dos seus gastos" },
      {
        property: "og:description",
        content: "Total do mês, gastos por categoria e comparação com o mês passado.",
      },
    ],
  }),
  component: Resumo,
});

const CATEGORIAS = [
  "alimentação",
  "transporte",
  "moradia",
  "contas fixas",
  "saúde",
  "lazer",
  "educação",
  "vestuário",
  "outros",
] as const;

const CATEGORIAS_ENTRADA = [
  "salário",
  "aposentadoria",
  "pensão",
  "trabalho extra",
  "aluguel recebido",
  "venda",
  "presente",
  "outros",
] as const;

function Resumo() {
  const qc = useQueryClient();
  const overview = useServerFn(getOverview);
  const criar = useServerFn(addExpense);
  const apagar = useServerFn(deleteExpense);
  const criarEntrada = useServerFn(addIncome);
  const apagarEntrada = useServerFn(deleteIncome);

  const { data, isLoading } = useQuery({ queryKey: ["overview"], queryFn: () => overview() });

  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("alimentação");
  const [descricao, setDescricao] = useState("");
  const [valorE, setValorE] = useState("");
  const [categoriaE, setCategoriaE] = useState<(typeof CATEGORIAS_ENTRADA)[number]>("salário");
  const [descricaoE, setDescricaoE] = useState("");

  const addEntradaMutation = useMutation({
    mutationFn: () =>
      criarEntrada({
        data: {
          valor: Number(valorE.replace(",", ".")),
          categoria: categoriaE,
          descricao: descricaoE || categoriaE,
          data: new Date().toISOString().slice(0, 10),
        },
      }),
    onSuccess: () => {
      setValorE("");
      setDescricaoE("");
      toast.success("Entrada anotada!");
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Confira o valor e tente de novo."),
  });

  const delEntradaMutation = useMutation({
    mutationFn: (id: string) => apagarEntrada({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const addMutation = useMutation({
    mutationFn: () =>
      criar({
        data: {
          valor: Number(valor.replace(",", ".")),
          categoria,
          descricao: descricao || categoria,
          data: new Date().toISOString().slice(0, 10),
        },
      }),
    onSuccess: () => {
      setValor("");
      setDescricao("");
      toast.success("Gasto anotado!");
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () => toast.error("Confira o valor e tente de novo."),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overview"] }),
  });

  const total = data?.totalMes ?? 0;
  const entradas = data?.totalEntradas ?? 0;
  const saldo = data?.saldo ?? 0;
  const anterior = data?.totalAnterior ?? 0;
  const diferenca = total - anterior;
  const categorias = Object.entries(data?.porCategoria ?? {}).sort((a, b) => b[1] - a[1]);
  const maior = categorias[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Resumo</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Como está seu mês</h1>
      </header>

      <div
        className={`rounded-3xl p-6 ${
          saldo >= 0
            ? "bg-primary-deep text-primary-deep-foreground"
            : "bg-destructive text-destructive-foreground"
        }`}
      >
        <p className="text-sm opacity-90">Saldo do mês (entradas menos gastos)</p>
        <p className="mt-2 font-display text-4xl">{brl(saldo)}</p>
        <p className="mt-2 text-base opacity-90">
          {saldo >= 0
            ? "Suas entradas cobrem seus gastos. Continue assim!"
            : "Atenção: os gastos passaram das entradas neste mês."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Entrou neste mês</p>
          <p className="mt-2 font-display text-4xl text-primary-deep">{brl(entradas)}</p>
        </div>
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">Gasto neste mês</p>
          <p className="mt-2 font-display text-4xl">{brl(total)}</p>
        </div>
        <div className="surface-card p-6">
          <p className="text-sm text-muted-foreground">Mês passado</p>
          <p className="mt-2 font-display text-4xl">{brl(anterior)}</p>
        </div>
        <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
          <p className="text-sm opacity-80">Comparando</p>
          <p className="mt-2 font-display text-2xl leading-snug">
            {anterior === 0
              ? "Ainda não temos o mês passado para comparar."
              : diferenca > 0
                ? `Você gastou ${brl(diferenca)} a mais que no mês passado.`
                : `Boa! ${brl(Math.abs(diferenca))} a menos que no mês passado.`}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="surface-card p-6">
          <h2 className="font-display text-2xl">Por categoria</h2>
          {isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && categorias.length === 0 && (
            <p className="mt-4 text-muted-foreground">
              Nenhum gasto ainda neste mês. Você pode anotar aqui ao lado ou falando com o agente.
            </p>
          )}
          <div className="mt-5 space-y-4">
            {categorias.map(([nome, v]) => (
              <div key={nome}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium capitalize">{nome}</span>
                  <span className="text-muted-foreground">{brl(v)}</span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${CORES_CATEGORIA[nome] ?? "bg-primary"}`}
                    style={{ width: `${Math.max(6, (v / maior) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-8 font-display text-xl">Últimos lançamentos</h3>
          <ul className="mt-3 divide-y divide-primary/10">
            {(data?.recentes ?? []).map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.descricao}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {g.categoria} · {dataCurta(g.data)}
                  </p>
                </div>
                <span className="ml-auto font-display text-lg">{brl(Number(g.valor))}</span>
                <button
                  aria-label="Apagar gasto"
                  onClick={() => delMutation.mutate(g.id)}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
        <div className="surface-card h-fit p-6">
          <h2 className="font-display text-xl">Anotar um gasto</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate();
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold">Valor (R$)</span>
              <input
                inputMode="decimal"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="35,00"
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Categoria</span>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as (typeof CATEGORIAS)[number])}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base capitalize outline-none focus:border-primary"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Descrição</span>
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Supermercado"
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              Anotar gasto
            </button>
          </form>
        </div>

        <div className="surface-card h-fit p-6">
          <h2 className="font-display text-xl">Anotar uma entrada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dinheiro que você recebeu: salário, aposentadoria, pensão, um extra…
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addEntradaMutation.mutate();
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold">Valor (R$)</span>
              <input
                inputMode="decimal"
                required
                value={valorE}
                onChange={(e) => setValorE(e.target.value)}
                placeholder="1.500,00"
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Tipo de entrada</span>
              <select
                value={categoriaE}
                onChange={(e) =>
                  setCategoriaE(e.target.value as (typeof CATEGORIAS_ENTRADA)[number])
                }
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base capitalize outline-none focus:border-primary"
              >
                {CATEGORIAS_ENTRADA.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Descrição</span>
              <input
                value={descricaoE}
                onChange={(e) => setDescricaoE(e.target.value)}
                placeholder="Salário de agosto"
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={addEntradaMutation.isPending}
              className="w-full rounded-full bg-primary-deep px-6 py-3.5 text-base font-semibold text-primary-deep-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Anotar entrada
            </button>
          </form>

          <h3 className="mt-8 font-display text-lg">Últimas entradas</h3>
          {(data?.entradasRecentes ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma entrada anotada ainda.</p>
          ) : (
            <ul className="mt-2 divide-y divide-primary/10">
              {(data?.entradasRecentes ?? []).map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.descricao}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {e.categoria} · {dataCurta(e.data)}
                    </p>
                  </div>
                  <span className="ml-auto font-display text-base text-primary-deep">
                    + {brl(Number(e.valor))}
                  </span>
                  <button
                    aria-label="Apagar entrada"
                    onClick={() => delEntradaMutation.mutate(e.id)}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        </aside>
      </section>
    </div>
  );
}
