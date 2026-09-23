/* ÀMesa — Service Worker para notificações push
   Servido a partir da raiz (amesadigital.pt/sw.js) → scope "/". */

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(event){ event.waitUntil(self.clients.claim()); });

// Recebe a notificação e mostra-a (mesmo com o site fechado)
self.addEventListener('push', function(event){
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { corpo: event.data ? event.data.text() : '' }; }

  var titulo = data.titulo || 'Novidade';
  var opcoes = {
    body: data.corpo || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
    renotify: !!data.tag,
    tag: data.tag || undefined
  };
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

// Ao tocar na notificação, abre (ou foca) o cardápio
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(wins){
      for (var i = 0; i < wins.length; i++) {
        var w = wins[i];
        try { if (w.url.indexOf(url.split('?')[0]) === 0 && 'focus' in w) return w.focus(); } catch (e) {}
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
