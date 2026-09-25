/* ÀMesa · Stories — Fase 1
   Templates definidos como DADOS (não código). O motor (story-render.js) lê estes
   objetos e desenha a composição 9:16. Para adicionar templates no futuro basta
   acrescentar objetos a este array — sem mexer no motor. */
window.STORY_TEMPLATES = [
  {
    id: 'promocao01',
    nome: 'PROMOÇÃO 01',
    badge: 'PROMOÇÃO',              // etiqueta no topo (pode ser sobreposta pela app)
    // De onde vêm as cores (chaves de config.aparencia). Se não existirem, usa os fallbacks.
    corAccentKeys: ['destaque', 'precos'],
    corTituloKeys: [],              // título fica sempre branco sobre a foto
    // Fallbacks elegantes (usados quando não há foto / não há aparencia)
    fallback: { bg1: '#2a1d10', bg2: '#a8712f', accent: '#e0245e', texto: '#ffffff' },
    // Intensidade do escurecimento sobre a foto (0–1) para o texto ser legível
    escurecer: 0.55
  }
];
