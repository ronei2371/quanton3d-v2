// Memoria do equipamento do cliente: a IAQ3D lembra a resina, a impressora e a altura de
// camada que o cliente usou na ultima conversa (fica no cadastro do Cliente). Na proxima
// vez o chat ja abre com essa configuracao (o cliente ve e pode trocar em "Alterar").

const NAO_INFORMADO = /^(n[aã]o informad[ao]|n[aã]o sei.*|outra|-)?$/i;

function limpar(valor) {
  const v = String(valor || '').replace(/\*/g, '').trim();
  return NAO_INFORMADO.test(v) ? '' : v.slice(0, 80);
}

// Le a mensagem "Contexto: resina X, impressora Y, altura camada Zmm" que o site envia.
export function lerContexto(historico = []) {
  const lista = Array.isArray(historico) ? historico : [];
  const msg = lista.find((m) => m && m.role === 'user' && /^Contexto:/i.test(String(m.content || '')));
  if (!msg) return {};
  const t = String(msg.content);
  const resina = t.match(/resina\s+(.+?),\s*impressora/i)?.[1];
  const impressora = t.match(/impressora\s+(.+?),\s*altura/i)?.[1];
  const altura = t.match(/altura\s+camada\s+([\d.,]+)\s*mm/i)?.[1];
  return { resina: limpar(resina), impressora: limpar(impressora), altura: limpar(altura).replace(',', '.') };
}

function normalizar(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// Monta o $set do Cliente. So grava o que foi informado/detectado (nunca apaga o que ja tinha).
export function dadosEquipamento({ contexto = {}, resinaDetectada = '', impressoraDetectada = '' } = {}) {
  const set = {};
  const resina = limpar(resinaDetectada) || contexto.resina;
  if (resina) set.resinaAtual = resina;

  // Impressora: prefere o nome escolhido na lista do site (vem com maiusculas certas);
  // se o cliente falou de outra impressora na conversa, grava a detectada.
  const doContexto = limpar(contexto.impressora);
  const detectada = limpar(impressoraDetectada);
  let impressora = doContexto;
  if (detectada && (!doContexto || !normalizar(doContexto).includes(normalizar(detectada)))) impressora = detectada;
  if (impressora) set.impressoraAtual = impressora;

  if (contexto.altura && /^\d+(\.\d+)?$/.test(contexto.altura)) set.alturaAtual = contexto.altura;
  if (Object.keys(set).length) set.equipamentoEm = new Date();
  return set;
}

// Para o GET /chat/historico: usa o cadastro; se ainda nao tiver, procura nas conversas.
export function equipamentoParaResposta(cliente = {}, conversas = []) {
  let resina = cliente?.resinaAtual || '';
  let impressora = cliente?.impressoraAtual || '';
  const altura = cliente?.alturaAtual || '';
  for (const c of [...conversas].reverse()) {
    if (!resina && c.resinaDetectada) resina = c.resinaDetectada;
    if (!impressora && c.impressoraDetectada) impressora = c.impressoraDetectada;
    if (resina && impressora) break;
  }
  return resina || impressora ? { resina, impressora, altura } : null;
}
