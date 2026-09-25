/* ÀMesa · Stories — Fase 1 (só pré-visualização)
   Motor de composição 9:16 em Canvas (1080×1920), 100% no browser.
   Sem Storage, sem base de dados, sem partilha, sem APIs externas.
   Uso: window.__storyAbrir({ nome, titulo, descricao, aparencia, headerFotos }) */
(function () {
  'use strict';
  var W = 1080, H = 1920;

  // ---------- utilitários de cor ----------
  function primeiraCor(aparencia, chaves, fallback) {
    aparencia = aparencia || {};
    for (var i = 0; i < (chaves || []).length; i++) {
      var v = aparencia[chaves[i]];
      if (v && String(v).trim()) return String(v).trim();
    }
    return fallback;
  }

  // ---------- carregar imagem (com fallback sem CORS para preview) ----------
  function carregarImagem(src) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () {
        // tenta sem crossOrigin (preview funciona à mesma; export fica para fases futuras)
        var img2 = new Image();
        img2.onload = function () { resolve(img2); };
        img2.onerror = function () { resolve(null); };
        img2.src = src;
      };
      img.src = src;
    });
  }

  // ---------- desenhar imagem em "cover" ----------
  function drawCover(ctx, img, x, y, w, h) {
    var ir = img.width / img.height, r = w / h, sw, sh, sx, sy;
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  // ---------- quebrar texto em linhas (com limite e reticências) ----------
  function wrap(ctx, texto, maxW, maxLinhas) {
    var palavras = String(texto || '').split(/\s+/).filter(Boolean);
    var linhas = [], atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var teste = atual ? (atual + ' ' + palavras[i]) : palavras[i];
      if (ctx.measureText(teste).width <= maxW || !atual) {
        atual = teste;
      } else {
        linhas.push(atual); atual = palavras[i];
        if (linhas.length === maxLinhas) break;
      }
    }
    if (linhas.length < maxLinhas && atual) linhas.push(atual);
    // reticências se sobrou texto
    if (linhas.length === maxLinhas) {
      var usadas = linhas.join(' ').split(/\s+/).length;
      if (usadas < palavras.length) {
        var ult = linhas[maxLinhas - 1];
        while (ult && ctx.measureText(ult + '…').width > maxW) ult = ult.replace(/\s*\S+$/, '');
        linhas[maxLinhas - 1] = (ult || linhas[maxLinhas - 1]) + '…';
      }
    }
    return linhas;
  }

  // ---------- ajustar tamanho de fonte até caber em N linhas ----------
  function ajustarFonte(ctx, texto, maxW, maxLinhas, tamMax, tamMin, familia, peso) {
    for (var t = tamMax; t >= tamMin; t -= 4) {
      ctx.font = (peso || '800') + ' ' + t + 'px ' + familia;
      var ls = wrap(ctx, texto, maxW, maxLinhas + 1);
      if (ls.length <= maxLinhas) return { tam: t, linhas: wrap(ctx, texto, maxW, maxLinhas) };
    }
    ctx.font = (peso || '800') + ' ' + tamMin + 'px ' + familia;
    return { tam: tamMin, linhas: wrap(ctx, texto, maxW, maxLinhas) };
  }

  var FAMILIA ='"Helvetica Neue", "Segoe UI", Arial, sans-serif';

  // ---------- desenhar a Story ----------
  async function desenhar(canvas, tpl, dados, fotoSrc) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}

    var accent = primeiraCor(dados.aparencia, tpl.corAccentKeys, tpl.fallback.accent);
    var img = await carregarImagem(fotoSrc || ((dados.headerFotos && dados.headerFotos[0]) || ''));

    // fundo
    if (img) {
      drawCover(ctx, img, 0, 0, W, H);
    } else {
      var g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, primeiraCor(dados.aparencia, ['bgMain'], tpl.fallback.bg1));
      g.addColorStop(1, tpl.fallback.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // gradiente de escurecimento (topo suave, base forte) para legibilidade
    var esc = ctx.createLinearGradient(0, 0, 0, H);
    esc.addColorStop(0, 'rgba(0,0,0,0.28)');
    esc.addColorStop(0.42, 'rgba(0,0,0,0.05)');
    esc.addColorStop(0.68, 'rgba(0,0,0,' + (tpl.escurecer * 0.7).toFixed(2) + ')');
    esc.addColorStop(1, 'rgba(0,0,0,' + Math.min(0.92, tpl.escurecer + 0.35).toFixed(2) + ')');
    ctx.fillStyle = esc; ctx.fillRect(0, 0, W, H);

    var M = 90; // margem lateral

    // etiqueta (badge) no topo
    ctx.textBaseline = 'alphabetic';
    ctx.font = '800 40px ' + FAMILIA;
    var badge = (tpl.badge || 'PROMOÇÃO').toUpperCase();
    var bw = ctx.measureText(badge).width, padX = 30, padY = 20, by = 96, bh = 40 + padY * 2;
    ctx.fillStyle = accent;
    roundRect(ctx, M, by, bw + padX * 2, bh, 14); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(badge, M + padX, by + padY + 40 - 8);

    // ----- bloco inferior -----
    var maxW = W - M * 2;
    var y = H - 150; // linha de base, sobe conforme desenhamos de baixo para cima

    // nome do restaurante (base)
    ctx.textAlign = 'left';
    ctx.font = '700 44px ' + FAMILIA;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    sombra(ctx);
    var nome = (dados.nome || '').toUpperCase();
    ctx.fillText(cortar(ctx, nome, maxW), M, y);
    limparSombra(ctx);
    // linha divisória acima do nome
    ctx.strokeStyle = accent; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(M, y - 74); ctx.lineTo(M + 90, y - 74); ctx.stroke();
    y -= 128;

    // descrição (até 3 linhas)
    if (dados.descricao && dados.descricao.trim()) {
      var d = ajustarFonte(ctx, dados.descricao.trim(), maxW, 3, 52, 34, FAMILIA, '500');
      ctx.font = '500 ' + d.tam + 'px ' + FAMILIA;
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      sombra(ctx);
      for (var i = d.linhas.length - 1; i >= 0; i--) { ctx.fillText(d.linhas[i], M, y); y -= (d.tam * 1.28); }
      limparSombra(ctx);
      y -= 18;
    }

    // título (até 3 linhas, grande)
    var titulo = (dados.titulo && dados.titulo.trim()) || 'A tua promoção';
    var tt = ajustarFonte(ctx, titulo, maxW, 3, 128, 60, FAMILIA, '800');
    ctx.font = '800 ' + tt.tam + 'px ' + FAMILIA;
    ctx.fillStyle = '#fff';
    sombra(ctx, 0.55);
    for (var j = tt.linhas.length - 1; j >= 0; j--) { ctx.fillText(tt.linhas[j], M, y); y -= (tt.tam * 1.12); }
    limparSombra(ctx);
    // Nota: nesta fase NÃO interpretamos preço/desconto automaticamente — só título, descrição e nome.
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function sombra(ctx, a) { ctx.shadowColor = 'rgba(0,0,0,' + (a || 0.45) + ')'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3; }
  function limparSombra(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
  function cortar(ctx, txt, maxW) {
    if (ctx.measureText(txt).width <= maxW) return txt;
    var t = txt; while (t && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
    return t + '…';
  }

  // ---------- overlay de pré-visualização ----------
  var estado = { dados: null, fotoSrc: null, tpl: null };

  function construirOverlay() {
    if (document.getElementById('storyOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'storyOverlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(20,14,6,.72);display:none;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML =
      '<div style="width:100%;max-width:440px;max-height:96vh;overflow:auto;background:#fffdf9;border-radius:20px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.4);">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
      +   '<div style="font-weight:800;color:#4a3820;font-size:1.05rem;">🎨 Pré-visualização da Story</div>'
      +   '<button id="stFechar2" type="button" style="border:none;background:#efe4cf;border-radius:999px;width:34px;height:34px;cursor:pointer;font-size:1.1rem;color:#4a3820;">✕</button>'
      + '</div>'
      + '<div id="stTpls" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;"></div>'
      + '<div style="display:flex;justify-content:center;background:#2a1d10;border-radius:14px;padding:10px;">'
      +   '<canvas id="stCanvas" width="' + W + '" height="' + H + '" style="height:min(70vh, calc(88vw * 16 / 9));width:auto;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);"></canvas>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
      +   '<label style="flex:1;text-align:center;border:1px solid #e0d3b5;background:#fff;border-radius:10px;padding:11px;cursor:pointer;font-weight:800;color:#4a3820;font-size:.9rem;">📷 Escolher foto<input id="stFoto" type="file" accept="image/*" style="display:none;"></label>'
      +   '<button id="stSemFoto" type="button" style="border:1px solid #e0d3b5;background:#fff;border-radius:10px;padding:11px 14px;cursor:pointer;font-weight:800;color:#8a7a5c;font-size:.9rem;">Sem foto</button>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:8px;">'
      +   '<button id="stRegerar" type="button" style="flex:1;border:none;background:#a8712f;color:#fff;border-radius:10px;padding:12px;cursor:pointer;font-weight:800;font-size:.92rem;">🔄 Gerar novamente</button>'
      +   '<button id="stFechar" type="button" style="border:1px solid #e0d3b5;background:#fff;color:#4a3820;border-radius:10px;padding:12px 16px;cursor:pointer;font-weight:800;font-size:.92rem;">Fechar</button>'
      + '</div>'
      + '<div style="font-size:.76rem;color:#8a7a5c;text-align:center;margin-top:10px;">Fase 1 — só pré-visualização. Guardar e partilhar chegam depois.</div>'
      + '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    document.getElementById('stFechar').onclick = fechar;
    document.getElementById('stFechar2').onclick = fechar;
    document.getElementById('stRegerar').onclick = render;
    document.getElementById('stSemFoto').onclick = function () { estado.fotoSrc = null; render(); };
    document.getElementById('stFoto').onchange = function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { estado.fotoSrc = fr.result; render(); };
      fr.readAsDataURL(f);
    };
  }

  function pintarTpls() {
    var cont = document.getElementById('stTpls'); if (!cont) return;
    var tpls = window.STORY_TEMPLATES || [];
    cont.innerHTML = tpls.map(function (t) {
      var on = (estado.tpl && estado.tpl.id === t.id);
      return '<button type="button" data-id="' + t.id + '" style="border:1px solid ' + (on ? '#a8712f' : '#e0d3b5') + ';background:' + (on ? '#a8712f' : '#fff') + ';color:' + (on ? '#fff' : '#4a3820') + ';border-radius:999px;padding:7px 13px;cursor:pointer;font-weight:800;font-size:.82rem;">' + t.nome + '</button>';
    }).join('');
    cont.querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        var t = (window.STORY_TEMPLATES || []).find(function (x) { return x.id === b.dataset.id; });
        if (t) { estado.tpl = t; pintarTpls(); render(); }
      };
    });
  }

  function render() {
    var c = document.getElementById('stCanvas');
    if (!c || !estado.tpl) return;
    desenhar(c, estado.tpl, estado.dados, estado.fotoSrc);
  }

  function fechar() {
    var ov = document.getElementById('storyOverlay'); if (ov) ov.style.display = 'none';
  }

  window.__storyAbrir = function (dados) {
    construirOverlay();
    estado.dados = dados || {};
    estado.fotoSrc = null;
    estado.tpl = (window.STORY_TEMPLATES || [])[0] || null;
    if (!estado.tpl) { alert('Nenhum template de Story disponível.'); return; }
    pintarTpls();
    document.getElementById('storyOverlay').style.display = 'flex';
    render();
  };
})();
