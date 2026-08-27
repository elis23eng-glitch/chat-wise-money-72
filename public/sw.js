const CACHE_NAME = "mergulho-v1";
const SHELL_ASSETS = ["/", "/conversa", "/resumo", "/metas", "/mercado", "/insights"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => {
        return caches.match(request).then((cached) => cached ?? caches.match("/"));
      }),
  );
});
