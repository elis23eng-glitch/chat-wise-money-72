import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, MonitorSmartphone, ShieldCheck, KeyRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIdioma } from "@/lib/i18n";
import { ConfirmarExclusao } from "@/components/ConfirmarExclusao";
import {
  CodigosRecuperacao,
  DispositivosConfiaveis,
  HistoricoAcessos,
} from "@/components/SegurancaAcessos";

export const Route = createFileRoute("/_autenticado/minha-seguranca")({
  head: () => ({
    meta: [
      { title: "Segurança da conta — Wise Money" },
      {
        name: "description",
        content:
          "Veja seus dispositivos conectados, encerre sessões em outros aparelhos e ative a verificação em duas etapas.",
      },
      { property: "og:title", content: "Segurança da conta — Wise Money" },
      {
        property: "og:description",
        content: "Sessões ativas, sair de todos os dispositivos e verificação em duas etapas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhaSeguranca,
});

type Sessao = {
  id: string;
  criada_em: string;
  atualizada_em: string;
  user_agent: string | null;
  ip: string | null;
  atual: boolean;
};

function nomeDispositivo(ua: string | null): string {
  if (!ua) return "—";
  const so = /iPhone|iPad/i.test(ua)
    ? "iPhone/iPad"
    : /Android/i.test(ua)
      ? "Android"
      : /Windows/i.test(ua)
        ? "Windows"
        : /Mac OS/i.test(ua)
          ? "Mac"
          : /Linux/i.test(ua)
            ? "Linux"
            : "—";
  const nav = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Safari\//i.test(ua)
        ? "Safari"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : "";
  return nav ? `${so} · ${nav}` : so;
}

function MinhaSeguranca() {
  const { t, idioma } = useIdioma();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmarTodos, setConfirmarTodos] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [encerrandoOutros, setEncerrandoOutros] = useState(false);

  const locale = idioma === "en" ? "en-US" : "pt-BR";

  const sessoes = useQuery({
    queryKey: ["seguranca", "sessoes"],
    queryFn: async (): Promise<Sessao[]> => {
      const { data, error } = await supabase.rpc("listar_minhas_sessoes");
      if (error) throw error;
      return (data ?? []) as Sessao[];
    },
  });

  const fatores = useQuery({
    queryKey: ["seguranca", "mfa"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data.totp ?? [];
    },
  });

  // ---- 2FA (TOTP) ----
  const [inscrevendo, setInscrevendo] = useState(false);
  const [qr, setQr] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [codigo, setCodigo] = useState("");

  async function iniciar2FA() {
    setInscrevendo(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Wise Money ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      setQr({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("Não consegui iniciar a verificação.", "Could not start verification."),
      );
    } finally {
      setInscrevendo(false);
    }
  }

  async function confirmar2FA() {
    if (!qr) return;
    setInscrevendo(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: qr.id,
        code: codigo.replace(/\s/g, ""),
      });
      if (error) throw error;
      toast.success(t("Verificação em duas etapas ativada!", "Two-step verification is on!"));
      setQr(null);
      setCodigo("");
      await fatores.refetch();
    } catch {
      toast.error(
        t(
          "Código incorreto ou expirado. Tente o próximo código do aplicativo.",
          "Wrong or expired code. Try the next code from your app.",
        ),
      );
    } finally {
      setInscrevendo(false);
    }
  }

  async function remover2FA(id: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      toast.error(t("Não consegui desativar agora.", "Could not turn it off right now."));
      return;
    }
    toast.success(t("Verificação em duas etapas desativada.", "Two-step verification turned off."));
    await fatores.refetch();
  }

  async function encerrarOutros() {
    setEncerrandoOutros(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast.success(
        t("Sessões dos outros aparelhos encerradas.", "Sessions on other devices were ended."),
      );
      await sessoes.refetch();
    } catch {
      toast.error(t("Não consegui encerrar agora.", "Could not end them right now."));
    } finally {
      setEncerrandoOutros(false);
    }
  }

  async function sairDeTodos() {
    setSaindo(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      window.localStorage.setItem("wise-money-manter-conectado", "0");
      await supabase.auth.signOut({ scope: "global" });
      navigate({ to: "/entrar", replace: true });
    } finally {
      setSaindo(false);
    }
  }

  const lista = sessoes.data ?? [];
  const ativo2FA = (fatores.data ?? []).filter((f) => f.status === "verified");

  return (
    <main className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-3xl leading-tight">
        {t("Segurança da minha conta", "My account security")}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t(
          "Veja onde sua conta está conectada, encerre acessos em outros aparelhos e reforce a entrada com um código extra.",
          "See where your account is signed in, end access on other devices and add an extra code to your sign-in.",
        )}
      </p>

      {/* Sessões */}
      <section className="surface-card mt-8 p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <MonitorSmartphone className="size-6 text-primary" />
          {t("Dispositivos conectados", "Connected devices")}
        </h2>

        {sessoes.isLoading ? (
          <p className="mt-4 text-muted-foreground">{t("Um instante…", "Just a moment…")}</p>
        ) : lista.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            {t("Nenhuma sessão encontrada.", "No sessions found.")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lista.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-input bg-card px-4 py-3"
              >
                <div>
                  <p className="text-base font-semibold">
                    {nomeDispositivo(s.user_agent)}
                    {s.atual && (
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {t("este aparelho", "this device")}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("Último acesso:", "Last activity:")}{" "}
                    {new Date(s.atualizada_em).toLocaleString(locale)}
                    {s.ip ? ` · ${s.ip}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={encerrarOutros}
            disabled={encerrandoOutros}
            className="rounded-full border border-input bg-card px-5 py-3 text-base font-semibold transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {encerrandoOutros
              ? t("Encerrando…", "Ending…")
              : t("Encerrar sessões nos outros aparelhos", "End sessions on other devices")}
          </button>
          <button
            type="button"
            onClick={() => setConfirmarTodos(true)}
            className="flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-base font-semibold text-destructive-foreground transition-colors hover:opacity-90"
          >
            <LogOut className="size-5" />
            {t("Sair de todos os dispositivos", "Sign out of all devices")}
          </button>
        </div>
      </section>

      {/* 2FA */}
      <section className="surface-card mt-6 p-6 shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <ShieldCheck className="size-6 text-primary" />
          {t("Verificação em duas etapas (2FA)", "Two-step verification (2FA)")}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          {t(
            "Além da senha, o app pede um código de 6 números que muda a cada 30 segundos no seu celular. Use um aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou similar).",
            "Besides your password, the app asks for a 6-digit code that changes every 30 seconds on your phone. Use an authenticator app (Google Authenticator, Microsoft Authenticator or similar).",
          )}
        </p>

        {ativo2FA.length > 0 ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-2xl bg-primary/10 px-4 py-3 text-base font-semibold text-primary">
              {t("Ativada e protegendo sua conta.", "Active and protecting your account.")}
            </p>
            {ativo2FA.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => remover2FA(f.id)}
                className="rounded-full border border-input bg-card px-5 py-3 text-base font-semibold transition-colors hover:bg-secondary"
              >
                {t("Desativar verificação em duas etapas", "Turn off two-step verification")}
              </button>
            ))}
          </div>
        ) : qr ? (
          <div className="mt-4 space-y-4">
            <p className="text-base">
              {t(
                "1. Abra seu aplicativo autenticador e leia o código abaixo.",
                "1. Open your authenticator app and scan the code below.",
              )}
            </p>
            <img
              src={qr.qr}
              alt={t("Código QR para 2FA", "QR code for 2FA")}
              className="size-48 rounded-2xl bg-card p-2"
            />
            <p className="text-sm text-muted-foreground">
              {t("Ou digite esta chave:", "Or type this key:")}{" "}
              <span className="font-mono">{qr.secret}</span>
            </p>
            <label className="block">
              <span className="text-sm font-semibold">
                {t("2. Digite o código de 6 números", "2. Enter the 6-digit code")}
              </span>
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                inputMode="numeric"
                maxLength={7}
                className="mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-lg tracking-[0.3em] outline-none focus:border-primary"
                placeholder="000000"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setQr(null);
                  setCodigo("");
                }}
                className="flex-1 rounded-full border border-input bg-card px-5 py-3 text-base font-semibold hover:bg-secondary"
              >
                {t("Cancelar", "Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmar2FA}
                disabled={inscrevendo || codigo.replace(/\D/g, "").length < 6}
                className="flex-1 rounded-full bg-primary px-5 py-3 text-base font-semibold text-primary-foreground disabled:opacity-60"
              >
                {t("Ativar", "Activate")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={iniciar2FA}
            disabled={inscrevendo}
            className="mt-4 flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
          >
            <KeyRound className="size-5" />
            {t("Ativar verificação em duas etapas", "Turn on two-step verification")}
          </button>
        )}
      </section>

      {/* Privacidade */}
      <section className="surface-card mt-6 p-6 shadow-soft">
        <h2 className="font-display text-2xl">
          {t("O que significa “continuar conectado”", "What “keep me signed in” means")}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          {t(
            "Quando você marca “Continuar conectado neste dispositivo”, o aplicativo mantém apenas um token de sessão temporário e criptografado neste aparelho — sua senha nunca é guardada aqui e não é possível recuperá-la a partir do celular. O token é renovado enquanto você usa o app, pode ser encerrado a qualquer momento nesta tela e é apagado ao tocar em “Sair”. Em aparelhos compartilhados, deixe a opção desmarcada.",
            "When you tick “Keep me signed in on this device”, the app only keeps a temporary, encrypted session token on this device — your password is never stored here and cannot be recovered from the phone. The token is refreshed while you use the app, can be ended at any time on this screen, and is erased when you tap “Sign out”. On shared devices, leave the option unticked.",
          )}
        </p>
        <Link to="/seguranca" className="mt-4 inline-block text-base font-semibold text-primary">
          {t("Ver política de segurança completa", "See the full security policy")}
        </Link>
      </section>

      <ConfirmarExclusao
        aberto={confirmarTodos}
        titulo={t("Sair de todos os dispositivos?", "Sign out of all devices?")}
        descricao={t(
          "Sua conta será desconectada em todos os aparelhos, inclusive neste. Você poderá entrar novamente com seu e-mail e senha.",
          "Your account will be signed out everywhere, including here. You can sign in again with your email and password.",
        )}
        rotuloConfirmar={t("Sair de todos", "Sign out everywhere")}
        carregando={saindo}
        aoConfirmar={sairDeTodos}
        aoCancelar={() => setConfirmarTodos(false)}
      />
    </main>
  );
}
