/* àMesa Compras — CATÁLOGO de produtos (lista fixa, por setores do supermercado e categorias).
   Para acrescentar produtos: junta o nome à linha da categoria certa (separados por "|").
   A ordem dos setores é a ordem da lista final (como quem percorre o supermercado). */
(function(){
  var AMC = window.AMC = window.AMC || {};
  var SETORES = [
    { id:'frutas-legumes', nome:'Frutas e legumes', emoji:'🥬', cor:'#2e9b57', grupos:[
      ['Frutas', 'Maçãs|Peras|Bananas|Laranjas|Tangerinas|Limões|Uvas|Morangos|Kiwis|Ananás|Melão|Melancia|Pêssegos|Ameixas|Cerejas|Mirtilos|Framboesas|Manga|Papaia|Abacate|Figos|Romã|Diospiros|Castanhas'],
      ['Legumes', 'Batatas|Batata-doce|Cebolas|Cebola roxa|Alho|Cenouras|Tomates|Tomate cereja|Alface|Rúcula|Espinafres|Couve portuguesa|Couve-galega|Couve-flor|Brócolos|Couve lombarda|Repolho|Pepino|Curgete|Beringela|Pimento vermelho|Pimento verde|Abóbora|Alho-francês|Nabos|Nabiças|Grelos|Feijão-verde|Ervilhas frescas|Cogumelos|Milho doce|Beterraba|Aipo|Rabanetes|Gengibre'],
      ['Ervas frescas', 'Salsa|Coentros|Hortelã|Manjericão|Cebolinho|Louro fresco|Alecrim|Tomilho|Poejo']
    ]},
    { id:'padaria', nome:'Padaria e pastelaria', emoji:'🥖', cor:'#c79a3e', grupos:[
      ['Pão', 'Pão|Pão de forma|Pão integral|Pão de mistura|Broa de milho|Carcaças|Papo-secos|Baguete|Pão de centeio|Tostas|Pão ralado|Tortilhas (wraps)'],
      ['Bolos e pastelaria', 'Croissants|Bolo de arroz|Pastéis de nata|Bolachas Maria|Bolo-rei|Queques|Biscoitos']
    ]},
    { id:'talho', nome:'Talho', emoji:'🥩', cor:'#b23a3a', grupos:[
      ['Vaca', 'Bifes de vaca|Carne picada|Carne para estufar|Vazia|Alcatra|Acém|Costeletas de vitela'],
      ['Porco', 'Bifanas|Febras|Costeletas de porco|Entrecosto|Lombo de porco|Secretos|Rojões|Carne de porco à alentejana|Entremeada|Pá de porco'],
      ['Aves e outros', 'Frango inteiro|Peito de frango|Coxas de frango|Asas de frango|Peru (bifes)|Pato|Coelho|Borrego|Cabrito|Hambúrgueres|Salsichas frescas']
    ]},
    { id:'peixaria', nome:'Peixaria', emoji:'🐟', cor:'#1f6f8b', grupos:[
      ['Peixe', 'Bacalhau|Bacalhau demolhado|Pescada|Dourada|Robalo|Sardinhas|Carapau|Salmão|Atum fresco|Peixe-espada|Cavala|Linguado|Polvo|Lulas|Choco|Raia'],
      ['Marisco', 'Camarão|Gambas|Amêijoas|Mexilhão|Berbigão|Sapateira']
    ]},
    { id:'charcutaria', nome:'Charcutaria e queijos', emoji:'🧀', cor:'#d4890b', grupos:[
      ['Charcutaria', 'Fiambre|Fiambre de peru|Presunto|Chouriço|Chouriço de carne|Paio|Salpicão|Morcela|Farinheira|Alheira|Bacon|Linguiça|Mortadela|Salsichas'],
      ['Queijos', 'Queijo flamengo|Queijo fatiado|Queijo fresco|Requeijão|Queijo da Serra|Queijo de Azeitão|Queijo São Jorge|Queijo ralado|Mozzarella|Queijo creme|Parmesão|Queijo cabra']
    ]},
    { id:'laticinios', nome:'Laticínios e ovos', emoji:'🥛', cor:'#5b8fd6', grupos:[
      ['Leite e natas', 'Leite meio-gordo|Leite magro|Leite gordo|Leite sem lactose|Bebida de aveia|Bebida de soja|Natas|Natas para culinária|Leite condensado|Leite evaporado'],
      ['Iogurtes e manteiga', 'Iogurtes naturais|Iogurtes de aromas|Iogurtes gregos|Iogurtes líquidos|Manteiga|Margarina|Kefir|Pudins|Gelatina'],
      ['Ovos', 'Ovos|Ovos biológicos']
    ]},
    { id:'mercearia', nome:'Mercearia', emoji:'🥫', cor:'#8a5a2b', grupos:[
      ['Arroz, massa e leguminosas', 'Arroz carolino|Arroz agulha|Arroz basmati|Esparguete|Massa meada|Massa cotovelinhos|Massa penne|Massa fusilli|Lasanha|Aletria|Grão-de-bico|Feijão encarnado|Feijão branco|Feijão-frade|Lentilhas|Cuscuz|Puré de batata'],
      ['Conservas', 'Atum em lata|Sardinhas em lata|Cavala em lata|Polvo em lata|Salsichas em lata|Tomate pelado|Polpa de tomate|Milho em lata|Ervilhas em lata|Grão em frasco|Feijão em frasco|Azeitonas|Pickles|Cogumelos em lata'],
      ['Farinhas e açúcar', 'Farinha|Farinha com fermento|Farinha de milho|Amido de milho (Maizena)|Açúcar|Açúcar amarelo|Açúcar em pó|Fermento em pó|Fermento de padeiro|Chocolate em pó|Cacau|Coco ralado|Canela em pau|Pepitas de chocolate'],
      ['Azeite, óleo e vinagre', 'Azeite|Óleo|Vinagre|Vinagre balsâmico'],
      ['Sopas e caldos', 'Caldo de galinha|Caldo de carne|Caldo de legumes|Sopa instantânea']
    ]},
    { id:'temperos', nome:'Temperos e molhos', emoji:'🧂', cor:'#a3452b', grupos:[
      ['Temperos', 'Sal|Sal grosso|Pimenta|Pimentão-doce|Colorau|Piri-piri|Cominhos|Noz-moscada|Caril|Orégãos|Louro|Canela|Cravinho|Massa de pimentão|Alho em pó'],
      ['Molhos', 'Ketchup|Maionese|Mostarda|Molho de tomate|Molho de soja|Molho inglês|Molho barbecue|Pesto|Massa de alho']
    ]},
    { id:'pequeno-almoco', nome:'Pequeno-almoço e doces', emoji:'🍪', cor:'#c2185b', grupos:[
      ['Pequeno-almoço', 'Cereais|Flocos de aveia|Granola|Muesli|Mel|Compota|Doce de morango|Creme de chocolate|Manteiga de amendoim|Marmelada'],
      ['Café e chá', 'Café moído|Café em grão|Cápsulas de café|Café solúvel|Chá|Cevada|Chocolate de beber'],
      ['Doces e snacks', 'Bolachas|Bolachas de água e sal|Chocolate|Gomas|Batatas fritas (pacote)|Pipocas|Frutos secos|Amendoins|Amêndoas|Nozes|Passas|Barras de cereais']
    ]},
    { id:'congelados', nome:'Congelados', emoji:'🧊', cor:'#4aa3c9', grupos:[
      ['Congelados', 'Ervilhas congeladas|Legumes para sopa|Espinafres congelados|Batatas fritas congeladas|Douradinhos|Pescada congelada|Camarão congelado|Pizza congelada|Gelados|Gelo|Polpa de fruta|Massa folhada|Massa quebrada']
    ]},
    { id:'bebidas', nome:'Bebidas', emoji:'🥤', cor:'#7a3fb0', grupos:[
      ['Água e sumos', 'Água|Água com gás|Sumo de laranja|Néctar|Refrigerante|Coca-Cola|Ice tea|Água tónica'],
      ['Vinhos e cervejas', 'Vinho tinto|Vinho branco|Vinho verde|Vinho do Porto|Espumante|Cerveja|Cerveja sem álcool|Sidra']
    ]},
    { id:'bebe', nome:'Bebé', emoji:'🍼', cor:'#e48aa8', grupos:[
      ['Bebé', 'Fraldas|Toalhitas|Leite para bebé|Papas|Boiões de fruta|Creme para a muda']
    ]},
    { id:'higiene', nome:'Higiene e beleza', emoji:'🧴', cor:'#3a9e9e', grupos:[
      ['Higiene', 'Papel higiénico|Lenços de papel|Gel de banho|Sabonete|Champô|Amaciador|Pasta de dentes|Escova de dentes|Fio dentário|Elixir|Desodorizante|Lâminas de barbear|Espuma de barbear|Pensos higiénicos|Tampões|Cotonetes|Algodão|Creme hidratante|Protetor solar|Pensos rápidos']
    ]},
    { id:'limpeza', nome:'Limpeza da casa', emoji:'🧽', cor:'#5b6b7a', grupos:[
      ['Roupa', 'Detergente da roupa|Amaciador da roupa|Tira-nódoas|Lixívia'],
      ['Loiça e cozinha', 'Detergente da loiça|Pastilhas da máquina|Sal da máquina|Abrilhantador|Esfregões|Esponjas|Rolo de cozinha|Guardanapos|Papel de alumínio|Película aderente|Papel vegetal|Sacos do lixo|Sacos de congelação'],
      ['Casa', 'Limpa-vidros|Limpeza multiusos|Desengordurante|Limpa-chão|Ambientador|Inseticida|Pilhas|Lâmpadas|Fósforos|Velas']
    ]},
    { id:'animais', nome:'Animais', emoji:'🐾', cor:'#8d6e63', grupos:[
      ['Animais', 'Ração para cão|Ração para gato|Comida húmida para cão|Comida húmida para gato|Areia para gato|Snacks para animais']
    ]},
    { id:'outros', nome:'Outros', emoji:'📦', cor:'#9a8b6f', grupos:[] }
  ];

  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function slug(s){ return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }

  var PRODUTOS = [], PORID = {}, SETOR = {};
  SETORES.forEach(function(s, si){
    SETOR[s.id] = s; s.ordem = si; s.produtos = [];
    s.grupos.forEach(function(g){
      g[1].split('|').forEach(function(nome){
        var p = { id:slug(nome), nome:nome, setor:s.id, grupo:g[0], n:norm(nome) };
        if(PORID[p.id]) return;
        PORID[p.id] = p; PRODUTOS.push(p); s.produtos.push(p);
      });
    });
  });

  // palavras que ajudam a pôr no setor certo um produto escrito à mão (ou um ingrediente de uma receita)
  var PISTAS = [
    ['peixaria', 'bacalhau|peixe|pescada|sardinh|salmao|atum fresco|polvo|lula|choco|camarao|gamba|ameijoa|mexilh|marisco|robalo|dourada|carapau|cavala'],
    ['talho', 'carne|frango|porco|vaca|vitela|bife|febra|costelet|lombo|peru|borrego|cabrito|coelho|picada|entrecosto'],
    ['charcutaria', 'salsicha|chouri|presunto|fiambre|bacon|paio|salpic|morcela|farinheira|alheira|linguica|queijo|mozzarella|parmesao|requeijao'],
    ['laticinios', 'leite|natas|iogurte|manteiga|ovo|margarina|kefir'],
    ['frutas-legumes', 'batata|cebola|alho|cenoura|tomate|alface|couve|pimento|abobora|curgete|beringela|cogumelo|salsa|coentro|hortela|manjericao|limao|laranja|maca|banana|pera|uva|morango|fruta|legume|grelos|nabo|espinafre|brocolo|ervilha fresca|feijao-verde|gengibre|louro fresco'],
    ['padaria', 'pao|broa|carcaca|baguete|croissant|tosta'],
    ['temperos', 'sal|pimenta|colorau|pimentao|piri|cominho|noz-moscada|caril|oregao|louro|canela|cravinho|molho|ketchup|maionese|mostarda'],
    ['mercearia', 'arroz|massa|esparguete|grao|feijao|lentilha|farinha|acucar|fermento|azeite|oleo|vinagre|caldo|conserva|lata|azeitona|chocolate|cacau|amido|maizena'],
    ['bebidas', 'agua|sumo|vinho|cerveja|refrigerante|espumante|porto'],
    ['congelados', 'congelad|gelado|gelo'],
    ['limpeza', 'detergente|lixivia|esfregao|esponja|limpa|saco do lixo|aluminio|pelicula'],
    ['higiene', 'champo|sabonete|gel de banho|pasta de dentes|papel higienico|desodoriz']
  ];
  function adivinharSetor(nome){
    var n = norm(nome);
    for(var i = 0; i < PISTAS.length; i++){ var re = new RegExp('(^|[^a-z])(' + PISTAS[i][1] + ')'); if(re.test(n)) return PISTAS[i][0]; }
    return 'outros';
  }
  // procura o produto do catálogo que corresponde a um nome (ex.: ingrediente "Bacalhau demolhado" → "Bacalhau demolhado")
  function sing(t){ return t.split(' ').map(function(w){ return w.length > 3 ? w.replace(/(oes|aes)$/, 'ao').replace(/s$/, '') : w; }).join(' '); }   // "batatas" = "batata"
  PRODUTOS.forEach(function(p){ p.s = sing(p.n); });
  function encontrar(nome){
    var n = norm(nome); if(!n) return null;
    if(PORID[slug(nome)]) return PORID[slug(nome)];
    var ns = sing(n.replace(/\(.*?\)/g, '').trim()), melhor = null;
    PRODUTOS.forEach(function(p){ if((ns === p.s || ns.indexOf(p.s + ' ') === 0) && (!melhor || p.s.length > melhor.s.length)) melhor = p; });
    return melhor;
  }
  function procurar(q){
    q = norm(q); if(!q) return [];
    var pal = q.split(' ');
    return PRODUTOS.filter(function(p){ return pal.every(function(w){ return p.n.indexOf(w) >= 0 || norm(p.grupo).indexOf(w) >= 0; }); }).slice(0, 60);
  }

  AMC.catalogo = { SETORES:SETORES, SETOR:SETOR, PRODUTOS:PRODUTOS, PORID:PORID, norm:norm, slug:slug, adivinharSetor:adivinharSetor, encontrar:encontrar, procurar:procurar };
})();
