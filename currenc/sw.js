const cacheName = 'pwa-currenc-v1.0';

const filesToCache = [
    './',
    './css/style.css',
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

self.addEventListener('fetch', event => {
    //alert(event);
    console.log('Service Worker: Fetch', event.request.url);
    console.log("Url", event.request.url);

    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});