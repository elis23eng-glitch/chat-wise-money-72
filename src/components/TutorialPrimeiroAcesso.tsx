import { useEffect, useState } from "react";
import {
  BarChart3,
  FileDown,
  Languages,
  ListChecks,
  MessageCircle,
  Mic,
  PlayCircle,
  Target,
} from "lucide-react";

import { useIdioma } from "@/lib/i18n";

const CHAVE = "wise-money:tutorial-visto-v3";

type Passo = {
  icone: typeof MessageCircle;
  titulo: string;
  texto: string;
  exemplo?: string;
  video?: boolean;
};

export function useTutorial() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(CHAVE)) setAberto(true);
    } catch {
      /* ignora */
    }
  }, []);

  const fechar = () => {
    setAberto(false);
    try {
      window.localStorage.setItem(CHAVE, "1");
    } catch {
      /* ignora */
    }
  };

  return { aberto, abrir: () => setAberto(true), fechar };
}

export function TutorialPrimeiroAcesso({
  aberto,
  aoFechar,
}: {
  aberto: boolean;
  aoFechar: () => void;
}) {
  const { t } = useIdioma();
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (aberto) setPasso(0);
  }, [aberto]);

  const passos: Passo[] = [
    {
      icone: PlayCircle,
      titulo: t("Veja em vídeo (30 segundos)", "Watch the 30-second video"),
      texto: t(
        "Um mini tutorial mostrando como registrar um gasto conversando e como ver o resumo do mês no Painel.",
        "A mini tutorial showing how to record an expense by chatting and how to see your month summary on the Dashboard.",
      ),
      video: true,
    },
    {
      icone: MessageCircle,
      titulo: t("Converse com a Nina", "Chat with Nina"),
      texto: t(
        "Na tela Conversa você escreve do seu jeito. A Nina, sua assistente, entende e anota tudo pra você.",
        "On the Chat screen you write your own way. Nina, your assistant, understands and records everything for you.",
      ),
      exemplo: t('Ex.: "gastei 40 reais no mercado hoje"', 'E.g.: "spent 40 on groceries today"'),
    },
    {
      icone: Mic,
      titulo: t("Prefere falar? Use o botão Falar", "Rather speak? Use the Speak button"),
      texto: t(
        "Toque no botão Falar, diga o que gastou ou recebeu e solte. O texto aparece sozinho.",
        "Tap the Speak button, say what you spent or received, and release. The text appears by itself.",
      ),
    },
    {
      icone: BarChart3,
      titulo: t("Veja entradas e saídas no Painel", "See income and expenses on the Dashboard"),
      texto: t(
        "O Painel mostra quanto entrou, quanto saiu e se o saldo está positivo ou negativo, no mês ou na semana.",
        "The Dashboard shows what came in, what went out, and whether your balance is positive or negative, by month or week.",
      ),
    },
    {
      icone: Target,
      titulo: t("Crie uma meta simples", "Create a simple goal"),
      texto: t(
        "Diga o que quer juntar e acompanhe o progresso em Metas. Pode guardar um pouquinho de cada vez.",
        "Say what you want to save for and follow the progress in Goals. You can put aside a little at a time.",
      ),
      exemplo: t(
        'Ex.: "quero juntar 500 reais até dezembro"',
        'E.g.: "I want to save 500 by December"',
      ),
    },
    {
      icone: FileDown,
      titulo: t("Guarde ou envie seu relatório", "Save or send your report"),
      texto: t(
        "No Painel, o botão Exportar PDF cria um relatório para baixar, compartilhar ou enviar por link.",
        "On the Dashboard, the Export PDF button creates a report you can download, share or send by link.",
      ),
    },
    {
      icone: ListChecks,
      titulo: t("Confira antes de exportar", "Check before exporting"),
      texto: t(
        "Em Ver prévia aparece uma listinha de verificação: idioma, saldo, gastos por categoria, metas e histórico de alertas. Marque que conferiu e só então os botões de exportar liberam.",
        "In Preview you get a small checklist: language, balance, spending by category, goals and alert history. Tick that you checked it and the export buttons unlock.",
      ),
    },
    {
      icone: Languages,
      titulo: t("Português ou inglês, quando quiser", "Portuguese or English, whenever you like"),
      texto: t(
        "No topo da tela você troca o idioma. Tudo muda junto: textos, datas e valores.",
        "At the top of the screen you can switch languages. Everything changes: texts, dates and amounts.",
      ),
    },
  ];

  if (!aberto) return null;

  const atual = passos[passo]!;
  const Icone = atual.icone;
  const ultimo = passo === passos.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("Tutorial de primeiro acesso", "First-time tutorial")}
    >
      <div className="surface-card w-full max-w-lg p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {t("Bem-vindo", "Welcome")} · {passo + 1}/{passos.length}
        </p>

        <div className="mt-5 flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icone className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl leading-tight">{atual.titulo}</h2>
            <p className="mt-2 text-lg leading-relaxed text-muted-foreground">{atual.texto}</p>
            {atual.exemplo && (
              <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-base text-primary-deep">
                {atual.exemplo}
              </p>
            )}
            {atual.video && (
              <video
                className="mt-4 w-full rounded-2xl border border-border shadow-sm"
                src="/videos/tutorial-mergulho.mp4"
                poster="/videos/tutorial-poster.jpg"
                controls
                playsInline
                preload="metadata"
                aria-label={t(
                  "Vídeo: como registrar um gasto e ver o resumo do mês",
                  "Video: how to record an expense and see the month summary",
                )}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden="true">
          {passos.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === passo ? "w-6 bg-primary" : "w-2 bg-primary/25"
              }`}
            />
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-full px-4 py-3 text-base font-semibold text-muted-foreground hover:text-primary"
          >
            {t("Pular tutorial", "Skip tutorial")}
          </button>

          <div className="flex gap-3">
            {passo > 0 && (
              <button
                type="button"
                onClick={() => setPasso((p) => p - 1)}
                className="rounded-full border border-primary/30 bg-card px-6 py-3 text-base font-semibold text-primary hover:bg-primary/10"
              >
                {t("Voltar", "Back")}
              </button>
            )}
            <button
              type="button"
              onClick={() => (ultimo ? aoFechar() : setPasso((p) => p + 1))}
              className="rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-deep"
            >
              {ultimo ? t("Começar", "Get started") : t("Próximo", "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
