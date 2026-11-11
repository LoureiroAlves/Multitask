/* àMesa — Service Worker para notificações push
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
    // 4 Trevo: avisos dos negócios fora da àMesa (salões…) levam o ícone do trevo; os restaurantes ficam com o da àMesa
    icon: data.icon || (/\/salao(-gestao)?\.html/.test(String(data.url || '')) ? '/icon-trevo-192.png' : '/icon-192.png'),
    badge: data.badge || (/\/salao(-gestao)?\.html/.test(String(data.url || '')) ? '/icon-trevo-192.png' : '/icon-192.png'),
    data: { url: data.url || '/' },
    vibrate: data.fixa ? [120, 60, 120, 60, 240] : [80, 40, 80],
    renotify: !!data.tag,
    tag: data.tag || undefined,
    timestamp: Date.now()
  };
  if (data.image) opcoes.image = data.image;                 // imagem grande (Android/Chrome; o iPhone ignora)
  if (data.fixa) opcoes.requireInteraction = true;           // "está pronta": fica no ecrã até o cliente tocar
  var eSalao = /\/salao(-gestao)?\.html/.test(String(data.url || ''));
  if (data.url) opcoes.actions = [{ action: 'abrir', title: eSalao ? 'Abrir' : (data.fixa ? 'Ver encomenda' : 'Abrir menu') }];
  event.waitUntil(Promise.all([
    self.registration.showNotification(titulo, opcoes),
    // avisa as páginas abertas para se atualizarem sozinhas (quem não liga a isto ignora)
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(wins){
      wins.forEach(function(w){ try { w.postMessage({ tipo: 'push', url: data.url || '', tag: data.tag || '' }); } catch (e) {} });
    })
  ]));
});

// Ao tocar na notificação, abre (ou foca) o cardápio
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(wins){
      for (var i = 0; i < wins.length; i++) {
        var w = wins[i];
        try { if (w.url.indexOf(url.split('?')[0]) === 0 && 'focus' in w) { try { w.postMessage({ tipo: 'abrir', url: url }); } catch (e2) {} return w.focus(); } } catch (e) {}
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
