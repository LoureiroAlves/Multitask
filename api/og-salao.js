// 4 Trevo — pré-visualização dos links dos salões (WhatsApp, Facebook, Instagram, Telegram…)
// Só é chamada para os "robôs" dessas apps, nos endereços 4trevo (regra no vercel.json). As pessoas abrem a página normal.
// Devolve uma página pequena com o nome, a frase e a foto/logótipo do salão nas etiquetas og:*.
// Os restaurantes (àMesa) continuam a usar o api/og.js, que não muda.

const SUPA_URL = 'https://zewiijcrkyxjkhudlplk.supabase.co';
const SUPA_KEY = 'sb_publishable_6LP7x2v5c-c9DQkQslnUmA_g13SEjp3';
const IMG_PADRAO = '/icon-trevo-512.png';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function ok(u) { return typeof u === 'string' && /^https:\/\//.test(u) && !/\.(mp4|webm|mov)(\?|$)/i.test(u); }

module.exports = async (req, res) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '4trevo.com').replace(/[^a-z0-9.\-:]/gi, '');
  const origem = 'https://' + host;
  const url = new URL(req.url, origem);
  const slug = String(url.searchParams.get('slug') || url.searchParams.get('n') || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const destino = origem + '/' + slug;

  let nome = '', frase = '', foto = '', logo = '';
  if (slug) {
    try {
      const r = await fetch(SUPA_URL + '/rest/v1/negocios?slug=eq.' + slug + '&select=nome,config&limit=1', {
        headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY },
      });
      const arr = r.ok ? await r.json() : [];
      const n = arr && arr[0];
      if (n) {
        const s = (n.config && n.config.salao) || {};
        nome = s.nome || n.nome || '';
        frase = s.frase || '';
        logo = ok(s.logo) ? ((ok(s.logoQ) && s.logoQde === s.logo) ? s.logoQ : s.logo) : '';
        const capas = Array.isArray(s.capas) ? s.capas.filter(ok) : [];
        foto = (s.fundo && s.fundo.tipo !== 'video' && ok(s.fundo.url)) ? s.fundo.url : (capas[0] || '');
      }
    } catch (e) { /* sem ligação: usa o genérico */ }
  }

  const titulo = nome ? (nome + ' · Marcações') : 'Marcações online';
  const desc = (frase ? (frase + ' — ') : '') + 'Veja os serviços e marque online.';
  const img = logo || foto || (origem + IMG_PADRAO);   // o logótipo do salão primeiro

  const html = '<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8">'
    + '<title>' + esc(titulo) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '">'
    + '<meta property="og:site_name" content="' + esc(nome || '4 Trevo') + '"><meta property="og:type" content="website"><meta property="og:locale" content="pt_PT">'
    + '<meta property="og:title" content="' + esc(titulo) + '">'
    + '<meta property="og:description" content="' + esc(desc) + '">'
    + '<meta property="og:url" content="' + esc(destino) + '">'
    + '<meta property="og:image" content="' + esc(img) + '">'
    + '<meta name="twitter:card" content="' + (img === logo ? 'summary' : 'summary_large_image') + '">'
    + '<meta http-equiv="refresh" content="0; url=' + esc(destino) + '">'
    + '</head><body><a href="' + esc(destino) + '">' + esc(titulo) + '</a></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
};
