import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FileClock, Repeat, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { VerComprovante } from "@/components/VerComprovante";
import {
  listarAuditorias,
  obterLimiares,
  salvarLimiares,
  type Limiares,
} from "@/lib/auditoria.functions";
import {
  alternarRegraRecorrente,
  apagarRegraRecorrente,
  criarRegraRecorrente,
  detectarRecorrentes,
  listarRegrasRecorrentes,
  registrarCicloRecorrente,
} from "@/lib/recorrentes.functions";
import { brl, categoriaLabel, dataCurta } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

export const Route = createFileRoute("/_autenticado/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria dos comprovantes — Wise Money" },
      {
        name: "description",
        content:
          "Histórico de leitura das notas, confiança do OCR, duplicidades, correções manuais e contas fixas.",
      },
      { property: "og:title", content: "Auditoria dos comprovantes — Wise Money" },
      {
        property: "og:description",
        content: "Veja o que a Nina leu, o que você corrigiu e configure os limites de confiança.",
      },
      { name: "twitter:title", content: "Auditoria dos comprovantes — Wise Money" },
      {
        name: "twitter:description",
        content: "Veja o que a Nina leu, o que você corrigiu e configure os limites de confiança.",
      },
    ],
  }),
  component: Auditoria,
});

const campo =
  "mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary";

