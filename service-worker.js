const CACHE_NAME = "radiantwaves-v2";

const urlsToCache = [
  "index.html",
  "news.json",
  "main-story.jpg",
  "facebook.png",
  "twitter.png",
  "Instagram.png",
  "tiktok.png",
  "icon-192.png",
  "icon-512.png",
  "news-music.mp3"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
