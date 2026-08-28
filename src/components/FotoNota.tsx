import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, History, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CATEGORIAS_GASTO, CATEGORIA_EN, type CategoriaGasto } from "@/lib/categorias";
import { useIdioma } from "@/lib/i18n";
import { lerRecibo, registrarDespesasDoRecibo } from "@/lib/recibo.functions";

type Item = {
  descricao: string;
  valor: number;
  categoria: CategoriaGasto;
  data: string;
  estabelecimento: string | null;
  hora: string | null;
  local: string | null;
};

type Tentativa = {
  em: string;
  ajuste: string | null;
  observacao: string;
  itens: Item[];
};

/** Reduz a foto para no máximo 1400px e converte em JPEG base64. */
async function prepararImagem(arquivo: File): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("imagem inválida"));
      el.src = url;
    });
    const max = 1400;
    const escala = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sem canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FotoNota({ disabled }: { disabled?: boolean }) {
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const ler = useServerFn(lerRecibo);
  const registrar = useServerFn(registrarDespesasDoRecibo);

  const [previa, setPrevia] = useState<string | null>(null);
  const [itens, setItens] = useState<Item[] | null>(null);
  const [observacao, setObservacao] = useState("");
  const [ajuste, setAjuste] = useState("");
  const [historico, setHistorico] = useState<Tentativa[]>([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const leitura = useMutation({
    mutationFn: async (entrada: { arquivo?: File; ajuste?: string }) => {
      const imagem = entrada.arquivo ? await prepararImagem(entrada.arquivo) : previa;
      if (!imagem) throw new Error("sem imagem");
      setPrevia(imagem);
      return ler({
        data: {
          imagem,
          idioma: idioma === "en" ? "en" : "pt",
          ...(entrada.ajuste ? { ajuste: entrada.ajuste } : {}),
        },
      });
    },
    onSuccess: (r, entrada) => {
      const lista = r.itens as Item[];
      setItens(lista);
      setObservacao(r.observacao);
      setHistorico((h) => [
        ...h,
        {
          em: new Date().toISOString(),
          ajuste: entrada.ajuste ?? null,
          observacao: r.observacao,
          itens: lista,
        },
      ]);
      setAjuste("");
      if (lista.length === 0) {
        toast.info(
          t("Não consegui ler despesas nessa foto", "I could not read any expense in this photo"),
        );
      }
    },
    onError: () =>
      toast.error(
        t(
          "Não consegui ler a foto. Tente com mais luz e o papel esticado.",
          "I could not read the photo. Try again with more light and the paper flat.",
        ),
      ),
  });

  const salvar = useMutation({
    mutationFn: async (lista: Item[]) => registrar({ data: { itens: lista } }),
    onSuccess: (r) => {
      toast.success(t(`${r.total} despesa(s) registrada(s)!`, `${r.total} expense(s) saved!`));
      fechar();
      void qc.invalidateQueries();
    },
    onError: () => toast.error(t("Não consegui salvar agora.", "I could not save right now.")),
  });

  function fechar() {
    setItens(null);
    setPrevia(null);
    setObservacao("");
    setAjuste("");
    setHistorico([]);
    setHistoricoAberto(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function atualizar(i: number, campo: Partial<Item>) {
    setItens((atual) =>
      atual ? atual.map((item, idx) => (idx === i ? { ...item, ...campo } : item)) : atual,
    );
  }

  const total = (itens ?? []).reduce((s, i) => s + (Number.isFinite(i.valor) ? i.valor : 0), 0);
  const local = itens?.find((i) => i.estabelecimento || i.hora || i.local);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) leitura.mutate({ arquivo });
        }}
      />
      <button
        type="button"
        disabled={disabled || leitura.isPending || salvar.isPending}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
      >
        {leitura.isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Camera className="size-5" />
        )}
        {leitura.isPending
          ? t("Lendo a foto…", "Reading the photo…")
          : t("Foto da nota", "Photo of receipt")}
      </button>

      {itens && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
            <h2 className="font-display text-xl">
              {t("Confira antes de registrar", "Check before saving")}
            </h2>
            {observacao && <p className="mt-1 text-sm text-muted-foreground">{observacao}</p>}

            {local && (
              <p className="mt-2 rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground">
                {[
                  local.estabelecimento,
                  local.hora ? `${t("às", "at")} ${local.hora}` : null,
                  local.local,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            {previa && (
              <img
                src={previa}
                alt={t("Foto da nota enviada", "Photo of the receipt you sent")}
                className="mt-3 max-h-40 w-full rounded-2xl object-contain"
              />
            )}

            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              {t(
                `${itens.length} despesa(s) encontrada(s) — ajuste o que precisar`,
                `${itens.length} expense(s) found — edit anything you need`,
              )}
            </p>

            <div className="mt-2 space-y-3">
              {itens.map((item, i) => (
                <div key={i} className="rounded-2xl bg-secondary/60 p-3">
                  <input
                    value={item.descricao}
                    onChange={(e) => atualizar(i, { descricao: e.target.value })}
                    aria-label={t("Descrição", "Description")}
                    className="w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.valor}
                      onChange={(e) => atualizar(i, { valor: Number(e.target.value) })}
                      aria-label={t("Valor", "Amount")}
                      className="rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                    />
                    <input
                      type="date"
                      value={item.data}
                      onChange={(e) => atualizar(i, { data: e.target.value })}
                      aria-label={t("Data", "Date")}
                      className="rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                    />
                    <select
                      value={item.categoria}
                      onChange={(e) => atualizar(i, { categoria: e.target.value as CategoriaGasto })}
                      aria-label={t("Categoria", "Category")}
                      className="col-span-2 rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                    >
                      {CATEGORIAS_GASTO.map((c) => (
                        <option key={c} value={c}>
                          {idioma === "en" ? CATEGORIA_EN[c] : c}
                        </option>
                      ))}
                    </select>
                    <input
                      value={item.estabelecimento ?? ""}
                      onChange={(e) => atualizar(i, { estabelecimento: e.target.value || null })}
                      placeholder={t("Estabelecimento", "Place")}
                      aria-label={t("Estabelecimento", "Place")}
                      className="rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                    />
                    <input
                      value={item.hora ?? ""}
                      onChange={(e) => atualizar(i, { hora: e.target.value || null })}
                      placeholder={t("Horário", "Time")}
                      aria-label={t("Horário", "Time")}
                      className="rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {t("Remover este item", "Remove this item")}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 font-display text-lg">
              {t("Total", "Total")}: R$ {total.toFixed(2).replace(".", ",")}
            </p>

            <div className="mt-4 rounded-2xl border border-primary/15 p-3">
              <p className="text-sm font-semibold">
                {t("A leitura saiu errada?", "Did the reading come out wrong?")}
              </p>
              <textarea
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                rows={2}
                placeholder={t(
                  "Ex.: o total é 87,90 e são 4 itens; a data é 12/08",
                  "E.g.: the total is 87.90 with 4 items; the date is Aug 12",
                )}
                className="mt-2 w-full rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-base"
              />
              <button
                type="button"
                disabled={leitura.isPending}
                onClick={() => leitura.mutate({ ajuste: ajuste.trim() || undefined })}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
              >
                {leitura.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {t("Ler a foto de novo", "Read the photo again")}
              </button>
            </div>

            {historico.length > 1 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setHistoricoAberto((a) => !a)}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
                >
                  <History className="size-4" />
                  {t(
                    `Histórico de leituras (${historico.length})`,
                    `Reading history (${historico.length})`,
                  )}
                </button>
                {historicoAberto && (
                  <ul className="mt-2 space-y-2">
                    {historico.map((h, i) => (
                      <li key={h.em} className="rounded-2xl bg-secondary/60 p-3 text-sm">
                        <p className="font-semibold">
                          {t(`Leitura ${i + 1}`, `Reading ${i + 1}`)} ·{" "}
                          {new Date(h.em).toLocaleTimeString(idioma === "en" ? "en-US" : "pt-BR")} ·{" "}
                          {t(`${h.itens.length} item(ns)`, `${h.itens.length} item(s)`)}
                        </p>
                        {h.ajuste && (
                          <p className="mt-1 text-muted-foreground">
                            {t("Ajuste pedido:", "Adjustment asked:")} {h.ajuste}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setItens(h.itens);
                            setObservacao(h.observacao);
                          }}
                          className="mt-2 min-h-11 rounded-full bg-background px-4 text-sm font-semibold text-primary"
                        >
                          {t("Usar esta leitura", "Use this reading")}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                disabled={itens.length === 0 || salvar.isPending}
                onClick={() => salvar.mutate(itens)}
                className="min-h-12 flex-1 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {salvar.isPending
                  ? t("Registrando…", "Saving…")
                  : t("Registrar despesas", "Save expenses")}
              </button>
              <button
                type="button"
                onClick={fechar}
                className="min-h-12 flex-1 rounded-full bg-secondary px-5 font-semibold text-secondary-foreground"
              >
                {t("Cancelar", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
