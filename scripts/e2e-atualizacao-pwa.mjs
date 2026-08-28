#!/usr/bin/env node
/**
 * E2E: simula um usuário que JÁ tem o app instalado com uma versão antiga
 * em cache (marca "Mergulho") e confirma que, ao abrir de novo, a versão
 * atual carrega sozinha — com "Wise Money" na tela inicial — sem
 * reinstalar o aplicativo.
 */
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:8080";

const SW_ANTIGO = `
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(
  caches.open('mergulho-v1').then((c) => c.put('/', new Response(
    '<!doctype html><html lang="pt-BR"><head><title>mergulho — assistente</title></head><body><h1>mergulho</h1></body></html>',
    { headers: { 'content-type': 'text/html' } })))
); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('/').then((r) => r || fetch(e.request)));
  }
});
`;

function passo(ok, texto) {
  console.log(`${ok ? "✅" : "❌"} ${texto}`);
  return ok;
}

const navegador = await chromium.launch(
  process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {},
);
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await contexto.newPage();

// O service worker "antigo" é servido pela própria origem via interceptação.
await contexto.route("**/sw-antigo.js", (rota) =>
  rota.fulfill({ status: 200, contentType: "text/javascript", body: SW_ANTIGO }),
);

let ok = true;
try {
  // 1. Instalação da versão antiga (usuário instalou o app há semanas).
  await pagina.goto(BASE, { waitUntil: "domcontentloaded" });
  await pagina.evaluate(async () => {
    const r = await navigator.serviceWorker.register("/sw-antigo.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return r.scope;
  });
  await pagina.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });

  // 2. Usuário abre o app instalado: ainda veria a marca antiga em cache.
  await pagina.goto(BASE, { waitUntil: "domcontentloaded" });
  const conteudoAntigo = await pagina.content();
  ok = passo(/mergulho/i.test(conteudoAntigo), "Estado inicial reproduz a marca antiga em cache");

  // 3. Reabertura: o app atual deve assumir e trocar o service worker sozinho.
  await pagina.goto(`${BASE}/?atualizar=1`, { waitUntil: "domcontentloaded" });
  await pagina.waitForFunction(
    async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.some((r) =>
        [r.active, r.waiting, r.installing].some((s) => s?.scriptURL.endsWith("/sw.js")),
      );
    },
    null,
    { timeout: 20000 },
  );

  await pagina.goto(BASE, { waitUntil: "domcontentloaded" });
  await pagina.waitForLoadState("networkidle").catch(() => undefined);

  const titulo = await pagina.title();
  const html = await pagina.content();
  const textoVisivel = await pagina.locator("body").innerText();

  ok = passo(/wise money/i.test(titulo), `Título atualizado: "${titulo}"`) && ok;
  ok = passo(/wise money/i.test(textoVisivel), "Nome “Wise Money” visível na tela inicial") && ok;
  ok = passo(!/mergulho/i.test(html), "Marca antiga ausente do DOM") && ok;

  const registros = await pagina.evaluate(async () =>
    (await navigator.serviceWorker.getRegistrations()).map(
      (r) => r.active?.scriptURL ?? r.waiting?.scriptURL ?? r.installing?.scriptURL ?? "",
    ),
  );
  ok =
    passo(
      registros.every((u) => u.endsWith("/sw.js")) && registros.length > 0,
      `Service worker antigo removido (ativos: ${registros.join(", ") || "nenhum"})`,
    ) && ok;

  const cachesRestantes = await pagina.evaluate(() => caches.keys());
  ok =
    passo(
      !cachesRestantes.some((c) => /mergulho/i.test(c)),
      `Caches antigos limpos (restantes: ${cachesRestantes.join(", ") || "nenhum"})`,
    ) && ok;

  ok = passo(true, "Atualização concluída sem reinstalar o aplicativo") && ok;
} catch (e) {
  ok = passo(false, `Falha no teste: ${e instanceof Error ? e.message : String(e)}`);
} finally {
  await navegador.close();
}

console.log(ok ? "\n✅ E2E de atualização do app instalado passou." : "\n❌ E2E falhou.");
process.exit(ok ? 0 : 1);
