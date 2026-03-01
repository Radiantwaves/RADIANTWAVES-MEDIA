const CACHE_NAME = "radiantwaves-v1";
const urlsToCache = [
  "/index.html",
  "/news.json",
  "/manifest.json",
  "/main-story.jpg",
  "/facebook.png",
  "/twitter.png",
  "/tiktok.png",
  "/Instagram.png",
  "/news-music.mp3",
  "/icon-192.png",
  "/icon-512.png"
];

// Install Service Worker and cache static assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate Service Worker and clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if(name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch handler: serve cached assets, always fetch fresh news.json
self.addEventListener("fetch", event => {
  const requestURL = new URL(event.request.url);

  // Always fetch fresh news.json
  if(requestURL.pathname.endsWith("news.json")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with latest news.json
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Serve other assets from cache first
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
