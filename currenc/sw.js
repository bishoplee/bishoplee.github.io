const cacheName = 'pwa-currenc-v1.0';

const filesToCache = [
    cacheName
];

self.addEventListener('install', function(event) {
    event.waitUntil(caches.open(cacheName).then(cache => {
        return cache.addAll([
            './',
            './index.html',
            './css/style.css',
            './css/fonts/Source_Sans_Pro/SourceSansPro-Light.ttf',
            './css/fonts/Encode_Sans_Condensed/EncodeSansCondensed-Regular.ttf',
            './css/fonts/Encode_Sans_Condensed/EncodeSansCondensed-ExtraLight.ttf',
            './images/currenc-icon-512x512.png',
            './images/currenc-icon-256x256.png',
            './images/currenc-icon-192x192.png',
            './images/currenc-icon-168x168.png',
            './js/idb.js',
            './js/app.js',
            './js/offline.js',
            './js/toast.js'
        ]);
    }));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(key => {
                    return key.startsWith('pwa-currenc-') && !filesToCache.includes(key);
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === './') {
            event.respondWith(caches.match('./'));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});