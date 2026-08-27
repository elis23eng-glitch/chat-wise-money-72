import { createFileRoute } from "@tanstack/react-router";

/** Gera a voz da Nina com IA (timbre feminino caloroso, estilo assistente). */
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("TTS indisponível", { status: 503 });

        let body: { text?: unknown; idioma?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("JSON inválido", { status: 400 });
        }

        const text = typeof body.text === "string" ? body.text.trim().slice(0, 3000) : "";
        if (!text) return new Response("Texto vazio", { status: 400 });
        const idioma = body.idioma === "en" ? "en" : "pt";

        const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "shimmer",
            response_format: "mp3",
            speed: 0.95,
            instructions:
              idioma === "en"
                ? "Speak like a warm, calm smart-assistant: clear, friendly, natural pacing, gentle and reassuring. Neutral American English."
                : "Fale como uma assistente virtual acolhedora: português do Brasil, voz feminina calma, clara e gentil, ritmo natural e pausado, sem soar robótica.",
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          return new Response(detail || "Falha ao gerar áudio", { status: response.status });
        }

        return new Response(response.body, {
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
