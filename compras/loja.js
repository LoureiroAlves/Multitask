/* àMesa Compras — A MINHA LISTA (guardada no telemóvel, nunca vai para o servidor).
   Usada pela página compras.html e pelas receitas ("Juntar à minha lista").
   Precisa de compras/catalogo.js carregado antes. */
(function(){
  var AMC = window.AMC = window.AMC || {};
  var CHAVE = 'amCompras';

  function ler(){
    try{ var o = JSON.parse(localStorage.getItem(CHAVE) || 'null'); if(o && Array.isArray(o.itens)) return o; }catch(e){}
    return { v:1, itens:[] };
  }
  function gravar(o){ try{ o.em = Date.now(); localStorage.setItem(CHAVE, JSON.stringify(o)); }catch(e){} }
  var ouvintes = [];
  function avisar(){ ouvintes.forEach(function(f){ try{ f(); }catch(e){} }); }
  // só avisa quando OUTRA aba/janela mudou a lista (na mesma página quem muda já redesenha)
  window.addEventListener('storage', function(ev){ if(ev.key === CHAVE) avisar(); });

  function idDe(nome){ var C = AMC.catalogo, p = C.encontrar(nome); return p ? p.id : 'x-' + C.slug(nome); }
  function tem(id){ return ler().itens.some(function(i){ return i.id === id; }); }

  // junta um produto (do catálogo ou escrito à mão). opc: { qtd, nota, setor }
  function juntar(nome, opc){
    opc = opc || {};
    var C = AMC.catalogo, o = ler(), p = C.encontrar(nome);
    var id = p ? p.id : 'x-' + C.slug(nome);
    if(!C.slug(nome)) return null;
    var it = o.itens.filter(function(i){ return i.id === id; })[0];
    if(it){
      if(opc.qtd){ it.qtd = it.qtd ? (it.qtd.indexOf(opc.qtd) >= 0 ? it.qtd : it.qtd + ' + ' + opc.qtd) : opc.qtd; }
      if(opc.nota && (!it.nota || it.nota.indexOf(opc.nota) < 0)) it.nota = it.nota ? it.nota + ', ' + opc.nota : opc.nota;
      it.feito = false;
    } else {
      it = { id:id, nome:p ? p.nome : String(nome).trim(), setor:opc.setor || (p ? p.setor : C.adivinharSetor(nome)), qtd:opc.qtd || '', nota:opc.nota || '', feito:false, ts:Date.now() };
      o.itens.push(it);
    }
    gravar(o); return it;
  }
  function tirar(id){ var o = ler(); o.itens = o.itens.filter(function(i){ return i.id !== id; }); gravar(o); }
  function alternar(nome){ var id = idDe(nome); if(tem(id)){ tirar(id); return false; } juntar(nome); return true; }
  function riscar(id, valor){ var o = ler(); o.itens.forEach(function(i){ if(i.id === id) i.feito = (valor == null ? !i.feito : !!valor); }); gravar(o); }
  function mudar(id, campos){ var o = ler(); o.itens.forEach(function(i){ if(i.id === id) Object.keys(campos).forEach(function(k){ i[k] = campos[k]; }); }); gravar(o); }
  function limparRiscados(){ var o = ler(); o.itens = o.itens.filter(function(i){ return !i.feito; }); gravar(o); }
  function desmarcarTudo(){ var o = ler(); o.itens.forEach(function(i){ i.feito = false; }); gravar(o); }
  function apagarTudo(){ gravar({ v:1, itens:[] }); }

  // lista agrupada pela ordem dos setores (como se percorre o supermercado)
  function porSetor(){
    var C = AMC.catalogo, grupos = {};
    ler().itens.forEach(function(i){ var s = C.SETOR[i.setor] ? i.setor : 'outros'; (grupos[s] = grupos[s] || []).push(i); });
    return C.SETORES.filter(function(s){ return grupos[s.id]; }).map(function(s){
      return { setor:s, itens:grupos[s.id].sort(function(a, b){ return a.nome.localeCompare(b.nome, 'pt'); }) };   // ordem fixa: riscar NÃO muda o produto de sítio
    });
  }
  function texto(){
    var linhas = ['🛒 Lista de compras (àMesa)', ''];
    porSetor().forEach(function(g){
      linhas.push(g.setor.emoji + ' ' + g.setor.nome.toUpperCase());
      g.itens.forEach(function(i){ linhas.push((i.feito ? '✅ ' : '▫️ ') + i.nome + (i.qtd ? ' — ' + i.qtd : '') + (i.nota ? ' (' + i.nota + ')' : '')); });
      linhas.push('');
    });
    linhas.push('amesadigital.pt/compras.html');
    return linhas.join('\n');
  }

  AMC.loja = { ler:ler, juntar:juntar, tirar:tirar, alternar:alternar, tem:tem, idDe:idDe, riscar:riscar, mudar:mudar,
               limparRiscados:limparRiscados, desmarcarTudo:desmarcarTudo, apagarTudo:apagarTudo, porSetor:porSetor, texto:texto,
               aoMudar:function(f){ ouvintes.push(f); } };
})();
