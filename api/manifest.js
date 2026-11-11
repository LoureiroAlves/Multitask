// 4 Trevo (Multitask) — ficha da app instalável de cada negócio que não é da àMesa (ex.: salões).
// /api/manifest?n=<slug>        → app do cliente (abre salao.html?n=<slug>)
// /api/manifest?n=<slug>&g=1    → app da gestão (abre salao-gestao.html?n=<slug>)
// Nome = nome do negócio; ícone = trevo de 4 folhas. Lê só dados públicos, com a chave pública do Supabase.

const SUPA_URL = 'https://zewiijcrkyxjkhudlplk.supabase.co';
const SUPA_KEY = 'sb_publishable_6LP7x2v5c-c9DQkQslnUmA_g13SEjp3';

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://amesadigital.pt');
  const slug = String(url.searchParams.get('n') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const gestao = url.searchParams.get('g') === '1';
  let nome = '', cor = '#2E7D52';
  if (slug) {
    try {
      const r = await fetch(SUPA_URL + '/rest/v1/negocios?slug=eq.' + slug + '&select=nome,config&limit=1', {
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
      });
      const arr = r.ok ? await r.json() : [];
      const n = arr && arr[0];
      if (n) {
        const s = (n.config && n.config.salao) || {};
        nome = String(s.nome || n.nome || '').slice(0, 60);
        if (/^#[0-9a-fA-F]{6}$/.test(s.cor || '')) cor = s.cor;
      }
    } catch (e) { /* sem ligação: segue com o nome da marca */ }
  }
  const base = nome || '4 Trevo';
  const pagina = gestao ? '/salao-gestao.html' : '/salao.html';
  const manifest = {
    name: gestao ? (base + ' · Gestão') : base,
    short_name: (gestao ? ('Gestão ' + base) : base).slice(0, 24),
    description: gestao ? 'Agenda e marcações do negócio.' : 'Serviços e marcações.',
    id: pagina + (slug ? ('?n=' + slug) : ''),
    start_url: pagina + (slug ? ('?n=' + slug) : ''),
    scope: '/',
    display: 'standalone',
    background_color: '#F6F4F2',
    theme_color: cor,
    icons: [
      { src: '/icon-trevo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-trevo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-trevo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(JSON.stringify(manifest));
};
