/* àMesa Receitas — LISTA DE COMPRAS de cada receita (uma lista por receita, guardada no telemóvel).
   As listas nunca se misturam: a chave inclui o id da receita. */
(function(){
  var AMR = window.AMR = window.AMR || {};
  function chave(r){ return 'amrLista:' + r.id; }
  function ler(r){ try{ return JSON.parse(localStorage.getItem(chave(r)) || '{}') || {}; }catch(e){ return {}; } }
  function gravar(r, o){ try{ localStorage.setItem(chave(r), JSON.stringify(o)); }catch(e){} }

  function abrir(r, fator, depois){
    var m = AMR.modelo, e = m.esc, marc = ler(r);
    var ov = document.createElement('div'); ov.className = 'amr amr-folha-ov';
    ov.style.setProperty('--r-cor', (r.layout && r.layout.cor) || '#c05a3a');
    var pessoas = Math.round(r.porcoes * (fator || 1));
    ov.innerHTML = '<div class="amr-folha" role="dialog" aria-label="Lista de compras"><h3>🛒 Lista de compras</h3><div class="sub">' + e(r.nome) + ' · ' + pessoas + ' pessoas</div>'
      + '<div style="display:flex;justify-content:space-between;font-weight:900;font-size:.82rem;color:var(--r-muted);"><span class="cnt"></span><button type="button" class="limpar" style="border:none;background:none;color:var(--r-terra);font-weight:900;">Desmarcar tudo</button></div>'
      + '<div class="amr-barra"><i></i></div><ul class="amr-compras">'
      + r.ingredientes.map(function(i){ return '<li data-id="' + e(i.ingrediente_id) + '" class="' + (marc[i.ingrediente_id] ? 'ok' : '') + '"><span class="cx">✓</span><span class="n">' + e(i.nome) + (i.opcional ? ' <small style="color:var(--r-muted)">(opcional)</small>' : '') + '</span><span class="q">' + e(m.quantidadeTexto(i, fator)) + '</span></li>'; }).join('')
      + '</ul>'
      + (window.AMC && AMC.loja ? '<button type="button" class="amr-btn juntar" style="width:100%;margin-top:12px;border-color:#2e7d4f;color:#2e7d4f;">🛒 Juntar à minha lista de compras</button><a class="verLista" href="compras.html#lista" style="display:none;text-align:center;margin-top:8px;font-weight:900;color:#2e7d4f;text-decoration:none;">Ver a minha lista de compras →</a>' : '')
      + '<button type="button" class="amr-btn prim fechar" style="width:100%;margin-top:10px;">Fechar</button></div>';
    document.body.appendChild(ov);
    function conta(){ var n = Object.keys(marc).filter(function(k){ return marc[k]; }).length, t = r.ingredientes.length; ov.querySelector('.cnt').textContent = n + ' de ' + t + ' no cesto'; ov.querySelector('.amr-barra i').style.width = Math.round(n / t * 100) + '%'; }
    conta();
    ov.querySelectorAll('.amr-compras li').forEach(function(li){ li.onclick = function(){
      var id = li.dataset.id;
      if(marc[id]){ var nome = li.querySelector('.n').textContent; if(!confirm('Desmarcar «' + nome + '»?\n\nJá está no cesto. Queres voltar a pô-lo por comprar?')) return; delete marc[id]; }   // pode ter sido por engano
      else marc[id] = true;
      li.classList.toggle('ok', !!marc[id]); gravar(r, marc); conta(); try{ if(navigator.vibrate) navigator.vibrate(10); }catch(x){}
    }; });
    ov.querySelector('.limpar').onclick = function(){ marc = {}; gravar(r, marc); ov.querySelectorAll('.amr-compras li').forEach(function(li){ li.classList.remove('ok'); }); conta(); };
    function fechar(){ ov.classList.remove('on'); setTimeout(function(){ ov.remove(); if(depois) depois(); }, 300); }
    ov.querySelector('.fechar').onclick = fechar;
    // junta os ingredientes (os que ainda não estão no cesto) à lista geral de compras da àMesa (compras.html)
    var bj = ov.querySelector('.juntar');
    if(bj) bj.onclick = function(){
      var n = 0;
      r.ingredientes.forEach(function(i){ if(marc[i.ingrediente_id]) return; var q = m.quantidadeTexto(i, fator); AMC.loja.juntar(i.nome, { qtd:(q && q !== 'q.b.') ? q : '', nota:r.nome }); n++; });
      bj.textContent = n ? '✓ ' + n + (n === 1 ? ' ingrediente juntado' : ' ingredientes juntados') + ' à tua lista' : '✓ Já está tudo no cesto';
      bj.disabled = true; bj.style.background = '#e8f6ed'; ov.querySelector('.verLista').style.display = 'block';
      try{ if(navigator.vibrate) navigator.vibrate(15); }catch(x){}
    };
    ov.addEventListener('click', function(ev){ if(ev.target === ov) fechar(); });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ ov.classList.add('on'); }); });
  }
  AMR.lista = { abrir:abrir };
})();
