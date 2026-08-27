import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  addExpense,
  addIncome,
  deleteExpense,
  deleteIncome,
  getOverview,
} from "@/lib/finance.functions";
import { brl, dataCurta, CORES_CATEGORIA, categoriaLabel, notaConversao } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";
import { EditarLancamento, type LancamentoEditavel } from "@/components/EditarLancamento";
import { ConfirmarExclusao } from "@/components/ConfirmarExclusao";

export const Route = createFileRoute("/_autenticado/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo dos gastos — Wise Money" },
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
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const overview = useServerFn(getOverview);
  const criar = useServerFn(addExpense);
  const apagar = useServerFn(deleteExpense);
  const criarEntrada = useServerFn(addIncome);
  const apagarEntrada = useServerFn(deleteIncome);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["overview"],
    queryFn: () => overview(),
  });

  const [editando, setEditando] = useState<{
    tipo: "gasto" | "entrada";
    lancamento: LancamentoEditavel;
  } | null>(null);

  const [confirmando, setConfirmando] = useState<{
    tipo: "gasto" | "entrada";
    id: string;
    descricao: string;
    valor: number;
  } | null>(null);

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
      toast.success(t("Entrada anotada!", "Income recorded!"));
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () =>
      toast.error(t("Confira o valor e tente de novo.", "Check the amount and try again.")),
  });

  const delEntradaMutation = useMutation({
    mutationFn: (id: string) => apagarEntrada({ data: { id } }),
    onSuccess: () => {
      toast.success(t("Entrada apagada.", "Income deleted."));
      setConfirmando(null);
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error(t("Não consegui apagar.", "Could not delete.")),
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
      toast.success(t("Gasto anotado!", "Expense recorded!"));
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () =>
      toast.error(t("Confira o valor e tente de novo.", "Check the amount and try again.")),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => {
      toast.success(t("Gasto apagado.", "Expense deleted."));
      setConfirmando(null);
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error(t("Não consegui apagar.", "Could not delete.")),
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
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {t("Resumo", "Summary")}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            {t("Como está seu mês", "How your month is going")}
          </h1>
          {notaConversao(idioma) && (
            <p className="mt-2 text-sm text-muted-foreground">{notaConversao(idioma)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["dashboard"] });
            refetch();
          }}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-base font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <RefreshCw className={`size-5 ${isFetching ? "animate-spin" : ""}`} />
          {t("Atualizar", "Refresh")}
        </button>
      </header>

      <div
        className={`rounded-3xl p-6 ${
          saldo >= 0
            ? "bg-primary-deep text-primary-deep-foreground"
            : "bg-destructive text-destructive-foreground"
        }`}
      >
        <p className="text-sm opacity-90">
          {t("Saldo do mês (entradas menos gastos)", "Month's balance (income minus expenses)")}
        </p>
        <p className="mt-2 font-display text-4xl">{brl(saldo)}</p>
        <p className="mt-2 text-base opacity-90">
          {saldo >= 0
            ? t(
                "Suas entradas cobrem seus gastos. Continue assim!",
                "Your income covers your expenses. Keep it up!",
              )
            : t(
                "Atenção: os gastos passaram das entradas neste mês.",
                "Watch out: expenses went over income this month.",
              )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">
            {t("Entrou neste mês", "Income this month")}
          </p>
          <p className="mt-2 font-display text-4xl text-primary-deep">{brl(entradas)}</p>
        </div>
        <div className="surface-card p-6 shadow-soft">
          <p className="text-sm text-muted-foreground">
            {t("Gasto neste mês", "Spent this month")}
          </p>
          <p className="mt-2 font-display text-4xl">{brl(total)}</p>
        </div>
        <div className="surface-card p-6">
          <p className="text-sm text-muted-foreground">{t("Mês passado", "Last month")}</p>
          <p className="mt-2 font-display text-4xl">{brl(anterior)}</p>
        </div>
        <div className="rounded-3xl bg-primary-deep p-6 text-primary-deep-foreground">
          <p className="text-sm opacity-80">{t("Comparando", "Comparing")}</p>
          <p className="mt-2 font-display text-2xl leading-snug">
            {anterior === 0
              ? t(
                  "Ainda não temos o mês passado para comparar.",
                  "We don't have last month to compare yet.",
                )
              : diferenca > 0
                ? t(
                    `Você gastou ${brl(diferenca)} a mais que no mês passado.`,
                    `You spent ${brl(diferenca)} more than last month.`,
                  )
                : t(
                    `Boa! ${brl(Math.abs(diferenca))} a menos que no mês passado.`,
                    `Nice! ${brl(Math.abs(diferenca))} less than last month.`,
                  )}
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="surface-card p-6">
          <h2 className="font-display text-2xl">{t("Por categoria", "By category")}</h2>
          {isLoading && (
            <p className="mt-4 text-sm text-muted-foreground">{t("Carregando…", "Loading…")}</p>
          )}
          {!isLoading && categorias.length === 0 && (
            <p className="mt-4 text-muted-foreground">
              {t(
                "Nenhum gasto ainda neste mês. Você pode anotar aqui ao lado ou falando com o agente.",
                "No expenses yet this month. You can add one here or by chatting with the assistant.",
              )}
            </p>
          )}
          <div className="mt-5 space-y-4">
            {categorias.map(([nome, v]) => (
              <div key={nome}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium capitalize">{categoriaLabel(nome, idioma)}</span>
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

          <h3 className="mt-8 font-display text-xl">
            {t("Últimos lançamentos", "Latest entries")}
          </h3>
          <ul className="mt-3 divide-y divide-primary/10">
            {(data?.recentes ?? []).map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.descricao}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {categoriaLabel(g.categoria, idioma)} · {dataCurta(g.data)}
                  </p>
                </div>
                <span className="ml-auto font-display text-lg">{brl(Number(g.valor))}</span>
                <button
                  aria-label={t("Corrigir gasto", "Correct expense")}
                  onClick={() =>
                    setEditando({
                      tipo: "gasto",
                      lancamento: { ...g, valor: Number(g.valor), descricao: g.descricao ?? "" },
                    })
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={t("Apagar gasto", "Delete expense")}
                  onClick={() =>
                    setConfirmando({
                      tipo: "gasto",
                      id: g.id,
                      descricao: g.descricao ?? "",
                      valor: Number(g.valor),
                    })
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
          <div className="surface-card h-fit p-6">
            <h2 className="font-display text-xl">{t("Anotar um gasto", "Add an expense")}</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate();
              }}
            >
              <label className="block">
                <span className="text-sm font-semibold">{t("Valor (R$)", "Amount (R$)")}</span>
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
                <span className="text-sm font-semibold">{t("Categoria", "Category")}</span>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as (typeof CATEGORIAS)[number])}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base capitalize outline-none focus:border-primary"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {categoriaLabel(c, idioma)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{t("Descrição", "Description")}</span>
                <input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder={t("Supermercado", "Groceries")}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                />
              </label>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
              >
                {t("Anotar gasto", "Add expense")}
              </button>
            </form>
          </div>

          <div className="surface-card h-fit p-6">
            <h2 className="font-display text-xl">{t("Anotar uma entrada", "Add income")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "Dinheiro que você recebeu: salário, aposentadoria, pensão, um extra…",
                "Money you received: salary, retirement, pension, extra work…",
              )}
            </p>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                addEntradaMutation.mutate();
              }}
            >
              <label className="block">
                <span className="text-sm font-semibold">{t("Valor (R$)", "Amount (R$)")}</span>
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
                <span className="text-sm font-semibold">{t("Tipo de entrada", "Income type")}</span>
                <select
                  value={categoriaE}
                  onChange={(e) =>
                    setCategoriaE(e.target.value as (typeof CATEGORIAS_ENTRADA)[number])
                  }
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base capitalize outline-none focus:border-primary"
                >
                  {CATEGORIAS_ENTRADA.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {categoriaLabel(c, idioma)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold">{t("Descrição", "Description")}</span>
                <input
                  value={descricaoE}
                  onChange={(e) => setDescricaoE(e.target.value)}
                  placeholder={t("Salário de agosto", "August salary")}
                  className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
                />
              </label>
              <button
                type="submit"
                disabled={addEntradaMutation.isPending}
                className="w-full rounded-full bg-primary-deep px-6 py-3.5 text-base font-semibold text-primary-deep-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {t("Anotar entrada", "Add income")}
              </button>
            </form>

            <h3 className="mt-8 font-display text-lg">{t("Últimas entradas", "Latest income")}</h3>
            {(data?.entradasRecentes ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("Nenhuma entrada anotada ainda.", "No income recorded yet.")}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-primary/10">
                {(data?.entradasRecentes ?? []).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.descricao}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {categoriaLabel(e.categoria, idioma)} · {dataCurta(e.data)}
                      </p>
                    </div>
                    <span className="ml-auto font-display text-base text-primary-deep">
                      + {brl(Number(e.valor))}
                    </span>
                    <button
                      aria-label={t("Corrigir entrada", "Correct income")}
                      onClick={() =>
                        setEditando({
                          tipo: "entrada",
                          lancamento: {
                            ...e,
                            valor: Number(e.valor),
                            descricao: e.descricao ?? "",
                          },
                        })
                      }
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label={t("Apagar entrada", "Delete income")}
                      onClick={() =>
                        setConfirmando({
                          tipo: "entrada",
                          id: e.id,
                          descricao: e.descricao ?? "",
                          valor: Number(e.valor),
                        })
                      }

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

      <EditarLancamento
        tipo={editando?.tipo ?? "gasto"}
        lancamento={editando?.lancamento ?? null}
        aoFechar={() => setEditando(null)}
      />

      <ConfirmarExclusao
        aberto={!!confirmando}
        titulo={
          confirmando?.tipo === "entrada"
            ? t("Apagar esta entrada?", "Delete this income?")
            : t("Apagar este gasto?", "Delete this expense?")
        }
        descricao={`${confirmando?.descricao ?? ""} — ${brl(confirmando?.valor ?? 0)}`}
        carregando={delMutation.isPending || delEntradaMutation.isPending}
        aoCancelar={() => setConfirmando(null)}
        aoConfirmar={() => {
          if (!confirmando) return;
          if (confirmando.tipo === "gasto") delMutation.mutate(confirmando.id);
          else delEntradaMutation.mutate(confirmando.id);
        }}
      />
    </div>
  );
}
