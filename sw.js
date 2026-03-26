const CACHE = 'noor-v9';
const STATIC = [
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Josefin+Sans:wght@300;400;600;700&display=swap',
  'https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/normal-v4.2.2/with-waqf-lazmi/font.ttf'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(STATIC.map(url => c.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = e.request.url;
  const method = e.request.method;
  if (method !== 'GET') return;

  // Cache-first for fonts & audio assets
  if (u.includes('everyayah.com') || u.includes('fonts.gstatic.com') ||
      u.includes('fonts.googleapis.com') || u.includes('static-cdn.tarteel.ai') ||
      u.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res && res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => new Response('', { status: 503 })))
    );
    return;
  }

  // Network-first with cache fallback for API calls
  if (u.includes('api.alquran.cloud') || u.includes('api.quran.com')) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(e.request).then(r => r || new Response('', { status: 503 })))
    );
    return;
  }
});
