import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";

import { estaOffline, tentarQuandoVoltarConexao, verificarAtualizacaoAgora } from "@/lib/atualizar-app";
import { limparEventosSw, resumoPorVersaoData, VERSAO_APP } from "@/lib/eventos-sw";
import type { ResumoPorVersaoData } from "@/lib/eventos-sw";
import { useIdioma } from "@/lib/i18n";

type Estado = "parado" | "verificando" | "atualizando" | "ok" | "offline" | "erro" | "sem-suporte";

/**
 * Painel simples de atualização do app:
 * - botão para procurar e aplicar a versão nova agora, com progresso;
 * - aviso e modo de recuperação quando falha sem internet, tentando de novo
 *   assim que a conexão voltar;
 * - contagem de atualizações que deram certo ou erro, por versão e data.
 */
export function AtualizacaoApp() {
  const { t, idioma } = useIdioma();
  const [estado, setEstado] = useState<Estado>("parado");
  const [detalhe, setDetalhe] = useState("");
  const [aguardandoConexao, setAguardandoConexao] = useState(false);
  const [linhas, setLinhas] = useState<ResumoPorVersaoData[]>([]);

  const recarregarResumo = useCallback(() => setLinhas(resumoPorVersaoData()), []);

  useEffect(() => {
    recarregarResumo();
    const aoMudar = () => recarregarResumo();
    window.addEventListener("wise-money:sw", aoMudar);
    return () => window.removeEventListener("wise-money:sw", aoMudar);
  }, [recarregarResumo]);

  const verificar = useCallback(async () => {
    setEstado("verificando");
    setDetalhe("");
    const resultado = await verificarAtualizacaoAgora();
    recarregarResumo();

    if (resultado.estado === "atualizando") {
      setEstado("atualizando");
      return;
    }
    if (resultado.estado === "sem-novidade") {
      setEstado("ok");
      return;
    }
    if (resultado.estado === "sem-suporte") {
      setEstado("sem-suporte");
      return;
    }
    if (resultado.estado === "offline") {
      setEstado("offline");
      setAguardandoConexao(true);
      return;
    }
    setEstado("erro");
    setDetalhe(resultado.mensagem);
  }, [recarregarResumo]);

  // Modo de recuperação: quando a internet voltar, tenta de novo sozinho.
  useEffect(() => {
    if (!aguardandoConexao) return;
    return tentarQuandoVoltarConexao(() => {
      setAguardandoConexao(false);
      void verificar();
    });
  }, [aguardandoConexao, verificar]);

  const ocupado = estado === "verificando" || estado === "atualizando";

  const mensagem: Record<Estado, string> = {
    parado: t(
      "Toque no botão para conferir se existe uma versão nova do app.",
      "Tap the button to check whether a newer version of the app is available.",
    ),
    verificando: t("Procurando uma versão nova…", "Looking for a newer version…"),
    atualizando: t(
      "Versão nova encontrada. Aplicando e recarregando a tela…",
      "New version found. Applying it and reloading the screen…",
    ),
    ok: t(
      "Tudo certo: você já está na versão mais nova do Wise Money.",
      "All good: you are already on the newest version of Wise Money.",
    ),
    offline: t(
      "Sem internet agora. Guardamos o pedido e vamos tentar de novo assim que a conexão voltar. O app continua funcionando com os dados salvos.",
      "No internet right now. We saved your request and will try again as soon as you are back online. The app keeps working with saved data.",
    ),
    erro: t(
      "Não deu para atualizar agora. Tente de novo em instantes.",
      "The update did not work right now. Please try again in a moment.",
    ),
    "sem-suporte": t(
      "Este navegador não guarda o app para uso offline, então não há nada para atualizar.",
      "This browser does not store the app for offline use, so there is nothing to update.",
    ),
  };

  const Icone =
    estado === "offline"
      ? WifiOff
      : estado === "erro"
        ? TriangleAlert
        : estado === "ok"
          ? CheckCircle2
          : RefreshCw;

  const dataLocal = (iso: string) =>
    iso === "?"
      ? iso
      : new Date(`${iso}T12:00:00`).toLocaleDateString(idioma === "en" ? "en-US" : "pt-BR", {
          day: "2-digit",
          month: "short",
        });

  return (
    <section className="surface-card mt-5 p-6 shadow-soft">
      <p className="flex items-center gap-2 font-display text-2xl">
        <RefreshCw className="size-6 text-primary" />
        {t("Atualização do app", "App update")}
      </p>

      <button
        type="button"
        onClick={() => void verificar()}
        disabled={ocupado}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground disabled:opacity-70"
      >
        {ocupado ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="size-5" aria-hidden />
        )}
        {ocupado
          ? t("Atualizando…", "Updating…")
          : t("Verificar atualização agora", "Check for updates now")}
      </button>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 flex items-start gap-2 text-base text-muted-foreground"
      >
        <Icone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>
          {mensagem[estado]}
          {detalhe ? <span className="block text-sm opacity-80">{detalhe}</span> : null}
        </span>
      </p>

      {estado === "offline" && aguardandoConexao ? (
        <button
          type="button"
          onClick={() => void verificar()}
          className="mt-3 min-h-12 w-full rounded-full border border-primary px-6 py-3 text-base font-semibold text-primary"
        >
          {t("Tentar de novo agora", "Try again now")}
        </button>
      ) : null}

      <div className="mt-6">
        <p className="font-display text-xl">
          {t("Histórico de atualizações", "Update history")}{" "}
          <span className="text-base text-muted-foreground">
            ({t("versão atual", "current version")} {VERSAO_APP})
          </span>
        </p>
        {linhas.length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">
            {t(
              "Ainda não há registros neste aparelho.",
              "There are no records on this device yet.",
            )}
          </p>
        ) : (
          <>
            <table className="mt-3 w-full text-left text-base">
              <thead className="text-sm uppercase text-muted-foreground">
                <tr>
                  <th className="py-1">{t("Versão", "Version")}</th>
                  <th className="py-1">{t("Data", "Date")}</th>
                  <th className="py-1 text-right">{t("Sucesso", "Success")}</th>
                  <th className="py-1 text-right">{t("Erro", "Error")}</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={`${linha.versao}-${linha.data}`} className="border-t border-border/60">
                    <td className="py-2">{linha.versao}</td>
                    <td className="py-2">{dataLocal(linha.data)}</td>
                    <td className="py-2 text-right font-semibold text-primary">{linha.sucesso}</td>
                    <td className="py-2 text-right font-semibold text-destructive">{linha.erro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={() => {
                limparEventosSw();
                setLinhas([]);
              }}
              className="mt-3 text-sm font-semibold text-muted-foreground underline"
            >
              {t("Limpar histórico", "Clear history")}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
