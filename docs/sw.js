// Service worker : rend l'appli installable et l'écran disponible même avec un réseau lent.
// Les données (Supabase) ne sont jamais mises en cache ici : elles viennent toujours d'internet.
const CACHE = 'carrosserie-v7';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'config.js', 'vendor/supabase.js', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase, polices : réseau direct
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});

// Notifications envoyées par Supabase
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = { title: 'Suivi carrosserie', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Suivi carrosserie', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope)) { c.postMessage({ open: url }); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
