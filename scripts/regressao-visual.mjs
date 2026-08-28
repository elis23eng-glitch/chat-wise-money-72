#!/usr/bin/env node
/**
 * Regressão visual: captura screenshots de cada rota (desktop e mobile),
 * compara com o baseline versionado e falha se houver diferença acima do
 * limite ou se a marca d'água do Lovable reaparecer.
 *
 * Uso:
 *   bun scripts/regressao-visual.mjs                 # compara com o baseline
 *   ATUALIZAR_BASELINE=1 bun scripts/regressao-visual.mjs   # regrava o baseline
 */
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.APP_URL ?? "https://chat-wise-money-72.lovable.app";
const ATUALIZAR = process.env.ATUALIZAR_BASELINE === "1";
const LIMITE_PCT = Number(process.env.LIMITE_DIFF_PCT ?? "0.5"); // % de pixels diferentes tolerada

const ROTAS = ["/", "/entrar", "/instalar", "/resumo", "/painel", "/metas", "/ano", "/conversa"];
const VIEWPORTS = [
  { nome: "desktop", width: 1280, height: 900 },
  { nome: "mobile", width: 390, height: 844 },
];
const PADROES_MARCA = [/edit with lovable/i, /made with lovable/i, /lovable-badge/i, /gpteng\.co/i];

const DIR = join(process.cwd(), "tests", "visual");
const DIR_BASE = join(DIR, "baseline");
const DIR_ATUAL = join(DIR, "atual");
const DIR_DIFF = join(DIR, "diff");
for (const d of [DIR_BASE, DIR_ATUAL, DIR_DIFF]) mkdirSync(d, { recursive: true });

const linhas = [];
let falhas = 0;
let novos = 0;

const navegador = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);

for (const vp of VIEWPORTS) {
  const contexto = await navegador.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  const pagina = await contexto.newPage();

  for (const rota of ROTAS) {
    const nome = `${vp.nome}${rota === "/" ? "-home" : rota.replaceAll("/", "-")}.png`;
    const url = `${BASE}${rota}`;
    try {
      await pagina.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await pagina.waitForTimeout(1200);

      const html = await pagina.content();
      const marca = PADROES_MARCA.filter((p) => p.test(html)).map(String);

      const atual = await pagina.screenshot();
      writeFileSync(join(DIR_ATUAL, nome), atual);

      const caminhoBase = join(DIR_BASE, nome);
      let veredito;

      if (ATUALIZAR || !existsSync(caminhoBase)) {
        writeFileSync(caminhoBase, atual);
        novos += 1;
        veredito = ATUALIZAR ? "🔄 baseline atualizado" : "🆕 baseline criado";
      } else {
        const imgBase = PNG.sync.read(readFileSync(caminhoBase));
        const imgAtual = PNG.sync.read(atual);
        if (imgBase.width !== imgAtual.width || imgBase.height !== imgAtual.height) {
          falhas += 1;
          veredito = `❌ tamanho diferente (${imgBase.width}x${imgBase.height} → ${imgAtual.width}x${imgAtual.height})`;
        } else {
          const diff = new PNG({ width: imgBase.width, height: imgBase.height });
          const px = pixelmatch(
            imgBase.data,
            imgAtual.data,
            diff.data,
            imgBase.width,
            imgBase.height,
            {
              threshold: 0.15,
            },
          );
          const pct = (px / (imgBase.width * imgBase.height)) * 100;
          if (pct > LIMITE_PCT) {
            falhas += 1;
            writeFileSync(join(DIR_DIFF, nome), PNG.sync.write(diff));
            veredito = `❌ ${pct.toFixed(2)}% de pixels diferentes`;
          } else {
            veredito = `✅ ${pct.toFixed(2)}%`;
          }
        }
      }

      if (marca.length > 0) {
        falhas += 1;
        veredito += ` · ⚠️ marca d'água: ${marca.join(", ")}`;
      }

      linhas.push(`| \`${rota}\` | ${vp.nome} | ${veredito} |`);
    } catch (e) {
      falhas += 1;
      linhas.push(
        `| \`${rota}\` | ${vp.nome} | ❌ erro: ${e instanceof Error ? e.message : String(e)} |`,
      );
    }
  }

  await contexto.close();
}

await navegador.close();

const resumo = [
  "## Regressão visual (screenshots por rota)",
  "",
  `Base: ${BASE} · limite de diferença: ${LIMITE_PCT}%`,
  "",
  "| Rota | Viewport | Resultado |",
  "| --- | --- | --- |",
  ...linhas,
  "",
  falhas > 0
    ? `**${falhas} verificação(ões) falharam.** Baixe o artefato \`regressao-visual\` para ver os diffs.`
    : `**Tudo certo.** ${novos > 0 ? `${novos} baseline(s) gravado(s).` : "Nenhuma regressão visual detectada."}`,
  "",
].join("\n");

console.log(resumo);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, resumo + "\n");

process.exit(falhas > 0 ? 1 : 0);
