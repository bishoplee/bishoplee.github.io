const cacheName = 'pwa-currenc-v1.0';

const filesToCache = [
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
];

// Install Service Worker
self.addEventListener('install', function(event) {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        // Open the Cache
        caches.open(cacheName).then(cache => {
            console.log('Service Worker: Caching App Shell at the moment...');

            // Add Files to the Cache
            return cache.addAll(filesToCache);
        })
    );
});

// Fired when the Service Worker starts up
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(cacheNames.map(key => {
                if( key !== cacheName) {
                    console.log('Service Worker: Removing Old Cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fired for fetch requests, [hijacking]
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === './') {
            event.respondWith(caches.match('./'));
            return;
        }
    }
    //console.log('Service Worker: Fetch', event.request.url);

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