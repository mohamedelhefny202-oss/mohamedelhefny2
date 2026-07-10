/* ===========================================================
   Service Worker - جرد الكافيه اليومي
   يقوم بتخزين ملفات التطبيق الأساسية للعمل بدون إنترنت
=========================================================== */

const CACHE_NAME = "cafe-inventory-cache-v1";

const APP_SHELL = [
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];

/* عند التثبيت: خزّن ملفات التطبيق الأساسية */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* عند التفعيل: احذف أي نسخ كاش قديمة */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* عند الطلب: جرّب الكاش أولاً، ثم الشبكة، مع تحديث الكاش بالنتيجة الجديدة */
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const networkFetch = fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
