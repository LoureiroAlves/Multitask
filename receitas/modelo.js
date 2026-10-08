/* ÀMesa Receitas — MODELO da receita (formato do JSON, leitura tolerante, textos de quantidades e tempos).
   Usado pela página pública e pelo editor. Não depende de nada do sistema dos restaurantes. */
(function(){
  var AMR = window.AMR = window.AMR || {};

  var UNIDADES = {
    'g':           { s:'g',         p:'g',          colado:false },
    'kg':          { s:'kg',        p:'kg',         colado:false },
    'ml':          { s:'ml',        p:'ml',         colado:false },
    'l':           { s:'l',         p:'l',          colado:false },
    'un':          { s:'',          p:'',           colado:false },
    'dente':       { s:'dente',     p:'dentes',     colado:false },
    'colher-sopa': { s:'colher de sopa', p:'colheres de sopa', colado:false },
    'colher-cha':  { s:'colher de chá',  p:'colheres de chá',  colado:false },
    'chavena':     { s:'chávena',   p:'chávenas',   colado:false },
    'pitada':      { s:'pitada',    p:'pitadas',    colado:false },
    'ramo':        { s:'ramo',      p:'ramos',      colado:false },
    'folha':       { s:'folha',     p:'folhas',     colado:false },
    'lata':        { s:'lata',      p:'latas',      colado:false },
    'fatia':       { s:'fatia',     p:'fatias',     colado:false },
    'q.b.':        { s:'q.b.',      p:'q.b.',       colado:false }
  };
  var DIFICULDADES = { facil:'Fácil', media:'Média', dificil:'Difícil' };
  var LAYOUTS = ['classico'];   // novos layouts registam-se em layouts.js; o JSON só guarda o nome

  function txt(v){ return (v == null) ? '' : String(v).trim(); }
  function num(v){ if(v == null || v === '') return null; var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
  function int(v, d){ var n = parseInt(v, 10); return isFinite(n) ? n : (d == null ? null : d); }
  function slug(s){ return txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }
  function norm(s){ return txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  // "500 g bacalhau", "2 dentes de alho", "Sal q.b." → objeto (para importar listas em texto)
  function ingredienteDeTexto(t){
    t = txt(t);
    var qb = /\bq\.?\s*b\.?$/i.test(t);
    var m = /^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|un|dentes?|colher(?:es)? de sopa|colher(?:es)? de ch[aá]|ch[aá]venas?|pitadas?|ramos?|folhas?|latas?|fatias?)?\s*(?:de\s+)?(.*)$/i.exec(t);
    var nome = t, q = null, u = 'un';
    if(m && m[1]){
      q = num(m[1]); nome = m[3] || t; var uu = (m[2] || '').toLowerCase();
      u = /^kg$/.test(uu) ? 'kg' : /^g$/.test(uu) ? 'g' : /^ml$/.test(uu) ? 'ml' : /^l$/.test(uu) ? 'l' : /^dente/.test(uu) ? 'dente' : /sopa/.test(uu) ? 'colher-sopa' : /ch[aá]$/.test(uu) ? 'colher-cha' : /ch[aá]vena/.test(uu) ? 'chavena' : /pitada/.test(uu) ? 'pitada' : /ramo/.test(uu) ? 'ramo' : /folha/.test(uu) ? 'folha' : /lata/.test(uu) ? 'lata' : /fatia/.test(uu) ? 'fatia' : 'un';
    }
    if(qb){ nome = nome.replace(/\s*q\.?\s*b\.?$/i, ''); q = null; u = 'q.b.'; }
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    return { ingrediente_id:slug(nome), nome:nome, quantidade:q, unidade:u };
  }

  // Lê qualquer JSON de receita (do editor, de um ficheiro ou da base de dados) e devolve
  // { receita, avisos } com o formato certo. Tolera texto simples nos ingredientes e passos.
  function normalizar(j){
    var av = [];
    if(typeof j === 'string'){ try{ j = JSON.parse(j); }catch(e){ throw new Error('O texto não é um JSON válido: ' + e.message); } }
    if(!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('O JSON tem de ser um objeto { … } com uma receita.');
    if(j.receita && typeof j.receita === 'object') j = j.receita;   // aceita { "receita": { … } }
    var r = {};
    r.versao = 1;
    r.nome = txt(j.nome || j.titulo);
    if(!r.nome) av.push('Falta o nome da receita.');
    r.id = slug(j.id || j.slug || r.nome);
    r.categoria = slug(j.categoria || '');
    r.descricao = txt(j.descricao);
    r.porcoes = Math.max(1, int(j.porcoes || j.pessoas, 4));
    var t = j.tempo || {};
    if(typeof t !== 'object') t = { total:int(t) };
    r.tempo = { preparacao:int(t.preparacao, 0), cozedura:int(t.cozedura, 0), total:int(t.total) };
    if(r.tempo.total == null) r.tempo.total = (r.tempo.preparacao || 0) + (r.tempo.cozedura || 0) || null;
    var dif = norm(j.dificuldade).replace('dificil', 'dificil');
    r.dificuldade = DIFICULDADES[dif] ? dif : (/med/.test(dif) ? 'media' : /dif/.test(dif) ? 'dificil' : 'facil');
    // ingredientes
    var ingIn = Array.isArray(j.ingredientes) ? j.ingredientes : [];
    var ids = {};
    r.ingredientes = ingIn.map(function(i){
      var o = (typeof i === 'string') ? ingredienteDeTexto(i) : {
        ingrediente_id:slug(i.ingrediente_id || i.id || i.nome), nome:txt(i.nome),
        quantidade:num(i.quantidade), unidade:txt(i.unidade || (i.quantidade == null ? 'q.b.' : 'un'))
      };
      if(typeof i === 'object'){ if(txt(i.nota)) o.nota = txt(i.nota); if(i.opcional) o.opcional = true; if(txt(i.grupo)) o.grupo = txt(i.grupo); }
      if(!UNIDADES[o.unidade]){ av.push('Unidade desconhecida "' + o.unidade + '" em ' + (o.nome || '?') + ' — ficou "un".'); o.unidade = 'un'; }
      if(o.unidade === 'q.b.') o.quantidade = null;
      if(!o.ingrediente_id) o.ingrediente_id = 'ing-' + Math.random().toString(36).slice(2, 7);
      var base = o.ingrediente_id, k = 2; while(ids[o.ingrediente_id]){ o.ingrediente_id = base + '-' + (k++); } ids[o.ingrediente_id] = 1;
      return o;
    }).filter(function(o){ return o.nome; });
    if(!r.ingredientes.length) av.push('A receita não tem ingredientes.');
    // passos
    var psIn = Array.isArray(j.passos) ? j.passos : [];
    r.passos = psIn.map(function(p, n){
      var o = (typeof p === 'string') ? { titulo:'', descricao:txt(p) } : { titulo:txt(p.titulo), descricao:txt(p.descricao || p.texto) };
      o.id = n + 1;
      if(typeof p === 'object'){
        var ings = Array.isArray(p.ingredientes) ? p.ingredientes.map(function(x){ return slug(x); }).filter(function(x){ return ids[x]; }) : [];
        if(ings.length) o.ingredientes = ings;
        var tm = p.timer || null; var seg = tm ? int(tm.segundos != null ? tm.segundos : (tm.minutos != null ? tm.minutos * 60 : null)) : null;
        if(tm && tm.ativo !== false && seg > 0) o.timer = { ativo:true, segundos:seg, rotulo:txt(tm.rotulo) || o.titulo };
        if(txt(p.dica)) o.dica = txt(p.dica);
      }
      if(!o.titulo) o.titulo = 'Passo ' + (n + 1);
      return o;
    }).filter(function(o){ return o.descricao || o.titulo; });
    if(!r.passos.length) av.push('A receita não tem passos.');
    r.notas = (Array.isArray(j.notas) ? j.notas : (j.notas ? [j.notas] : [])).map(txt).filter(Boolean);
    r.tags = (Array.isArray(j.tags) ? j.tags : (j.tags ? String(j.tags).split(',') : [])).map(function(x){ return norm(x).replace(/\s+/g, '-'); }).filter(Boolean);
    r.player = { ativo:!(j.player && j.player.ativo === false) };
    var ly = j.layout || {};
    r.layout = { tipo:LAYOUTS.indexOf(ly.tipo) >= 0 ? ly.tipo : 'classico' };
    if(txt(ly.emoji)) r.layout.emoji = txt(ly.emoji);
    if(/^#[0-9a-f]{3,8}$/i.test(txt(ly.cor))) r.layout.cor = txt(ly.cor);
    return { receita:r, avisos:av };
  }

  function validar(r){
    var e = [];
    if(!r.nome) e.push('Escreve o nome da receita.');
    if(!r.id) e.push('Falta o identificador (slug).');
    if(!r.categoria) e.push('Escolhe a categoria.');
    if(!r.ingredientes.length) e.push('Junta pelo menos um ingrediente.');
    if(!r.passos.length) e.push('Junta pelo menos um passo.');
    return e;
  }

  // textos para mostrar
  function numTexto(n){ if(n == null) return ''; var r = Math.round(n * 100) / 100; if(Math.abs(r - Math.round(r)) < 0.01) return String(Math.round(r)); var fr = { '0.25':'¼', '0.5':'½', '0.75':'¾' }; var i = Math.floor(r), d = (r - i).toFixed(2).replace(/0$/, ''); if(fr[d] && r < 10) return (i ? i : '') + fr[d]; return String(r).replace('.', ','); }
  function arredonda(q, u){ if(q == null) return null; if(u === 'g' || u === 'ml'){ return q >= 100 ? Math.round(q / 5) * 5 : Math.round(q); } if(u === 'un' || u === 'dente' || u === 'lata' || u === 'fatia' || u === 'folha' || u === 'ramo'){ return Math.max(0.5, Math.round(q * 2) / 2); } return Math.round(q * 4) / 4; }
  function quantidadeTexto(ing, fator){
    var u = UNIDADES[ing.unidade] || UNIDADES.un;
    if(ing.unidade === 'q.b.' || ing.quantidade == null) return 'q.b.';
    var q = arredonda(ing.quantidade * (fator || 1), ing.unidade);
    if(ing.unidade === 'g' && q >= 1000){ return numTexto(q / 1000) + ' kg'; }
    if(ing.unidade === 'ml' && q >= 1000){ return numTexto(q / 1000) + ' l'; }
    var nome = q > 1 ? u.p : u.s;
    return numTexto(q) + (nome ? ' ' + nome : '');
  }
  function tempoTexto(min){ min = int(min); if(!min) return ''; if(min < 60) return min + ' min'; var h = Math.floor(min / 60), m = min % 60; return h + ' h' + (m ? ' ' + m + ' min' : ''); }
  function relogio(seg){ seg = Math.max(0, Math.round(seg)); var m = Math.floor(seg / 60), s = seg % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

  AMR.modelo = { UNIDADES:UNIDADES, DIFICULDADES:DIFICULDADES, LAYOUTS:LAYOUTS, normalizar:normalizar, validar:validar, slug:slug, norm:norm,
                 quantidadeTexto:quantidadeTexto, tempoTexto:tempoTexto, relogio:relogio, esc:esc, ingredienteDeTexto:ingredienteDeTexto };
})();
