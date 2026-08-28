import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { History, KeyRound, ShieldPlus, Trash2 } from "lucide-react";

import { useIdioma } from "@/lib/i18n";
import { idDoDispositivo } from "@/lib/dispositivo";
import {
  gerarCodigosRecuperacao,
  getDispositivosConfiaveis,
  getHistoricoAcessos,
  getStatusCodigosRecuperacao,
  removerDispositivoConfiavel,
  salvarDispositivoConfiavel,
  usarCodigoRecuperacao,
} from "@/lib/seguranca.functions";

const botao =
  "rounded-full border border-input bg-card px-5 py-3 text-base font-semibold transition-colors hover:bg-secondary disabled:opacity-60";
const botaoPrimario =
  "rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60";

/** Códigos de recuperação do 2FA. */
export function CodigosRecuperacao() {
  const { t, idioma } = useIdioma();
  const locale = idioma === "en" ? "en-US" : "pt-BR";
  const gerar = useServerFn(gerarCodigosRecuperacao);
  const usar = useServerFn(usarCodigoRecuperacao);
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [gerando, setGerando] = useState(false);
  const [codigoDigitado, setCodigoDigitado] = useState("");

  const status = useQuery({
    queryKey: ["seguranca", "codigos"],
    queryFn: () => getStatusCodigosRecuperacao(),
  });

  async function aoGerar() {
    setGerando(true);
    try {
      const r = await gerar({ data: undefined });
      setCodigos(r.codigos);
      await status.refetch();
      toast.success(t("Códigos gerados. Guarde-os agora!", "Codes generated. Save them now!"));
    } catch {
      toast.error(t("Não consegui gerar agora.", "Could not generate them right now."));
    } finally {
      setGerando(false);
    }
  }

  async function aoUsar() {
    try {
      const r = await usar({ data: { codigo: codigoDigitado } });
      if (!r.ok) {
        toast.error(t("Código inválido ou já usado.", "Invalid or already used code."));
        return;
      }
      setCodigoDigitado("");
      toast.success(
        t(
          "Código aceito. A verificação em duas etapas foi removida — ative de novo em um aparelho novo.",
          "Code accepted. Two-step verification was removed — turn it on again on a new device.",
        ),
      );
    } catch {
      toast.error(t("Não consegui validar agora.", "Could not validate right now."));
    }
  }

  function baixar() {
    if (!codigos) return;
    const texto = `Wise Money — ${t("códigos de recuperação", "recovery codes")}\n\n${codigos.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wise-money-codigos-recuperacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="surface-card mt-6 p-6 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <KeyRound className="size-6 text-primary" />
        {t("Códigos de recuperação", "Recovery codes")}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">
        {t(
          "Se você perder o celular com o aplicativo autenticador, use um destes códigos para voltar a entrar. Cada código funciona uma única vez. Guarde em papel ou em um cofre de senhas.",
          "If you lose the phone with your authenticator app, use one of these codes to get back in. Each code works only once. Keep them on paper or in a password vault.",
        )}
      </p>

      <p className="mt-3 text-base">
        {status.data
          ? t(
              `Você tem ${status.data.disponiveis} código(s) disponível(is).`,
              `You have ${status.data.disponiveis} code(s) available.`,
            )
          : t("Verificando…", "Checking…")}
        {status.data?.geradoEm
          ? ` · ${t("gerados em", "generated on")} ${new Date(status.data.geradoEm).toLocaleDateString(locale)}`
          : ""}
      </p>

      {codigos && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            {t(
              "Estes códigos só aparecem agora. Copie antes de sair da tela.",
              "These codes are shown only now. Copy them before leaving this screen.",
            )}
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-lg">
            {codigos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={botao} onClick={baixar}>
              {t("Baixar arquivo", "Download file")}
            </button>
            <button
              type="button"
              className={botao}
              onClick={() => {
                void navigator.clipboard.writeText(codigos.join("\n"));
                toast.success(t("Copiado!", "Copied!"));
              }}
            >
              {t("Copiar", "Copy")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className={botaoPrimario} onClick={aoGerar} disabled={gerando}>
          {status.data && status.data.total > 0
            ? t("Gerar novos códigos", "Generate new codes")
            : t("Gerar meus códigos", "Generate my codes")}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-input p-4">
        <p className="text-base font-semibold">
          {t("Perdi o autenticador", "I lost my authenticator")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "Digite um código de recuperação para desligar a verificação em duas etapas e configurar de novo.",
            "Enter a recovery code to turn off two-step verification and set it up again.",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            value={codigoDigitado}
            onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            className="flex-1 rounded-2xl border border-input bg-card px-4 py-3 font-mono text-lg outline-none focus:border-primary"
          />
          <button
            type="button"
            className={botao}
            onClick={aoUsar}
            disabled={codigoDigitado.replace(/[^A-Z0-9]/g, "").length < 8}
          >
            {t("Usar código", "Use code")}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Histórico detalhado de acessos. */
export function HistoricoAcessos() {
  const { t, idioma } = useIdioma();
  const locale = idioma === "en" ? "en-US" : "pt-BR";
  const historico = useQuery({
    queryKey: ["seguranca", "historico"],
    queryFn: () => getHistoricoAcessos(),
  });

  const lista = historico.data ?? [];

  return (
    <section className="surface-card mt-6 p-6 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <History className="size-6 text-primary" />
        {t("Histórico de acessos", "Sign-in history")}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">
        {t(
          "Data, aparelho, IP aproximado e situação de cada entrada na sua conta.",
          "Date, device, approximate IP and status for every sign-in to your account.",
        )}
      </p>

      {historico.isLoading ? (
        <p className="mt-4 text-muted-foreground">{t("Um instante…", "Just a moment…")}</p>
      ) : lista.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          {t("Ainda não há acessos registrados.", "No sign-ins recorded yet.")}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lista.map((e) => (
            <li key={e.id} className="rounded-2xl border border-input bg-card px-4 py-3">
              <p className="text-base font-semibold">
                {e.device_name ?? t("Dispositivo", "Device")}
                {e.novo_dispositivo && (
                  <span className="ml-2 rounded-full bg-accent/25 px-2 py-0.5 text-xs font-semibold">
                    {t("aparelho novo", "new device")}
                  </span>
                )}
                {e.confiavel && (
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    {t("confiável", "trusted")}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(e.created_at).toLocaleString(locale)}
                {e.ip ? ` · IP ${e.ip}` : ""} ·{" "}
                {e.status === "sucesso" ? t("entrada concluída", "sign-in successful") : e.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Dispositivos confiáveis com validade e limite de sessão. */
export function DispositivosConfiaveis() {
  const { t, idioma } = useIdioma();
  const locale = idioma === "en" ? "en-US" : "pt-BR";
  const qc = useQueryClient();
  const salvar = useServerFn(salvarDispositivoConfiavel);
  const remover = useServerFn(removerDispositivoConfiavel);
  const [apelido, setApelido] = useState("");
  const [dias, setDias] = useState(30);
  const [horas, setHoras] = useState(720);
  const [salvando, setSalvando] = useState(false);

  const dispositivos = useQuery({
    queryKey: ["seguranca", "confiaveis"],
    queryFn: () => getDispositivosConfiaveis(),
  });

  const atual = idDoDispositivo();
  const lista = dispositivos.data ?? [];

  async function aoSalvar() {
    setSalvando(true);
    try {
      await salvar({
        data: { deviceId: atual, apelido, dias, sessaoMaxHoras: horas },
      });
      await qc.invalidateQueries({ queryKey: ["seguranca"] });
      toast.success(t("Aparelho marcado como confiável.", "Device marked as trusted."));
    } catch {
      toast.error(t("Não consegui salvar agora.", "Could not save right now."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="surface-card mt-6 p-6 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-2xl">
        <ShieldPlus className="size-6 text-primary" />
        {t("Aparelhos confiáveis", "Trusted devices")}
      </h2>
      <p className="mt-2 text-base text-muted-foreground">
        {t(
          "Marque só aparelhos pessoais. Você escolhe até quando ele é confiável e por quanto tempo a sessão pode ficar ativa antes de pedir a senha de novo.",
          "Only mark personal devices. You choose how long it stays trusted and how long a session can stay active before asking for your password again.",
        )}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="text-sm font-semibold">{t("Nome do aparelho", "Device name")}</span>
          <input
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            placeholder={t("Meu celular", "My phone")}
            className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            {t("Confiar por (dias)", "Trust for (days)")}
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            {t("Sessão ativa por (horas)", "Session active for (hours)")}
          </span>
          <input
            type="number"
            min={1}
            max={8760}
            value={horas}
            onChange={(e) => setHoras(Number(e.target.value))}
            className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
        <div className="flex items-end">
          <button type="button" className={botaoPrimario} onClick={aoSalvar} disabled={salvando}>
            {t("Confiar neste aparelho", "Trust this device")}
          </button>
        </div>
      </div>

      {lista.length > 0 && (
        <ul className="mt-5 space-y-3">
          {lista.map((d) => {
            const expirado = new Date(d.confiavel_ate).getTime() < Date.now();
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-input bg-card px-4 py-3"
              >
                <div>
                  <p className="text-base font-semibold">
                    {d.apelido || t("Aparelho", "Device")}
                    {d.device_id === atual && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {t("este aparelho", "this device")}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {expirado
                      ? t("Confiança expirada em", "Trust expired on")
                      : t("Confiável até", "Trusted until")}{" "}
                    {new Date(d.confiavel_ate).toLocaleDateString(locale)} ·{" "}
                    {t("sessão de", "session of")} {d.sessao_max_horas}h
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t("Remover", "Remove")}
                  className="flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
                  onClick={async () => {
                    await remover({ data: { id: d.id } });
                    await qc.invalidateQueries({ queryKey: ["seguranca", "confiaveis"] });
                  }}
                >
                  <Trash2 className="size-4" />
                  {t("Remover", "Remove")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
