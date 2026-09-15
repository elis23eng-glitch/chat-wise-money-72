import { createFileRoute } from "@tanstack/react-router";

import { authenticateRequest } from "@/integrations/supabase/auth-request.server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string, now = Date.now()): boolean {
  if (buckets.size > 5_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const current = buckets.get(userId);
  if (!current || current.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

/** Gera a voz da Nina com IA (timbre feminino caloroso, estilo assistente). */
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth.authenticated) {
          return new Response(auth.status === 503 ? "Serviço indisponível" : "Não autorizado", {
            status: auth.status,
          });
        }
        if (isRateLimited(auth.userId)) {
          return new Response("Muitas solicitações. Tente novamente em instantes.", {
            status: 429,
            headers: { "Retry-After": "60" },
          });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("TTS indisponível", { status: 503 });

        let body: { text?: unknown; idioma?: unknown; voice?: unknown; speed?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("JSON inválido", { status: 400 });
        }

        const text = typeof body.text === "string" ? body.text.trim().slice(0, 1_500) : "";
        if (!text) return new Response("Texto vazio", { status: 400 });
        const idioma = body.idioma === "en" ? "en" : "pt";
        const vozes = ["shimmer", "nova", "coral", "alloy"] as const;
        const voice = vozes.includes(body.voice as (typeof vozes)[number])
          ? (body.voice as string)
          : "shimmer";
        const bruta = Number(body.speed);
        const speed = Number.isFinite(bruta) ? Math.min(1.4, Math.max(0.6, bruta)) : 0.95;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20_000);
        let response: Response;
        try {
          response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice,
              response_format: "mp3",
              speed,

              instructions:
                idioma === "en"
                  ? "Speak like a warm, calm smart-assistant: clear, friendly, natural pacing, gentle and reassuring. Neutral American English."
                  : "Fale como uma assistente virtual acolhedora: português do Brasil, voz feminina calma, clara e gentil, ritmo natural e pausado, sem soar robótica.",
            }),
            signal: controller.signal,
          });
        } catch (error) {
          console.error("[TTS] Falha ao acessar o gateway.", error);
          return new Response("Falha ao gerar áudio", { status: 502 });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          console.error(`[TTS] Gateway respondeu com status ${response.status}.`);
          return new Response("Falha ao gerar áudio", { status: 502 });
        }

        return new Response(response.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
