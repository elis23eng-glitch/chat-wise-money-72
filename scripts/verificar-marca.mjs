#!/usr/bin/env node
/**
 * Garante que a marca "Wise Money" aparece e que a marca antiga ("Mergulho")
 * não aparece em título, meta tags e DOM de todas as rotas publicadas.
 */
import { appendFileSync } from "node:fs";

const BASE = process.env.APP_URL ?? "https://chat-wise-money-72.lovable.app";
const ROTAS = ["/", "/entrar", "/instalar", "/resumo", "/painel", "/metas", "/ano", "/conversa"];
const ESPERADO = /wise\s*money/i;
const PROIBIDO = /mergulho/i;

const linhas = [];
let falhas = 0;

async function texto(url) {
  const res = await fetch(url, { headers: { "user-agent": "wise-money-ci" } });
  return { status: res.status, html: (await res.text()).replace(/\0/g, "") };
}

for (const rota of ROTAS) {
  const url = `${BASE}${rota}`;
  try {
    const { status, html } = await texto(url);
    const titulo = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "";
    const metas = [...html.matchAll(/<meta[^>]*content="([^"]*)"[^>]*>/gi)].map((m) => m[1]).join(" ");

    const problemas = [];
    if (PROIBIDO.test(html)) problemas.push("marca antiga no DOM");
    if (PROIBIDO.test(titulo)) problemas.push("marca antiga no título");
    if (PROIBIDO.test(metas)) problemas.push("marca antiga nas meta tags");
    if (!ESPERADO.test(titulo)) problemas.push("título sem “Wise Money”");
    if (!ESPERADO.test(html)) problemas.push("DOM sem “Wise Money”");

    if (problemas.length) falhas += 1;
    linhas.push(
      `| \`${rota}\` | ${status} | ${titulo.trim() || "—"} | ${problemas.length ? "❌ " + problemas.join("; ") : "✅ ok"} |`,
    );
  } catch (e) {
    falhas += 1;
    linhas.push(`| \`${rota}\` | erro | — | ❌ ${e instanceof Error ? e.message : String(e)} |`);
  }
}

const resumo = [
  "## Verificação de marca (Wise Money)",
  "",
  `Base: ${BASE}`,
  "",
  "| Rota | HTTP | Título | Resultado |",
  "| --- | --- | --- | --- |",
  ...linhas,
  "",
  falhas > 0 ? `❌ Problemas de marca em ${falhas} rota(s).` : "✅ Marca correta em todas as rotas.",
  "",
].join("\n");

console.log(resumo);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo + "\n");
}
process.exit(falhas > 0 ? 1 : 0);
