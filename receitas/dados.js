/* àMesa Receitas — DADOS (Supabase). Só usa as tabelas receita_categorias e receitas.
   As listas pedem apenas as colunas leves (nunca o JSON completo) e vêm por páginas. */
(function(){
  var AMR = window.AMR = window.AMR || {};
  var URL = 'https://zewiijcrkyxjkhudlplk.supabase.co', CHAVE = 'sb_publishable_6LP7x2v5c-c9DQkQslnUmA_g13SEjp3';
  var sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(URL, CHAVE) : null;   // mesma sessão do Painel (mesmo site)
  var LEVE = 'id,slug,categoria_id,nome,descricao,dificuldade,tempo_total,porcoes,emoji,publicado,ordem,atualizado_em';
  var POR_PAGINA = 24;

  // ---- memória: o que já foi buscado fica guardado 10 min (na página e no telemóvel durante a visita) → abrir/voltar é instantâneo.
  //      Só no site público (receitas.html liga AMR.dados.usarCache); o admin vê sempre os dados frescos.
  var CACHE = {}, EM_CURSO = {}, TTL = 10 * 60 * 1000;
  function guardado(k){
    var c = CACHE[k]; if(c && Date.now() - c.t < TTL) return c.v;
    try{ var s = JSON.parse(sessionStorage.getItem('amr:' + k) || 'null'); if(s && Date.now() - s.t < TTL){ CACHE[k] = s; return s.v; } }catch(e){}
    return undefined;
  }
  function guarda(k, v){ var o = { t:Date.now(), v:v }; CACHE[k] = o; try{ sessionStorage.setItem('amr:' + k, JSON.stringify(o)); }catch(e){} }
  function comCache(k, fn){
    if(!AMR.dados || !AMR.dados.usarCache) return fn();
    var v = guardado(k); if(v !== undefined) return Promise.resolve(v);
    if(EM_CURSO[k]) return EM_CURSO[k];
    var p = fn().then(function(r){ delete EM_CURSO[k]; if(r != null) guarda(k, r); return r; }, function(e){ delete EM_CURSO[k]; throw e; });
    EM_CURSO[k] = p; return p;
  }

  function limpaCache(){ CACHE = {}; try{ Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf('amr:') === 0) sessionStorage.removeItem(k); }); }catch(e){} }
  function erro(r){ if(r && r.error) throw new Error(r.error.message || 'Erro na base de dados'); return r ? r.data : null; }
  function q(p){ return AMR.modelo ? AMR.modelo.norm(p) : String(p || '').toLowerCase(); }

  AMR.dados = {
    cliente: function(){ return sb; },
    POR_PAGINA: POR_PAGINA,
    usarCache: false,
    jaTem: function(k){ return guardado(k) !== undefined; },
    categorias: function(incluirInativas){ var self = this; return incluirInativas ? self._categorias(true) : comCache('cats', function(){ return self._categorias(false); }); },
    _categorias: async function(incluirInativas){
      var c = sb.from('receita_categorias').select('id,slug,nome,emoji,cor,descricao,ordem,ativo').order('ordem').order('nome');
      if(!incluirInativas) c = c.eq('ativo', true);
      return erro(await c) || [];
    },
    categoria: async function(slug){ return erro(await sb.from('receita_categorias').select('id,slug,nome,emoji,cor,descricao,ordem,ativo').eq('slug', slug).maybeSingle()); },
    // lista de uma categoria (ou de todas, se catId vazio), com pesquisa e páginas
    receitas: function(opc){ var self = this; opc = opc || {}; if(opc.incluirRascunhos) return self._receitas(opc);
      return comCache('lista:' + (opc.categoriaId || '') + ':' + q(opc.pesquisa).trim() + ':' + (opc.pagina || 0), function(){ return self._receitas(opc); }); },
    _receitas: async function(opc){
      opc = opc || {};
      var pag = Math.max(0, opc.pagina || 0), n = opc.porPagina || POR_PAGINA;
      var c = sb.from('receitas').select(LEVE, { count:'exact' }).order('ordem').order('nome').range(pag * n, pag * n + n - 1);
      if(opc.categoriaId) c = c.eq('categoria_id', opc.categoriaId);
      if(!opc.incluirRascunhos) c = c.eq('publicado', true);
      var pesq = q(opc.pesquisa).trim();
      if(pesq) pesq.split(/\s+/).slice(0, 5).forEach(function(p){ c = c.ilike('pesquisa', '%' + p.replace(/[%_]/g, '') + '%'); });
      var r = await c; var d = erro(r) || [];
      return { lista:d, total:(r.count == null ? d.length : r.count), pagina:pag, porPagina:n };
    },
    receitaPorId: async function(id){ return erro(await sb.from('receitas').select('id,slug,categoria_id,dados,publicado,ordem').eq('id', id).maybeSingle()); },
    receita: function(slug){ var self = this; return comCache('rec:' + slug, function(){ return self._receita(slug); }); },
    _receita: async function(slug){ return erro(await sb.from('receitas').select('id,slug,categoria_id,dados,publicado,ordem,atualizado_em').eq('slug', slug).maybeSingle()); },
    // começa a buscar já (ao encostar o dedo), para quando abrir já estar cá
    adiantar: function(tipo, v){ try{ if(tipo === 'rec') this.receita(v).catch(function(){}); else if(tipo === 'cat') this.receitas({ categoriaId:v }).catch(function(){}); }catch(e){} },
    // ---- administração ----
    sessao: async function(){ try{ var s = await sb.auth.getSession(); return (s && s.data && s.data.session) || null; }catch(e){ return null; } },
    eAdmin: async function(){ try{ var r = await sb.rpc('is_admin'); return r.data === true; }catch(e){ return false; } },
    guardarCategoria: async function(cat){
      limpaCache();
      var o = { slug:cat.slug, nome:cat.nome, emoji:cat.emoji || '🍽️', cor:cat.cor || '#c05a3a', descricao:cat.descricao || null, ordem:parseInt(cat.ordem, 10) || 100, ativo:cat.ativo !== false };
      if(cat.id) return erro(await sb.from('receita_categorias').update(o).eq('id', cat.id).select().single());
      return erro(await sb.from('receita_categorias').insert(o).select().single());
    },
    guardarReceita: async function(reg){
      limpaCache();
      var o = { categoria_id:reg.categoria_id, slug:reg.slug, dados:reg.dados, publicado:!!reg.publicado, ordem:parseInt(reg.ordem, 10) || 100 };
      if(reg.id) return erro(await sb.from('receitas').update(o).eq('id', reg.id).select('id,slug,publicado').single());
      return erro(await sb.from('receitas').insert(o).select('id,slug,publicado').single());
    },
    apagarReceita: async function(id){ limpaCache(); return erro(await sb.from('receitas').delete().eq('id', id)); },
    slugLivre: async function(slug, excetoId){ var r = await sb.from('receitas').select('id').eq('slug', slug).limit(1); var d = erro(r) || []; return !d.length || (excetoId && d[0].id === excetoId); }
  };
})();
