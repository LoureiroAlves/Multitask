/* àMesa · "No Cu da Galinha" — marca os sítios onde o ovo se pode esconder + modo esconderijo (?modo=esconderijo, usado pelo Painel)
   Carregado pelo cardapio.html. Quem ganha, os códigos e a segurança são decididos no Supabase. */
(function(){
  var Q; try{ Q = new URLSearchParams(location.search); }catch(e){ Q = { get:function(){ return null; } }; }
  var MODO = Q.get('modo') === 'esconderijo';
  window.__esconderijo = MODO;
  function slug(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function nomePt(v){ if(!v) return ''; if(typeof v === 'string') return v; try{ return v.pt || v[Object.keys(v)[0]] || ''; }catch(e){ return ''; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  // Palavras e letras: a mesma normalização nos dois lados (Gestor e cliente) — minúsculas, sem acentos, mantém o comprimento
  window.__ovoNorm = function(w){ return String(w || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  // Tokens (palavras) de um texto com a sua ocorrência: [{raw, tok, occ}]
  window.__ovoTokens = function(txt){ var out = [], cont = {}; String(txt || '').split(/\s+/).forEach(function(raw){ if(!raw) return; var tok = window.__ovoNorm(raw); cont[tok] = (cont[tok] || 0) + 1; out.push({ raw:raw, tok:tok, occ:cont[tok] }); }); return out; };
  // Que palavra/letra está debaixo do toque (x,y) dentro de "cont"? → {campo:'n'|'d', raw, tok, occ, idx, letra} ou null
  window.__ovoNoPonto = function(x, y, item){
    var node = null, off = 0;
    try{ if(document.caretRangeFromPoint){ var r = document.caretRangeFromPoint(x, y); if(r){ node = r.startContainer; off = r.startOffset; } } else if(document.caretPositionFromPoint){ var p = document.caretPositionFromPoint(x, y); if(p){ node = p.offsetNode; off = p.offset; } } }catch(e){}
    if(!node || node.nodeType !== 3) return null;
    var cont = node.parentNode && node.parentNode.closest ? node.parentNode.closest('.nome, .desc') : null; if(!cont || !item.contains(cont)) return null;
    var campo = cont.classList.contains('desc') ? 'd' : 'n';
    var t = node.textContent || ''; if(!t.trim()) return null;
    var s0 = off, e0 = off; while(s0 > 0 && !/\s/.test(t[s0 - 1])) s0--; while(e0 < t.length && !/\s/.test(t[e0])) e0++;
    var raw = t.slice(s0, e0); if(!raw.trim()) return null;
    var idx = Math.max(0, Math.min(raw.length - 1, off - s0));
    var tok = window.__ovoNorm(raw); var occ = 0;
    // ocorrência = quantas vezes o mesmo token aparece antes da posição do toque, +1
    var antes = cont.textContent.slice(0, cont.textContent.indexOf(t) + s0); occ = window.__ovoTokens(antes).filter(function(k){ return k.tok === tok; }).length + 1;
    return { campo:campo, raw:raw, tok:tok, occ:occ, idx:idx, letra:tok.charAt(idx) };
  };

  // Marca os elementos escondíveis do menu com data-alvo (ids estáveis; nomes em PT, independentes da língua escolhida)
  window.__ovoMarcarAlvos = function(){
    var menu = window._menu; if(!menu || !Array.isArray(menu.categorias)) return;
    menu.categorias.forEach(function(cat){
      if(!cat || !cat.id) return;
      var rot = nomePt(cat.tile) || cat.id;
      document.querySelectorAll('.tile[data-target="' + String(cat.id).replace(/"/g, '') + '"]').forEach(function(t){ t.dataset.alvo = 'cat:' + cat.id; t.dataset.alvoRotulo = rot; t.dataset.alvoSeccao = ''; });
      var sec = document.getElementById(cat.id); if(!sec) return;
      var usados = {};
      sec.querySelectorAll('.item').forEach(function(el){
        var n = el.dataset.alvoNome || ((el.querySelector('.nome') || {}).textContent || '');
        var sl = slug(n); if(!sl) return;
        usados[sl] = (usados[sl] || 0) + 1;
        el.dataset.alvo = 'item:' + cat.id + '/' + sl + (usados[sl] > 1 ? ('#' + usados[sl]) : '');
        el.dataset.alvoRotulo = String(n).trim(); el.dataset.alvoSeccao = rot;
      });
      sec.querySelectorAll('.mos-box').forEach(function(b, i){ b.dataset.alvo = 'mos:' + cat.id + '#' + i; b.dataset.alvoRotulo = ((b.querySelector('.mos-tit') || {}).textContent || ('Caixa ' + (i + 1))).trim(); b.dataset.alvoSeccao = rot; });
      if(MODO && !sec.querySelector('.ovo-chip-cat')){
        var c = document.createElement('button'); c.type = 'button'; c.className = 'ovo-chip-cat'; c.textContent = '🥚 Esconder o ovo nesta categoria (' + rot + ')';
        c.dataset.alvo = 'cat:' + cat.id; c.dataset.alvoRotulo = rot; c.dataset.alvoSeccao = '';
        sec.insertBefore(c, sec.firstChild);
      }
    });
  };

  if(!MODO) return;
  // ---------- MODO ESCONDERIJO ----------
  var escolhido = null;
  function enviar(msg){ try{ if(window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); }catch(e){} try{ if(window.opener) window.opener.postMessage(msg, '*'); }catch(e){} }
  function montar(){
    document.body.classList.add('modo-esconderijo');
    var b = document.createElement('div'); b.id = 'ovoBarra';
    b.innerHTML = '<span style="font-size:1.6rem;">🥚</span><div class="t">Toca no sítio onde queres esconder o ovo<small>Abre as categorias normalmente. Podes escolher um prato, uma caixa, a promoção, o prato do dia ou a própria categoria.</small></div><button type="button" id="ovoCancelar">Cancelar</button>';
    document.body.appendChild(b);
    var c = document.createElement('div'); c.id = 'ovoConf';
    c.innerHTML = '<div class="k">Local escolhido</div><div class="v" id="ovoRot">—</div><div class="k" id="ovoSecK">Secção</div><div class="v s" id="ovoSec">—</div><div id="ovoFino"></div><div class="acts"><button type="button" class="outro" id="ovoOutro">Escolher outro local</button><button type="button" class="ok" id="ovoOk">✔ Confirmar esconderijo</button></div>';
    document.body.appendChild(c);
    document.getElementById('ovoCancelar').onclick = function(){ enviar({ type:'ovo-cancelar' }); };
    document.getElementById('ovoOutro').onclick = function(){ limpar(); };
    document.getElementById('ovoOk').onclick = function(){ if(!escolhido) return; enviar({ type:'ovo-esconderijo', alvo:escolhido }); try{ localStorage.setItem('amesaOvoAlvo', JSON.stringify(escolhido)); }catch(e){} document.getElementById('ovoOk').textContent = '✔ Guardado'; };
  }
  function limpar(){ escolhido = null; document.querySelectorAll('.ovo-escolhido').forEach(function(x){ x.classList.remove('ovo-escolhido'); }); var c = document.getElementById('ovoConf'); if(c) c.classList.remove('on'); }
  function escolher(el){
    var a = String(el.dataset.alvo || ''); var i = a.indexOf(':'); if(i < 0) return;
    limpar();
    escolhido = { tipo:a.slice(0, i), ref:a.slice(i + 1), rotulo:el.dataset.alvoRotulo || a, seccao:el.dataset.alvoSeccao || '' };
    el.classList.add('ovo-escolhido');
    document.getElementById('ovoRot').textContent = escolhido.rotulo;
    var temSec = !!escolhido.seccao; document.getElementById('ovoSecK').style.display = temSec ? '' : 'none'; document.getElementById('ovoSec').style.display = temSec ? '' : 'none'; document.getElementById('ovoSec').textContent = escolhido.seccao;
    document.getElementById('ovoOk').textContent = '✔ Confirmar esconderijo';
    fino(el);
    document.getElementById('ovoConf').classList.add('on');
    try{ if(navigator.vibrate) navigator.vibrate(30); }catch(e){}
  }
  // Afinar: num prato, escolher uma PALAVRA ou uma LETRA do nome/descrição
  var base = null;
  function fino(el){
    var box = document.getElementById('ovoFino'); if(!box) return; box.innerHTML = '';
    if(!escolhido || escolhido.tipo !== 'item'){ return; }
    base = JSON.parse(JSON.stringify(escolhido));
    var nome = (el.querySelector('.nome') || {}).textContent || '', desc = (el.querySelector('.desc') || {}).textContent || '';
    var h = '<div class="k" style="margin-top:6px;">Afinar (opcional): esconder numa palavra ou letra</div><div class="ovo-chips" id="ovoPal">'
      + '<button type="button" class="ovo-chip on" data-p="">Prato inteiro</button>'
      + window.__ovoTokens(nome).map(function(k){ return '<button type="button" class="ovo-chip" data-c="n" data-tok="' + esc(k.tok) + '" data-occ="' + k.occ + '" data-raw="' + esc(k.raw) + '">' + esc(k.raw) + '</button>'; }).join('')
      + (desc ? window.__ovoTokens(desc).map(function(k){ return '<button type="button" class="ovo-chip d" data-c="d" data-tok="' + esc(k.tok) + '" data-occ="' + k.occ + '" data-raw="' + esc(k.raw) + '">' + esc(k.raw) + '</button>'; }).join('') : '')
      + '</div><div class="ovo-chips" id="ovoLet"></div>';
    box.innerHTML = h;
    box.querySelectorAll('#ovoPal .ovo-chip').forEach(function(b){ b.onclick = function(){
      box.querySelectorAll('#ovoPal .ovo-chip').forEach(function(x){ x.classList.toggle('on', x === b); });
      var let_ = document.getElementById('ovoLet'); let_.innerHTML = '';
      if(!b.dataset.tok){ escolhido = JSON.parse(JSON.stringify(base)); document.getElementById('ovoRot').textContent = escolhido.rotulo; return; }
      escolhido = { tipo:'palavra', ref:base.ref + '/' + b.dataset.c + '/' + b.dataset.tok + '#' + b.dataset.occ, rotulo:'Palavra "' + b.dataset.raw + '" · ' + base.rotulo, seccao:base.seccao };
      document.getElementById('ovoRot').textContent = escolhido.rotulo;
      let_.innerHTML = '<span class="k" style="margin-right:6px;">Letra:</span><button type="button" class="ovo-chip on" data-i="">Toda a palavra</button>' + b.dataset.raw.split('').map(function(ch, i){ return /\s/.test(ch) ? '' : '<button type="button" class="ovo-chip l" data-i="' + i + '">' + esc(ch) + '</button>'; }).join('');
      let_.querySelectorAll('.ovo-chip').forEach(function(lb){ lb.onclick = function(){
        let_.querySelectorAll('.ovo-chip').forEach(function(x){ x.classList.toggle('on', x === lb); });
        if(lb.dataset.i === ''){ escolhido = { tipo:'palavra', ref:base.ref + '/' + b.dataset.c + '/' + b.dataset.tok + '#' + b.dataset.occ, rotulo:'Palavra "' + b.dataset.raw + '" · ' + base.rotulo, seccao:base.seccao }; }
        else { var i = parseInt(lb.dataset.i, 10); escolhido = { tipo:'letra', ref:base.ref + '/' + b.dataset.c + '/' + b.dataset.tok + '#' + b.dataset.occ + '/' + i, rotulo:'Letra "' + b.dataset.raw.charAt(i) + '" de "' + b.dataset.raw + '" · ' + base.rotulo, seccao:base.seccao }; }
        document.getElementById('ovoRot').textContent = escolhido.rotulo;
      }; });
    }; });
  }
  // Interceta os toques nos alvos ANTES do menu (fase de captura). As categorias (tiles) continuam a abrir normalmente —
  // para esconder numa categoria usa-se o chip amarelo dentro dela.
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('[data-alvo]') : null;
    if(!el || el.classList.contains('tile')) return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    escolher(el);
  }, true);
  ['pointerdown','pointerup','touchend','mousedown','mouseup'].forEach(function(ev){
    document.addEventListener(ev, function(e){ var el = e.target && e.target.closest ? e.target.closest('[data-alvo]') : null; if(el && !el.classList.contains('tile') && ev !== 'pointerdown' && ev !== 'mousedown'){ e.stopImmediatePropagation(); } }, true);
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
  // Menu já construído? marca; senão o construirMenu chama __ovoMarcarAlvos no fim
  setTimeout(function(){ try{ window.__ovoMarcarAlvos(); }catch(e){} }, 800);
})();