function Historico() {
  const { t, idioma } = useIdioma();
  const listar = useServerFn(listarAuditorias);
  const { data, isLoading } = useQuery({
    queryKey: ["auditorias"],
    queryFn: () => listar({ data: { limite: 30 } }),
  });
  const [aberto, setAberto] = useState<string | null>(null);

  if (isLoading) return <p className="text-muted-foreground">{t("Carregando…", "Loading…")}</p>;
  if (!data?.itens.length)
    return (
      <p className="text-muted-foreground">
        {t(
          "Ainda não há leituras registradas. Envie a foto de uma nota na conversa para começar.",
          "No readings recorded yet. Send a receipt photo in the chat to start.",
        )}
      </p>
    );

  return (
    <ul className="space-y-4">
      {data.itens.map((a) => {
        const abertoAqui = aberto === a.id;
        return (
          <li key={a.id} className="rounded-3xl border border-primary/15 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {a.estabelecimento ?? t("Comprovante sem nome", "Unnamed receipt")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dataCurta(a.criadoEm.slice(0, 10))} ·{" "}
                  {t(`${a.totalItens} item(ns)`, `${a.totalItens} item(s)`)} ·{" "}
                  {t(`${a.tentativasOcr} leitura(s) de OCR`, `${a.tentativasOcr} OCR reading(s)`)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  a.confiancaMedia < 0.7
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {t("confiança", "confidence")} {Math.round(a.confiancaMedia * 100)}%
              </span>
              {a.itensBaixaConfianca > 0 && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  {t(`${a.itensBaixaConfianca} duvidoso(s)`, `${a.itensBaixaConfianca} uncertain`)}
                </span>
              )}
              {a.duplicidadeTotal > 0 && (
                <span className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-semibold text-primary-deep">
                  {t(
                    `${a.duplicidadeTotal} possível duplicidade${a.duplicidadeIgnorada ? " (ignorada)" : ""}`,
                    `${a.duplicidadeTotal} possible duplicate${a.duplicidadeIgnorada ? " (ignored)" : ""}`,
                  )}
                </span>
              )}
              {a.edicoes.length > 0 && (
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary-deep">
                  {t(`${a.edicoes.length} correção(ões)`, `${a.edicoes.length} manual edit(s)`)}
                </span>
              )}
              {a.comprovante && <VerComprovante caminho={a.comprovante} />}
              <button
                type="button"
                onClick={() => setAberto(abertoAqui ? null : a.id)}
                className="ml-auto rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
              >
                {abertoAqui ? t("Fechar", "Close") : t("Ver detalhes", "See details")}
              </button>
            </div>

            {abertoAqui && (
              <div className="mt-4 space-y-4 text-sm">
                {a.observacao && <p className="text-muted-foreground">{a.observacao}</p>}
                <div>
                  <p className="font-semibold">{t("O que foi salvo", "What was saved")}</p>
                  <ul className="mt-2 space-y-1">
                    {a.itens.map((i, idx) => (
                      <li key={`${a.id}-${idx}`} className="flex justify-between gap-3">
                        <span className="truncate">
                          {i.descricao} · {categoriaLabel(i.categoria, idioma)} ·{" "}
                          {dataCurta(i.data)}
                        </span>
                        <span className="whitespace-nowrap font-medium">{brl(i.valor)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {a.edicoes.length > 0 && (
                  <div>
                    <p className="font-semibold">
                      {t("O que você corrigiu antes de salvar", "What you changed before saving")}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {a.edicoes.map((e, idx) => (
                        <li key={`${a.id}-e-${idx}`} className="text-muted-foreground">
                          <span className="font-medium text-foreground">{e.item}</span> · {e.campo}:{" "}
                          <span className="line-through">{e.antes || "—"}</span> → {e.depois || "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Limites() {
  const { t } = useIdioma();
  const qc = useQueryClient();
  const obter = useServerFn(obterLimiares);
  const salvar = useServerFn(salvarLimiares);
  const { data } = useQuery({ queryKey: ["limiares"], queryFn: () => obter() });
  const [form, setForm] = useState<Limiares | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const gravar = useMutation({
    mutationFn: (valores: Limiares) => salvar({ data: valores }),
    onSuccess: () => {
      toast.success(t("Limites salvos!", "Thresholds saved!"));
      qc.invalidateQueries({ queryKey: ["limiares"] });
    },
    onError: () => toast.error(t("Não consegui salvar agora.", "Could not save right now.")),
  });

  if (!form) return <p className="text-muted-foreground">{t("Carregando…", "Loading…")}</p>;

  const linhas: { chave: keyof Limiares; rotulo: string; ajuda: string }[] = [
    {
      chave: "limiar_geral",
      rotulo: t("Confiança mínima do item", "Minimum item confidence"),
      ajuda: t(
        "Abaixo disso o item entra na revisão em lote.",
        "Below this the item goes into batch review.",
      ),
    },
    {
      chave: "alerta_medio",
      rotulo: t("Alerta de leitura fraca (média)", "Weak reading alert (average)"),
      ajuda: t(
        "Abaixo disso aparece o aviso vermelho para reprocessar.",
        "Below this the red reprocess warning appears.",
      ),
    },
    { chave: "limiar_valor", rotulo: t("Valor", "Amount"), ajuda: t("Campo valor.", "Amount field.") },
    { chave: "limiar_data", rotulo: t("Data", "Date"), ajuda: t("Campo data.", "Date field.") },
    {
      chave: "limiar_estabelecimento",
      rotulo: t("Estabelecimento", "Merchant"),
      ajuda: t("Campo estabelecimento.", "Merchant field."),
    },
    {
      chave: "limiar_categoria",
      rotulo: t("Categoria", "Category"),
      ajuda: t("Campo categoria.", "Category field."),
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground">
        {t(
          "Escolha a partir de qual confiança a Nina deve pedir sua revisão. Quanto maior o número, mais rigorosa ela fica.",
          "Choose the confidence level at which Nina should ask for your review. Higher means stricter.",
        )}
      </p>
      {linhas.map((l) => (
        <div key={l.chave}>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{l.rotulo}</span>
            <span className="font-display text-lg">{Math.round(form[l.chave] * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(form[l.chave] * 100)}
            onChange={(e) => setForm({ ...form, [l.chave]: Number(e.target.value) / 100 })}
            className="mt-2 w-full accent-[hsl(var(--primary))]"
          />
          <p className="text-xs text-muted-foreground">{l.ajuda}</p>
        </div>
      ))}
      <button
        type="button"
        onClick={() => gravar.mutate(form)}
        disabled={gravar.isPending}
        className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
      >
        {t("Salvar limites", "Save thresholds")}
      </button>
    </div>
  );
}

function Recorrentes() {
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const detectar = useServerFn(detectarRecorrentes);
  const listar = useServerFn(listarRegrasRecorrentes);
  const criar = useServerFn(criarRegraRecorrente);
  const alternar = useServerFn(alternarRegraRecorrente);
  const apagar = useServerFn(apagarRegraRecorrente);
  const registrar = useServerFn(registrarCicloRecorrente);

  const sugestoes = useQuery({ queryKey: ["recorrentes-sugestoes"], queryFn: () => detectar() });
  const regras = useQuery({ queryKey: ["recorrentes-regras"], queryFn: () => listar() });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["recorrentes-sugestoes"] });
    qc.invalidateQueries({ queryKey: ["recorrentes-regras"] });
  };

  const criarM = useMutation({
    mutationFn: (s: {
      chave: string;
      descricao: string;
      estabelecimento: string | null;
      categoria: string;
      valorMedio: number;
      diaDoMes: number;
    }) => criar({ data: s }),
    onSuccess: () => {
      toast.success(t("Regra criada!", "Rule created!"));
      recarregar();
    },
    onError: () => toast.error(t("Não consegui criar a regra.", "Could not create the rule.")),
  });

  const registrarM = useMutation({
    mutationFn: (v: { id: string; valor: number; data: string }) => registrar({ data: v }),
    onSuccess: () => {
      toast.success(t("Conta registrada!", "Bill recorded!"));
      recarregar();
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error(t("Não consegui registrar.", "Could not record it.")),
  });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl">
          {t("Contas que se repetem", "Bills that repeat")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Encontramos estes gastos em mais de um mês. Crie uma regra e a Nina lembra você no próximo ciclo — o registro só acontece depois da sua confirmação.",
            "We found these expenses in more than one month. Create a rule and Nina reminds you next cycle — nothing is recorded without your confirmation.",
          )}
        </p>
        {sugestoes.isLoading && (
          <p className="mt-3 text-muted-foreground">{t("Procurando…", "Looking…")}</p>
        )}
        <ul className="mt-4 space-y-3">
          {(sugestoes.data?.sugestoes ?? []).map((s) => (
            <li
              key={s.chave}
              className="flex flex-wrap items-center gap-3 rounded-3xl border border-primary/15 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{s.descricao}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {categoriaLabel(s.categoria, idioma)} ·{" "}
                  {t(`${s.meses} meses`, `${s.meses} months`)} ·{" "}
                  {t(`dia ${s.diaDoMes}`, `day ${s.diaDoMes}`)} ·{" "}
                  {s.variacao === "estável" ? t("valor estável", "stable amount") : t("valor varia", "amount varies")}
                </p>
              </div>
              <span className="ml-auto font-display text-lg">{brl(s.valorMedio)}</span>
              <button
                type="button"
                onClick={() =>
                  criarM.mutate({
                    chave: s.chave,
                    descricao: s.descricao,
                    estabelecimento: s.estabelecimento,
                    categoria: s.categoria,
                    valorMedio: s.valorMedio,
                    diaDoMes: s.diaDoMes,
                  })
                }
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {t("Criar regra", "Create rule")}
              </button>
            </li>
          ))}
          {!sugestoes.isLoading && (sugestoes.data?.sugestoes ?? []).length === 0 && (
            <li className="text-muted-foreground">
              {t(
                "Nenhuma conta repetida encontrada nos últimos meses.",
                "No repeating bills found in the last months.",
              )}
            </li>
          )}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-xl">{t("Minhas regras", "My rules")}</h3>
        <ul className="mt-4 space-y-3">
          {(regras.data?.regras ?? []).map((r) => (
            <li key={r.id} className="rounded-3xl border border-primary/15 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{r.descricao}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {categoriaLabel(r.categoria, idioma)} ·{" "}
                    {t(`todo dia ${r.diaDoMes}`, `every ${r.diaDoMes}th`)}
                    {r.proximaData ? ` · ${t("próxima", "next")} ${dataCurta(r.proximaData)}` : ""}
                  </p>
                </div>
                <span className="ml-auto font-display text-lg">{brl(r.valorMedio)}</span>
                <button
                  type="button"
                  onClick={() =>
                    registrarM.mutate({
                      id: r.id,
                      valor: r.valorMedio,
                      data: r.proximaData ?? new Date().toISOString().slice(0, 10),
                    })
                  }
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <CheckCircle2 className="mr-1 inline size-4" />
                  {t("Confirmar e registrar", "Confirm and record")}
                </button>
                <button
                  type="button"
                  onClick={() => alternar({ data: { id: r.id, ativa: !r.ativa } }).then(recarregar)}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary-deep"
                >
                  {r.ativa ? t("Pausar", "Pause") : t("Ativar", "Activate")}
                </button>
                <button
                  type="button"
                  onClick={() => apagar({ data: { id: r.id } }).then(recarregar)}
                  className="rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive"
                >
                  {t("Apagar", "Delete")}
                </button>
              </div>
            </li>
          ))}
          {(regras.data?.regras ?? []).length === 0 && (
            <li className="text-muted-foreground">
              {t("Você ainda não tem regras.", "You have no rules yet.")}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Auditoria() {
  const { t } = useIdioma();
  const [aba, setAba] = useState<"historico" | "limites" | "recorrentes">("historico");

  const abas = [
    { id: "historico" as const, rotulo: t("Histórico", "History"), icone: FileClock },
    { id: "limites" as const, rotulo: t("Limites de confiança", "Confidence thresholds"), icone: SlidersHorizontal },
    { id: "recorrentes" as const, rotulo: t("Contas fixas", "Recurring bills"), icone: Repeat },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Auditoria", "Audit")}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {t("O que a Nina leu e o que você corrigiu", "What Nina read and what you fixed")}
        </h1>
      </header>

      <div className="flex flex-wrap gap-3">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              aba === a.id
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/15"
            }`}
          >
            <a.icone className="size-4" />
            {a.rotulo}
          </button>
        ))}
      </div>

      <section className="surface-card p-6">
        {aba === "historico" && <Historico />}
        {aba === "limites" && <Limites />}
        {aba === "recorrentes" && <Recorrentes />}
      </section>
    </div>
  );
}
