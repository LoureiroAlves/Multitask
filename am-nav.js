/* àMesa — NAVEGAÇÃO ANIMADA entre Restaurantes ⇄ Receitas ⇄ Compras
   - deslizar o dedo para o lado muda de área (a página acompanha o dedo)
   - o seletor do topo tem uma "pílula" que desliza até à área escolhida
   - os cartões da página inicial abrem com zoom
   - onda + leve "afundar" ao tocar nos botões e cartões
   Vai no <head> de index.html, receitas.html e compras.html (antes do resto, para não piscar). */
(function(){
  var AREAS = [
    { id:'restaurantes', url:'./?ver=restaurantes', nome:'Restaurantes', e:'🍽️' },
    { id:'receitas', url:'receitas.html', nome:'Receitas', e:'🍳' },
    { id:'compras', url:'compras.html', nome:'Compras', e:'🛒' }
  ];
  var pag = (location.pathname.split('/').pop() || '').toLowerCase();
  var AQUI = pag === 'receitas.html' ? 1 : pag === 'compras.html' ? 2 : 0;
  var reduz = false; try{ reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

  // ---- estilos (injetados já, no <head>) ----
  var css = ''
    + '@keyframes amEntraD{from{transform:translateX(56px);opacity:0}to{transform:none;opacity:1}}'
    + '@keyframes amEntraE{from{transform:translateX(-56px);opacity:0}to{transform:none;opacity:1}}'
    + '@keyframes amEntraZ{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}'
    + 'html.am-entra-d main{animation:amEntraD .42s cubic-bezier(.2,.9,.3,1) both}'
    + 'html.am-entra-e main{animation:amEntraE .42s cubic-bezier(.2,.9,.3,1) both}'
    + 'html.am-entra-z main{animation:amEntraZ .45s cubic-bezier(.2,.9,.3,1) both}'
    + '.am-anim-d{animation:amEntraD .36s cubic-bezier(.2,.9,.3,1) both}'
    + '.am-anim-e{animation:amEntraE .36s cubic-bezier(.2,.9,.3,1) both}'
    + '.am-anim-z{animation:amEntraZ .38s cubic-bezier(.2,.9,.3,1) both}'
    + 'body.am-sai main{transition:transform .24s cubic-bezier(.5,0,.8,.4),opacity .24s ease;opacity:0}'
    + 'body.am-sai-e main{transform:translateX(-70px)}body.am-sai-d main{transform:translateX(70px)}'
    // seletor com pílula a deslizar
    + '.am-troca{position:relative}.am-troca a,.am-troca span{position:relative;z-index:1;transition:color .25s}'
    + '.am-troca.am-pil .on{background:transparent!important}'
    + '.am-pilula{position:absolute;z-index:0;top:4px;bottom:4px;border-radius:12px;background:#2e2418;box-shadow:0 4px 12px rgba(46,36,24,.25);transition:left .32s cubic-bezier(.3,1.3,.5,1),width .32s;pointer-events:none}'
    + '.am-troca a.am-vai{color:#fff!important}.am-troca .on.am-deixa{color:#2e2418!important}'
    // espreitar a área ao lado enquanto arrastas
    + '.am-espreita{position:fixed;top:50%;z-index:9990;transform:translateY(-50%) scale(.8);opacity:0;background:#2e2418;color:#fff;font:900 15px/1 Nunito,system-ui,sans-serif;border-radius:999px;padding:12px 16px;box-shadow:0 10px 26px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap;transition:transform .15s,background .15s}'
    + '.am-espreita.pronta{background:#2e7d4f;transform:translateY(-50%) scale(1)}'
    // toque: onda + afundar
    + '.am-onda-alvo{position:relative;overflow:hidden}'
    + '.am-onda{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:.18;transform:scale(0);animation:amOnda .55s ease-out forwards}'
    + '@keyframes amOnda{to{transform:scale(1);opacity:0}}'
    + '.am-afunda{transition:transform .12s ease}.am-afunda.am-carrega{transform:scale(.965)}'
    // zoom dos cartões da página inicial
    + '.am-zoom{position:fixed;z-index:9995;margin:0;transition:all .42s cubic-bezier(.6,0,.2,1);overflow:hidden;pointer-events:none}'
    + '.am-iris{position:fixed;inset:0;z-index:9994;pointer-events:none}'
    + '@media (prefers-reduced-motion: reduce){html[class*="am-entra"] main,.am-anim-d,.am-anim-e,.am-anim-z{animation:none!important}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  // ---- entrada: como chegámos a esta página? ----
  try{
    var d = sessionStorage.getItem('amEntra');
    if(d && !reduz){ document.documentElement.classList.add('am-entra-' + d); setTimeout(function(){ document.documentElement.classList.remove('am-entra-' + d); }, 700); }
    sessionStorage.removeItem('amEntra');
  }catch(e){}
  // voltar atrás (página guardada pelo browser): tira o estado de "a sair"
  window.addEventListener('pageshow', function(ev){
    aSair = false;
    document.body && document.body.classList.remove('am-sai', 'am-sai-e', 'am-sai-d');
    var m = document.querySelector('main'); if(m){ m.style.transform = ''; m.style.opacity = ''; m.style.transition = ''; }
    document.querySelectorAll('.am-troca').forEach(function(n){ if(n.__amRepor) n.__amRepor(); });      // pílula de volta à área desta página
    document.querySelectorAll('.am-zoom').forEach(function(z){ z.remove(); });
    document.querySelectorAll('.porta-c').forEach(function(c){ c.style.visibility = ''; });
    var esp = document.querySelector('.am-espreita'); if(esp){ esp.style.opacity = '0'; esp.classList.remove('pronta'); }
  });

  function vibra(n){ try{ if(navigator.vibrate) navigator.vibrate(n); }catch(e){} }
  var aSair = false;
  function irPara(i, comoEntra){
    if(aSair || i === AQUI || i < 0 || i >= AREAS.length) return;
    aSair = true; vibra(10);
    try{ sessionStorage.setItem('amEntra', comoEntra || (i > AQUI ? 'd' : 'e')); }catch(e){}
    if(i === 0) try{ sessionStorage.setItem('amEscolha', 'restaurantes'); }catch(e){}
    if(reduz){ location.href = AREAS[i].url; return; }
    document.body.classList.add('am-sai', i > AQUI ? 'am-sai-e' : 'am-sai-d');
    setTimeout(function(){ location.href = AREAS[i].url; }, 230);
    setTimeout(function(){ aSair = false; }, 2500);
  }
  // animação de mudança DENTRO da mesma página (ex.: setor → lista). Usado por compras.html e receitas.html
  function anima(el, dir){ if(!el || reduz) return; el.classList.remove('am-anim-d', 'am-anim-e', 'am-anim-z'); void el.offsetWidth; el.classList.add('am-anim-' + (dir || 'z')); setTimeout(function(){ el.classList.remove('am-anim-' + (dir || 'z')); }, 450); }
  window.AMNAV = { irPara:irPara, anima:anima, AQUI:AQUI };

  function pronto(f){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); }
  pronto(function(){
    var body = document.body;

    // ===== 1) Seletor do topo com pílula =====
    function prepararTroca(nav){
      if(!nav || nav.dataset.amPil) return; nav.dataset.amPil = '1';
      var on = nav.querySelector('.on'); if(!on) return;
      var pil = document.createElement('i'); pil.className = 'am-pilula'; nav.insertBefore(pil, nav.firstChild);
      function poe(el){ pil.style.left = el.offsetLeft + 'px'; pil.style.width = el.offsetWidth + 'px'; }
      // só esconde o fundo escuro do botão ativo quando a pílula está mesmo no sítio (se o seletor ainda não tiver tamanho, fica o fundo normal)
      function assenta(){
        var alvo = nav.querySelector('.am-vai') || on;
        if(!alvo.offsetWidth){ nav.classList.remove('am-pil'); return; }
        pil.style.transition = 'none'; poe(alvo); void pil.offsetWidth; pil.style.transition = '';
        nav.classList.add('am-pil');
      }
      assenta();
      // repor o seletor como estava (ao voltar atrás o browser mostra a página "congelada" a meio da mudança)
      nav.__amRepor = function(){
        nav.querySelectorAll('.am-vai').forEach(function(x){ x.classList.remove('am-vai'); });
        on.classList.remove('am-deixa');
        assenta();
      };
      window.addEventListener('resize', assenta);
      try{ new ResizeObserver(function(){ if(!nav.querySelector('.am-vai')) assenta(); }).observe(nav); }catch(e){}   // aparece/muda de tamanho → acerta
      try{ document.fonts && document.fonts.ready.then(assenta); }catch(e){}
      nav.querySelectorAll('a').forEach(function(a, k){
        a.addEventListener('click', function(ev){
          var i = AREAS.map(function(x){ return x.url; }).indexOf(a.getAttribute('href')); if(i < 0) return;
          ev.preventDefault(); if(aSair) return;
          a.classList.add('am-vai'); on.classList.add('am-deixa'); nav.classList.add('am-pil'); poe(a);
          setTimeout(function(){ irPara(i); }, reduz ? 0 : 140);
        });
      });
    }
    function verTrocas(){ document.querySelectorAll('.am-troca').forEach(prepararTroca); }
    verTrocas();
    // as páginas das receitas e das compras redesenham o conteúdo → voltar a preparar o seletor quando aparecer
    try{ new MutationObserver(verTrocas).observe(document.querySelector('main') || body, { childList:true, subtree:true }); }catch(e){}

    // ===== 2) Cartões da página inicial: zoom =====
    document.querySelectorAll('.porta-c').forEach(function(c){
      c.addEventListener('click', function(ev){
        var href = c.getAttribute('href'), i = AREAS.map(function(x){ return x.url; }).indexOf(href);
        if(c.id === 'optRest'){ setTimeout(function(){ anima(document.querySelector('main'), 'z'); }, 0); vibra(10); return; }   // restaurantes ficam na mesma página
        if(i < 0 || reduz) return;
        ev.preventDefault(); if(aSair) return; aSair = true; vibra(12);
        var r = c.getBoundingClientRect(), z = c.cloneNode(true);
        z.classList.add('am-zoom'); z.removeAttribute('id');
        z.style.cssText += ';position:fixed;z-index:9995;transition:all .42s cubic-bezier(.6,0,.2,1);pointer-events:none;margin:0;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:26px;animation:none';
        body.appendChild(z); c.style.visibility = 'hidden';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ z.style.left = '0px'; z.style.top = '0px'; z.style.width = '100vw'; z.style.height = '100vh'; z.style.borderRadius = '0'; }); });
        try{ sessionStorage.setItem('amEntra', 'z'); }catch(e){}
        setTimeout(function(){ location.href = href; }, 380);
        window.addEventListener('pageshow', function(){ z.remove(); c.style.visibility = ''; aSair = false; }, { once:true });
      });
    });

    // ===== 3) Tocar: onda + afundar =====
    var ALVOS = '.am-troca a, .porta-c, .setor, .prod, .item, .amr-card, .amr-cat, .amr-btn, .barraf button, .voltar, .minha, .amr-mais, .vazio button';
    document.addEventListener('pointerdown', function(ev){
      var el = ev.target.closest && ev.target.closest(ALVOS); if(!el || reduz) return;
      el.classList.add('am-afunda', 'am-carrega');
      var cs = getComputedStyle(el);
      if(cs.position === 'static') el.classList.add('am-onda-alvo'); else if(cs.overflow !== 'hidden') el.style.overflow = 'hidden';
      var r = el.getBoundingClientRect(), t = Math.max(r.width, r.height) * 2.2, o = document.createElement('span');
      o.className = 'am-onda'; o.style.width = o.style.height = t + 'px'; o.style.left = (ev.clientX - r.left - t / 2) + 'px'; o.style.top = (ev.clientY - r.top - t / 2) + 'px';
      el.appendChild(o); setTimeout(function(){ o.remove(); }, 600);
    }, { passive:true });
    function solta(){ document.querySelectorAll('.am-carrega').forEach(function(x){ x.classList.remove('am-carrega'); }); }
    document.addEventListener('pointerup', solta, { passive:true });
    document.addEventListener('pointercancel', solta, { passive:true });
    document.addEventListener('scroll', solta, { passive:true });

    // ===== 3b) ABRIR: o cartão/mosaico em que tocas cresce até encher o ecrã (restaurante, categoria, receita, setor, carrinho) =====
    var ABRE = '.amr-cat, .amr-card, .setor, .fab, article.card[data-slug]';
    function zoomDe(el, fora){
      if(!fora){ var rf = el.getBoundingClientRect(), cor = getComputedStyle(el).backgroundColor, d = document.createElement('div'); d.className = 'am-iris'; d.style.background = cor; d.style.zIndex = 9995; body.appendChild(d);
        var pf = Math.round(rf.left + rf.width / 2) + 'px ' + Math.round(rf.top + rf.height / 2) + 'px';
        d.animate([{ clipPath:'circle(0% at ' + pf + ')', opacity:1 }, { clipPath:'circle(150% at ' + pf + ')', opacity:1, offset:.6 }, { clipPath:'circle(150% at ' + pf + ')', opacity:0 }], { duration:520, easing:'cubic-bezier(.5,0,.3,1)', fill:'forwards' });
        setTimeout(function(){ d.remove(); }, 540); vibra(10); return; }
      var r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
      var cs = getComputedStyle(el), z = el.cloneNode(true);
      z.removeAttribute('id'); z.classList.add('am-zoom');
      z.style.cssText += ';position:fixed;z-index:9995;transition:all .42s cubic-bezier(.6,0,.2,1);pointer-events:none;margin:0;left:' + r.left + 'px;top:' + r.top + 'px;right:auto;bottom:auto;width:' + r.width + 'px;height:' + r.height + 'px;border-radius:' + cs.borderRadius
        + ';background-color:' + cs.backgroundColor + ';background-image:' + cs.backgroundImage + ';background-size:' + cs.backgroundSize + ';background-position:' + cs.backgroundPosition + ';transform:none;animation:none;opacity:1;';
      if(cs.backgroundColor === 'rgba(0, 0, 0, 0)' && cs.backgroundImage === 'none') z.style.backgroundColor = '#fff';
      document.body.appendChild(z);
      Array.prototype.forEach.call(z.children, function(f){ try{ f.animate([{ opacity:1 }, { opacity:0 }], { duration:200, fill:'forwards' }); }catch(e){} });
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ z.style.left = '0px'; z.style.top = '0px'; z.style.width = '100vw'; z.style.height = '100vh'; z.style.borderRadius = '0'; }); });
      vibra(10);
      setTimeout(function(){ z.remove(); }, 5000);   // vai para outra página: fica até ela abrir
    }
    // mesma página (categoria, receita, setor, lista): "mergulho" — o ecrã atual amplia-se e desvanece a partir do ponto tocado,
    // e o conteúdo novo entra suave por baixo (sem a cor a encher o ecrã)
    function mergulho(el, ev){
      var m = document.querySelector('main'); if(!m) return;
      var r = m.getBoundingClientRect(), x = (ev && ev.clientX) || (el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2), y = (ev && ev.clientY) || (el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2);
      var c = m.cloneNode(true); c.removeAttribute('id'); c.classList.add('am-merg');
      c.querySelectorAll('[id]').forEach(function(n){ n.removeAttribute('id'); });
      c.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;margin:0;z-index:9990;pointer-events:none;transform-origin:' + (x - r.left) + 'px ' + (y - r.top) + 'px;background:' + (getComputedStyle(body).backgroundColor || '#faf5ec') + ';';
      body.appendChild(c);
      // o mosaico tocado destaca-se um instante
      var alvo = c.querySelectorAll(ABRE)[Array.prototype.indexOf.call(m.querySelectorAll(ABRE), el)];
      if(alvo) alvo.animate([{ transform:'scale(1)' }, { transform:'scale(1.06)' }], { duration:200, fill:'forwards' });
      c.animate([{ transform:'scale(1)', opacity:1 }, { transform:'scale(1.06)', opacity:1, offset:.35 }, { transform:'scale(1.35)', opacity:0 }], { duration:420, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards' });
      setTimeout(function(){ c.remove(); }, 440);
      vibra(10);
    }
    document.addEventListener('click', function(ev){
      if(reduz || aSair) return;
      var el = ev.target.closest && ev.target.closest(ABRE); if(!el) return;
      var fora = el.matches('article.card');
      if(fora && ev.target.closest('.fav-btn, .stars, .star, .rating, button')) return;   // coração e estrelas não abrem o restaurante
      if(fora) zoomDe(el, true); else if(el.matches('.fab')) zoomDe(el, false); else mergulho(el, ev);
    }, true);
    // ===== 3c) FECHAR / VOLTAR: o ecrã atual fecha em círculo até ao botão em que tocaste =====
    function iris(x, y){
      if(reduz) return;
      var cor = getComputedStyle(document.body).backgroundColor; if(!cor || cor === 'rgba(0, 0, 0, 0)') cor = '#faf5ec';
      var d = document.createElement('div'); d.className = 'am-iris'; d.style.background = cor; body.appendChild(d);
      var p = Math.round(x) + 'px ' + Math.round(y) + 'px';
      d.animate([{ clipPath:'circle(150% at ' + p + ')', opacity:1 }, { clipPath:'circle(0% at ' + p + ')', opacity:.6 }], { duration:340, easing:'cubic-bezier(.6,0,.3,1)', fill:'forwards' });
      setTimeout(function(){ d.remove(); }, 360);
    }
    document.addEventListener('click', function(ev){
      var b = ev.target.closest && ev.target.closest('#volta, .voltar, #voltEsc'); if(!b) return;
      var r = b.getBoundingClientRect(); iris(r.left + r.width / 2, r.top + r.height / 2); vibra(8);
    }, true);
    window.addEventListener('popstate', function(){ if(!document.querySelector('.am-iris, .am-zoom, .am-merg')) iris(window.innerWidth / 2, 80); });   // botão/gesto "voltar" dentro das Receitas
    window.addEventListener('hashchange', function(ev){   // voltar dentro das Compras (ex.: de um setor para os setores)
      try{ var de = new URL(ev.oldURL).hash, para = new URL(ev.newURL).hash; if(de && (!para || para === '#') && !document.querySelector('.am-zoom, .am-iris, .am-merg')) iris(window.innerWidth / 2, 80); }catch(e){}
    });

    // ===== 4) Deslizar o dedo para mudar de área =====
    var esp = document.createElement('div'); esp.className = 'am-espreita'; body.appendChild(esp);
    var x0, y0, t0, dx = 0, modo = null, main = null, W = 1;
    function podeArrastar(alvo){
      if(body.classList.contains('na-porta')) return false;                                    // ecrã de escolha da página inicial
      if(AQUI === 1 && /[?&](r|c)=/.test(location.search)) return false;                     // dentro de uma receita/categoria: não muda de área
      if(AQUI === 2 && location.hash && location.hash !== '#') return false;                    // dentro de um setor ou da minha lista: idem
      if(document.querySelector('.amr-player, .amr-folha-ov, .ov, #amIntro:not([hidden])')) {   // janelas abertas por cima
        var intro = document.getElementById('amIntro');
        if(document.querySelector('.amr-player, .amr-folha-ov, .ov') || (intro && intro.offsetParent !== null)) return false;
      }
      if(alvo.closest && alvo.closest('input, textarea, select, [contenteditable], [data-sem-deslizar], .am-zoom')) return false;
      for(var n = alvo; n && n !== body; n = n.parentElement){                                  // dentro de algo que já desliza para o lado (ex.: filtros)
        if(n.scrollWidth > n.clientWidth + 4){ var ox = getComputedStyle(n).overflowX; if(ox === 'auto' || ox === 'scroll') return false; }
      }
      return true;
    }
    document.addEventListener('touchstart', function(ev){
      modo = null; dx = 0; if(aSair || ev.touches.length !== 1) return;
      var t = ev.touches[0]; W = window.innerWidth;
      if(t.clientX < 22 || t.clientX > W - 22) return;                                         // bordas: são do gesto "voltar" do telemóvel
      if(!podeArrastar(ev.target)) return;
      x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); modo = 'talvez'; main = document.querySelector('main');
    }, { passive:true });
    document.addEventListener('touchmove', function(ev){
      if(!modo || modo === 'nao') return;
      var t = ev.touches[0], mx = t.clientX - x0, my = t.clientY - y0;
      if(modo === 'talvez'){
        if(Math.abs(mx) < 12 && Math.abs(my) < 12) return;
        if(Math.abs(mx) > Math.abs(my) * 1.6){ modo = 'sim'; if(main) main.style.transition = 'none'; }
        else { modo = 'nao'; return; }
      }
      ev.preventDefault();
      var alvo = AQUI + (mx < 0 ? 1 : -1), existe = alvo >= 0 && alvo < AREAS.length;
      dx = existe ? mx : mx * 0.25;                                                            // sem área desse lado: só "estica"
      if(main){ main.style.transform = 'translateX(' + dx + 'px)'; main.style.opacity = String(1 - Math.min(.45, Math.abs(dx) / W * .8)); }
      if(existe){
        var a = AREAS[alvo], pronto = Math.abs(dx) > W * .28;
        esp.textContent = mx < 0 ? a.e + ' ' + a.nome + ' →' : '← ' + a.e + ' ' + a.nome;
        esp.style.left = mx < 0 ? 'auto' : '14px'; esp.style.right = mx < 0 ? '14px' : 'auto';
        esp.style.opacity = String(Math.min(1, Math.abs(dx) / (W * .2)));
        if(pronto !== esp.classList.contains('pronta')){ esp.classList.toggle('pronta', pronto); if(pronto) vibra(8); }
      } else esp.style.opacity = '0';
    }, { passive:false });
    document.addEventListener('touchend', function(){
      if(modo !== 'sim'){ modo = null; return; }
      modo = null;
      var alvo = AQUI + (dx < 0 ? 1 : -1), existe = alvo >= 0 && alvo < AREAS.length;
      var rapido = Math.abs(dx) > 60 && Math.abs(dx) / Math.max(1, Date.now() - t0) > .5;
      esp.style.opacity = '0'; esp.classList.remove('pronta');
      if(existe && (Math.abs(dx) > W * .28 || rapido)){
        if(main){ main.style.transition = 'transform .22s ease-in, opacity .22s'; main.style.transform = 'translateX(' + (dx < 0 ? -W : W) * .6 + 'px)'; main.style.opacity = '0'; }
        try{ sessionStorage.setItem('amEntra', alvo > AQUI ? 'd' : 'e'); }catch(e){}
        if(alvo === 0) try{ sessionStorage.setItem('amEscolha', 'restaurantes'); }catch(e){}
        aSair = true; vibra(12);
        setTimeout(function(){ location.href = AREAS[alvo].url; }, 200);
        setTimeout(function(){ aSair = false; }, 2500);
      } else if(main){
        main.style.transition = 'transform .35s cubic-bezier(.3,1.4,.5,1), opacity .25s'; main.style.transform = ''; main.style.opacity = '';
        setTimeout(function(){ main.style.transition = ''; }, 380);
      }
    }, { passive:true });
  });
})();
