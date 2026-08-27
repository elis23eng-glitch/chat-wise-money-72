import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { updateExpense, updateIncome } from "@/lib/finance.functions";
import { categoriaLabel } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

const CATEGORIAS_GASTO = [
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

export type LancamentoEditavel = {
  id: string;
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
};

type Props = {
  tipo: "gasto" | "entrada";
  lancamento: LancamentoEditavel | null;
  aoFechar: () => void;
};

/** Corrige um lançamento já registrado (valor, categoria, descrição ou data). */
export function EditarLancamento({ tipo, lancamento, aoFechar }: Props) {
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const salvarGasto = useServerFn(updateExpense);
  const salvarEntrada = useServerFn(updateIncome);

  const categorias = tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_ENTRADA;

  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<string>(categorias[0]);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");

  useEffect(() => {
    if (!lancamento) return;
    setValor(String(lancamento.valor).replace(".", ","));
    setCategoria(lancamento.categoria);
    setDescricao(lancamento.descricao ?? "");
    setData(lancamento.data.slice(0, 10));
  }, [lancamento]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lancamento) return;
      const payload = {
        id: lancamento.id,
        valor: Number(valor.replace(/\./g, "").replace(",", ".")),
        categoria,
        descricao: descricao || categoria,
        data,
      };
      if (tipo === "gasto") {
        await salvarGasto({ data: payload as never });
      } else {
        await salvarEntrada({ data: payload as never });
      }
    },
    onSuccess: () => {
      toast.success(t("Lançamento corrigido!", "Entry corrected!"));
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      aoFechar();
    },
    onError: () =>
      toast.error(
        t("Confira os dados e tente de novo.", "Please check the details and try again."),
      ),
  });

  if (!lancamento) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="surface-card w-full max-w-md p-6 shadow-soft">
        <h2 className="font-display text-2xl">
          {tipo === "gasto"
            ? t("Corrigir gasto", "Correct expense")
            : t("Corrigir entrada", "Correct income")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Anotou errado? Ajuste o valor, a categoria, a descrição ou a data.",
            "Wrote it down wrong? Adjust the amount, category, description or date.",
          )}
        </p>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold">{t("Valor (R$)", "Amount (R$)")}</span>
            <input
              inputMode="decimal"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("Categoria", "Category")}</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base capitalize outline-none focus:border-primary"
            >
              {categorias.map((c) => (
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
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("Data", "Date")}</span>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={aoFechar}
              className="flex-1 rounded-full border border-input bg-card px-5 py-3 text-base font-semibold transition-colors hover:bg-secondary"
            >
              {t("Cancelar", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60"
            >
              {mutation.isPending ? t("Salvando…", "Saving…") : t("Salvar correção", "Save fix")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
