/* àMesa Receitas — RECIPE PLAYER: a receita passo a passo, com progresso, ingredientes do passo,
   temporizadores (continuam a contar se mudares de passo) e um final com festa. */
(function(){
  var AMR = window.AMR = window.AMR || {};

  // ---- Sons (Web Audio; no iPhone só tocam depois do primeiro toque e com o botão de silêncio desligado) ----
  var ctxAudio = null;
  function audio(){
    try{
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      if(ctxAudio.state === 'suspended') ctxAudio.resume();
      return ctxAudio;
    }catch(e){ return null; }
  }
  function nota(f, ini, dur, vol, tipo, f2){
    var c = audio(); if(!c) return;
    var t = c.currentTime + ini, o = c.createOscillator(), g = c.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol || .2, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  var SONS = {
    prox:   function(){ nota(620, 0, .09, .16, 'triangle', 930); },          // avançar: "tic" a subir
    ant:    function(){ nota(930, 0, .09, .16, 'triangle', 620); },          // recuar: "tic" a descer
    inicio: function(){ nota(660, 0, .12, .22); nota(990, .13, .18, .22); },  // relógio começou: dois bips a subir
    pausa:  function(){ nota(990, 0, .12, .2); nota(660, .13, .18, .2); },    // pausa: dois bips a descer
    repor:  function(){ nota(520, 0, .14, .18, 'triangle'); },
    aviso:  function(){ nota(1320, 0, .1, .18); },                            // falta 1 minuto
    fim:    function(){ [0, .35, .7].forEach(function(d){ nota(880, d, .3, .26); nota(1320, d + .08, .3, .26); }); }
  };
  function som(tipo){ try{ SONS[tipo] && SONS[tipo](); }catch(e){} }
  function vibra(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
  function apito(){ som('fim'); vibra([200, 100, 200, 100, 400]); }

  // ---- Guardar os temporizadores no telemóvel: se o ecrã bloquear, a página recarregar ou fechares o passo a passo,
  //      o tempo continua a contar (as contas fazem-se pela hora do relógio, não por "tiques") ----
  function chave(r){ return 'amrPlayer:' + (r.id || r.nome); }
  function ler(r){ try{ var o = JSON.parse(localStorage.getItem(chave(r)) || 'null'); if(o && Date.now() - (o.em || 0) < 12 * 3600e3) return o; }catch(e){} return null; }

  function confetes(cor){ var cores = [cor, '#f2b705', '#2e9b57', '#2a5aa8', '#e0245e', '#ff8c42']; for(var i = 0; i < 70; i++){ var c = document.createElement('i'); c.className = 'amr-conf'; c.style.left = (Math.random() * 100) + 'vw'; c.style.background = cores[i % cores.length]; c.style.animationDelay = (Math.random() * .5) + 's'; c.style.animationDuration = (1.6 + Math.random()) + 's'; document.body.appendChild(c); setTimeout(function(x){ return function(){ x.remove(); }; }(c), 3000); } }

  function abrir(r, fator, opc){
    opc = opc || {};
    var m = AMR.modelo, e = m.esc, cor = (r.layout && r.layout.cor) || '#c05a3a';
    var N = r.passos.length, idx = 0, dir = 1, timers = {}, relogio = null, trava = null, alarme = null, concluida = false;
    var guardado = ler(r);
    if(guardado){
      Object.keys(guardado.timers || {}).forEach(function(k){ var p = r.passos.filter(function(x){ return String(x.id) === k; })[0], g = guardado.timers[k]; if(p && p.timer && g) timers[k] = { total:g.total, resta:g.resta, fimEm:g.fimEm, corre:!!g.corre, fim:!!g.fim, avisou:!!g.avisou, visto:!!g.visto, rotulo:p.timer.rotulo || p.titulo }; });
      if(guardado.idx > 0 && guardado.idx < N) idx = guardado.idx;
    }
    function guardar(){
      try{
        var algum = Object.keys(timers).some(function(k){ var t = timers[k]; return t.corre || t.fim || t.resta < t.total; });
        if(!algum && (idx === 0 || concluida)){ localStorage.removeItem(chave(r)); return; }
        var o = { em:Date.now(), idx:concluida ? 0 : idx, fator:fator, timers:{} };
        Object.keys(timers).forEach(function(k){ var t = timers[k]; o.timers[k] = { total:t.total, resta:t.resta, fimEm:t.fimEm, corre:t.corre, fim:t.fim, avisou:t.avisou, visto:t.visto }; });
        localStorage.setItem(chave(r), JSON.stringify(o));
      }catch(e){}
    }
    function limparGuardado(){ try{ localStorage.removeItem(chave(r)); }catch(e){} }
    var porId = {}; r.ingredientes.forEach(function(i){ porId[i.ingrediente_id] = i; });
    var ov = document.createElement('div'); ov.className = 'amr amr-player'; ov.style.setProperty('--r-cor', cor);
    ov.innerHTML = '<div class="amr-pl-top"><button type="button" class="x" aria-label="Fechar">✕</button><div class="nome">' + e(r.nome) + '</div></div>'
      + '<div class="amr-pl-prog"><div class="lbl"><span class="pn"></span><span class="pp"></span></div><div class="bar"><i></i></div><div class="amr-pl-dots">' + r.passos.map(function(){ return '<i></i>'; }).join('') + '</div></div>'
      + '<div class="amr-pl-corpo"></div><div class="amr-mini" style="display:none"></div>'
      + '<div class="amr-pl-nav"><button type="button" class="ant">← Anterior</button><button type="button" class="prox">Próximo →</button></div>';
    document.body.appendChild(ov);
    var corpo = ov.querySelector('.amr-pl-corpo'), nav = ov.querySelector('.amr-pl-nav'), mini = ov.querySelector('.amr-mini');
    function acordado(){ try{ if(navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(function(w){ trava = w; }).catch(function(){}); }catch(x){} }   // o ecrã não se apaga enquanto cozinhas
    acordado();
    ov.addEventListener('pointerdown', function(){ audio(); pararAlarme(); }, true);   // desbloqueia o som no iPhone; tocar no ecrã cala o alarme

    function tAtual(p){ var t = timers[p.id]; if(!t && p.timer){ t = timers[p.id] = { total:p.timer.segundos, resta:p.timer.segundos, corre:false, fim:false, rotulo:p.timer.rotulo || p.titulo }; } return t; }
    function restaDe(t){ return t.corre ? Math.max(0, (t.fimEm - Date.now()) / 1000) : t.resta; }
    function pararAlarme(){ if(alarme){ clearInterval(alarme); alarme = null; } }
    function tocarAlarme(){ apito(); var n = 1; pararAlarme(); alarme = setInterval(function(){ if(++n > 5 || document.visibilityState !== 'visible'){ pararAlarme(); return; } apito(); }, 3500); }
    function tick(){
      var algum = false, tocou = false, mudou = false;
      Object.keys(timers).forEach(function(k){
        var t = timers[k]; if(!t.corre) return; algum = true;
        var resta = restaDe(t);
        if(!t.avisou && t.total > 120 && resta <= 60 && resta > 0){ t.avisou = true; mudou = true; if(document.visibilityState === 'visible') som('aviso'); }
        if(resta <= 0){ t.corre = false; t.fim = true; t.resta = 0; t.visto = document.visibilityState === 'visible'; mudou = true; tocou = true; }   // toca já (no Android ouve-se mesmo com o ecrã apagado); no iPhone volta a tocar quando reabrires
      });
      if(tocou) tocarAlarme();
      if(mudou) guardar();
      pintaTimer(); pintaMini();
      if(!algum && relogio){ clearInterval(relogio); relogio = null; }
    }
    function arranca(){ if(!relogio) relogio = setInterval(tick, 250); }
    // ao voltar ao ecrã (depois de bloquear o telemóvel ou mudar de app): acerta logo o tempo e avisa o que terminou entretanto
    function voltou(){
      if(document.visibilityState !== 'visible' || !ov.isConnected) return;
      audio(); acordado(); tick();
      var acabou = Object.keys(timers).filter(function(k){ return timers[k].fim && !timers[k].visto; });
      if(acabou.length){
        acabou.forEach(function(k){ timers[k].visto = true; }); guardar(); tocarAlarme();
        var i = r.passos.findIndex(function(p){ return String(p.id) === String(acabou[0]); });
        if(i >= 0 && i !== idx){ dir = i > idx ? 1 : -1; idx = i; passo(); }
      }
      if(Object.keys(timers).some(function(k){ return timers[k].corre; })) arranca();
    }
    document.addEventListener('visibilitychange', voltou);
    window.addEventListener('pageshow', voltou);
    window.addEventListener('focus', voltou);
    function haQuanto(t){ if(!t.fimEm) return ''; var s = Math.round((Date.now() - t.fimEm) / 1000); if(s < 60) return ''; var mi = Math.round(s / 60); return ' <span style="font-weight:700">· há ' + (mi < 60 ? mi + ' min' : Math.floor(mi / 60) + ' h ' + (mi % 60) + ' min') + '</span>'; }
    function pintaTimer(){
      var p = r.passos[idx], box = corpo.querySelector('.amr-timer'); if(!p || !box) return; var t = tAtual(p);
      box.className = 'amr-timer' + (t.corre ? ' corre' : '') + (t.fim ? ' fim' : '');
      var resta = restaDe(t);
      box.querySelector('.rel').textContent = t.fim ? '00:00' : m.relogio(Math.ceil(resta));
      box.querySelector('.rot').innerHTML = t.fim ? '🔔 <b style="color:var(--r-verde)">Tempo terminado</b>' + haQuanto(t) : e(t.rotulo);
      box.querySelector('.go').textContent = t.fim ? '↺ Repetir' : t.corre ? '❚❚ Pausa' : (resta < t.total ? '▶ Continuar' : '▶ Iniciar');
      box.querySelector('.rep').style.display = (!t.fim && resta < t.total) ? '' : 'none';
    }
    function pintaMini(){
      var outros = Object.keys(timers).filter(function(k){ return String(k) !== String(r.passos[idx] && r.passos[idx].id) && (timers[k].corre || timers[k].fim); });
      if(!outros.length){ mini.style.display = 'none'; return; }
      mini.style.display = 'flex';
      mini.innerHTML = outros.map(function(k){ var t = timers[k]; return '<span>' + (t.fim ? '🔔' : '⏱') + ' <b>' + (t.fim ? 'pronto' : m.relogio(Math.ceil(restaDe(t)))) + '</b> ' + e(t.rotulo) + '</span>'; }).join(' · ');
    }
    function passo(){
      var p = r.passos[idx];
      ov.querySelector('.pn').textContent = 'Passo ' + (idx + 1) + ' de ' + N;
      ov.querySelector('.pp').textContent = Math.round((idx + 1) / N * 100) + '%';
      ov.querySelector('.bar i').style.width = ((idx + 1) / N * 100) + '%';
      ov.querySelectorAll('.amr-pl-dots i').forEach(function(d, k){ d.className = k === idx ? 'on' : (k < idx ? 'f' : ''); });
      var ings = (p.ingredientes || []).map(function(id){ return porId[id]; }).filter(Boolean);
      corpo.innerHTML = '<div class="amr-pl-passo' + (dir < 0 ? ' tras' : '') + '"><div class="amr-pl-num">' + (idx + 1) + '</div><h2 class="amr-pl-tit">' + e(p.titulo) + '</h2><div class="amr-pl-desc">' + e(p.descricao) + '</div>'
        + (ings.length ? '<div class="amr-pl-ings">' + ings.map(function(i){ var q = m.noPasso ? m.noPasso(p, i) : i; return '<span>' + e(i.nome) + ' <b>' + e(m.quantidadeTexto(q, fator)) + '</b></span>'; }).join('') + '</div>' : '')
        + (p.dica ? '<div class="amr-pl-dica">💡 ' + e(p.dica) + '</div>' : '')
        + (p.timer ? '<div class="amr-timer"><div class="info"><div class="rel"></div><div class="rot"></div></div><button type="button" class="rep sec" aria-label="Repor">↺</button><button type="button" class="go"></button></div>' : '')
        + '</div>';
      corpo.scrollTop = 0;
      if(p.timer){
        var t = tAtual(p), box = corpo.querySelector('.amr-timer');
        box.querySelector('.go').onclick = function(){
          audio(); pararAlarme();
          if(t.fim){ t.fim = false; t.resta = t.total; t.avisou = false; t.fimEm = null; }
          if(t.corre){ t.resta = restaDe(t); t.corre = false; som('pausa'); vibra(40); }
          else { t.fimEm = Date.now() + t.resta * 1000; t.corre = true; t.visto = false; arranca(); som('inicio'); vibra([30, 60, 30]); }
          guardar(); pintaTimer(); pintaMini();
        };
        box.querySelector('.rep').onclick = function(){ pararAlarme(); t.corre = false; t.fim = false; t.resta = t.total; t.avisou = false; t.fimEm = null; som('repor'); guardar(); pintaTimer(); pintaMini(); };
        pintaTimer();
      }
      pintaMini();
      var ant = nav.querySelector('.ant'), prox = nav.querySelector('.prox');
      ant.disabled = idx === 0; nav.style.display = '';
      prox.textContent = idx === N - 1 ? 'Concluir ✓' : 'Próximo →';
    }
    function fim(){
      concluida = true;
      ov.querySelector('.pn').textContent = 'Concluída'; ov.querySelector('.pp').textContent = '100%'; ov.querySelector('.bar i').style.width = '100%';
      ov.querySelectorAll('.amr-pl-dots i').forEach(function(d){ d.className = 'f'; });
      nav.style.display = 'none'; mini.style.display = 'none';
      corpo.innerHTML = '<div class="amr-fim"><div class="e">🎉</div><h2>Receita concluída</h2><div class="serif" style="font-size:1.4rem;font-weight:700;">' + e(r.nome) + '</div><p>Bom apetite! ❤️</p>'
        + '<div class="amr-acoes" style="max-width:360px;margin:20px auto 0;"><button type="button" class="amr-btn prim" data-a="voltar">Voltar à receita</button><button type="button" class="amr-btn" data-a="lista">🛒 Ver lista de compras</button><button type="button" class="amr-btn" data-a="outra" style="border:none;background:none;color:var(--r-muted);">↺ Recomeçar os passos</button></div></div>';
      corpo.querySelector('[data-a="voltar"]').onclick = fechar;
      corpo.querySelector('[data-a="lista"]').onclick = function(){ AMR.lista && AMR.lista.abrir(r, fator); };
      corpo.querySelector('[data-a="outra"]').onclick = function(){ pararAlarme(); timers = {}; concluida = false; if(relogio){ clearInterval(relogio); relogio = null; } limparGuardado(); idx = 0; dir = 1; passo(); };
      confetes(cor); vibra(60); nota(660, 0, .12, .2); nota(880, .12, .12, .2); nota(1320, .24, .3, .22);
      if(!Object.keys(timers).some(function(k){ return timers[k].corre; })) limparGuardado();
    }
    function ir(d){ if(d > 0 && idx === N - 1){ fim(); return; } var n = idx + d; if(n < 0 || n >= N) return; concluida = false; som(d > 0 ? 'prox' : 'ant'); vibra(12); dir = d; idx = n; passo(); guardar(); }
    function fechar(){ if(relogio) clearInterval(relogio); pararAlarme(); guardar(); try{ trava && trava.release(); }catch(x){} document.removeEventListener('keydown', teclas); document.removeEventListener('visibilitychange', voltou); window.removeEventListener('pageshow', voltou); window.removeEventListener('focus', voltou); ov.classList.remove('on'); setTimeout(function(){ ov.remove(); opc.aoFechar && opc.aoFechar(); }, 380); }
    function teclas(ev){ if(ev.key === 'ArrowRight') ir(1); else if(ev.key === 'ArrowLeft') ir(-1); else if(ev.key === 'Escape') fechar(); }
    nav.querySelector('.ant').onclick = function(){ ir(-1); };
    nav.querySelector('.prox').onclick = function(){ ir(1); };
    ov.querySelector('.x').onclick = fechar;
    document.addEventListener('keydown', teclas);
    var x0 = null; corpo.addEventListener('touchstart', function(ev){ x0 = ev.touches[0].clientX; }, { passive:true });
    corpo.addEventListener('touchend', function(ev){ if(x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; x0 = null; if(Math.abs(dx) > 70 && nav.style.display !== 'none') ir(dx < 0 ? 1 : -1); });
    passo();
    if(Object.keys(timers).some(function(k){ return timers[k].corre; })){ arranca(); tick(); }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ ov.classList.add('on'); }); });
    return { fechar:fechar };
  }
  // há um temporizador a contar (ou que terminou sem ser visto) desta receita? → a página reabre o passo a passo sozinha
  function pendente(r){ var o = ler(r); if(!o) return null; var k = Object.keys(o.timers || {}); return k.some(function(x){ var t = o.timers[x]; return t.corre || (t.fim && !t.visto); }) ? o : null; }
  AMR.player = { abrir:abrir, pendente:pendente };
})();
