import { Check, Download, Eye, Link2, Minus, Share2, X } from "lucide-react";

import { PreviaRelatorio } from "@/components/PreviaRelatorio";
import { listarSecoesSelecionadas, type OpcaoSecaoRelatorio } from "@/lib/dashboard-report";
import type { DadosRelatorio, SecoesRelatorio } from "@/lib/pdf-report";

export type AcaoRelatorio = "baixar" | "compartilhar" | "link";
export type Traduzir = (portugues: string, ingles: string) => string;

type ReportControlsProps = {
  aberto: boolean;
  desabilitado: boolean;
  exportando: AcaoRelatorio | null;
  idioma: "pt" | "en";
  secoes: SecoesRelatorio;
  opcoesSecoes: OpcaoSecaoRelatorio[];
  nenhumaSecao: boolean;
  linkRelatorio: string;
  linkCopiado: boolean;
  aviso: string;
  t: Traduzir;
  onAlternar: () => void;
  onIdiomaChange: (idioma: "pt" | "en") => void;
  onSecaoChange: (chave: keyof SecoesRelatorio, selecionada: boolean) => void;
  onAbrirPrevia: () => void;
  onExportar: (acao: AcaoRelatorio) => void;
  onCopiarLink: () => void;
};

export function DashboardReportControls({
  aberto,
  desabilitado,
  exportando,
  idioma,
  secoes,
  opcoesSecoes,
  nenhumaSecao,
  linkRelatorio,
  linkCopiado,
  aviso,
  t,
  onAlternar,
  onIdiomaChange,
  onSecaoChange,
  onAbrirPrevia,
  onExportar,
  onCopiarLink,
}: ReportControlsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onAlternar}
        disabled={desabilitado}
        aria-expanded={aberto}
        className="mt-5 ml-0 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:ml-3"
      >
        <Download className="size-4" />
        {t("Exportar PDF", "Export PDF")}
      </button>

      {aberto && (
        <div className="surface-card mt-4 max-w-2xl space-y-5 p-6">
          <div>
            <h2 className="font-display text-xl">
              {t("O que entra no PDF?", "What goes into the PDF?")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(
                "Marque as partes que você quer no relatório.",
                "Check the parts you want in the report.",
              )}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {opcoesSecoes.map((secao) => (
                <label
                  key={secao.chave}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-base"
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-[var(--primary)]"
                    checked={secoes[secao.chave]}
                    onChange={(evento) => onSecaoChange(secao.chave, evento.target.checked)}
                  />
                  {secao.rotulo}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Idioma do PDF", "PDF language")}
            </h3>
            <div
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary p-1"
              role="group"
              aria-label={t("Idioma do PDF", "PDF language")}
            >
              {[
                { valor: "pt" as const, rotulo: "Português (BR)" },
                { valor: "en" as const, rotulo: "English" },
              ].map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => onIdiomaChange(opcao.valor)}
                  aria-pressed={idioma === opcao.valor}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    idioma === opcao.valor
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAbrirPrevia}
              disabled={nenhumaSecao}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
            >
              <Eye className="size-5" />
              {t("Ver prévia", "Preview report")}
            </button>
            <button
              type="button"
              onClick={() => onExportar("baixar")}
              disabled={nenhumaSecao || exportando !== null}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Download className="size-5" />
              {exportando === "baixar"
                ? t("Gerando PDF…", "Generating PDF…")
                : t("Baixar PDF", "Download PDF")}
            </button>
            <button
              type="button"
              onClick={() => onExportar("compartilhar")}
              disabled={nenhumaSecao || exportando !== null}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Share2 className="size-5" />
              {exportando === "compartilhar"
                ? t("Preparando…", "Preparing…")
                : t("Compartilhar", "Share")}
            </button>
            <button
              type="button"
              onClick={() => onExportar("link")}
              disabled={nenhumaSecao || exportando !== null}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Link2 className="size-5" />
              {exportando === "link"
                ? t("Criando link…", "Creating link…")
                : t("Compartilhar por link", "Share by link")}
            </button>
          </div>

          {linkRelatorio && (
            <div className="rounded-2xl border border-primary/20 bg-secondary p-4">
              <p className="text-base font-semibold text-primary-deep">
                {linkCopiado
                  ? t("Link copiado! Vale por 7 dias.", "Link copied! Valid for 7 days.")
                  : t("Link pronto — vale por 7 dias.", "Link ready — valid for 7 days.")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={linkRelatorio}
                  onFocus={(evento) => evento.currentTarget.select()}
                  aria-label={t("Link do relatório", "Report link")}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={onCopiarLink}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                >
                  {t("Copiar", "Copy")}
                </button>
                <a
                  href={linkRelatorio}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
                >
                  {t("Abrir", "Open")}
                </a>
              </div>
            </div>
          )}

          {nenhumaSecao && (
            <p className="text-sm text-destructive">
              {t(
                "Escolha pelo menos uma seção para gerar o PDF.",
                "Pick at least one section to generate the PDF.",
              )}
            </p>
          )}
          {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}
        </div>
      )}
    </>
  );
}

type ReportPreviewProps = {
  aberta: boolean;
  dados: DadosRelatorio | null;
  idioma: "pt" | "en";
  secoes: SecoesRelatorio;
  opcoesSecoes: OpcaoSecaoRelatorio[];
  conferido: boolean;
  exportando: AcaoRelatorio | null;
  linkRelatorio: string;
  linkCopiado: boolean;
  aviso: string;
  t: Traduzir;
  onConferidoChange: (conferido: boolean) => void;
  onFechar: () => void;
  onExportar: (acao: AcaoRelatorio) => void;
};

export function DashboardReportPreview({
  aberta,
  dados,
  idioma,
  secoes,
  opcoesSecoes,
  conferido,
  exportando,
  linkRelatorio,
  linkCopiado,
  aviso,
  t,
  onConferidoChange,
  onFechar,
  onExportar,
}: ReportPreviewProps) {
  if (!aberta || !dados) return null;

  const secoesSelecionadas = listarSecoesSelecionadas(secoes, opcoesSecoes);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-foreground/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t("Prévia do relatório", "Report preview")}
    >
      <div className="surface-card mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="font-display text-xl leading-none">
              {t("Prévia do relatório", "Report preview")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {(idioma === "pt" ? "Português (BR)" : "English") +
                " · " +
                secoesSelecionadas.join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary-deep hover:bg-primary/15"
          >
            <X className="size-4" />
            {t("Fechar", "Close")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-4">
          <div className="mx-auto mb-4 max-w-2xl rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-lg">
              {t("Confira antes de exportar", "Check before exporting")}
            </h3>
            <ul className="mt-3 space-y-2 text-base">
              <li className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-4" />
                </span>
                <span>
                  {t("Idioma do relatório:", "Report language:")}{" "}
                  <strong>{idioma === "pt" ? "Português (BR)" : "English"}</strong>
                </span>
              </li>
              {opcoesSecoes.map((secao) => {
                const incluida = secoes[secao.chave];
                return (
                  <li key={secao.chave} className="flex items-center gap-3">
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full ${
                        incluida ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {incluida ? <Check className="size-4" /> : <Minus className="size-4" />}
                    </span>
                    <span className={incluida ? "" : "text-muted-foreground"}>
                      {secao.rotulo} —{" "}
                      {incluida ? t("incluída", "included") : t("fora do PDF", "not in the PDF")}
                    </span>
                  </li>
                );
              })}
            </ul>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-secondary px-4 py-3 text-base font-semibold text-primary-deep">
              <input
                type="checkbox"
                checked={conferido}
                onChange={(evento) => onConferidoChange(evento.target.checked)}
                className="size-5 accent-[hsl(var(--primary))]"
              />
              {t(
                "Conferi o idioma e as seções, pode exportar",
                "I checked the language and sections, ready to export",
              )}
            </label>
          </div>

          <PreviaRelatorio dados={dados} />
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border p-4">
          <button
            type="button"
            onClick={() => onExportar("baixar")}
            disabled={exportando !== null}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            <Download className="size-5" />
            {t("Baixar PDF", "Download PDF")}
          </button>
          <button
            type="button"
            onClick={() => onExportar("compartilhar")}
            disabled={exportando !== null}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-3 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Share2 className="size-5" />
            {t("Compartilhar", "Share")}
          </button>
          <button
            type="button"
            onClick={() => onExportar("link")}
            disabled={exportando !== null}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-3 text-base font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Link2 className="size-5" />
            {exportando === "link"
              ? t("Criando link…", "Creating link…")
              : t("Compartilhar por link", "Share by link")}
          </button>
        </div>

        {(linkRelatorio || aviso) && (
          <div className="border-t border-border p-4 text-sm">
            {linkRelatorio && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={linkRelatorio}
                  onFocus={(evento) => evento.currentTarget.select()}
                  aria-label={t("Link do relatório", "Report link")}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="text-muted-foreground">
                  {linkCopiado
                    ? t("Copiado! Vale 7 dias.", "Copied! Valid for 7 days.")
                    : t("Vale por 7 dias.", "Valid for 7 days.")}
                </span>
              </div>
            )}
            {aviso && <p className="mt-2 text-muted-foreground">{aviso}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
