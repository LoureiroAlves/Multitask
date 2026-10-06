/* ÀMesa · "No Cu da Galinha" — o jogo no menu: selo, inscrição, caça, vitória, patrocinador
   Carregado pelo cardapio.html. Quem ganha, os códigos e a segurança são decididos no Supabase. */
(function(){
  if(window.__PREVIEW || window.__esconderijo) return;
  var J = null, P = null, canal = null, pollT = null, rtOk = false, fimT = null, iniT = null, cdT = null, vigiaT = null, tentativas = 0, tentPend = 0, dicasMostradas = {}, cache = {}, aCacar = false, terminouVisto = false, venci = null, encoder = null;
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function disp(){ try{ var d = localStorage.getItem('amesaDisp'); if(!d){ d = (crypto.randomUUID ? crypto.randomUUID() : ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8); return v.toString(16); }))); localStorage.setItem('amesaDisp', d); } return d; }catch(e){ return '00000000-0000-4000-8000-000000000000'; } }
  function hhmm(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
  function ls(k, v){ try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ return null; } }
  async function sha(txt){ if(cache[txt]) return cache[txt]; try{ encoder = encoder || new TextEncoder(); var b = await crypto.subtle.digest('SHA-256', encoder.encode(txt)); var h = Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); cache[txt] = h; return h; }catch(e){ return ''; } }
  function toast(t){ var el = $('ovoToast'); if(!el){ el = document.createElement('div'); el.id = 'ovoToast'; document.body.appendChild(el); } el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(function(){ el.classList.remove('on'); }, 1400); }
  function vib(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }
  // ---------- convites: quem chega por um link de amigo (?convite=CÓDIGO) ----------
  try{ var _cv = new URLSearchParams(location.search).get('convite'); if(_cv && /^[A-Za-z0-9]{4,12}$/.test(_cv)) ls('amesaOvoConvite', _cv.toUpperCase()); }catch(e){}
  var CONV = null;   // { codigo, amigos, meta, tem_dica, dica } da inscrição deste telemóvel
  async function lerConvite(){
    var part = P || (J && ls('amesaOvoPart:' + J.id)); if(!part) return null;   // antes de começar, P ainda não está em memória
    try{ var r = await sbC.rpc('ovo_meu_convite', { p_participacao:part }); if(r.error || !r.data) return null; CONV = r.data; return CONV; }catch(e){ return null; }
  }
  function linkConvite(cod){
    // link curto amesadigital.pt/<restaurante>?convite=… (é este que mostra a pré-visualização com o nome do restaurante no WhatsApp)
    var slug = ''; try{ slug = (typeof __slugDoEndereco === 'function') ? __slugDoEndereco() : ''; }catch(e){}
    if(slug) return 'https://amesadigital.pt/' + slug + '?convite=' + encodeURIComponent(cod);
    var base = window.__linkCardapio ? window.__linkCardapio() : (location.origin + location.pathname);
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'convite=' + encodeURIComponent(cod);
  }
  function textoConvite(){
    var rest = window.__negNome || 'restaurante';
    return '🥚 Caça ao ovo no ' + rest + ' — começa ' + quandoTxt(J.inicio) + '! Prémio: ' + (J.premio_nome || '') + '. Só jogam os inscritos — inscreve-te aqui:';
  }
  async function partilharConvite(){
    if(!CONV || !CONV.codigo) await lerConvite();
    if(!CONV || !CONV.codigo){ toast('Sem ligação. Tenta outra vez.'); return; }
    var url = linkConvite(CONV.codigo), txt = textoConvite();
    try{ if(navigator.share){ await navigator.share({ title:'Caça ao ovo', text:txt, url:url }); return; } }catch(e){ if(e && e.name === 'AbortError') return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(txt + ' ' + url), '_blank');
  }
  // Bloco "Convida amigos" (folha do jogo agendado, para quem já está inscrito)
  async function pintarConvite(){
    var box = $('ovoConvBox'); if(!box || !J) return;
    var c = await lerConvite(); box = $('ovoConvBox'); if(!box) return;
    if(!c){ box.innerHTML = ''; return; }
    var meta = c.meta || 2, n = Math.min(c.amigos || 0, meta), fechado = Date.now() >= fechoInsc();
    var h = '';
    if(c.tem_dica){
      h += '<div class="ovo-conv"><div class="ovo-conv-t">🎁 Convida ' + meta + ' amigos e ganha uma <b>dica secreta</b></div>'
        + '<div class="ovo-conv-barra"><i style="width:' + Math.round(n / meta * 100) + '%"></i></div>'
        + '<div class="ovo-conv-n">' + (n >= meta ? '🔓 Conseguiste! A dica secreta aparece quando a caça começar.' : (n + ' de ' + meta + ' amigos inscritos')) + '</div>'
        + (n < meta ? '<div class="ovo-conv-s">Conta quando o amigo se inscreve pelo teu link, com as notificações ligadas.</div>' : '')
        + '</div>';
    }
    if(!fechado) h += '<button type="button" class="btn" id="ovoConvidar" style="background:#25d366;box-shadow:none;">📲 Convidar amigos</button>';
    // sugerir instalar a app (para receber os avisos e não perder a próxima caça)
    var I = window.__amInstalar;
    if(I && !I.instalada()){
      if(I.pode()) h += '<button type="button" class="btn sec" id="ovoInstalar">➕ Pôr a ÀMesa no ecrã principal</button>';
      else if(I.ios()) h += '<div class="ovo-conv-s" style="margin-top:8px;">📲 Dica: no Safari toca em <b>Partilhar</b> ⬆️ → <b>“Adicionar ao Ecrã Principal”</b> para não perderes a próxima caça.</div>';
    }
    box.innerHTML = h;
    var bc = $('ovoConvidar'); if(bc) bc.onclick = partilharConvite;
    var bi = $('ovoInstalar'); if(bi) bi.onclick = function(){ I.pedir().then(function(ok){ if(ok) toast('✓ ÀMesa no ecrã principal'); pintarConvite(); }); };
  }
  // Dica secreta durante a caça (só para quem convidou os amigos)
  async function pintarDicaSecreta(){
    var box = $('ovoDicaSec'); if(!box) return;
    var c = (CONV && CONV.dica) ? CONV : await lerConvite(); box = $('ovoDicaSec'); if(!box || !c || !c.tem_dica) return;
    if(c.dica){ box.innerHTML = '<div class="dica ovo-dica-sec">🔐 <b>Dica secreta:</b> ' + esc(c.dica) + '</div>'; return; }
    box.innerHTML = '<div class="ovo-conv-s" style="margin:6px 0;">🔒 Dica secreta bloqueada — convidaste ' + Math.min(c.amigos || 0, c.meta || 2) + ' de ' + (c.meta || 2) + ' amigos.</div>';
  }

  // ---------- só telemóvel: no computador o jogo fica bloqueado (o administrador não) ----------
  function soTelemovel(){
    if(!window.__amPC) return false;
    var link = (function(){ try{ var s = (typeof __slugDoEndereco === 'function') ? __slugDoEndereco() : ''; return s ? (location.origin + '/' + s) : location.href.split('#')[0]; }catch(e){ return location.href; } })();
    folha('<div class="big">📱🥚</div><h2>A caça ao ovo joga-se no telemóvel</h2><p>Aponta a câmara do telemóvel a este código, abre o menu e inscreve-te lá.</p><div id="ovoQrPC" style="background:#fff;border-radius:14px;padding:12px;display:inline-block;margin:6px auto 10px;"></div><button type="button" class="btn sec" id="ovoDepois">OK</button>');
    $('ovoDepois').onclick = fecharFolha;
    try{ if(window.QRCode) new QRCode($('ovoQrPC'), { text:link, width:190, height:190, colorDark:'#3a2c18', colorLight:'#ffffff' }); }catch(e){}
    return true;
  }

  // ---------- carregar o jogo ----------
  async function carregar(){
    if(typeof sbC === 'undefined' || !sbC || !window.__negocioId) return;
    var r = await sbC.from('ovo_jogos_publico').select('*').eq('negocio_id', window.__negocioId).gte('fim', new Date(Date.now() - 24*3600*1000).toISOString()).order('inicio', { ascending:false }).limit(5);
    if(r.error || !r.data) return;
    var ativo = r.data.filter(function(j){ return j.estado === 'ativo'; })[0];
    var visivel = function(j){ return !j.esconder_menu; };   // o restaurante tirou-o do menu
    var term = r.data.filter(function(j){ return visivel(j) && j.estado === 'terminado' && j.terminado_em && (Date.now() - new Date(j.terminado_em).getTime()) < 24*3600*1000; })[0];
    var exp = r.data.filter(function(j){ return visivel(j) && j.estado === 'expirado' && (Date.now() - new Date(j.fim).getTime()) < 24*3600*1000; })[0];
    var agend = r.data.filter(function(j){ return j.estado === 'agendado' && (new Date(j.inicio).getTime() - Date.now()) < 7*24*3600*1000; }).sort(function(a, b){ return new Date(a.inicio) - new Date(b.inicio); })[0];
    aplicar(ativo || agend || term || exp || null);
    // campanha publicada depois de o menu estar aberto: volta a ver de 2 em 2 min (consulta pequena)
    if(!vigiaT) vigiaT = setInterval(function(){ if(document.hidden) return; if(!J || J.estado === 'terminado' || J.estado === 'expirado') carregar(); }, 120000);
  }
  var jogoId = null;
  function aplicar(j){
    // Mudou de sessão (ex.: a anterior terminou e começou outra sem fechar a app) → limpa tudo o que era da sessão antiga
    var novoId = j ? j.id : null;
    if(novoId !== jogoId){
      if(jogoId !== null){ pararCaca(); fecharFolha(); }
      jogoId = novoId; venci = null; P = null; CONV = null; tentativas = 0; tentPend = 0; dicasMostradas = {}; terminouVisto = false;
      var fv = $('ovoFlut'); if(fv) fv.onclick = function(){ abrirFolha('caca'); };
    }
    J = j; var selo = $('ovoSelo');
    if(!selo){ selo = document.createElement('div'); selo.id = 'ovoSelo'; var ref = $('promoDia'); if(ref && ref.parentNode) ref.parentNode.insertBefore(selo, ref); else document.body.appendChild(selo); }
    if(!J){ selo.style.display = 'none'; pararCaca(); return; }
    var venc = Array.isArray(J.vencedores_lista) ? J.vencedores_lista : [];
    if(fimT){ clearTimeout(fimT); fimT = null; }
    if(iniT){ clearTimeout(iniT); iniT = null; }
    if(cdT){ clearInterval(cdT); cdT = null; }
    if(J.estado === 'agendado'){
      selo.className = 'agend'; selo.style.display = 'block';
      selo.innerHTML = '<button type="button"><span class="ov">🥚</span><span>' + esc(J.nome) + ' — a caça ao ovo vai começar<small>🎁 ' + esc(J.premio_nome) + ' · começa ' + quandoTxt(J.inicio) + ' · <b class="ovo-cd"></b><br><b class="ovo-insc"></b>' + (J.patrocinador_nome ? (' · com o apoio de ' + esc(J.patrocinador_nome)) : '') + '</small></span></button>';
      selo.querySelector('button').onclick = function(){ abrirFolha('agendado'); };
      var pinta = function(){
        document.querySelectorAll('.ovo-cd').forEach(function(el){ el.textContent = contagem(J.inicio); });
        var insc = !!ls('amesaOvoPart:' + J.id), aberto = Date.now() < fechoInsc();
        document.querySelectorAll('.ovo-insc').forEach(function(el){ el.textContent = insc ? '✓ Estás inscrito' : (aberto ? ('✋ Inscreve-te até às ' + hhmm(fechoInsc())) : 'Inscrições fechadas'); });
        var bi = $('ovoInscrever'); if(bi && !insc && !aberto){ abrirFolha('agendado'); }   // fechou com a folha aberta → atualiza
      };
      pinta(); cdT = setInterval(pinta, 1000);
      // aviso 5 minutos antes (uma vez por dispositivo)
      var ms5 = new Date(J.inicio).getTime() - Date.now() - 5*60000;
      if(ms5 > 0 && ms5 < 2147483000) setTimeout(function(){ if(J && J.estado === 'agendado' && !ls('amesaOvoAviso5:' + J.id)){ ls('amesaOvoAviso5:' + J.id, '1'); abrirFolha('agendado'); vib([60,40,60]); } }, ms5);
      // chegou por um convite e ainda não está inscrito → mostra logo a folha para se inscrever (uma vez por sessão)
      if(ls('amesaOvoConvite') && !ls('amesaOvoPart:' + J.id) && !ls('amesaOvoConvVisto:' + J.id) && Date.now() < fechoInsc()){ ls('amesaOvoConvVisto:' + J.id, '1'); setTimeout(function(){ abrirFolha('agendado'); }, 1200); }
      var msI = new Date(J.inicio).getTime() - Date.now() + 800;
      if(msI < 2147483000) iniT = setTimeout(arranque, Math.max(0, msI));
      return;
    }
    if(J.estado === 'expirado'){
      selo.className = 'fim'; selo.style.display = 'block';
      selo.innerHTML = '<button type="button"><span class="ov">⏰</span><span>Tempo esgotado<small>Ninguém encontrou o ovo · terminou às ' + hhmm(J.fim) + '</small></span></button>';
      selo.querySelector('button').onclick = function(){ abrirFolha('expirado'); };
      pararCaca(); return;
    }
    if(J.estado === 'terminado'){
      selo.className = 'fim'; selo.style.display = 'block';
      selo.innerHTML = '<button type="button"><span class="ov">🥚</span><span>Jogo terminado<small>' + (venc.length ? ('O ovo foi encontrado por ' + esc(venc.map(function(v){ return v.nome; }).join(', ')) + ' às ' + hhmm(venc[0].quando)) : 'O ovo ficou por encontrar') + '</small></span></button>';
      selo.querySelector('button').onclick = function(){ abrirFolha('fim'); };
      try{ var vv = JSON.parse(ls('amesaOvoVenci:' + J.id) || 'null'); if(vv && vv.codigo){ selo.innerHTML = '<button type="button"><span class="ov">🏆</span><span>Ganhaste a caça ao ovo!<small>Código ' + esc(vv.codigo) + ' · toca para veres e reclamares o prémio</small></span></button>'; selo.querySelector('button').onclick = function(){ folhaVitoria(vv); }; } }catch(e){}
      pararCaca(); return;
    }
    // relógio até ao fim: quando o tempo acaba, todos (a procurar ou não) recebem o aviso — o fim não muda a base de dados, por isso não chega pelo Realtime
    { var ms = new Date(J.fim).getTime() - Date.now() + 1500; if(ms > 0 && ms < 2147483000) fimT = setTimeout(fimDoTempo, ms); }
    selo.className = ''; selo.style.display = 'block';
    selo.innerHTML = '<button type="button"><span class="ov">🥚</span><span>' + esc(J.nome) + ' — caça ao ovo a decorrer<small>🎁 ' + esc(J.premio_nome) + ' · até às ' + hhmm(J.fim) + (J.participantes ? (' · ' + J.participantes + ' a procurar') : '') + '</small></span></button>';
    selo.querySelector('button').onclick = function(){ abrirFolha(aCacar ? 'caca' : 'abertura'); };
    P = ls('amesaOvoPart:' + J.id);
    if(P){ iniciarCaca(); }
    else if(!ls('amesaOvoVisto:' + J.id)){ ls('amesaOvoVisto:' + J.id, '1'); setTimeout(function(){ abrirFolha('abertura'); }, 1400); }
  }
  function quandoTxt(ts){ var d = new Date(ts), h = new Date(); var am = new Date(); am.setDate(am.getDate() + 1); var mesmo = function(a, b){ return a.toDateString() === b.toDateString(); }; return (mesmo(d, h) ? 'hoje às ' : (mesmo(d, am) ? 'amanhã às ' : (d.getDate() + '/' + (d.getMonth()+1) + ' às '))) + hhmm(ts); }
  function contagem(ts){ var s = Math.max(0, Math.round((new Date(ts).getTime() - Date.now()) / 1000)); var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    if(d > 0) return 'faltam ' + d + 'd ' + h + 'h'; if(h > 0) return 'faltam ' + h + 'h ' + String(m).padStart(2,'0') + 'm'; return 'faltam ' + String(m).padStart(2,'0') + ':' + String(x).padStart(2,'0'); }
  async function arranque(tent){
    iniT = null; tent = tent || 0; if(!J) return;
    try{ var r = await sbC.from('ovo_jogos_publico').select('*').eq('id', J.id).maybeSingle(); if(r && r.data) J = r.data; }catch(e){}
    if(J.estado === 'agendado' && tent < 8){ iniT = setTimeout(function(){ arranque(tent + 1); }, 2000); return; }   // relógio do telemóvel adiantado → espera pelo servidor
    if(J.estado !== 'ativo'){ aplicar(J); return; }
    ls('amesaOvoVisto:' + J.id, '1');
    aplicar(J);
    fecharFolha(); setTimeout(function(){ abrirFolha('comecou'); vib([120,60,120,60,200]); }, 350);
  }
  async function fimDoTempo(){
    fimT = null; if(!J) return;
    try{ var r = await sbC.from('ovo_jogos_publico').select('*').eq('id', J.id).maybeSingle(); if(r && r.data) J = r.data; }catch(e){}
    if(J.estado === 'ativo'){ J.estado = 'expirado'; }   // relógio do telemóvel ligeiramente adiantado → trata como fim
    if(venci && venci !== 'a_reclamar'){ aplicar(J); return; }   // quem ganhou não precisa de aviso
    terminouVisto = true;
    var _tipoFim = (J.estado === 'terminado' ? 'fim' : 'expirado'); vib([120,60,120]); popupFimPat(function(){ abrirFolha(_tipoFim); });
    aplicar(J);
  }
  // ---------- folhas ----------
  function fecharFolha(){ var ov = $('ovoOv'); if(!ov) return; ov.classList.remove('on'); setTimeout(function(){ ov.remove(); }, 320); }
  function folha(html, fixa){ var ov = $('ovoOv'); if(ov) ov.remove(); ov = document.createElement('div'); ov.id = 'ovoOv'; ov.innerHTML = '<div id="ovoCard">' + html + '</div>'; document.body.appendChild(ov); var aberta = Date.now(); ov.addEventListener('click', function(e){ if(e.target === ov && !fixa && Date.now() - aberta > 1200) fecharFolha(); }); requestAnimationFrame(function(){ ov.classList.add('on'); }); return ov; }
  function dicasAtivas(){ if(!J) return []; var out = []; if(J.dica_auto) out.push(J.dica_auto); if(J.charada) out.push(J.charada); var min = (Date.now() - new Date(J.inicio).getTime()) / 60000; (Array.isArray(J.dicas) ? J.dicas : []).forEach(function(d){ if(d && d.texto && min >= (parseFloat(d.minutos) || 0)) out.push(d.texto); }); return out; }
  function abrirFolha(tipo){
    if(!J) return;
    var dicas = dicasAtivas();
    if(tipo === 'abertura' || tipo === 'caca'){
      folha('<div class="big">🥚</div><h2>' + esc(J.nome) + '</h2><p>' + esc(J.descricao || 'Há um ovo escondido algures neste menu. Encontra-o antes de toda a gente!') + '</p>'
        + '<div class="premio"><span style="font-size:.78rem;font-weight:800;color:#8a5a10;">PRÉMIO</span><b>🎁 ' + esc(J.premio_nome) + '</b>' + (J.premio_descricao ? ('<span style="font-size:.85rem;">' + esc(J.premio_descricao) + '</span>') : '') + '</div>'
        + dicas.map(function(d){ return '<div class="dica">💡 ' + esc(d) + '</div>'; }).join('')
        + (tipo === 'caca' ? '<div id="ovoDicaSec"></div>' : '')
        + '<p class="meta">Válido até às ' + hhmm(J.fim) + ' · ' + (J.participantes || 0) + ' a procurar · ' + (J.limite_vencedores > 1 ? (J.limite_vencedores + ' prémios') : '1 prémio') + '</p>'
        + (tipo === 'abertura' ? '<div class="dica" style="background:#fbe7e4;color:#b23;">🔒 Só jogam os inscritos — as inscrições fecharam 1 minuto antes do início.</div><button type="button" class="btn sec" id="ovoComecar">Inscrevi-me neste telemóvel — entrar</button><button type="button" class="btn sec" id="ovoDepois">Fechar</button>'
                              : '<p style="font-weight:800;">Estás a procurar · ' + tentativas + ' tentativa(s)</p><button type="button" class="btn" id="ovoDepois">Continuar a procurar</button>'));
      var c = $('ovoComecar'); if(c) c.onclick = comecar;
      $('ovoDepois').onclick = fecharFolha;
      if($('ovoDicaSec')) pintarDicaSecreta();
    } else if(tipo === 'agendado'){
      folha(patHTML('hero') + '<div class="big">🥚⏳</div><h2>' + esc(J.nome) + '</h2><p>' + esc(J.descricao || 'Vamos esconder um ovo neste menu. O primeiro a encontrá-lo ganha!') + '</p>'
        + '<div class="premio"><span style="font-size:.78rem;font-weight:800;color:#8a5a10;">PRÉMIO</span><b>🎁 ' + esc(J.premio_nome) + '</b>' + (J.premio_descricao ? ('<span style="font-size:.85rem;">' + esc(J.premio_descricao) + '</span>') : '') + '</div>'
        + '<p style="font-weight:900;font-size:1.1rem;">Começa ' + quandoTxt(J.inicio) + '</p><p class="ovo-cd" style="font-size:2rem;font-weight:900;font-variant-numeric:tabular-nums;margin:4px 0;">' + contagem(J.inicio) + '</p>'
        + (function(){
            var insc = !!ls('amesaOvoPart:' + J.id), aberto = Date.now() < fechoInsc();
            if(insc) return '<div class="dica">✓ Estás inscrito! Avisamos-te 1 minuto antes. Quando começar, entras logo na caça — deixa o menu aberto ou toca no aviso.</div><div id="ovoConvBox"></div><button type="button" class="btn sec" id="ovoDepois">OK</button>';
            if(aberto) return (ls('amesaOvoConvite') ? '<div class="ovo-convidado">🎉 Foste convidado para esta caça ao ovo!</div>' : '') + '<p style="font-weight:800;">Só os inscritos podem jogar. Inscrições até às ' + hhmm(fechoInsc()) + '.</p><button type="button" class="btn" id="ovoInscrever">✋ Quero jogar — inscrever-me</button><button type="button" class="btn sec" id="ovoDepois">Agora não</button>';
            return '<div class="dica" style="background:#fbe7e4;color:#b23;">As inscrições já fecharam. Fica atento à próxima caça! 🥚</div><button type="button" class="btn sec" id="ovoDepois">OK</button>';
          })()
        + '<p class="meta">Termina às ' + hhmm(J.fim) + '.</p>');
      $('ovoDepois').onclick = fecharFolha;
      { var bi = $('ovoInscrever'); if(bi) bi.onclick = inscrever; }
      if($('ovoConvBox')) pintarConvite();
    } else if(tipo === 'comecou' && !ls('amesaOvoPart:' + J.id)){
      folha('<div class="big">🥚🔒</div><h2>A caça começou!</h2><p><b>' + esc(J.nome) + '</b> — desta vez só jogam os inscritos.</p><p>Fica atento: quando houver nova caça, inscreve-te antes de começar. 🥚</p><button type="button" class="btn sec" id="ovoDepois">OK</button>');
      $('ovoDepois').onclick = fecharFolha;
    } else if(tipo === 'comecou'){
      folha((J.patrocinador_nome ? patHTML('grande') : '') + '<div class="big">🥚🔔</div><h2>A caça começou!</h2><p><b>' + esc(J.nome) + '</b> — o ovo já está escondido no menu.</p>'
        + '<div class="premio"><span style="font-size:.78rem;font-weight:800;color:#8a5a10;">PRÉMIO</span><b>🎁 ' + esc(J.premio_nome) + '</b></div>'
        + dicasAtivas().map(function(d){ return '<div class="dica">💡 ' + esc(d) + '</div>'; }).join('')
        + '<div id="ovoDicaSec"></div>'
        + '<p class="meta">Até às ' + hhmm(J.fim) + ' · ' + (J.limite_vencedores > 1 ? (J.limite_vencedores + ' prémios') : '1 prémio') + '</p>'
        + (aCacar ? '<p style="font-weight:800;">Já estás a procurar! Toca nos pratos, categorias, fotos… 🔍</p><button type="button" class="btn" id="ovoDepois">Vamos!</button>'
                  : '<button type="button" class="btn" id="ovoComecar">🔍 Começar a Procurar</button><button type="button" class="btn sec" id="ovoDepois">Agora não</button>'));
      { var c2 = $('ovoComecar'); if(c2) c2.onclick = comecar; } $('ovoDepois').onclick = fecharFolha;
      pintarDicaSecreta();
    } else if(tipo === 'expirado'){
      folha('<div class="big">⏰</div><h2>Tempo esgotado!</h2><p>Desta vez ninguém encontrou o ovo — continua escondido no nosso menu.</p><p>Obrigado por participares. Fica atento à próxima caça! 🥚</p><button type="button" class="btn sec" id="ovoDepois">Fechar</button>');
      $('ovoDepois').onclick = fecharFolha;
    } else if(tipo === 'fim'){
      var venc = Array.isArray(J.vencedores_lista) ? J.vencedores_lista : [];
      folha('<div class="big">🎉</div><h2>Já temos vencedor!</h2><p>' + (venc.length ? ('O ovo foi encontrado por <b>' + esc(venc.map(function(v){ return v.nome; }).join(', ')) + '</b> às ' + hhmm(venc[0].quando) + '.') : 'O jogo terminou.') + '</p><p>Obrigado por participares — fica atento à próxima caça.</p><button type="button" class="btn sec" id="ovoDepois">Fechar</button>' + patHTML('discreto'));
      $('ovoDepois').onclick = fecharFolha;
    }
  }
  // Patrocinador da sessão (opcional). Sem patrocinador → não aparece nada.
  function patHTML(modo){
    if(!J || !J.patrocinador_nome) return '';
    var lk = (J.patrocinador_link && /^https?:\/\//i.test(J.patrocinador_link)) ? J.patrocinador_link : '';
    var abre = lk ? ('<a href="' + esc(lk) + '" target="_blank" rel="noopener sponsored" ') : '<div ', fecha = lk ? '</a>' : '</div>';
    var logo = J.patrocinador_logo ? ('<img src="' + esc(J.patrocinador_logo) + '" alt="' + esc(J.patrocinador_nome) + '">') : '';
    if(modo === 'discreto') return abre + 'class="ovo-pat-d"><span>Esta caça ao ovo teve o apoio de</span><b>' + esc(J.patrocinador_nome) + '</b>' + fecha;
    if(modo === 'hero' && J.patrocinador_logo) return abre + 'class="ovo-pat-hero so-img"><img src="' + esc(J.patrocinador_logo) + '" alt="' + esc(J.patrocinador_nome) + '">' + fecha;
    if(modo === 'hero') return abre + 'class="ovo-pat-hero"><div class="h-t">🥚 APRESENTADO POR 🥚</div>'
      + (J.patrocinador_logo ? ('<div class="h-logo"><img src="' + esc(J.patrocinador_logo) + '" alt="' + esc(J.patrocinador_nome) + '"></div>') : '<div style="height:8px;"></div>')
      + '<div class="h-n">' + esc(J.patrocinador_nome) + '</div>'
      + (J.patrocinio_msg ? ('<div class="h-m">“' + esc(J.patrocinio_msg) + '”</div>') : '')
      + (lk ? '<div class="h-lk">Conhecer ›</div>' : '') + fecha;
    return abre + 'class="ovo-pat"><div class="ovo-pat-t">PATROCINADO POR</div>' + logo + '<div class="ovo-pat-n">' + esc(J.patrocinador_nome) + '</div>'
      + (J.patrocinio_msg ? ('<div class="ovo-pat-m">“' + esc(J.patrocinio_msg) + '”</div>') : '') + fecha;
  }
  function popupFimPat(depois){
    try{
      if(!J || !J.patrocinador_logo || ls('amesaOvoPatFim:' + J.id)){ depois(); return; }
      ls('amesaOvoPatFim:' + J.id, '1');
      var ov = document.createElement('div'); ov.id = 'ovoPatFim';
      ov.innerHTML = '<div class="t">🏁 O jogo terminou!</div><img src="' + esc(J.patrocinador_logo) + '" alt="' + esc(J.patrocinador_nome || '') + '"><div class="barra"><i></i></div>';
      document.body.appendChild(ov); requestAnimationFrame(function(){ ov.classList.add('on'); });
      setTimeout(function(){ ov.classList.remove('on'); setTimeout(function(){ ov.remove(); depois(); }, 260); }, 4000);
    }catch(e){ depois(); }
  }
  function fechoInsc(){ return J ? (new Date(J.inicio).getTime() - 60000) : 0; }   // as inscrições fecham 1 minuto antes
  async function inscrever(){
    if(soTelemovel()) return;
    var b = $('ovoInscrever'); if(b){ b.disabled = true; b.textContent = 'A inscrever…'; }
    var ep = '';
    try{ if(window.__ovoObterPush) ep = await window.__ovoObterPush(); }catch(e){ ep = ''; }
    var erro = null, id = null;
    for(var k = 0; k < 3; k++){
      try{
        var args = { p_jogo:J.id, p_dispositivo:disp(), p_endpoint:ep || null }, cv = ls('amesaOvoConvite');
        if(cv) args.p_convite = cv;
        var r = await sbC.rpc('ovo_inscrever', args);
        if(r.error && cv && /ovo_inscrever|PGRST202|function/i.test(String(r.error.message || '') + (r.error.code || ''))){ delete args.p_convite; r = await sbC.rpc('ovo_inscrever', args); }   // base de dados ainda sem convites
        if(r.error) throw r.error; id = r.data; erro = null; break; }
      catch(e){ erro = e; if(/inscricoes_fechadas|jogo_inativo/.test(String(e && e.message || e))) break; await new Promise(function(ok){ setTimeout(ok, 1200); }); }
    }
    if(!id){
      var m = String(erro && erro.message || erro);
      if(b){ b.disabled = false; b.textContent = '✋ Quero jogar — inscrever-me'; }
      toast(m.indexOf('inscricoes_fechadas') >= 0 ? 'As inscrições já fecharam.' : (m.indexOf('jogo_inativo') >= 0 ? 'Este jogo já não está disponível.' : 'Sem ligação. Tenta outra vez.')); return;
    }
    P = id; ls('amesaOvoPart:' + J.id, id); ls('amesaOvoConvite', null); CONV = null; vib([60,40,60]);
    toast(ep ? '✓ Inscrito! Avisamos-te 1 minuto antes.' : '✓ Inscrito! Deixa o menu aberto para entrares quando começar.');
    abrirFolha('agendado');
    document.querySelectorAll('.ovo-insc').forEach(function(el){ el.textContent = '✓ Estás inscrito'; });
  }
  async function comecar(){
    if(soTelemovel()) return;
    var b = $('ovoComecar'); if(b){ b.disabled = true; b.textContent = 'A entrar…'; }
    // ao acordar o telemóvel a rede pode demorar uns segundos: tenta até 4 vezes antes de desistir
    var erroFinal = null;
    for(var k = 0; k < 4; k++){
      try{ var r = await sbC.rpc('ovo_entrar', { p_jogo:J.id, p_dispositivo:disp() }); if(r.error) throw r.error; P = r.data; ls('amesaOvoPart:' + J.id, P); erroFinal = null; break; }
      catch(e){ erroFinal = e; if(/jogo_inativo|nao_inscrito/.test(String(e && e.message || e))) break; await new Promise(function(ok){ setTimeout(ok, 1500); }); }
    }
    if(erroFinal){
      var inat = String(erroFinal && erroFinal.message || erroFinal).indexOf('jogo_inativo') >= 0;
      if(inat){ try{ var q = await sbC.from('ovo_jogos_publico').select('*').eq('id', J.id).maybeSingle(); if(q && q.data && q.data.estado === 'ativo'){ J = q.data; return comecar(); } }catch(_e){} }
      var naoInsc = String(erroFinal && erroFinal.message || erroFinal).indexOf('nao_inscrito') >= 0;
      if(b){ b.disabled = false; b.textContent = naoInsc ? 'Inscrevi-me neste telemóvel — entrar' : '🔍 Começar a Procurar'; }
      toast(naoInsc ? 'Este telemóvel não está inscrito neste jogo.' : (inat ? 'O jogo já terminou.' : 'Sem ligação à internet. Tenta outra vez.')); return;
    }
    fecharFolha(); iniciarCaca(); toast('Boa caça! Toca nos pratos, categorias, promoções… 🥚');
  }
  // ---------- caça ----------
  function iniciarCaca(){
    if(aCacar || window.__amPC) return; aCacar = true;
    tentativas = parseInt(ls('amesaOvoTent:' + J.id) || '0', 10) || 0;
    var f = $('ovoFlut'); if(!f){ f = document.createElement('button'); f.id = 'ovoFlut'; f.type = 'button'; document.body.appendChild(f); f.onclick = function(){ abrirFolha('caca'); }; }
    f.onclick = function(){ abrirFolha('caca'); };
    pintaFlut(); f.style.display = 'flex';
    dicasAtivas().forEach(function(d){ dicasMostradas[d] = 1; });   // as que já estão na abertura não voltam a avisar
    venci = null;
    try{ var vj = ls('amesaOvoVenci:' + J.id); if(vj){ venci = JSON.parse(vj); f.innerHTML = '<span class="ov">🏆</span><span>Ganhaste!<small style="display:block;">' + esc(venci.codigo) + '</small></span>'; f.onclick = function(){ folhaVitoria(venci); }; } }catch(e){}
    if(!venci) document.addEventListener('click', onToque, true);
    ligarRealtime(); if(!pollT) pollT = setInterval(function(){ if(!rtOk && !document.hidden) sincronizar(); }, 30000);   // reserva: só quando o tempo real não está ligado
    if(!iniciarCaca._uma){   // estes só se ligam uma vez (antes acumulavam a cada sessão nova)
      iniciarCaca._uma = true;
      document.addEventListener('visibilitychange', function(){ if(!document.hidden && aCacar) sincronizar(); });
      window.addEventListener('pagehide', enviarTentativas);
      setInterval(function(){ if(aCacar){ enviarTentativas(); verificarDicas(); } }, 30000);
    }
  }
  function pararCaca(){ aCacar = false; var f = $('ovoFlut'); if(f) f.style.display = 'none'; document.removeEventListener('click', onToque, true); if(canal){ try{ sbC.removeChannel(canal); }catch(e){} canal = null; } if(pollT){ clearInterval(pollT); pollT = null; } }
  function pintaFlut(){ var f = $('ovoFlut'); if(f) f.innerHTML = '<span class="ov">🥚</span><span>À caça<small style="display:block;">' + tentativas + ' tentativa(s)' + (dicasAtivas().length ? ' · 💡 dica' : '') + '</small></span>'; }
  async function onToque(e){
    if(!aCacar || !J || venci) return;
    var el = e.target && e.target.closest ? e.target.closest('[data-alvo]') : null; if(!el) return;
    var a = String(el.dataset.alvo || ''); var i = a.indexOf(':'); if(i < 0) return;
    var tipo = a.slice(0, i), ref = a.slice(i + 1);
    // candidatos: a letra e a palavra debaixo do dedo (se for texto de um prato) e depois o elemento inteiro
    var cands = [];
    if(tipo === 'item' && window.__ovoNoPonto){ var w = window.__ovoNoPonto(e.clientX, e.clientY, el); if(w){ var base = ref + '/' + w.campo + '/' + w.tok + '#' + w.occ; cands.push(['letra', base + '/' + w.idx]); [1,-1,2,-2].forEach(function(d){ if(w.idx + d >= 0) cands.push(['letra', base + '/' + (w.idx + d)]); }); cands.push(['palavra', base]); } }   // o dedo cobre 2-3 letras: as vizinhas também contam
    cands.push([tipo, ref]);
    for(var k = 0; k < cands.length; k++){ var h = await sha((J.sal || '') + cands[k][0] + ':' + cands[k][1]); if(h && J.alvo_hash && h === J.alvo_hash){ reclamar(cands[k][0], cands[k][1], el); return; } }
    tentativas++; tentPend++; ls('amesaOvoTent:' + J.id, String(tentativas)); pintaFlut();
    var quente = (J.dificuldade === 'facil' && J.alvo_seccao && (el.dataset.alvoSeccao === J.alvo_seccao || (tipo === 'cat' && el.dataset.alvoRotulo === J.alvo_seccao)));
    var frases = quente ? ['Estás quente 🔥', 'Muito perto… 🔥', 'É por aqui! 🔥🔥'] : ['Aqui não… 🐔', 'Nada. Continua a procurar 🐔', 'Frio como gelo ❄️', 'Hmm, aqui só há comida 🍽️', 'O ovo não está aqui 🥚❌'];
    toast(frases[Math.floor(Math.random() * frases.length)]); vib(quente ? [40,40,40] : 25);
    el.classList.remove('ovo-shake'); void el.offsetWidth; el.classList.add('ovo-shake');
  }
  async function reclamar(tipo, ref, el){
    venci = 'a_reclamar'; enviarTentativas();
    try{
      var r = await sbC.rpc('ovo_reclamar', { p_jogo:J.id, p_participacao:P, p_alvo:{ tipo:tipo, ref:ref }, p_nome:'', p_telefone:'' });
      if(r.error) throw r.error;
      var w = (r.data || [])[0]; if(!w) throw new Error('sem_resposta');
      if(!w.quando) w.quando = w.ganhou_em || new Date().toISOString();   // hora da vitória fica fixa
      venci = w; ls('amesaOvoVenci:' + J.id, JSON.stringify(w));
      vib([80,40,80,40,200]);
      popupFimPat(function(){ confetti(); folhaVitoria(w); });   // confetis só depois de sair a publicidade
    }catch(e){
      venci = null;
      var m = String(e && e.message || e);
      if(m.indexOf('sem_vagas') >= 0 || m.indexOf('jogo_terminado') >= 0){ toast('Encontraste… mas alguém chegou primeiro 😢'); sincronizar(); }
      else if(m.indexOf('alvo_errado') >= 0){ toast('Aqui não… 🐔'); }
      else toast('Não foi possível confirmar. Tenta outra vez.');
    }
  }
  var AMESA_WA = '351916254923';   // WhatsApp da ÀMesa (o vencedor envia o código + contacto)
  function folhaVitoria(w){
    var nomeG = ls('amesaEncNome') || '', telG = ls('amesaEncTel') || '';
    var premio = w.premio || (J && J.premio_nome) || '', rest = window.__negNome || '';
    // Hora em que ganhou (fixa): a guardada no telemóvel; senão a da lista de vencedores do jogo
    if(!w.quando){
      var lv = (J && Array.isArray(J.vencedores_lista)) ? J.vencedores_lista : [];
      var mv = lv.filter(function(v){ return v.posicao === w.posicao; })[0] || (lv.length === 1 ? lv[0] : null);
      w.quando = w.ganhou_em || (mv && mv.quando) || (J && J.terminado_em) || null;
      if(w.quando && J){ try{ ls('amesaOvoVenci:' + J.id, JSON.stringify(w)); }catch(e){} }
    }
    var quando = new Date(w.quando || Date.now()).toLocaleString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    folha('<div class="big">🏆🥚</div><h2 style="font-size:1.7rem;">GANHASTE!</h2><p><b>Foste ' + (w.posicao > 1 ? ('o ' + w.posicao + '.º a encontrar o ovo') : 'o primeiro a encontrar o ovo') + (rest ? (' no ' + esc(rest)) : '') + '!</b></p>'
      + '<div class="premio"><span style="font-size:.78rem;font-weight:800;color:#8a5a10;">O TEU PRÉMIO</span><b>🎁 ' + esc(premio) + '</b></div>'
      + '<p style="margin-bottom:2px;"><b>O teu código de vencedor</b> (é a tua prova):</p><div class="codigo">' + esc(w.codigo) + '</div>'
      + '<p class="meta" style="margin-top:-4px;">Ganho em ' + esc(quando) + ' · tira um print a este ecrã</p>'
      + '<p style="font-size:.9rem;margin-top:12px;"><b>Para receberes o prémio</b>, deixa o teu nome e telemóvel — a ÀMesa contacta-te:</p>'
      + '<input id="ovoNome" placeholder="O teu nome" value="' + esc(nomeG) + '"><input id="ovoTel" type="tel" inputmode="tel" placeholder="Telemóvel" value="' + esc(telG) + '">'
      + '<button type="button" class="btn" id="ovoIdent">✓ Guardar o meu contacto</button>'
      + '<a class="btn" id="ovoWa" target="_blank" rel="noopener" style="display:block;text-align:center;text-decoration:none;background:#25d366;box-shadow:none;margin-top:8px;">💬 Enviar o código à ÀMesa por WhatsApp</a>'
      + '<p class="meta" style="margin-top:10px;">O código fica guardado neste telemóvel — toca no 🏆 para o veres outra vez.</p>'
      + patHTML('discreto')
      + '<button type="button" class="btn sec" id="ovoFecharV">Fechar</button>', true);
    var waLink = function(){ var n = ($('ovoNome').value || '').trim(), t = ($('ovoTel').value || '').trim();
      var txt = '🏆 Ganhei a caça ao ovo' + (rest ? (' no ' + rest) : '') + '!\nCódigo: ' + w.codigo + '\nPrémio: ' + premio + '\nGanho em: ' + quando + (n ? ('\nNome: ' + n) : '') + (t ? ('\nTelemóvel: ' + t) : '');
      $('ovoWa').href = 'https://wa.me/' + AMESA_WA + '?text=' + encodeURIComponent(txt); };
    waLink(); $('ovoNome').addEventListener('input', waLink); $('ovoTel').addEventListener('input', waLink);
    $('ovoFecharV').onclick = fecharFolha;
    $('ovoIdent').onclick = async function(){ var n = ($('ovoNome').value || '').trim(), t = ($('ovoTel').value || '').trim(); if(!n){ $('ovoNome').focus(); return; } if(t.replace(/\D/g,'').length < 9){ $('ovoTel').focus(); return; } var b = this; b.disabled = true; b.textContent = 'A guardar…';
      try{ var r = await sbC.rpc('ovo_identificar', { p_codigo:w.codigo, p_nome:n, p_telefone:t }); if(r && r.error) throw r.error; ls('amesaEncNome', n); ls('amesaEncTel', t); b.textContent = '✓ Contacto guardado — a ÀMesa vai contactar-te'; }
      catch(e){ b.disabled = false; b.textContent = '✓ Guardar o meu contacto'; toast('Não foi possível guardar. Envia por WhatsApp.'); } };
    var f = $('ovoFlut'); if(f){ f.innerHTML = '<span class="ov">🏆</span><span>Ganhaste!<small style="display:block;">' + esc(w.codigo) + '</small></span>'; f.onclick = function(){ folhaVitoria(w); }; }
    document.removeEventListener('click', onToque, true);
  }
  function confetti(){ var cores = ['#f2b705','#e0245e','#1e8c4a','#2a5aa8','#ff8c42']; for(var i = 0; i < 80; i++){ var c = document.createElement('div'); c.className = 'ovo-conf'; c.style.left = (Math.random()*100) + 'vw'; c.style.background = cores[i % cores.length]; c.style.animationDuration = (2 + Math.random()*2) + 's'; c.style.animationDelay = (Math.random()*0.8) + 's'; c.style.borderRadius = (Math.random() > .5 ? '50%' : '2px'); document.body.appendChild(c); setTimeout(function(x){ return function(){ x.remove(); }; }(c), 5000); } }
  // ---------- sincronização (Realtime + reserva) ----------
  function ligarRealtime(){
    try{
      if(canal || !sbC.channel) return;
      canal = sbC.channel('ovo-' + J.id).on('postgres_changes', { event:'UPDATE', schema:'public', table:'ovo_jogos', filter:'id=eq.' + J.id }, function(){ sincronizar(); }).subscribe(function(st){ rtOk = (st === 'SUBSCRIBED'); if(rtOk) sincronizar(); });
    }catch(e){ canal = null; }
  }
  async function sincronizar(){
    if(!J) return;
    try{
      var r = await sbC.from('ovo_jogos_publico').select('*').eq('id', J.id).maybeSingle(); if(r.error || !r.data) return;
      var antes = J; J = r.data;
      if(J.esconder_menu && (J.estado === 'terminado' || J.estado === 'expirado')){ aplicar(null); return; }
      var vAntes = Array.isArray(antes.vencedores_lista) ? antes.vencedores_lista.length : 0, vAgora = Array.isArray(J.vencedores_lista) ? J.vencedores_lista.length : 0;
      if(J.estado === 'terminado' || J.estado === 'expirado'){
        if(!terminouVisto){ terminouVisto = true; if(!venci || venci === 'a_reclamar'){ var _tf = (J.estado === 'terminado' ? 'fim' : 'expirado'); vib([120,60,120]); if(venci === 'a_reclamar'){ abrirFolha(_tf); } else { popupFimPat(function(){ abrirFolha(_tf); }); } } }
        aplicar(J); return;
      }
      if(vAgora > vAntes && !venci){ var ult = J.vencedores_lista[vAgora - 1]; toast('🥚 ' + (ult && ult.nome ? ult.nome : 'Alguém') + ' encontrou um ovo — ainda há ' + (J.limite_vencedores - vAgora) + '!'); vib([60,40,60]); }
      verificarDicas(); pintaFlut();
    }catch(e){}
  }
  function verificarDicas(){ if(!aCacar) return; dicasAtivas().forEach(function(d){ if(!dicasMostradas[d]){ dicasMostradas[d] = 1; toast('💡 Dica: ' + d); vib([40,40,40]); pintaFlut(); } }); }
  function enviarTentativas(){ if(!P || tentPend <= 0) return; var n = tentPend; tentPend = 0; try{ sbC.rpc('ovo_tentativas', { p_participacao:P, p_n:n }); }catch(e){} }
  // ---------- voltar à app: com o ecrã desligado os relógios param — confirma tudo com o servidor ----------
  var retT = null, retUlt = 0, escondidoEm = 0;
  function retomar(){
    if(document.hidden){ if(!escondidoEm) escondidoEm = Date.now(); return; }
    // O telemóvel adormeceu mais de 45 s com um jogo marcado ou a decorrer → recarrega a página.
    // (É o mesmo que fechar e voltar a abrir o menu: tudo é lido de novo e a inscrição fica guardada no telemóvel.)
    var dormiu = escondidoEm ? (Date.now() - escondidoEm) : 0; escondidoEm = 0;
    if(dormiu > 45000 && J && (J.estado === 'agendado' || J.estado === 'ativo') && Date.now() < new Date(J.fim).getTime() && !venci){
      try{ enviarTentativas(); }catch(e){}
      location.reload(); return;
    }
    if(Date.now() - retUlt < 1500) return; retUlt = Date.now();
    clearTimeout(retT);
    retT = setTimeout(async function(){
      if(!J){ carregar(); return; }
      var agora = Date.now();
      if(J.estado === 'agendado' && agora >= new Date(J.inicio).getTime() - 1000){ if(iniT){ clearTimeout(iniT); iniT = null; } arranque(); return; }   // começou enquanto o telemóvel dormia
      if(J.estado === 'ativo' && agora >= new Date(J.fim).getTime()){ if(fimT){ clearTimeout(fimT); fimT = null; } fimDoTempo(); return; }   // acabou enquanto dormia
      if(J.estado === 'ativo' && aCacar){ sincronizar(); return; }
      carregar();   // agendado ainda por começar, ou jogo novo publicado entretanto
    }, 300);
  }
  document.addEventListener('visibilitychange', retomar);
  window.addEventListener('pagehide', function(){ if(!escondidoEm) escondidoEm = Date.now(); });
  window.addEventListener('pageshow', retomar);
  // Vigia de segurança (de 4 em 4 s, só com o ecrã ligado): se a hora de começar já passou e o jogo não arrancou,
  // ou se estou inscrito, o jogo está a decorrer e a caça não está ligada — corrige sozinho.
  var arrancando = false;
  setInterval(function(){
    try{
      if(document.hidden || !J || venci) return;
      var agora = Date.now();
      if(J.estado === 'agendado' && agora >= new Date(J.inicio).getTime() + 3000 && !arrancando){
        arrancando = true; if(iniT){ clearTimeout(iniT); iniT = null; }
        Promise.resolve(arranque()).then(function(){ arrancando = false; }, function(){ arrancando = false; });
        setTimeout(function(){ arrancando = false; }, 20000);
        return;
      }
      if(J.estado === 'ativo' && agora < new Date(J.fim).getTime() && !aCacar && ls('amesaOvoPart:' + J.id)){ P = ls('amesaOvoPart:' + J.id); iniciarCaca(); }
    }catch(e){}
  }, 4000);
  window.addEventListener('focus', retomar);
  window.addEventListener('online', function(){ retUlt = 0; retomar(); });

  // ---------- arranque: depois do negócio estar carregado ----------
  var tent = 0; var esperar = setInterval(function(){ tent++; if(window.__negocioId && typeof sbC !== 'undefined' && sbC){ clearInterval(esperar); carregar(); } else if(tent > 60) clearInterval(esperar); }, 500);
})();
