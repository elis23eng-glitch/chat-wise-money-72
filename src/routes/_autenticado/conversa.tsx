import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CircleHelp, Mic, Square, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PainelVoz } from "@/components/PainelVoz";
import { ResumoEmAudio } from "@/components/ResumoEmAudio";
import { VoiceInputButton } from "@/components/VoiceInputButton";

import { clearMessages, getMessages, sendMessage } from "@/lib/finance.functions";
import { useIdioma } from "@/lib/i18n";
import { saudacaoNina, useLeituraEmVozAlta } from "@/lib/leitura-voz";

export const Route = createFileRoute("/_autenticado/conversa")({
  head: () => ({
    meta: [
      { title: "Conversa — Wise Money" },
      {
        name: "description",
        content: "Converse com seu agente financeiro para registrar gastos e tirar dúvidas.",
      },
      { property: "og:title", content: "Conversa com seu agente financeiro" },
      {
        property: "og:description",
        content: "Registre gastos e entenda seu dinheiro conversando em linguagem simples.",
      },
    ],
  }),
  component: Conversa,
});

function Conversa() {
  const qc = useQueryClient();
  const fetchMessages = useServerFn(getMessages);
  const enviar = useServerFn(sendMessage);
  const limpar = useServerFn(clearMessages);
  const [texto, setTexto] = useState("");
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const { t, idioma } = useIdioma();

  const COMANDOS_VOZ = [
    {
      titulo: t("Registrar gasto", "Log an expense"),
      exemplo: t("“Gastei 35 reais no mercado hoje”", '"I spent $35 at the market today"'),
    },
    {
      titulo: t("Registrar entrada", "Log income"),
      exemplo: t("“Recebi 1.500 reais de aposentadoria”", '"I received $1,500 from retirement"'),
    },
    {
      titulo: t("Corrigir valor", "Fix amount"),
      exemplo: t("“Corrigir o último gasto para 50 reais”", '"Change my last expense to $50"'),
    },
    {
      titulo: t("Corrigir categoria", "Fix category"),
      exemplo: t(
        "“Corrigir a categoria do último gasto para mercado”",
        '"Fix the category of my last expense to groceries"',
      ),
    },
    {
      titulo: t("Trocar data", "Change date"),
      exemplo: t(
        "“Trocar a data do último gasto para ontem”",
        '"Change the date of my last expense to yesterday"',
      ),
    },
    {
      titulo: t("Excluir lançamento", "Delete an entry"),
      exemplo: t("“Apagar o último gasto”", '"Delete my last expense"'),
    },
    {
      titulo: t("Consultar resumo", "Check summary"),
      exemplo: t("“Quanto eu gastei este mês?”", '"How much did I spend this month?"'),
    },
    {
      titulo: t("Cancelar", "Cancel"),
      exemplo: t(
        "Diga “cancelar” ou “deixa pra lá” para interromper um pedido.",
        'Say "cancel" or "never mind" to stop a request.',
      ),
    },
  ];

  const SUGESTOES = [
    t("Gastei 35 reais no mercado hoje", "I spent $35 at the market today"),
    t("Corrigir o último gasto para 50 reais", "Change my last expense to $50"),
    t("Apagar o último gasto", "Delete my last expense"),
    t("Quanto eu gastei este mês?", "How much did I spend this month?"),
    t("O que é uma reserva de emergência?", "What is an emergency fund?"),
    t("Quero juntar R$ 1.200 até dezembro", "I want to save $1,200 by December"),
  ];

  // Comandos prontos: alguns só preenchem o texto (o usuário completa o valor),
  // outros são enviados na hora.
  const COMANDOS_RAPIDOS: { rotulo: string; texto: string; enviar: boolean }[] = [
    {
      rotulo: t("💸 Gastei…", "💸 I spent…"),
      texto: t("Gastei ", "I spent "),
      enviar: false,
    },
    {
      rotulo: t("💰 Recebi…", "💰 I received…"),
      texto: t("Recebi ", "I received "),
      enviar: false,
    },
    {
      rotulo: t("📊 Mostre meu resumo", "📊 Show my summary"),
      texto: t("Mostre meu resumo deste mês", "Show my summary for this month"),
      enviar: true,
    },
    {
      rotulo: t("🎯 Minhas metas", "🎯 My goals"),
      texto: t("Como estão as minhas metas?", "How are my goals going?"),
      enviar: true,
    },
    {
      rotulo: t("✏️ Corrigir valor", "✏️ Fix amount"),
      texto: t("Corrigir o valor do último gasto para ", "Fix the amount of my last expense to "),
      enviar: false,
    },
    {
      rotulo: t("🏷️ Corrigir categoria", "🏷️ Fix category"),
      texto: t(
        "Corrigir a categoria do último gasto para ",
        "Fix the category of my last expense to ",
      ),
      enviar: false,
    },
    {
      rotulo: t("📅 Trocar data", "📅 Change date"),
      texto: t("Trocar a data do último gasto para ", "Change the date of my last expense to "),
      enviar: false,
    },
    {
      rotulo: t("🗑️ Apagar último", "🗑️ Delete last"),
      texto: t("Apagar o último gasto", "Delete my last expense"),
      enviar: true,
    },
  ];

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ["mensagens"],
    queryFn: () => fetchMessages(),
  });

  const mutation = useMutation({
    mutationFn: (message: string) => enviar({ data: { message, idioma } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mensagens"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () =>
      toast.error(
        t(
          "Não consegui responder agora. Tente de novo em instantes.",
          "I couldn't reply right now. Please try again in a moment.",
        ),
      ),
  });

  const limparMutation = useMutation({
    mutationFn: () => limpar({ data: undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensagens"] }),
  });

  const voz = useLeituraEmVozAlta(idioma === "en" ? "en" : "pt");

  useEffect(() => {
    if (!voz.autoLeitura || !voz.disponivel) return;
    const ultima = [...mensagens].reverse().find((m) => m.role !== "user");
    if (!ultima || voz.foiLido(ultima.id)) return;
    voz.marcarComoLido(ultima.id);
    voz.falar(ultima.content, ultima.id);
  }, [mensagens, voz]);

  function submeter(valor: string) {
    const limpo = valor.trim();

    if (!limpo || mutation.isPending) return;
    setTexto("");
    mutation.mutate(limpo);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="surface-card flex h-[70vh] min-h-[520px] flex-col overflow-hidden shadow-soft">
        <div className="flex items-center gap-3 border-b border-primary/10 px-5 py-4">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 font-display text-primary">
            m
          </span>
          <div>
            <p className="font-display text-lg leading-none">
              {t("Seu agente financeiro", "Your financial agent")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("Fale como quiser, eu entendo.", "Speak however you like, I'll understand.")}
            </p>
          </div>
          {voz.disponivel && (
            <button
              onClick={voz.alternarAuto}
              aria-pressed={voz.autoLeitura}
              aria-label={t("Ler respostas em voz alta", "Read replies aloud")}
              className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                voz.autoLeitura
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {voz.autoLeitura ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              {voz.autoLeitura ? t("Voz ligada", "Voice on") : t("Voz desligada", "Voice off")}
            </button>
          )}
          <button
            onClick={() => limparMutation.mutate()}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary ${voz.disponivel ? "" : "ml-auto"}`}
          >
            {t("Limpar conversa", "Clear conversation")}
          </button>

          <button
            onClick={() => setAjudaAberta(true)}
            aria-label={t("Ajuda: comandos de voz", "Help: voice commands")}
            className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          >
            <CircleHelp className="size-5" />
          </button>
        </div>

        {ajudaAberta && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            onClick={() => setAjudaAberta(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("Comandos de voz", "Voice commands")}
              className="surface-card max-h-[80vh] w-full max-w-md overflow-y-auto p-6 shadow-soft"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-display text-xl">
                  <Mic className="size-5 text-primary" />
                  {t("Fale comigo assim", "Talk to me like this")}
                </p>
                <button
                  onClick={() => setAjudaAberta(false)}
                  aria-label={t("Fechar ajuda", "Close help")}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(
                  "Toque no botão Falar e diga uma frase como estas:",
                  "Tap the Speak button and say a phrase like these:",
                )}
              </p>
              <div className="mt-4 space-y-3">
                {COMANDOS_VOZ.map((c) => (
                  <div key={c.titulo} className="rounded-2xl bg-secondary px-4 py-3">
                    <p className="text-sm font-semibold">{c.titulo}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.exemplo}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setAjudaAberta(false)}
                className="mt-5 w-full rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
              >
                {t("Entendi", "Got it")}
              </button>
            </div>
          </div>
        )}

        <Conversation className="flex-1">
          <ConversationContent className="gap-4">
            {isLoading && (
              <p className="text-sm text-muted-foreground">
                {t("Carregando conversa…", "Loading conversation…")}
              </p>
            )}
            {!isLoading && mensagens.length === 0 && (
              <div className="mx-auto max-w-md py-10 text-center">
                <p className="font-display text-2xl">
                  {t("Oi! Vamos começar?", "Hi! Shall we begin?")}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    "Me conte um gasto recente ou faça uma pergunta sobre dinheiro. Eu explico com calma, sem termos complicados.",
                    "Tell me about a recent expense or ask a question about money. I'll explain calmly, without complicated terms.",
                  )}
                </p>
                {voz.disponivel && (
                  <button
                    onClick={() =>
                      voz.falar(saudacaoNina(idioma === "en" ? "en" : "pt"), "saudacao-inicial")
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Volume2 className="size-4" />
                    {t("Ouvir saudação da Nina", "Hear Nina's greeting")}
                  </button>
                )}
              </div>
            )}
            {mensagens.map((m) => (
              <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                <MessageContent
                  className={
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent"
                  }
                >
                  <MessageResponse>{m.content}</MessageResponse>
                  {m.role !== "user" && voz.disponivel && (
                    <button
                      onClick={() =>
                        voz.falandoId === m.id ? voz.parar() : voz.falar(m.content, m.id)
                      }
                      aria-label={
                        voz.falandoId === m.id
                          ? t("Parar leitura", "Stop reading")
                          : t("Ouvir esta mensagem", "Listen to this message")
                      }
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      {voz.falandoId === m.id ? (
                        <>
                          <Square className="size-4" />
                          {t("Parar", "Stop")}
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-4" />
                          {t("Ouvir", "Listen")}
                        </>
                      )}
                    </button>
                  )}
                </MessageContent>
              </Message>
            ))}

            {mutation.isPending && (
              <div className="flex items-center gap-2 px-1">
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 font-display text-xs text-primary">
                  m
                </span>
                <Shimmer>{t("Pensando com você…", "Thinking it over with you…")}</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-primary/10 p-4">
          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t("Comandos prontos — toque ou fale", "Ready-made commands — tap or say them")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {COMANDOS_RAPIDOS.map((c) => (
                <button
                  key={c.rotulo}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (c.enviar) {
                      submeter(c.texto);
                    } else {
                      setTexto(c.texto);
                    }
                  }}
                  className="shrink-0 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  {c.rotulo}
                </button>
              ))}
            </div>
          </div>
          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              submeter(texto);
            }}
          >
            <PromptInputTextarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={t(
                "Ex.: gastei 42 reais com farmácia ontem",
                "E.g.: I spent $42 at the pharmacy yesterday",
              )}
            />
            <PromptInputFooter className="justify-between">
              <VoiceInputButton
                idioma={idioma === "en" ? "en" : "pt"}
                onText={(txt) => setTexto((atual) => (atual ? `${atual} ${txt}` : txt))}
                onAutoSubmit={(txt) => submeter(txt)}
                disabled={mutation.isPending}
              />

              <PromptInputSubmit
                status={mutation.isPending ? "submitted" : "ready"}
                disabled={!texto.trim() || mutation.isPending}
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              "Toque em Falar e diga: “gastei 35 no mercado”, “mostre meu resumo” ou “minhas metas”. A Nina executa sem você digitar.",
              'Tap Speak and say: "I spent 35 at the market", "show my summary" or "my goals". Nina runs it without typing.',
            )}
          </p>
        </div>
      </section>

      <aside className="space-y-4">
        <ResumoEmAudio voz={voz} />
        <PainelVoz prefs={voz.prefs} salvarPrefs={voz.salvarPrefs} testar={voz.falar} />
        <div className="surface-card p-5">
          <p className="font-display text-lg">{t("Experimente dizer", "Try saying")}</p>
          <div className="mt-3 space-y-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => submeter(s)}
                className="w-full rounded-2xl bg-secondary px-4 py-3 text-left text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-primary-deep p-5 text-primary-deep-foreground">
          <p className="font-display text-lg">{t("Dica", "Tip")}</p>
          <p className="mt-2 text-sm leading-relaxed opacity-85">
            {t(
              "Se eu classificar um gasto na categoria errada, é só me avisar: “na verdade isso foi transporte”.",
              'If I categorize an expense wrong, just let me know: "actually that was transportation".',
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
