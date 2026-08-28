import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";

import {
  estaOffline,
  tentarQuandoVoltarConexao,
  verificarAtualizacaoAgora,
} from "@/lib/atualizar-app";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { lerEventosSw, limparEventosSw, resumoPorVersaoData, VERSAO_APP } from "@/lib/eventos-sw";
import type { EventoSw, ResumoPorVersaoData } from "@/lib/eventos-sw";
import { useIdioma } from "@/lib/i18n";

type Periodo = "24h" | "7d" | "30d";
const DIAS_POR_PERIODO: Record<Periodo, number> = { "24h": 1, "7d": 7, "30d": 30 };

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
  const [eventos, setEventos] = useState<EventoSw[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("7d");
  const [versao, setVersao] = useState<string>("todas");

  const recarregarResumo = useCallback(() => setEventos(lerEventosSw()), []);

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

  const versoes = useMemo(
    () => [...new Set(eventos.map((e) => e.versao ?? "?"))].sort(),
    [eventos],
  );

  const filtrados = useMemo(() => {
    const limite = Date.now() - DIAS_POR_PERIODO[periodo] * 24 * 60 * 60 * 1000;
    return eventos.filter(
      (e) =>
        new Date(e.em).getTime() >= limite && (versao === "todas" || (e.versao ?? "?") === versao),
    );
  }, [eventos, periodo, versao]);

  const linhas: ResumoPorVersaoData[] = useMemo(() => resumoPorVersaoData(filtrados), [filtrados]);

  const totalSucesso = linhas.reduce((soma, l) => soma + l.sucesso, 0);
  const totalErro = linhas.reduce((soma, l) => soma + l.erro, 0);

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
        <div className="mt-3 flex flex-wrap gap-2">
          {(["24h", "7d", "30d"] as Periodo[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setPeriodo(opcao)}
              aria-pressed={periodo === opcao}
              className={`min-h-11 rounded-full px-4 py-2 text-base font-semibold ${
                periodo === opcao
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {opcao === "24h"
                ? t("Últimas 24h", "Last 24h")
                : opcao === "7d"
                  ? t("7 dias", "7 days")
                  : t("30 dias", "30 days")}
            </button>
          ))}
          {versoes.length > 1 ? (
            <select
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              aria-label={t("Filtrar por versão", "Filter by version")}
              className="min-h-11 rounded-full border border-border bg-background px-4 text-base"
            >
              <option value="todas">{t("Todas as versões", "All versions")}</option>
              {versoes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <p className="mt-3 text-base text-muted-foreground">
          {t("Sucesso", "Success")}: <strong className="text-primary">{totalSucesso}</strong> ·{" "}
          {t("Erro", "Error")}: <strong className="text-destructive">{totalErro}</strong>
        </p>

        {linhas.length === 0 ? (
          <p className="mt-2 text-base text-muted-foreground">
            {t(
              "Nenhum registro neste período neste aparelho.",
              "No records for this period on this device.",
            )}
          </p>
        ) : (
          <>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...linhas].reverse().map((l) => ({ ...l, rotulo: dataLocal(l.data) }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="rotulo" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={28} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="sucesso"
                    name={t("Sucesso", "Success")}
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="erro"
                    name={t("Erro", "Error")}
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

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
                setEventos([]);
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
