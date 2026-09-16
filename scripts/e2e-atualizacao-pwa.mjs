#!/usr/bin/env node
/**
 * E2E: simula um usuário que JÁ tem o app instalado com uma versão antiga
 * em cache (marca "Mergulho") e confirma que, ao abrir de novo, a versão
 * atual carrega sozinha — com "Wise Money" na tela inicial — sem
 * reinstalar o aplicativo.
 */
import { chromium } from "playwright";

const BASE = process.env.APP_URL ?? "http://localhost:8080";

// Service worker legado (versão instalada há semanas): entrega a página
// guardada em cache e revalida em segundo plano — o padrão que fazia o
// usuário continuar vendo a marca antiga depois de uma atualização.
const SW_ANTIGO = `
const ANTIGA = '<!doctype html><html lang="pt-BR"><head><title>mergulho - assistente</title></head><body><h1>mergulho</h1></body></html>';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(
  caches.open('mergulho-v1').then((c) => c.put('/', new Response(ANTIGA, { headers: { 'content-type': 'text/html' } })))
); });
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith((async () => {
    const cache = await caches.open('mergulho-v1');
    const guardada = await cache.match('/');
    const rede = fetch(e.request).then((r) => { cache.put('/', r.clone()); return r; });
    e.waitUntil(rede.catch(() => undefined));
    return guardada || rede;
  })());
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
const cdp = await contexto.newCDPSession(pagina);
let erroAvaliacaoWorker = null;

await cdp.send("ServiceWorker.enable");
cdp.on("ServiceWorker.workerErrorReported", (evento) => {
  erroAvaliacaoWorker = evento;
  console.log(`[service-worker:error] ${JSON.stringify(evento)}`);
});
cdp.on("ServiceWorker.workerRegistrationUpdated", (evento) =>
  console.log(`[service-worker:registration] ${JSON.stringify(evento)}`),
);
cdp.on("ServiceWorker.workerVersionUpdated", (evento) =>
  console.log(`[service-worker:version] ${JSON.stringify(evento)}`),
);
contexto.on("serviceworker", (worker) => console.log(`[service-worker:created] ${worker.url()}`));

pagina.on("console", (mensagem) => console.log(`[browser:${mensagem.type()}] ${mensagem.text()}`));
pagina.on("pageerror", (erro) => console.log(`[browser:pageerror] ${erro.message}`));

// O service worker "antigo" é servido pela própria origem via interceptação.
await contexto.route("**/sw-antigo.js", (rota) =>
  rota.fulfill({ status: 200, contentType: "text/javascript", body: SW_ANTIGO }),
);
await contexto.route("**/fixture-pwa.html", (rota) =>
  rota.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><html><body>Preparando instalação legada</body></html>",
  }),
);

let ok = true;
try {
  // 1. Instalação da versão antiga (usuário instalou o app há semanas).
  // Usa uma página vazia da mesma origem para que a aplicação atual não limpe
  // o cache legado enquanto o cenário de atualização está sendo preparado.
  await pagina.goto(`${BASE}/fixture-pwa.html`, { waitUntil: "domcontentloaded" });
  await pagina.evaluate(async () => {
    const r = await navigator.serviceWorker.register("/sw-antigo.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return r.scope;
  });
  await pagina.waitForFunction(() => !!navigator.serviceWorker.controller, null, {
    timeout: 15000,
  });

  // 2. Usuário abre o app instalado: ainda veria a marca antiga em cache.
  await pagina.goto(BASE, { waitUntil: "domcontentloaded" });
  const conteudoAntigo = await pagina.content();
  ok = passo(/mergulho/i.test(conteudoAntigo), "Estado inicial reproduz a marca antiga em cache");

  // 3. Reabertura: o app atual deve assumir e trocar o service worker sozinho.
  await pagina.goto(`${BASE}/?sw=on`, { waitUntil: "domcontentloaded" });
  // O worker legado responde primeiro com o cache e atualiza-o em segundo
  // plano. A segunda abertura reproduz o comportamento real de reabrir o app.
  await pagina.waitForTimeout(1000);
  await pagina.goto(`${BASE}/?sw=on`, { waitUntil: "domcontentloaded" });
  await pagina.waitForFunction(() => /wise money/i.test(document.title), null, {
    timeout: 20000,
  });
  // O novo worker pré-carrega os recursos antes de assumir o controle. Em CI
  // isso pode levar mais que alguns segundos; aguardar o estado correto evita
  // confundir um worker apenas "installing" com uma atualização concluída.
  let controladorAtual = false;
  for (let tentativa = 1; tentativa <= 24; tentativa++) {
    const diagnostico = await pagina.evaluate(async () => ({
      controller: navigator.serviceWorker.controller?.scriptURL ?? null,
      registrations: (await navigator.serviceWorker.getRegistrations()).map((r) => ({
        scope: r.scope,
        active: r.active ? { url: r.active.scriptURL, state: r.active.state } : null,
        waiting: r.waiting ? { url: r.waiting.scriptURL, state: r.waiting.state } : null,
        installing: r.installing
          ? { url: r.installing.scriptURL, state: r.installing.state }
          : null,
      })),
    }));
    console.log(`[PWA ${tentativa}/24] ${JSON.stringify(diagnostico)}`);
    if (erroAvaliacaoWorker) {
      throw new Error(`Falha ao avaliar o service worker: ${JSON.stringify(erroAvaliacaoWorker)}`);
    }
    controladorAtual = diagnostico.controller?.endsWith("/sw.js") === true;
    if (controladorAtual) break;
    await pagina.waitForTimeout(5000);
  }
  if (!controladorAtual) {
    throw new Error("O service worker atual não assumiu o controle após 120 segundos.");
  }
  // O app pode recarregar sozinho uma vez quando o novo service worker assume.
  await pagina.waitForTimeout(500);
  await pagina.waitForLoadState("load").catch(() => undefined);
  await pagina.locator("h1").first().waitFor({ timeout: 20000 });

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

  const versaoWorker = await pagina.evaluate(async () => {
    const controlador = navigator.serviceWorker.controller;
    if (!controlador) return null;
    return new Promise((resolve) => {
      const canal = new MessageChannel();
      const limite = setTimeout(() => resolve(null), 3000);
      canal.port1.onmessage = (evento) => {
        clearTimeout(limite);
        resolve(evento.data?.version ?? null);
      };
      controlador.postMessage({ type: "GET_VERSION" }, [canal.port2]);
    });
  });
  ok = passo(versaoWorker === "v4", `Worker controlador confirma versão ${versaoWorker}`) && ok;

  const versaoPublicada = await pagina.evaluate(async () => {
    const resposta = await fetch(`/version.json?e2e=${Date.now()}`, { cache: "no-store" });
    return (await resposta.json()).version;
  });
  ok = passo(versaoPublicada === "v4", `Versão publicada confirma ${versaoPublicada}`) && ok;

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
