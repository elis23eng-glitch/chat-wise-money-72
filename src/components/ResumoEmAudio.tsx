import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Headphones, Lightbulb, Square } from "lucide-react";

import { getOverview } from "@/lib/finance.functions";
import { brl, categoriaLabel } from "@/lib/format";
import { useIdioma } from "@/lib/i18n";

type Voz = {
  disponivel: boolean;
  falandoId: string | null;
  falar: (texto: string, id: string) => void;
  parar: () => void;
};

/** Resumo e insights do mês em áudio, para quem prefere ouvir a ler. */
export function ResumoEmAudio({ voz }: { voz: Voz }) {
  const { t, idioma } = useIdioma();
  const buscar = useServerFn(getOverview);
  const { data } = useQuery({ queryKey: ["overview"], queryFn: () => buscar() });

  if (!voz.disponivel) return null;

  const fmt = (v: number) => brl(v, idioma === "en" ? "en" : "pt");

  function textoResumo() {
    if (!data) return t("Ainda estou carregando seus dados.", "I'm still loading your data.");
    const { totalEntradas, totalMes, saldo } = data;
    const positivo = saldo >= 0;
    return t(
      `Aqui vai o seu resumo do mês. Você recebeu ${fmt(totalEntradas)} e gastou ${fmt(totalMes)}. ` +
        (positivo
          ? `Seu saldo está positivo em ${fmt(saldo)}. Muito bem, continue assim.`
          : `Seu saldo está negativo em ${fmt(Math.abs(saldo))}. Vamos com calma ajustar isso juntas.`),
      `Here is your summary for the month. You received ${fmt(totalEntradas)} and spent ${fmt(totalMes)}. ` +
        (positivo
          ? `Your balance is positive by ${fmt(saldo)}. Well done, keep it up.`
          : `Your balance is negative by ${fmt(Math.abs(saldo))}. Let's calmly adjust this together.`),
    );
  }

  function textoInsight() {
    if (!data) return t("Ainda estou carregando seus dados.", "I'm still loading your data.");
    const categorias = Object.entries(data.porCategoria).sort((a, b) => b[1] - a[1]);
    const maior = categorias[0];
    const partes: string[] = [];

    if (maior) {
      partes.push(
        t(
          `Sua maior despesa deste mês foi com ${categoriaLabel(maior[0], "pt")}, somando ${fmt(maior[1])}.`,
          `Your biggest expense this month was ${categoriaLabel(maior[0], "en")}, adding up to ${fmt(maior[1])}.`,
        ),
      );
      const anterior = data.porCategoriaAnterior[maior[0]] ?? 0;
      if (anterior > 0 && maior[1] > anterior) {
        partes.push(
          t(
            `Isso é mais do que no mês passado, quando foi ${fmt(anterior)}. Vale observar com carinho.`,
            `That's more than last month, when it was ${fmt(anterior)}. Worth keeping an eye on.`,
          ),
        );
      } else if (anterior > 0) {
        partes.push(
          t(
            `Você gastou menos que no mês passado nessa categoria. Parabéns!`,
            `You spent less than last month in this category. Congratulations!`,
          ),
        );
      }
    } else {
      partes.push(
        t(
          "Ainda não registrei gastos neste mês. Me conte um gasto falando comigo.",
          "I haven't recorded any expenses this month yet. Tell me one by speaking to me.",
        ),
      );
    }

    const meta = data.metas[0];
    if (meta) {
      const falta = Math.max(0, meta.valor_alvo - meta.valor_atual);
      partes.push(
        t(
          `Na sua meta ${meta.titulo}, falta ${fmt(falta)} para você chegar lá.`,
          `On your goal ${meta.titulo}, you need ${fmt(falta)} more to get there.`,
        ),
      );
    }
    return partes.join(" ");
  }

  const botao = (id: string, rotulo: string, texto: () => string, Icone: typeof Headphones) => {
    const falando = voz.falandoId === id;
    return (
      <button
        onClick={() => (falando ? voz.parar() : voz.falar(texto(), id))}
        className="flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5 text-left text-base font-semibold text-secondary-foreground transition-colors hover:bg-primary/10"
      >
        {falando ? (
          <Square className="size-5 shrink-0 text-primary" />
        ) : (
          <Icone className="size-5 shrink-0 text-primary" />
        )}
        {falando ? t("Parar áudio", "Stop audio") : rotulo}
      </button>
    );
  };

  return (
    <div className="surface-card p-5">
      <p className="font-display text-lg">{t("Ouvir em áudio", "Listen in audio")}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("Sem precisar ler a tela.", "No need to read the screen.")}
      </p>
      <div className="mt-3 space-y-2">
        {botao(
          "audio-resumo",
          t("Ouvir resumo do mês", "Listen to monthly summary"),
          textoResumo,
          Headphones,
        )}
        {botao(
          "audio-insight",
          t("Ouvir uma dica para mim", "Listen to a tip for me"),
          textoInsight,
          Lightbulb,
        )}
      </div>
    </div>
  );
}
