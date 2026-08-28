#!/usr/bin/env node
/**
 * Validação visual leve: confere se a marca d'água do Lovable
 * ("Edit with Lovable" / lovable-badge) voltou a aparecer no app publicado.
 * Escreve um resumo no GitHub Step Summary para rastreio rápido.
 */
import { appendFileSync } from "node:fs";

const BASE = process.env.APP_URL ?? "https://chat-wise-money-72.lovable.app";
const ROTAS = ["/", "/entrar", "/instalar", "/resumo", "/painel", "/metas", "/ano", "/conversa"];
const PADROES = [/edit with lovable/i, /lovable-badge/i, /gpteng\.co\/gptengineer\.js/i];

const linhas = [];
let falhas = 0;
let erros = 0;

for (const rota of ROTAS) {
  const url = `${BASE}${rota}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": "wise-money-ci" } });
    const html = await res.text();
    const encontrados = PADROES.filter((p) => p.test(html)).map((p) => String(p));
    if (encontrados.length > 0) falhas += 1;
    linhas.push(
      `| \`${rota}\` | ${res.status} | ${encontrados.length ? "⚠️ " + encontrados.join(", ") : "✅ ausente"} |`,
    );
  } catch (e) {
    erros += 1;
    linhas.push(`| \`${rota}\` | erro | ⏭️ ${e instanceof Error ? e.message : String(e)} |`);
  }
}

const resumo = [
  "## Validação visual — marca d'água",
  "",
  `Base: ${BASE}`,
  "",
  "| Rota | HTTP | Marca d'água |",
  "| --- | --- | --- |",
  ...linhas,
  "",
  falhas > 0
    ? `❌ Marca d'água detectada em ${falhas} rota(s).`
    : `✅ Nenhuma marca d'água detectada (${erros} rota(s) inacessível(is)).`,
  "",
].join("\n");

console.log(resumo);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo + "\n");
}

process.exit(falhas > 0 ? 1 : 0);
