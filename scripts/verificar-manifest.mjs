#!/usr/bin/env node
/**
 * Garante que a marca "Wise Money" está correta no manifest.json (name e
 * short_name) e que a marca antiga não aparece em nenhum texto carregado
 * pelo app (HTML das rotas, manifest e arquivos JS/CSS do build).
 */
import { appendFileSync } from "node:fs";

const BASE = process.env.APP_URL ?? "https://chat-wise-money-72.lovable.app";
const ROTAS = ["/", "/entrar", "/instalar"];
const ESPERADO = /wise\s*money/i;
const PROIBIDO = /mergulho/i;

const linhas = [];
let falhas = 0;

function anota(alvo, ok, detalhe) {
  if (!ok) falhas += 1;
  linhas.push(`| ${alvo} | ${ok ? "✅" : "❌"} | ${detalhe} |`);
  console.log(`${ok ? "✅" : "❌"} ${alvo} — ${detalhe}`);
}

async function baixar(url) {
  const res = await fetch(url, { headers: { "user-agent": "wise-money-ci" } });
  return { status: res.status, texto: await res.text() };
}

// 1) manifest.json
let manifest = null;
try {
  const { status, texto } = await baixar(`${BASE}/manifest.json`);
  manifest = JSON.parse(texto);
  anota("manifest.json", status === 200, `HTTP ${status}`);
  anota("manifest.name", ESPERADO.test(manifest.name ?? ""), manifest.name ?? "(vazio)");
  anota(
    "manifest.short_name",
    ESPERADO.test(manifest.short_name ?? ""),
    manifest.short_name ?? "(vazio)",
  );
  anota(
    "manifest sem marca antiga",
    !PROIBIDO.test(texto),
    PROIBIDO.test(texto) ? "encontrou a marca antiga" : "ok",
  );
} catch (erro) {
  anota("manifest.json", false, erro.message);
}

// 2) HTML das rotas e assets carregados por elas
const assets = new Set();
for (const rota of ROTAS) {
  try {
    const { status, texto } = await baixar(`${BASE}${rota}`);
    anota(
      `DOM ${rota}`,
      status === 200 && !PROIBIDO.test(texto) && ESPERADO.test(texto),
      `HTTP ${status}`,
    );
    for (const m of texto.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css))"/g)) assets.add(m[1]);
  } catch (erro) {
    anota(`DOM ${rota}`, false, erro.message);
  }
}

for (const asset of assets) {
  try {
    const { status, texto } = await baixar(`${BASE}${asset}`);
    anota(`asset ${asset}`, status === 200 && !PROIBIDO.test(texto), `HTTP ${status}`);
  } catch (erro) {
    anota(`asset ${asset}`, false, erro.message);
  }
}

const resumo = [
  "## Marca no manifest e nos textos carregados",
  "",
  `Base: ${BASE}`,
  "",
  "| Item | Resultado | Detalhe |",
  "| --- | --- | --- |",
  ...linhas,
  "",
  falhas > 0 ? `❌ ${falhas} verificação(ões) falharam.` : "✅ Marca correta no manifest e assets.",
  "",
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo + "\n");
}
process.exit(falhas > 0 ? 1 : 0);
