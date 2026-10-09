/* àMesa Receitas — LAYOUTS (apresentação). O JSON da receita só diz "layout.tipo"; aqui está o desenho.
   Para criar um layout novo: AMR.layouts.registar('moderno', function(el, r, ctx){ … }) — sem mexer nos dados. */
(function(){
  var AMR = window.AMR = window.AMR || {};
  var M = function(){ return AMR.modelo; };
  var registo = {};

  function cor(r, ctx){ return (r.layout && r.layout.cor) || (ctx.categoria && ctx.categoria.cor) || '#c05a3a'; }
  function emoji(r, ctx){ return (r.layout && r.layout.emoji) || (ctx.categoria && ctx.categoria.emoji) || '🍽️'; }

  // ---- CLÁSSICO ----
  registo.classico = function(el, r, ctx){
    var m = M(), e = m.esc, c = cor(r, ctx), em = emoji(r, ctx), porc = r.porcoes;
    el.style.setProperty('--r-cor', c);
    var porIdL = {}; r.ingredientes.forEach(function(i){ porIdL[i.ingrediente_id] = i; });
    function usaHTML(p, f){ return 'Usa: ' + (p.ingredientesDoPasso || []).map(function(d){ var i = porIdL[d.ingrediente_id]; return i ? e(m.quantidadeTexto(d, f)) + ' ' + e(i.nome) : ''; }).filter(Boolean).join(' · '); }
    function ingsHTML(f){ return r.ingredientes.map(function(i){ return '<li><span>' + e(i.nome) + (i.opcional ? ' <small style="display:inline">(opcional)</small>' : '') + (i.nota ? '<small>' + e(i.nota) + '</small>' : '') + '</span><span class="q">' + e(m.quantidadeTexto(i, f)) + '</span></li>'; }).join(''); }
    el.innerHTML = ''
      + '<div class="amr-hero amr-entra"><div class="padrao">' + new Array(40).join(em + ' ') + '</div>'
      +   '<div class="cat">' + e((ctx.categoria && ctx.categoria.nome) || 'Receita') + '</div>'
      +   '<h1>' + e(r.nome) + '</h1>' + (r.descricao ? '<p>' + e(r.descricao) + '</p>' : '')
      +   '<div class="amr-chips">'
      +     (r.tempo && r.tempo.total ? '<span class="amr-chip">⏱ ' + e(m.tempoTexto(r.tempo.total)) + '</span>' : '')
      +     '<span class="amr-chip">👥 ' + r.porcoes + ' ' + (r.porcoes === 1 ? 'pessoa' : 'pessoas') + '</span>'
      +     '<span class="amr-chip">📊 ' + e(m.DIFICULDADES[r.dificuldade] || '') + '</span>'
      +     '<span class="amr-chip">👣 ' + r.passos.length + ' passos</span>'
      +   '</div><div class="grande">' + em + '</div></div>'
      + (r.tempo && (r.tempo.preparacao || r.tempo.cozedura) ? '<div class="amr-bloco amr-entra" style="display:flex;gap:10px;justify-content:space-around;text-align:center;font-weight:900;">'
          + (r.tempo.preparacao ? '<div><div style="font-size:1.3rem">🔪</div>' + e(m.tempoTexto(r.tempo.preparacao)) + '<div style="color:var(--r-muted);font-size:.75rem;">preparação</div></div>' : '')
          + (r.tempo.cozedura ? '<div><div style="font-size:1.3rem">🔥</div>' + e(m.tempoTexto(r.tempo.cozedura)) + '<div style="color:var(--r-muted);font-size:.75rem;">cozedura</div></div>' : '')
          + '<div><div style="font-size:1.3rem">⏱</div>' + e(m.tempoTexto(r.tempo.total)) + '<div style="color:var(--r-muted);font-size:.75rem;">total</div></div></div>' : '')
      + '<div class="amr-bloco amr-entra"><h2>Ingredientes <span class="amr-porcoes"><button type="button" data-p="-1" aria-label="Menos pessoas"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button><b class="np">' + porc + '</b> pessoas<button type="button" data-p="1" aria-label="Mais pessoas"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button></span></h2><ul class="amr-ing">' + ingsHTML(1) + '</ul></div>'
      + '<div class="amr-acoes amr-entra">'
      +   ((r.player && r.player.ativo !== false) ? '<button type="button" class="amr-btn prim" data-a="comecar">▶ COMEÇAR RECEITA</button>' : '')
      +   '<button type="button" class="amr-btn" data-a="lista">🛒 Lista de compras</button>'
      + '</div>'
      + '<div class="amr-bloco amr-entra"><h2>Preparação</h2><ol class="amr-passos">' + r.passos.map(function(p, k){ return '<li><b>' + e(p.titulo) + '</b><span>' + e(p.descricao) + '</span>' + (p.ingredientesDoPasso ? '<span class="usa" data-k="' + k + '">' + usaHTML(p, 1) + '</span>' : '') + (p.timer ? '<br><span class="t">⏱ ' + e(m.relogio(p.timer.segundos)) + '</span>' : '') + '</li>'; }).join('') + '</ol></div>'
      + (r.notas.length ? '<div class="amr-bloco amr-entra"><h2>Notas</h2><ul class="amr-notas">' + r.notas.map(function(n){ return '<li>' + e(n) + '</li>'; }).join('') + '</ul>' + (r.tags.length ? '<div class="amr-tags">' + r.tags.map(function(t){ return '<span>#' + e(t) + '</span>'; }).join('') + '</div>' : '') + '</div>' : (r.tags.length ? '<div class="amr-tags" style="margin-top:14px">' + r.tags.map(function(t){ return '<span>#' + e(t) + '</span>'; }).join('') + '</div>' : ''));
    var fator = 1;
    el.querySelectorAll('[data-p]').forEach(function(b){ b.onclick = function(){ porc = Math.min(40, Math.max(1, porc + parseInt(b.dataset.p, 10))); fator = porc / r.porcoes; el.querySelector('.np').textContent = porc; el.querySelector('.amr-ing').innerHTML = ingsHTML(fator); el.querySelectorAll('.amr-passos .usa').forEach(function(u){ u.innerHTML = usaHTML(r.passos[+u.dataset.k], fator); }); }; });
    var bc = el.querySelector('[data-a="comecar"]'); if(bc) bc.onclick = function(){ ctx.aoComecar && ctx.aoComecar(fator); };
    var bl = el.querySelector('[data-a="lista"]'); if(bl) bl.onclick = function(){ ctx.aoLista && ctx.aoLista(fator); };
  };

  AMR.layouts = {
    registar:function(nome, fn){ registo[nome] = fn; },
    existe:function(nome){ return !!registo[nome]; },
    nomes:function(){ return Object.keys(registo); },
    // desenha a receita no elemento com o layout pedido (ou o clássico, se não existir)
    render:function(el, receita, ctx){ var t = (receita.layout && receita.layout.tipo) || 'classico'; (registo[t] || registo.classico)(el, receita, ctx || {}); }
  };
})();
