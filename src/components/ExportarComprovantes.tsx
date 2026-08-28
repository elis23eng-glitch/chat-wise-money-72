import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { baixarPdfComprovantes, type ComprovanteExport } from "@/lib/comprovantes-pdf";
import { useIdioma } from "@/lib/i18n";
import { listarComprovantes } from "@/lib/recibo.functions";

function primeiroDiaDoMes(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

function ultimoDiaDoMes(iso: string) {
  const [ano, mes] = iso.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(ano!, mes!, 0)).toISOString().slice(0, 10);
}

/** Exporta os comprovantes anexados às despesas como um PDF do mês ou do período. */
export function ExportarComprovantes() {
  const { t, idioma } = useIdioma();
  const listar = useServerFn(listarComprovantes);
  const hoje = new Date().toISOString().slice(0, 10);

  const [modo, setModo] = useState<"mes" | "periodo">("mes");
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [inicio, setInicio] = useState(primeiroDiaDoMes(hoje));
  const [fim, setFim] = useState(hoje);

  const de = modo === "mes" ? `${mes}-01` : inicio;
  const ate = modo === "mes" ? ultimoDiaDoMes(`${mes}-01`) : fim;

  const exportar = useMutation({
    mutationFn: async () => {
      const r = await listar({ data: { inicio: de, fim: ate } });
      const itens = r.itens as ComprovanteExport[];
      if (itens.length === 0) throw new Error("vazio");
      await baixarPdfComprovantes({ itens, inicio: de, fim: ate, idioma });
      return itens.length;
    },
    onSuccess: (total) =>
      toast.success(
        t(`PDF pronto com ${total} comprovante(s).`, `PDF ready with ${total} receipt(s).`),
      ),
    onError: (erro) =>
      erro instanceof Error && erro.message === "vazio"
        ? toast.info(
            t(
              "Nenhum comprovante anexado nesse período.",
              "No attached receipts in that period.",
            ),
          )
        : toast.error(t("Não consegui gerar o PDF agora.", "I could not build the PDF now.")),
  });

  return (
    <div className="surface-card p-6">
      <h2 className="font-display text-xl">
        {t("Exportar comprovantes em PDF", "Export receipts as PDF")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "Junta as fotos das notas guardadas num único arquivo, um comprovante por página.",
          "Puts your saved receipt photos in a single file, one receipt per page.",
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["mes", "periodo"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              modo === m
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {m === "mes" ? t("Por mês", "By month") : t("Por período", "By period")}
          </button>
        ))}
      </div>

      {modo === "mes" ? (
        <label className="mt-4 block">
          <span className="text-sm font-semibold">{t("Mês", "Month")}</span>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base"
          />
        </label>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">{t("De", "From")}</span>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">{t("Até", "To")}</span>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={exportar.isPending}
        onClick={() => exportar.mutate()}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60"
      >
        {exportar.isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <FileDown className="size-5" />
        )}
        {exportar.isPending
          ? t("Montando o PDF…", "Building the PDF…")
          : t("Baixar PDF dos comprovantes", "Download receipts PDF")}
      </button>
    </div>
  );
}
