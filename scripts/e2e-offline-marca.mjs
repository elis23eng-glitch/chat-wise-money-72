#!/usr/bin/env node
/**
 * E2E offline / alto cache: instala o app, deixa o service worker guardar as
 * páginas, corta a internet e confirma que a tela inicial e os títulos ainda
 * mostram "Wise Money" — nunca a marca antiga "Mergulho".
 */
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:8080";
const ROTAS = ["/", "/entrar", "/instalar"];
const PROIBIDO = /mergulho/i;

function passo(ok, texto) {
  console.log(`${ok ? "✅" : "❌"} ${texto}`);
  return ok;
}

const navegador = await chromium.launch(
  process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
);
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await contexto.newPage();

let ok = true;
try {
  // 1. Uso normal: o app registra o service worker e enche o cache.
  for (const rota of ROTAS) {
    await pagina.goto(`${BASE}${rota}?sw=on`, { waitUntil: "domcontentloaded" });
    await pagina.waitForTimeout(1500);
  }
  await pagina.waitForFunction(
    async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.some((r) => r.active?.scriptURL.endsWith("/sw.js"));
    },
    null,
    { timeout: 25000 },
  );
  ok = passo(true, "App instalado e páginas guardadas em cache");

  // 2. Sem internet: tudo deve vir do cache, com a marca certa.
  await contexto.setOffline(true);
  for (const rota of ROTAS) {
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await pagina.waitForTimeout(800);
    const titulo = await pagina.title();
    const html = await pagina.content();
    ok = passo(/wise money/i.test(titulo), `Offline ${rota} — título: "${titulo}"`) && ok;
    ok = passo(!PROIBIDO.test(html), `Offline ${rota} — sem a marca antiga no DOM`) && ok;
  }

  const textoInicial = await pagina
    .goto(`${BASE}/`, { waitUntil: "domcontentloaded" })
    .then(() => pagina.locator("body").innerText())
    .catch(() => "");
  ok = passo(/wise money/i.test(textoInicial), "Tela inicial offline exibe “Wise Money”") && ok;

  // 3. Internet de volta: continua Wise Money, sem reinstalar.
  await contexto.setOffline(false);
  await pagina.goto(`${BASE}/?sw=on`, { waitUntil: "domcontentloaded" });
  await pagina.waitForTimeout(2500);
  const tituloFinal = await pagina.title();
  ok = passo(/wise money/i.test(tituloFinal), `Online de novo — título: "${tituloFinal}"`) && ok;
} catch (erro) {
  ok = passo(false, `Falha no teste: ${erro instanceof Error ? erro.message : String(erro)}`);
} finally {
  await navegador.close();
}

console.log(ok ? "\n✅ E2E offline com a marca correta." : "\n❌ E2E offline falhou.");
process.exit(ok ? 0 : 1);
