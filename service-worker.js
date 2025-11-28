self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('silvastream-cache').then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'styles/main.css',
        'scripts/app.js',
        'scripts/api.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
