/* àMesa Receitas — RECIPE PLAYER: a receita passo a passo, com progresso, ingredientes do passo,
   temporizadores (continuam a contar se mudares de passo) e um final com festa. */
(function(){
  var AMR = window.AMR = window.AMR || {};

  var ctxAudio = null;
  function apito(){
    try{
      ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)();
      var t = ctxAudio.currentTime;
      [0, .35, .7].forEach(function(d){ [880, 1320].forEach(function(f, k){ var o = ctxAudio.createOscillator(), g = ctxAudio.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t + d + k * .08); g.gain.exponentialRampToValueAtTime(.25, t + d + k * .08 + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d + k * .08 + .3); o.connect(g); g.connect(ctxAudio.destination); o.start(t + d + k * .08); o.stop(t + d + k * .08 + .32); }); });
    }catch(e){}
    try{ if(navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]); }catch(e){}
  }
  function confetes(cor){ var cores = [cor, '#f2b705', '#2e9b57', '#2a5aa8', '#e0245e', '#ff8c42']; for(var i = 0; i < 70; i++){ var c = document.createElement('i'); c.className = 'amr-conf'; c.style.left = (Math.random() * 100) + 'vw'; c.style.background = cores[i % cores.length]; c.style.animationDelay = (Math.random() * .5) + 's'; c.style.animationDuration = (1.6 + Math.random()) + 's'; document.body.appendChild(c); setTimeout(function(x){ return function(){ x.remove(); }; }(c), 3000); } }

  function abrir(r, fator, opc){
    opc = opc || {};
    var m = AMR.modelo, e = m.esc, cor = (r.layout && r.layout.cor) || '#c05a3a';
    var N = r.passos.length, idx = 0, dir = 1, timers = {}, relogio = null, trava = null;
    var porId = {}; r.ingredientes.forEach(function(i){ porId[i.ingrediente_id] = i; });
    var ov = document.createElement('div'); ov.className = 'amr amr-player'; ov.style.setProperty('--r-cor', cor);
    ov.innerHTML = '<div class="amr-pl-top"><button type="button" class="x" aria-label="Fechar">✕</button><div class="nome">' + e(r.nome) + '</div></div>'
      + '<div class="amr-pl-prog"><div class="lbl"><span class="pn"></span><span class="pp"></span></div><div class="bar"><i></i></div><div class="amr-pl-dots">' + r.passos.map(function(){ return '<i></i>'; }).join('') + '</div></div>'
      + '<div class="amr-pl-corpo"></div><div class="amr-mini" style="display:none"></div>'
      + '<div class="amr-pl-nav"><button type="button" class="ant">← Anterior</button><button type="button" class="prox">Próximo →</button></div>';
    document.body.appendChild(ov);
    var corpo = ov.querySelector('.amr-pl-corpo'), nav = ov.querySelector('.amr-pl-nav'), mini = ov.querySelector('.amr-mini');
    try{ if(navigator.wakeLock) navigator.wakeLock.request('screen').then(function(w){ trava = w; }).catch(function(){}); }catch(x){}   // o ecrã não se apaga enquanto cozinhas

    function tAtual(p){ var t = timers[p.id]; if(!t && p.timer){ t = timers[p.id] = { total:p.timer.segundos, resta:p.timer.segundos, corre:false, fim:false, rotulo:p.timer.rotulo || p.titulo }; } return t; }
    function tick(){
      var agora = Date.now(), algum = false;
      Object.keys(timers).forEach(function(k){ var t = timers[k]; if(!t.corre) return; algum = true; t.resta = Math.max(0, t.resta - (agora - t.ultimo) / 1000); t.ultimo = agora; if(t.resta <= 0){ t.corre = false; t.fim = true; apito(); } });
      pintaTimer(); pintaMini();
      if(!algum && relogio){ clearInterval(relogio); relogio = null; }
    }
    function arranca(){ if(!relogio) relogio = setInterval(tick, 250); }
    function pintaTimer(){
      var p = r.passos[idx], box = corpo.querySelector('.amr-timer'); if(!p || !box) return; var t = tAtual(p);
      box.className = 'amr-timer' + (t.corre ? ' corre' : '') + (t.fim ? ' fim' : '');
      box.querySelector('.rel').textContent = t.fim ? '00:00' : m.relogio(Math.ceil(t.resta));
      box.querySelector('.rot').innerHTML = t.fim ? '🔔 <b style="color:var(--r-verde)">Tempo terminado</b>' : e(t.rotulo);
      box.querySelector('.go').textContent = t.fim ? '↺ Repetir' : t.corre ? '❚❚ Pausa' : (t.resta < t.total ? '▶ Continuar' : '▶ Iniciar');
      box.querySelector('.rep').style.display = (!t.fim && t.resta < t.total) ? '' : 'none';
    }
    function pintaMini(){
      var outros = Object.keys(timers).filter(function(k){ return String(k) !== String(r.passos[idx] && r.passos[idx].id) && (timers[k].corre || timers[k].fim); });
      if(!outros.length){ mini.style.display = 'none'; return; }
      mini.style.display = 'flex';
      mini.innerHTML = outros.map(function(k){ var t = timers[k]; return '<span>' + (t.fim ? '🔔' : '⏱') + ' <b>' + (t.fim ? 'pronto' : m.relogio(Math.ceil(t.resta))) + '</b> ' + e(t.rotulo) + '</span>'; }).join(' · ');
    }
    function passo(){
      var p = r.passos[idx];
      ov.querySelector('.pn').textContent = 'Passo ' + (idx + 1) + ' de ' + N;
      ov.querySelector('.pp').textContent = Math.round((idx + 1) / N * 100) + '%';
      ov.querySelector('.bar i').style.width = ((idx + 1) / N * 100) + '%';
      ov.querySelectorAll('.amr-pl-dots i').forEach(function(d, k){ d.className = k === idx ? 'on' : (k < idx ? 'f' : ''); });
      var ings = (p.ingredientes || []).map(function(id){ return porId[id]; }).filter(Boolean);
      corpo.innerHTML = '<div class="amr-pl-passo' + (dir < 0 ? ' tras' : '') + '"><div class="amr-pl-num">' + (idx + 1) + '</div><h2 class="amr-pl-tit">' + e(p.titulo) + '</h2><div class="amr-pl-desc">' + e(p.descricao) + '</div>'
        + (ings.length ? '<div class="amr-pl-ings">' + ings.map(function(i){ return '<span>' + e(i.nome) + ' <b>' + e(m.quantidadeTexto(i, fator)) + '</b></span>'; }).join('') + '</div>' : '')
        + (p.dica ? '<div class="amr-pl-dica">💡 ' + e(p.dica) + '</div>' : '')
        + (p.timer ? '<div class="amr-timer"><div class="info"><div class="rel"></div><div class="rot"></div></div><button type="button" class="rep sec" aria-label="Repor">↺</button><button type="button" class="go"></button></div>' : '')
        + '</div>';
      corpo.scrollTop = 0;
      if(p.timer){
        var t = tAtual(p), box = corpo.querySelector('.amr-timer');
        box.querySelector('.go').onclick = function(){ if(t.fim){ t.fim = false; t.resta = t.total; } t.corre = !t.corre; t.ultimo = Date.now(); if(t.corre) arranca(); pintaTimer(); pintaMini(); try{ ctxAudio = ctxAudio || new (window.AudioContext || window.webkitAudioContext)(); if(ctxAudio.state === 'suspended') ctxAudio.resume(); }catch(x){} };
        box.querySelector('.rep').onclick = function(){ t.corre = false; t.fim = false; t.resta = t.total; pintaTimer(); pintaMini(); };
        pintaTimer();
      }
      pintaMini();
      var ant = nav.querySelector('.ant'), prox = nav.querySelector('.prox');
      ant.disabled = idx === 0; nav.style.display = '';
      prox.textContent = idx === N - 1 ? 'Concluir ✓' : 'Próximo →';
    }
    function fim(){
      ov.querySelector('.pn').textContent = 'Concluída'; ov.querySelector('.pp').textContent = '100%'; ov.querySelector('.bar i').style.width = '100%';
      ov.querySelectorAll('.amr-pl-dots i').forEach(function(d){ d.className = 'f'; });
      nav.style.display = 'none'; mini.style.display = 'none';
      corpo.innerHTML = '<div class="amr-fim"><div class="e">🎉</div><h2>Receita concluída</h2><div class="serif" style="font-size:1.4rem;font-weight:700;">' + e(r.nome) + '</div><p>Bom apetite! ❤️</p>'
        + '<div class="amr-acoes" style="max-width:360px;margin:20px auto 0;"><button type="button" class="amr-btn prim" data-a="voltar">Voltar à receita</button><button type="button" class="amr-btn" data-a="lista">🛒 Ver lista de compras</button><button type="button" class="amr-btn" data-a="outra" style="border:none;background:none;color:var(--r-muted);">↺ Recomeçar os passos</button></div></div>';
      corpo.querySelector('[data-a="voltar"]').onclick = fechar;
      corpo.querySelector('[data-a="lista"]').onclick = function(){ AMR.lista && AMR.lista.abrir(r, fator); };
      corpo.querySelector('[data-a="outra"]').onclick = function(){ idx = 0; dir = 1; passo(); };
      confetes(cor); try{ if(navigator.vibrate) navigator.vibrate(60); }catch(x){}
    }
    function ir(d){ if(d > 0 && idx === N - 1){ fim(); return; } var n = idx + d; if(n < 0 || n >= N) return; dir = d; idx = n; passo(); }
    function fechar(){ if(relogio) clearInterval(relogio); try{ trava && trava.release(); }catch(x){} document.removeEventListener('keydown', teclas); ov.classList.remove('on'); setTimeout(function(){ ov.remove(); opc.aoFechar && opc.aoFechar(); }, 380); }
    function teclas(ev){ if(ev.key === 'ArrowRight') ir(1); else if(ev.key === 'ArrowLeft') ir(-1); else if(ev.key === 'Escape') fechar(); }
    nav.querySelector('.ant').onclick = function(){ ir(-1); };
    nav.querySelector('.prox').onclick = function(){ ir(1); };
    ov.querySelector('.x').onclick = fechar;
    document.addEventListener('keydown', teclas);
    var x0 = null; corpo.addEventListener('touchstart', function(ev){ x0 = ev.touches[0].clientX; }, { passive:true });
    corpo.addEventListener('touchend', function(ev){ if(x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; x0 = null; if(Math.abs(dx) > 70 && nav.style.display !== 'none') ir(dx < 0 ? 1 : -1); });
    passo();
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ ov.classList.add('on'); }); });
    return { fechar:fechar };
  }
  AMR.player = { abrir:abrir };
})();
