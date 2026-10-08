// àMesa — pré-visualização dos links de cada restaurante (WhatsApp, Facebook, Instagram, Telegram…)
// Só é chamada para os "robôs" dessas apps (regra no vercel.json). As pessoas continuam a abrir o menu normal.
// Devolve uma página pequena com o nome e a foto do restaurante nas etiquetas og:*.
// Usa só a chave pública do Supabase (a mesma que está no site) e lê só dados públicos do menu.

const SUPA_URL = 'https://zewiijcrkyxjkhudlplk.supabase.co';
const SUPA_KEY = 'sb_publishable_6LP7x2v5c-c9DQkQslnUmA_g13SEjp3';
const IMG_PADRAO = 'https://amesadigital.pt/og-amesa.png';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://amesadigital.pt');
  const slug = String(url.searchParams.get('slug') || url.searchParams.get('n') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const convite = url.searchParams.get('convite');
  const destino = 'https://amesadigital.pt/' + (slug || '') + (convite ? ('?convite=' + encodeURIComponent(convite)) : '');

  let nome = '', foto = '', frase = '';
  if (slug) {
    try {
      const r = await fetch(SUPA_URL + '/rest/v1/negocios?slug=eq.' + slug + '&select=nome,config&limit=1', {
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
      });
      const arr = r.ok ? await r.json() : [];
      const n = arr && arr[0];
      if (n) {
        const h = (n.config && n.config.header) || {};
        nome = n.nome || h.titulo || '';
        frase = h.subtitulo || h.frase || '';
        const fotos = Array.isArray(h.fotos) ? h.fotos : [];
        foto = fotos.find((f) => /^https:\/\//.test(String(f)) && !/\.(mp4|webm|mov)(\?|$)/i.test(String(f))) || '';
      }
    } catch (e) { /* sem ligação: usa o genérico */ }
  }

  const titulo = convite
    ? ('🥚 Foste convidado para a caça ao ovo' + (nome ? (' no ' + nome) : '') + '!')
    : (nome ? (nome + ' · Menu digital') : 'àMesa — a tua mesa está à espera');
  const desc = convite
    ? 'Inscreve-te no menu e procura o ovo escondido. Só jogam os inscritos.'
    : (frase ? (frase + ' — vê o menu, reserva mesa e encomenda pelo telemóvel.') : 'Vê o menu, reserva mesa e encomenda pelo telemóvel — sem esperas.');
  const img = foto || IMG_PADRAO;

  const html = '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">'
    + '<title>' + esc(titulo) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '">'
    + '<meta property="og:site_name" content="àMesa"><meta property="og:type" content="website"><meta property="og:locale" content="pt_PT">'
    + '<meta property="og:title" content="' + esc(titulo) + '">'
    + '<meta property="og:description" content="' + esc(desc) + '">'
    + '<meta property="og:url" content="' + esc(destino) + '">'
    + '<meta property="og:image" content="' + esc(img) + '">'
    + (img === IMG_PADRAO ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : '')
    + '<meta name="twitter:card" content="summary_large_image">'
    + '<meta http-equiv="refresh" content="0; url=' + esc(destino) + '">'
    + '</head><body><a href="' + esc(destino) + '">' + esc(titulo) + '</a></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
};
