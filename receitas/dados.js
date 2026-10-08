/* àMesa Receitas — DADOS (Supabase). Só usa as tabelas receita_categorias e receitas.
   As listas pedem apenas as colunas leves (nunca o JSON completo) e vêm por páginas. */
(function(){
  var AMR = window.AMR = window.AMR || {};
  var URL = 'https://zewiijcrkyxjkhudlplk.supabase.co', CHAVE = 'sb_publishable_6LP7x2v5c-c9DQkQslnUmA_g13SEjp3';
  var sb = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(URL, CHAVE) : null;   // mesma sessão do Painel (mesmo site)
  var LEVE = 'id,slug,categoria_id,nome,descricao,dificuldade,tempo_total,porcoes,emoji,publicado,ordem,atualizado_em';
  var POR_PAGINA = 24;

  function erro(r){ if(r && r.error) throw new Error(r.error.message || 'Erro na base de dados'); return r ? r.data : null; }
  function q(p){ return AMR.modelo ? AMR.modelo.norm(p) : String(p || '').toLowerCase(); }

  AMR.dados = {
    cliente: function(){ return sb; },
    POR_PAGINA: POR_PAGINA,
    categorias: async function(incluirInativas){
      var c = sb.from('receita_categorias').select('id,slug,nome,emoji,cor,descricao,ordem,ativo').order('ordem').order('nome');
      if(!incluirInativas) c = c.eq('ativo', true);
      return erro(await c) || [];
    },
    categoria: async function(slug){ return erro(await sb.from('receita_categorias').select('id,slug,nome,emoji,cor,descricao,ordem,ativo').eq('slug', slug).maybeSingle()); },
    // lista de uma categoria (ou de todas, se catId vazio), com pesquisa e páginas
    receitas: async function(opc){
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
    receita: async function(slug){ return erro(await sb.from('receitas').select('id,slug,categoria_id,dados,publicado,ordem,atualizado_em').eq('slug', slug).maybeSingle()); },
    // ---- administração ----
    sessao: async function(){ try{ var s = await sb.auth.getSession(); return (s && s.data && s.data.session) || null; }catch(e){ return null; } },
    eAdmin: async function(){ try{ var r = await sb.rpc('is_admin'); return r.data === true; }catch(e){ return false; } },
    guardarCategoria: async function(cat){
      var o = { slug:cat.slug, nome:cat.nome, emoji:cat.emoji || '🍽️', cor:cat.cor || '#c05a3a', descricao:cat.descricao || null, ordem:parseInt(cat.ordem, 10) || 100, ativo:cat.ativo !== false };
      if(cat.id) return erro(await sb.from('receita_categorias').update(o).eq('id', cat.id).select().single());
      return erro(await sb.from('receita_categorias').insert(o).select().single());
    },
    guardarReceita: async function(reg){
      var o = { categoria_id:reg.categoria_id, slug:reg.slug, dados:reg.dados, publicado:!!reg.publicado, ordem:parseInt(reg.ordem, 10) || 100 };
      if(reg.id) return erro(await sb.from('receitas').update(o).eq('id', reg.id).select('id,slug,publicado').single());
      return erro(await sb.from('receitas').insert(o).select('id,slug,publicado').single());
    },
    apagarReceita: async function(id){ return erro(await sb.from('receitas').delete().eq('id', id)); },
    slugLivre: async function(slug, excetoId){ var r = await sb.from('receitas').select('id').eq('slug', slug).limit(1); var d = erro(r) || []; return !d.length || (excetoId && d[0].id === excetoId); }
  };
})();
