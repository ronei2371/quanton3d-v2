// Controle de uso da IA do bot: limite diario de perguntas por cliente e custo estimado.
// Regra do Ronei (26/09): 15 perguntas respondidas pela IA por dia, por cliente.
// Respostas fixas (saudacao, gabarito, mistura, WhatsApp...) nao gastam IA e nao contam.

import Conversa from '../models/Conversa.js';

export const LIMITE_DIARIO = Math.max(1, Number.parseInt(process.env.BOT_LIMITE_DIARIO, 10) || 15);
// Protecao extra por IP (quem troca de cadastro para burlar). Alto para nao atrapalhar
// varias pessoas na mesma rede (loja, laboratorio).
export const LIMITE_POR_IP = Math.max(LIMITE_DIARIO, Number.parseInt(process.env.BOT_LIMITE_IP, 10) || 100);

export const FONTES_SEM_IA = ['rules'];

// Meia-noite de hoje no horario de Brasilia (America/Sao_Paulo, UTC-3 sem horario de verao).
export function inicioDoDiaBrasil(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(agora).split('-').map(Number);
  return new Date(Date.UTC(partes[0], partes[1] - 1, partes[2], 3, 0, 0));
}

export function inicioDoMesBrasil(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' })
    .format(agora).split('-').map(Number);
  return new Date(Date.UTC(partes[0], partes[1] - 1, 1, 3, 0, 0));
}

export async function perguntasHoje(clienteId) {
  if (!clienteId) return 0;
  return Conversa.countDocuments({
    clienteId: String(clienteId),
    fonte: { $nin: FONTES_SEM_IA },
    createdAt: { $gte: inicioDoDiaBrasil() },
  });
}

// Contador em memoria por IP (zera todo dia e a cada novo deploy; e so uma rede de seguranca).
const usoPorIp = new Map();
function chaveDia() { return inicioDoDiaBrasil().toISOString().slice(0, 10); }

export function usoDoIp(ip) {
  const reg = usoPorIp.get(ip);
  return reg && reg.dia === chaveDia() ? reg.total : 0;
}

export function registrarUsoIp(ip) {
  if (!ip) return;
  const dia = chaveDia();
  const reg = usoPorIp.get(ip);
  if (!reg || reg.dia !== dia) usoPorIp.set(ip, { dia, total: 1 });
  else reg.total += 1;
  if (usoPorIp.size > 20000) usoPorIp.clear();
}

export function mensagemLimite(max = LIMITE_DIARIO) {
  return `Você chegou ao limite de **${max} perguntas por dia** do assistente. Amanhã o limite volta ao normal.\n\n`
    + 'Se precisar de ajuda agora, toque em **Continuar no WhatsApp**, logo abaixo da conversa: a equipe recebe o resumo do que você já perguntou e continua de onde parou.';
}

// Custo estimado. Precos em US$ por milhao de tokens (ajustaveis no Render sem mexer no codigo).
// Padrao: DeepSeek V4 Flash em horario de pico (fora do pico sai pela metade). Valor exato: painel da DeepSeek.
export const PRECOS = {
  entrada: Number(process.env.IA_PRECO_ENTRADA_USD) || 0.30,
  cache: Number(process.env.IA_PRECO_CACHE_USD) || 0.03,
  saida: Number(process.env.IA_PRECO_SAIDA_USD) || 1.20,
  dolar: Number(process.env.IA_DOLAR_BRL) || 5.2,
};

export function custoEmDolar({ tokensEntrada = 0, tokensCache = 0, tokensSaida = 0 } = {}, precos = PRECOS) {
  const semCache = Math.max(0, tokensEntrada - tokensCache);
  return (semCache * precos.entrada + tokensCache * precos.cache + tokensSaida * precos.saida) / 1e6;
}

export function somarUso(...usos) {
  return usos.filter(Boolean).reduce((acc, u) => ({
    tokensEntrada: acc.tokensEntrada + (Number(u.prompt_tokens) || 0),
    tokensCache: acc.tokensCache + (Number(u.prompt_cache_hit_tokens) || Number(u.prompt_tokens_details?.cached_tokens) || 0),
    tokensSaida: acc.tokensSaida + (Number(u.completion_tokens) || 0),
  }), { tokensEntrada: 0, tokensCache: 0, tokensSaida: 0 });
}

export async function resumoCustoIA(desde) {
  const [r] = await Conversa.aggregate([
    { $match: { createdAt: { $gte: desde }, fonte: { $nin: FONTES_SEM_IA } } },
    { $group: {
      _id: null,
      mensagens: { $sum: 1 },
      tokensEntrada: { $sum: { $ifNull: ['$tokensEntrada', 0] } },
      tokensCache: { $sum: { $ifNull: ['$tokensCache', 0] } },
      tokensSaida: { $sum: { $ifNull: ['$tokensSaida', 0] } },
      comTokens: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$tokensEntrada', 0] }, 0] }, 1, 0] } },
    } },
  ]);
  const base = r || { mensagens: 0, tokensEntrada: 0, tokensCache: 0, tokensSaida: 0, comTokens: 0 };
  const usd = custoEmDolar(base);
  // Mensagens antigas (antes de 26/09) nao tem tokens gravados: estima pela media das que tem.
  const semTokens = base.mensagens - base.comTokens;
  const mediaUsd = base.comTokens ? usd / base.comTokens : 0;
  const totalUsd = usd + semTokens * mediaUsd;
  return {
    mensagens: base.mensagens,
    tokensEntrada: base.tokensEntrada,
    tokensCache: base.tokensCache,
    tokensSaida: base.tokensSaida,
    custoUSD: Number(totalUsd.toFixed(4)),
    custoBRL: Number((totalUsd * PRECOS.dolar).toFixed(2)),
  };
}
