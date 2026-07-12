// Service Worker mínimo — apenas habilita a "instalabilidade" do PWA.
// Propositalmente NÃO faz cache agressivo de nada, para evitar mostrar
// versões antigas do site após cada novo deploy no Render.

const CACHE_VERSION = 'quanton3d-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_VERSION)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

// Sempre busca da rede — não intercepta nem armazena nada em cache.
// Isso garante instalabilidade (ícone na tela inicial) sem risco de
// conteúdo desatualizado.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
