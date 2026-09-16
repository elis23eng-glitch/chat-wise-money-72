const VERSAO = "v4";
const CACHE_PAGINAS = "wise-money-v4-paginas";
const CACHE_RECURSOS = "wise-money-v4-recursos";
const ARQUIVOS_ESSENCIAIS = [
  "/",
  "/manifest.json",
  "/version.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_PAGINAS)
      .then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter(
            (nome) =>
              (nome.startsWith("wise-money") || nome.startsWith("mergulho")) &&
              nome !== CACHE_PAGINAS &&
              nome !== CACHE_RECURSOS,
          )
          .map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data?.type === "GET_VERSION") {
    evento.ports[0]?.postMessage({ version: VERSAO });
  }
  if (evento.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function buscarPagina(requisicao) {
  const cache = await caches.open(CACHE_PAGINAS);
  const rede = fetch(requisicao).then((resposta) => {
    if (resposta.ok) void cache.put(requisicao, resposta.clone());
    return resposta;
  });
  const limite = new Promise((_, rejeitar) =>
    setTimeout(() => rejeitar(new Error("timeout")), 4000),
  );

  try {
    return await Promise.race([rede, limite]);
  } catch {
    return (
      (await cache.match(requisicao, { ignoreSearch: true })) ??
      (await cache.match("/")) ??
      Response.error()
    );
  }
}

async function buscarRecurso(requisicao) {
  const cache = await caches.open(CACHE_RECURSOS);
  const guardado = await cache.match(requisicao);
  if (guardado) return guardado;

  const resposta = await fetch(requisicao);
  if (resposta.ok) void cache.put(requisicao, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    evento.respondWith(buscarPagina(request));
    return;
  }
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    evento.respondWith(buscarRecurso(request));
  }
});
