import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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
import { clearMessages, getMessages, sendMessage } from "@/lib/finance.functions";

export const Route = createFileRoute("/_autenticado/conversa")({
  head: () => ({
    meta: [
      { title: "Conversa — mergulho" },
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

const SUGESTOES = [
  "Gastei 35 reais no mercado hoje",
  "Quanto eu gastei este mês?",
  "O que é uma reserva de emergência?",
  "Quero juntar R$ 1.200 até dezembro",
];

function Conversa() {
  const qc = useQueryClient();
  const fetchMessages = useServerFn(getMessages);
  const enviar = useServerFn(sendMessage);
  const limpar = useServerFn(clearMessages);
  const [texto, setTexto] = useState("");

  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ["mensagens"],
    queryFn: () => fetchMessages(),
  });

  const mutation = useMutation({
    mutationFn: (message: string) => enviar({ data: { message } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mensagens"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: () => toast.error("Não consegui responder agora. Tente de novo em instantes."),
  });

  const limparMutation = useMutation({
    mutationFn: () => limpar({ data: undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mensagens"] }),
  });

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
            <p className="font-display text-lg leading-none">Seu agente financeiro</p>
            <p className="text-xs text-muted-foreground">Fale como quiser, eu entendo.</p>
          </div>
          <button
            onClick={() => limparMutation.mutate()}
            className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            Limpar conversa
          </button>
        </div>

        <Conversation className="flex-1">
          <ConversationContent className="gap-4">
            {isLoading && <p className="text-sm text-muted-foreground">Carregando conversa…</p>}
            {!isLoading && mensagens.length === 0 && (
              <div className="mx-auto max-w-md py-10 text-center">
                <p className="font-display text-2xl">Oi! Vamos começar?</p>
                <p className="mt-2 text-muted-foreground">
                  Me conte um gasto recente ou faça uma pergunta sobre dinheiro. Eu explico com
                  calma, sem termos complicados.
                </p>
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
                </MessageContent>
              </Message>
            ))}
            {mutation.isPending && (
              <div className="flex items-center gap-2 px-1">
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 font-display text-xs text-primary">
                  m
                </span>
                <Shimmer>Pensando com você…</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-primary/10 p-4">
          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              submeter(texto);
            }}
          >
            <PromptInputTextarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex.: gastei 42 reais com farmácia ontem"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={mutation.isPending ? "submitted" : undefined}
                disabled={!texto.trim() || mutation.isPending}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="surface-card p-5">
          <p className="font-display text-lg">Experimente dizer</p>
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
          <p className="font-display text-lg">Dica</p>
          <p className="mt-2 text-sm leading-relaxed opacity-85">
            Se eu classificar um gasto na categoria errada, é só me avisar: “na verdade isso foi
            transporte”.
          </p>
        </div>
      </aside>
    </div>
  );
}
