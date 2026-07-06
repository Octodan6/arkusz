// Wersja pamięci podręcznej — zmiana tej nazwy wymusza odświeżenie u wszystkich
const CACHE = 'platnosci-v2';
const FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html');

  if(isPage){
    // Strona główna: NAJPIERW internet (świeża wersja), pamięć podręczna tylko offline
    e.respondWith(
      fetch(e.request).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
        return res;
      }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
  } else {
    // Ikony, manifest: pamięć podręczna, w tle odświeżenie
    e.respondWith(
      caches.match(e.request).then(res=> res || fetch(e.request).then(r=>{
        const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
      }))
    );
  }
});
