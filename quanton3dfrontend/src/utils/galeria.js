// Endereco da foto de uma peca da galeria.
//
// Antes a listagem publica (GET /api/gallery) trazia a imagem inteira em base64
// dentro do JSON: 7 pecas davam ~718 KB, baixados de novo a cada visita, porque
// base64 embutido no JSON o navegador nao consegue guardar em cache.
// Agora a listagem manda so o endereco (imagemUrl) e a foto vem por
// GET /gallery/:id/imagem, que o navegador baixa em paralelo, so quando aparece
// na tela, e guarda.
//
// A ordem aqui importa: 'imagem' vem primeiro porque o ADM continua recebendo o
// base64 (rota /gallery/admin) e porque, enquanto o backend novo nao sobe, a
// listagem publica ainda manda o campo antigo.

const BASE = String(import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

export function urlDaFoto(item) {
  if (!item) return "";
  if (item.imagem) return item.imagem;
  return item.imagemUrl ? `${BASE}${item.imagemUrl}` : "";
}

export function temFoto(item) {
  return Boolean(item && (item.imagem || item.imagemUrl));
}
