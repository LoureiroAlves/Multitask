/* ============================================================
   ÀMesa — Catálogo de adereços (linha, uma só cor, adaptam-se ao tema)
   Partilhado por cardapio.html (render) e editar.html (seletor).
   Cada entrada é só o INTERIOR do SVG (viewBox 0 0 24 24).
   A cor vem de currentColor -> segue o tema/layout escolhido.
   ============================================================ */
(function(){
  var A = {
    // ---- Flores / botânico ----
    flor5:     '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="5.5" r="2.6"/><circle cx="17.5" cy="9.5" r="2.6"/><circle cx="15.5" cy="16.5" r="2.6"/><circle cx="8.5" cy="16.5" r="2.6"/><circle cx="6.5" cy="9.5" r="2.6"/>',
    margarida: '<circle cx="12" cy="12" r="2"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.2 3.2M15.8 15.8L19 19M19 5l-3.2 3.2M8.2 15.8L5 19"/>',
    tulipa:    '<path d="M12 22V12"/><path d="M12 12c-3.2 0-5.5-2.3-5.5-5.5 2.3 0 3.6 1.1 5.5 3.2 1.9-2.1 3.2-3.2 5.5-3.2C17.5 9.7 15.2 12 12 12z"/><path d="M12 22c-2.5 0-4-1.5-4-3M12 22c2.5 0 4-1.5 4-3"/>',
    rosa:      '<circle cx="12" cy="12" r="9"/><path d="M12 8a4 4 0 1 0 4 4"/><path d="M12 12a2 2 0 1 1-2-2"/><path d="M8 12a4 4 0 0 0 8 0"/>',
    lotus:     '<path d="M12 20C7 18 4 14 4 14s3 1 5 0c-1-2 3-8 3-8s4 6 3 8c2 1 5 0 5 0s-3 4-8 6z"/><path d="M12 20V9"/>',
    girassol:  '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22M4.9 4.9l2.4 2.4M16.7 16.7l2.4 2.4M19.1 4.9l-2.4 2.4M7.3 16.7l-2.4 2.4"/>',
    folha:     '<path d="M12 21C7 16 7 8 12 3c5 5 5 13 0 18z"/><path d="M12 21V6"/>',
    folhas:    '<path d="M11 21C6 18 6 10 11 5c4 4 4 11 0 16z"/><path d="M13 21c5-3 5-11 0-16-4 4-4 11 0 16z"/>',
    ramo:      '<path d="M12 22V4"/><path d="M12 8c-2-1-4-1-5-3M12 8c2-1 4-1 5-3M12 13c-2-1-4-1-5-3M12 13c2-1 4-1 5-3M12 18c-2-1-4-1-5-3M12 18c2-1 4-1 5-3"/>',
    oliveira:  '<path d="M4 20c6-2 10-8 16-16"/><path d="M8 15a2.5 2.5 0 1 0 3-3M13 10a2.5 2.5 0 1 0 3-3M11 18a2.5 2.5 0 1 0 3-3"/>',
    trevo:     '<circle cx="9" cy="10" r="3"/><circle cx="15" cy="10" r="3"/><circle cx="12" cy="14" r="3"/><path d="M12 17v5"/>',
    samambaia: '<path d="M12 22V2"/><path d="M12 6c-2 0-3-1-4-3M12 6c2 0 3-1 4-3M12 11c-2 0-3.5-1-4.5-3M12 11c2 0 3.5-1 4.5-3M12 16c-2 0-3.5-1-4.5-3M12 16c2 0 3.5-1 4.5-3"/>',
    espiga:    '<path d="M12 22V8"/><path d="M12 8c-1.5-1-2.5-3-2-5 1.5 0 2.5 1.5 2 5zM12 8c1.5-1 2.5-3 2-5-1.5 0-2.5 1.5-2 5z"/><path d="M12 13c-2 0-3.5-1-4-3M12 13c2 0 3.5-1 4-3M12 18c-2 0-3.5-1-4-3M12 18c2 0 3.5-1 4-3"/>',
    monstera:  '<path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"/><path d="M4 20C9 18 14 13 18 8"/><path d="M9 12h3M13 9v3M11 16h3"/>',
    erva:      '<path d="M12 22c0-6-3-9-5-11M12 22c0-8 0-12 0-16M12 22c0-6 3-9 5-11"/>',
    botao:     '<path d="M12 22V12"/><path d="M12 12c-2 0-3.5-1.5-3.5-4 0-2 1.5-4 3.5-6 2 2 3.5 4 3.5 6 0 2.5-1.5 4-3.5 4z"/>',
    cerejeira: '<circle cx="12" cy="12" r="1.5"/><path d="M12 4c1.5 1 1.5 3.5 0 5-1.5-1.5-1.5-4 0-5zM19 9c-.5 1.7-2.8 2.6-4.7 1.7 1-1.8 3-2.6 4.7-1.7zM16.3 17.6c-1.8-.4-3-2.4-2.4-4.3 1.8.5 2.9 2.5 2.4 4.3zM7.7 17.6c-.5-1.8.6-3.8 2.4-4.3.6 1.9-.6 3.9-2.4 4.3zM5 9c1.7-.9 3.7-.1 4.7 1.7-1.9.9-4.2 0-4.7-1.7z"/>',
    denteleao: '<circle cx="12" cy="8" r="1"/><path d="M12 22V9"/><path d="M12 8L12 3M12 8l3-4M12 8l-3-4M12 8l5-2M12 8l-5-2M12 8l4 1.2M12 8l-4 1.2"/>',
    cacto:     '<path d="M12 22V5"/><path d="M12 12H9a2 2 0 0 1-2-2V8M12 14h3a2 2 0 0 0 2-2v-1"/><path d="M9.5 22h5"/>',
    palma:     '<path d="M12 22V8"/><path d="M12 8C8 8 5 6 4 3c3 0 5 1 8 5 3-4 5-5 8-5-1 3-4 5-8 5z"/>',
    hera:      '<path d="M6 22C6 14 10 12 12 12s6-2 6-10"/><path d="M12 12a2 2 0 1 1-2-2M18 6a2 2 0 1 1-2-2M8 17a2 2 0 1 0 2 2"/>',
    florlinha: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V4M12 14.5V20M9.5 12H4M14.5 12H20M9.8 9.8L6 6M14.2 9.8L18 6M9.8 14.2L6 18M14.2 14.2L18 18"/>',
    flor6:     '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><circle cx="6.8" cy="9" r="2.3"/><circle cx="17.2" cy="9" r="2.3"/><circle cx="6.8" cy="15" r="2.3"/><circle cx="17.2" cy="15" r="2.3"/>',
    bambu:     '<path d="M9 2v20M15 2v20"/><path d="M8 7h2M14 7h2M8 13h2M14 13h2M8 19h2M14 19h2"/>',
    trigo2:    '<path d="M12 22V6"/><path d="M12 6c0-2 1-3.5 3-4-.2 2.2-1 3.5-3 4zM12 6c0-2-1-3.5-3-4 .2 2.2 1 3.5 3 4z"/><path d="M12 12c2-.3 3.2-1.3 4-3M12 12c-2-.3-3.2-1.3-4-3M12 17c2-.3 3.2-1.3 4-3M12 17c-2-.3-3.2-1.3-4-3"/>',
    // ---- Natureza ----
    sol:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    lua:       '<path d="M17 17A7 7 0 1 1 12 5a5.5 5.5 0 0 0 5 12z"/>',
    estrela4:  '<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z"/>',
    estrela5:  '<path d="M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 17l-5.6 3 1.6-6.3-5-4.2 6.5-.5z"/>',
    floco:     '<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/><path d="M12 6l-2-2M12 6l2-2M12 18l-2 2M12 18l2 2M6 12l-2-2M6 12l-2 2M18 12l2-2M18 12l2 2"/>',
    onda:      '<path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
    gota:      '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    nuvem:     '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 17 18z"/>',
    montanha:  '<path d="M2 20l6-11 4 6 3-5 7 10z"/><path d="M6 20l4-6"/>',
    coracao:   '<path d="M12 21C6 16 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 18 16 12 21z"/>',
    faisca:    '<path d="M12 3c.5 4 1.5 6 6 6-4.5 0-5.5 2-6 6-.5-4-1.5-6-6-6 4.5 0 5.5-2 6-6z"/>',
    pena:      '<path d="M6 20C6 11 12 4 20 4c0 8-7 14-14 14z"/><path d="M6 20L18 8M11 14h4M9 17h5"/>',
    borboleta: '<path d="M12 6v12"/><path d="M12 8c-1-4-8-5-8 0 0 3 4 4 8 1zM12 8c1-4 8-5 8 0 0 3-4 4-8 1zM12 15c-1 3-6 4-6 0 0-2 3-3 6-1zM12 15c1 3 6 4 6 0 0-2-3-3-6-1z"/>',
    concha:    '<path d="M12 20C6 20 3 14 6 8s12-6 15 0c-2 0-3 1-3 3M12 20c-1-4-1-8 0-12M12 20c1-4 3-8 6-9M12 20c-2-3-4-6-6-8"/>',
    // ---- Café / comida ----
    taca:      '<path d="M8 3h8l-1 6a3 3 0 0 1-6 0z"/><path d="M12 12v7M8 21h8"/>',
    chavena:   '<path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2"/><path d="M7 5c0-1 1-1 1-2M10 5c0-1 1-1 1-2M13 5c0-1 1-1 1-2"/>',
    croissant: '<path d="M4 15c5 4 11 4 16 0"/><path d="M4 15c1-3 3-4 5-4M20 15c-1-3-3-4-5-4M9 11c1-2 3-3 6-3"/>',
    cupcake:   '<path d="M6 11h12l-1.5 8h-9z"/><path d="M6 11a3 3 0 0 1 1-5 4 4 0 0 1 8 0 3 3 0 0 1 1 5z"/>',
    gelado:    '<path d="M9 9a3 3 0 0 1 6 0"/><path d="M8 9h8l-4 12z"/><path d="M9.5 13h5M10.5 16h3"/>',
    uvas:      '<circle cx="12" cy="7" r="2"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/><circle cx="12" cy="14.5" r="2"/><path d="M12 5V3M12 3c2 0 3-1 3-1"/>',
    citrino:   '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/>',
    talheres:  '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 9v12"/><path d="M16 3c-1.5 0-2 3-2 5s.7 3 2 3v10"/>',
    graocafe:  '<ellipse cx="12" cy="12" rx="6" ry="9"/><path d="M9 5c3 4 3 10 0 14"/>',
    garrafa:   '<path d="M10 2h4v3l1 3v13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8l1-3z"/><path d="M9 12h6"/>',
    peixe:     '<path d="M3 12c3-4 9-6 13 0-4 6-10 4-13 0z"/><path d="M16 12c1-2 3-3 5-3-1 3-1 3 0 6-2 0-4-1-5-3z"/><circle cx="7" cy="11" r=".6"/>',
    // ---- Geométrico / abstrato ----
    losango:   '<path d="M12 2l7 10-7 10-7-10z"/><path d="M8 12h8M12 6v12"/>',
    florgeo:   '<circle cx="12" cy="12" r="3"/><path d="M12 9V3M12 15v6M9 12H3M15 12h6M9.5 9.5L5 5M14.5 9.5L19 5M9.5 14.5L5 19M14.5 14.5L19 19"/>',
    espiral:   '<path d="M12 12a2 2 0 0 1 2 2 4 4 0 0 1-4 4 6 6 0 0 1-6-6 8 8 0 0 1 8-8 10 10 0 0 1 10 10"/>',
    mandala:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
    arabesco:  '<path d="M3 12c3-5 6-5 9 0s6 5 9 0"/><path d="M6 12a2 2 0 1 1 4 0M14 12a2 2 0 1 0 4 0"/>',
    ponto3:    '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>'
  };

  window.ADORNOS_SVG = A;
  // Lista ordenada de ids (para a grelha do editor)
  window.ADORNOS_IDS = Object.keys(A);
  // Devolve um <svg> completo, colorido por currentColor
  window.adornoSVG = function(id, sw){
    var inner = A[id]; if(!inner) return '';
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.5) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  };
})();
