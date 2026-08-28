import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { registrarAcesso } from "@/lib/seguranca.functions";
import { idDoDispositivo, inicioSessao, marcarInicioSessao } from "@/lib/dispositivo";
import { useIdioma } from "@/lib/i18n";

/**
 * Registra o acesso atual no histórico de segurança, avisa quando o aparelho é
 * desconhecido e encerra a sessão quando o limite de tempo do dispositivo expira.
 */
export function MonitorAcesso() {
  const registrar = useServerFn(registrarAcesso);
  const { t } = useIdioma();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;
    const jaRegistrou = window.sessionStorage.getItem("wise-money-acesso-registrado") === "1";

    async function executar() {
      try {
        const deviceId = idDoDispositivo();
        if (!inicioSessao()) marcarInicioSessao();

        if (!jaRegistrou) {
          window.sessionStorage.setItem("wise-money-acesso-registrado", "1");
          const r = await registrar({ data: { deviceId } });
          if (cancelado) return;
          if (r.novoDispositivo) {
            toast.warning(
              t(
                `Novo acesso detectado neste aparelho (${r.dispositivo}). Se não foi você, encerre as sessões em Segurança.`,
                `New sign-in detected on this device (${r.dispositivo}). If this wasn't you, end the sessions in Security.`,
              ),
              { duration: 12000 },
            );
          }
          if (r.sessaoMaxHoras) {
            const inicio = inicioSessao() ?? Date.now();
            if (Date.now() - inicio > r.sessaoMaxHoras * 3600000) {
              await supabase.auth.signOut();
              window.localStorage.removeItem("wise-money-inicio-sessao");
              toast.info(
                t(
                  "Tempo de sessão deste aparelho expirou. Entre novamente.",
                  "This device's session time expired. Please sign in again.",
                ),
              );
              navigate({ to: "/entrar", replace: true });
            }
          }
        }
      } catch {
        /* silencioso: segurança não deve travar o app */
      }
    }

    void executar();
    return () => {
      cancelado = true;
    };
  }, [registrar, t, navigate]);

  return null;
}
