import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { getDadosCsv } from "@/lib/exportar.functions";
import { categoriaLabel } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

type Periodo = "mes" | "ano" | "tudo";

function intervalo(periodo: Periodo) {
  const hoje = new Date();
  const fim = hoje.toISOString().slice(0, 10);
  if (periodo === "mes") {
    const inicio = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    return { inicio, fim };
  }
  if (periodo === "ano") {
    return { inicio: `${hoje.getUTCFullYear()}-01-01`, fim };
  }
  return { inicio: "2000-01-01", fim };
}

function csvCampo(valor: string | number) {
  const texto = String(valor ?? "");
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** Exporta gastos, entradas e totais por categoria em um arquivo CSV. */
export function ExportarCsv() {
  const { t, idioma } = useIdioma();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [ocupado, setOcupado] = useState(false);
  const buscar = useServerFn(getDadosCsv);

  async function baixar() {
    setOcupado(true);
    try {
      const { inicio, fim } = intervalo(periodo);
      const { linhas, categorias } = await buscar({ data: { inicio, fim } });
      if (linhas.length === 0) {
        toast.info(
          t("Não há lançamentos neste período.", "There are no entries in this period."),
        );
        return;
      }

      const cabecalho = [
        t("tipo", "type"),
        t("data", "date"),
        t("descricao", "description"),
        t("categoria", "category"),
        t("valor", "amount_brl"),
        t("estabelecimento", "merchant"),
        t("hora", "time"),
        t("tem_comprovante", "has_receipt"),
      ].join(";");

      const corpo = linhas.map((l) =>
        [
          l.tipo === "gasto" ? t("gasto", "expense") : t("entrada", "income"),
          l.data,
          l.descricao,
          categoriaLabel(l.categoria, idioma),
          l.valor.toFixed(2),
          l.estabelecimento,
          l.hora,
          l.comprovante,
        ]
          .map(csvCampo)
          .join(";"),
      );

      const resumo = [
        "",
        t("RESUMO POR CATEGORIA", "SUMMARY BY CATEGORY"),
        [t("tipo", "type"), t("categoria", "category"), t("itens", "items"), t("total", "total_brl")].join(
          ";",
        ),
        ...categorias.map((c) =>
          [
            c.tipo === "gasto" ? t("gasto", "expense") : t("entrada", "income"),
            categoriaLabel(c.categoria, idioma),
            c.itens,
            c.total.toFixed(2),
          ]
            .map(csvCampo)
            .join(";"),
        ),
      ];

      const conteudo = `\uFEFF${[cabecalho, ...corpo, ...resumo].join("\r\n")}`;
      const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wise-money-${periodo}-${fim}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(
        t(
          `Arquivo baixado com ${linhas.length} lançamentos.`,
          `File downloaded with ${linhas.length} entries.`,
        ),
      );
    } catch {
      toast.error(
        t(
          "Não consegui gerar o arquivo agora. Tente de novo.",
          "I could not generate the file now. Please try again.",
        ),
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="surface-card p-5">
      <p className="font-display text-lg">{t("Baixar planilha (CSV)", "Download spreadsheet (CSV)")}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "Um arquivo com seus gastos, entradas e o total por categoria para abrir no Excel ou Google Planilhas.",
          "A file with your expenses, income and category totals to open in Excel or Google Sheets.",
        )}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["mes", "ano", "tudo"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              periodo === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-primary/10"
            }`}
          >
            {p === "mes"
              ? t("Este mês", "This month")
              : p === "ano"
                ? t("Este ano", "This year")
                : t("Tudo", "Everything")}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={baixar}
        disabled={ocupado}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        <Download className="size-5" />
        {ocupado ? t("Preparando…", "Preparing…") : t("Baixar CSV", "Download CSV")}
      </button>
    </div>
  );
}
