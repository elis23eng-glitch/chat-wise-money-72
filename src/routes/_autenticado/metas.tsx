import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { addToGoal, createGoal, deleteGoal, getOverview } from "@/lib/finance.functions";
import { brl, dataCurta } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/_autenticado/metas")({
  head: () => ({
    meta: [
      { title: "Minhas metas — Wise Money" },
      {
        name: "description",
        content: "Crie metas de economia, guarde aos poucos e acompanhe o progresso de cada uma.",
      },
      { property: "og:title", content: "Minhas metas financeiras" },
      {
        property: "og:description",
        content: "Defina objetivos, guarde um pouco por vez e veja o quanto já caminhou.",
      },
      { name: "twitter:title", content: "Minhas metas financeiras" },
      {
        name: "twitter:description",
        content: "Defina objetivos, guarde um pouco por vez e veja o quanto já caminhou.",
      },
    ],
  }),
  component: Metas,
});

function Metas() {
  const { t } = useIdioma();
  const qc = useQueryClient();
  const overview = useServerFn(getOverview);
  const criar = useServerFn(createGoal);
  const guardar = useServerFn(addToGoal);
  const apagar = useServerFn(deleteGoal);

  const { data } = useQuery({ queryKey: ["overview"], queryFn: () => overview() });
  const metas = data?.metas ?? [];

  const [titulo, setTitulo] = useState("");
  const [alvo, setAlvo] = useState("");
  const [prazo, setPrazo] = useState("");

  const criarMutation = useMutation({
    mutationFn: () =>
      criar({
        data: {
          titulo,
          valor_alvo: Number(alvo.replace(",", ".")),
          prazo: prazo || null,
        },
      }),
    onSuccess: () => {
      setTitulo("");
      setAlvo("");
      setPrazo("");
      toast.success(t("Meta criada! Vamos juntos.", "Goal created! Let's go together."));
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () =>
      toast.error(
        t("Confira os dados da meta e tente de novo.", "Check the goal details and try again."),
      ),
  });

  const guardarMutation = useMutation({
    mutationFn: (v: { id: string; valor: number }) => guardar({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overview"] }),
  });

  const apagarMutation = useMutation({
    mutationFn: (id: string) => apagar({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["overview"] }),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Metas", "Goals")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("Onde você quer chegar", "Where you want to get to")}
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          {t(
            "Metas pequenas funcionam melhor. Comece com um valor que caiba no seu mês.",
            "Small goals work best. Start with an amount that fits your monthly budget.",
          )}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {metas.length === 0 && (
            <div className="surface-card p-8 text-center">
              <p className="font-display text-2xl">{t("Nenhuma meta ainda", "No goals yet")}</p>
              <p className="mt-2 text-muted-foreground">
                {t(
                  "Que tal começar com uma reserva de R$ 500 para imprevistos?",
                  "How about starting with a $500 emergency fund?",
                )}
              </p>
            </div>
          )}
          {metas.map((m) => {
            const pct = Math.min(100, Math.round((m.valor_atual / m.valor_alvo) * 100));
            const falta = Math.max(0, m.valor_alvo - m.valor_atual);
            return (
              <article key={m.id} className="surface-card p-6">
                <div className="flex items-start gap-3">
                  <div>
                    <h2 className="font-display text-2xl">{m.titulo}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t(
                        `${brl(m.valor_atual)} de ${brl(m.valor_alvo)}`,
                        `${brl(m.valor_atual)} of ${brl(m.valor_alvo)}`,
                      )}
                      {m.prazo
                        ? ` · ${t(`até ${dataCurta(m.prazo)}`, `until ${dataCurta(m.prazo)}`)}`
                        : ""}
                    </p>
                  </div>
                  <button
                    aria-label={t("Apagar meta", "Delete goal")}
                    onClick={() => apagarMutation.mutate(m.id)}
                    className="ml-auto rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-4 h-4 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.max(3, pct)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(
                    `${pct}% concluído · faltam ${brl(falta)}`,
                    `${pct}% complete · ${brl(falta)} left`,
                  )}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[20, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => guardarMutation.mutate({ id: m.id, valor: v })}
                      className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      {t(`Guardar R$ ${v}`, `Save $${v}`)}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="surface-card h-fit p-6">
          <h2 className="font-display text-xl">{t("Nova meta", "New goal")}</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              criarMutation.mutate();
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold">
                {t("O que você quer conquistar?", "What do you want to achieve?")}
              </span>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={t("Reserva de emergência", "Emergency fund")}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">
                {t("Valor da meta (R$)", "Goal amount ($)")}
              </span>
              <input
                required
                inputMode="decimal"
                value={alvo}
                onChange={(e) => setAlvo(e.target.value)}
                placeholder="1200"
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">
                {t("Prazo (opcional)", "Deadline (optional)")}
              </span>
              <input
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={criarMutation.isPending}
              className="w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {t("Criar meta", "Create goal")}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
