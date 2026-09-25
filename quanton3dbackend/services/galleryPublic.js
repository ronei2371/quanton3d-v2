// Campos da galeria que podem aparecer no site publico.
// Telefone, e-mail e id do cliente NUNCA saem daqui.
// Nome e redes sociais so aparecem quando o autor autorizou a divulgacao (credito).

const CAMPOS_PUBLICOS = ['_id', 'resina', 'impressora', 'imagem', 'observacao', 'parametros', 'createdAt'];

function textoLimpo(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function itemPublicoGaleria(item = {}) {
  const publico = {};
  CAMPOS_PUBLICOS.forEach((campo) => {
    if (item[campo] !== undefined) publico[campo] = item[campo];
  });

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
