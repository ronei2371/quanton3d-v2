// Lacunas do conhecimento: perguntas que a IAQ3D nao soube responder com a base da Quanton3D.
// Elas aparecem no ADM > Conversas Bot > "Bot não soube". O ADM escreve a resposta certa e
// aprova: a conversa vira conhecimento validado (rag.js -> conversas aprovadas) e sai da lista.

export const MOTIVOS_LACUNA = {
  sem_base: 'Nada na base da Quanton3D sobre isso',
  sem_valor_oficial: 'Pediu número sem perfil/valor oficial',
  nao_soube: 'O bot disse que não sabia ou mandou para o WhatsApp',
};

// Frases que o bot usa quando nao tem a informacao (com e sem acento).
export const FRASES_SEM_RESPOSTA = /n[aã]o tenho (um )?(perfil|valor|informa[cç][aã]o|dados?) (validad|oficial|sobre|para|segur)|n[aã]o tenho um valor oficial|confirme com a equipe|n[aã]o consegui (gerar|consultar)|n[aã]o encontrei (informa|dados|perfil)|n[aã]o h[aá] (parametros|par[aâ]metros|dados|informa[cç][aã]o) (validad|oficial)/i;

// Decide se a resposta do chat e uma lacuna. Retorna o motivo ('' = respondeu com base).
export function detectarLacuna({ ragUsado = false, guarda = false, reescritaNumerica = false, resposta = '' } = {}) {
  const texto = String(resposta || '');
  if (reescritaNumerica && FRASES_SEM_RESPOSTA.test(texto)) return 'sem_valor_oficial';
  if (FRASES_SEM_RESPOSTA.test(texto)) return 'nao_soube';
  if (!ragUsado && !guarda) return 'sem_base';
  return '';
}

// Filtro do Mongo para a lista do ADM. Conversas antigas (antes do campo "lacuna") entram
// pela fonte 'deepseek' (a busca nao achou nada) ou pela frase de "nao sei" na resposta.
export function filtroLacunas() {
  return {
    aprovado: { $ne: true },
    lacunaResolvida: { $ne: true },
    clienteId: { $not: /^homologacao-/ },
    $or: [
      { lacuna: { $in: Object.keys(MOTIVOS_LACUNA) } },
      { lacuna: { $exists: false }, fonte: 'deepseek' },
      { lacuna: { $exists: false }, resposta: { $regex: FRASES_SEM_RESPOSTA } },
    ],
  };
}

// Motivo para mostrar no ADM (inclui as conversas antigas sem o campo).
export function motivoDaConversa(c = {}) {
  if (c.lacuna && MOTIVOS_LACUNA[c.lacuna]) return c.lacuna;
  if (FRASES_SEM_RESPOSTA.test(String(c.resposta || ''))) return 'nao_soube';
  if (c.fonte === 'deepseek') return 'sem_base';
  return '';
}
