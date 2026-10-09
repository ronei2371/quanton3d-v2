// Campos da galeria que podem aparecer no site publico.
// Telefone, e-mail e id do cliente NUNCA saem daqui.
// Nome e redes sociais so aparecem quando o autor autorizou a divulgacao (credito).
//
// A FOTO nao vai mais embutida na listagem. Antes cada item trazia a imagem
// inteira em base64 (~100 KB por peca, 718 KB com 7 pecas) e isso descia junto
// na Home, a cada visita, sem o navegador conseguir guardar nada em cache.
// Agora vai so o endereco (imagemUrl) e a foto vem por GET /gallery/:id/imagem,
// que o navegador baixa em paralelo, so quando precisa, e guarda.

const CAMPOS_PUBLICOS = ['_id', 'resina', 'impressora', 'observacao', 'parametros', 'createdAt'];

function textoLimpo(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Versao do endereco: muda se a foto do item for trocada, para o cache do
// navegador nao segurar a antiga. Sem data valida, cai em '1'.
function versaoDaFoto(item) {
  const data = item.updatedAt || item.createdAt;
  const ms = data ? new Date(data).getTime() : 0;
  return Number.isFinite(ms) && ms > 0 ? String(ms) : '1';
}

export function itemPublicoGaleria(item = {}) {
  const publico = {};
  CAMPOS_PUBLICOS.forEach((campo) => {
    if (item[campo] !== undefined) publico[campo] = item[campo];
  });

  // 'temImagem' vem da listagem, que nem carrega o base64 do banco.
  // Quando o objeto ainda traz 'imagem' (teste, ADM), vale o proprio campo.
  const temFoto = item.temImagem === true
    || (typeof item.imagem === 'string' && item.imagem.length > 0);
  if (temFoto && item._id) {
    publico.imagemUrl = `/gallery/${String(item._id)}/imagem?v=${versaoDaFoto(item)}`;
  }

  if (item.autorizaDivulgacao === true) {
    const redes = item.redesSociais || {};
    const creditoRedes = {};
    ['instagram', 'tiktok', 'facebook', 'youtube'].forEach((rede) => {
      const valor = textoLimpo(redes[rede]);
      if (valor) creditoRedes[rede] = valor;
    });
    const nome = textoLimpo(item.nome);
    if (nome) publico.autor = nome;
    if (Object.keys(creditoRedes).length > 0) publico.redesSociais = creditoRedes;
  }

  return publico;
}

export default itemPublicoGaleria;
