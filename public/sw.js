/* Service worker do Wise Money.
 *
 * Estratégia: sempre buscar a versão mais nova na rede para navegações
 * (network-first) e assumir o controle imediatamente (skipWaiting +
 * clients.claim). Assim, quem já tem o app instalado recebe a versão
 * atual ao abrir, sem precisar reinstalar.
 */
const VERSAO = "wise-money-v2";
const ESTATICOS = `${VERSAO}-estaticos`;

self.addEventListener("install", (evento) => {
  self.skipWaiting();
  evento.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const chaves = await caches.keys();
      await Promise.all(chaves.filter((c) => !c.startsWith(VERSAO)).map((c) => caches.delete(c)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegações e manifesto: rede primeiro, cache só como último recurso offline.
  if (req.mode === "navigate" || url.pathname === "/manifest.json") {
    evento.respondWith(
      (async () => {
        // A chave ignora a parte "?..." para o modo offline achar a página
        // mesmo que o link tenha parâmetros diferentes.
        const chave = new Request(url.origin + url.pathname);
        try {
          const resposta = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(ESTATICOS);
          cache.put(chave, resposta.clone());
          return resposta;
        } catch {
          const cache = await caches.open(ESTATICOS);
          const emCache =
            (await cache.match(chave)) ?? (await cache.match(new Request(url.origin + "/")));
          return emCache ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Ícones e imagens: cache com revalidação em segundo plano.
  if (url.pathname.startsWith("/icons/") || url.pathname === "/favicon.png") {
    evento.respondWith(
      (async () => {
        const cache = await caches.open(ESTATICOS);
        const emCache = await cache.match(req);
        const naRede = fetch(req)
          .then((resposta) => {
            cache.put(req, resposta.clone());
            return resposta;
          })
          .catch(() => emCache ?? Response.error());
        return emCache ?? naRede;
      })(),
    );
  }
});
