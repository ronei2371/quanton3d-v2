// Controle de uso da IA do bot: limite diario de perguntas por cliente e custo estimado.
// Regra do Ronei (26/09): 15 perguntas respondidas pela IA por dia, por cliente.
// Respostas fixas (saudacao, gabarito, mistura, WhatsApp...) nao gastam IA e nao contam.

import Conversa from '../models/Conversa.js';
import UsoIAAdmin from '../models/UsoIAAdmin.js';

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

// Custo estimado. Precos em US$ por milhao de tokens do deepseek-flash.
// A DeepSeek cobra METADE fora do horario de pico. Pico: 01:00-04:00 e 06:00-10:00 UTC,
// de segunda a sexta (no Brasil: 22h-01h e 03h-07h). Todo o resto - inclusive o horario
// comercial brasileiro, noites e fins de semana - sai pela metade.
// Fonte: api-docs.deepseek.com/quick_start/pricing. Ajustaveis no Render sem mexer no codigo.
export const PRECOS_PICO = {
  entrada: Number(process.env.IA_PRECO_ENTRADA_USD) || 0.30,
  cache: Number(process.env.IA_PRECO_CACHE_USD) || 0.006,
  saida: Number(process.env.IA_PRECO_SAIDA_USD) || 1.20,
};

export const PRECOS_FORA_PICO = {
  entrada: Number(process.env.IA_PRECO_ENTRADA_OFF_USD) || 0.15,
  cache: Number(process.env.IA_PRECO_CACHE_OFF_USD) || 0.003,
  saida: Number(process.env.IA_PRECO_SAIDA_OFF_USD) || 0.60,
};

export const DOLAR = Number(process.env.IA_DOLAR_BRL) || 5.2;

// Formato antigo, que o painel ADM le para mostrar os precos no rodape.
export const PRECOS = { ...PRECOS_PICO, dolar: DOLAR, foraPico: PRECOS_FORA_PICO };

// Feriado chines tambem e fora de pico, mas nao da para saber quais sao daqui:
// nesses poucos dias a estimativa fica um pouco ACIMA do real, nunca abaixo.
export function ehHorarioPico(data = new Date()) {
  const d = data instanceof Date ? data : new Date(data);
  if (Number.isNaN(d.getTime())) return true;
  const diaSemana = d.getUTCDay(); // 0 = domingo, 6 = sabado
  if (diaSemana === 0 || diaSemana === 6) return false;
  const h = d.getUTCHours();
  return (h >= 1 && h < 4) || (h >= 6 && h < 10);
}

export function precosDe(data) {
  return ehHorarioPico(data) ? PRECOS_PICO : PRECOS_FORA_PICO;
}

export function custoEmDolar({ tokensEntrada = 0, tokensCache = 0, tokensSaida = 0 } = {}, precos = PRECOS_PICO) {
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

// Grava o gasto de um botao "sugerir" do ADM. Nunca derruba a rota que chamou:
// se falhar, so perde a contagem daquele clique.
export async function registrarUsoAdmin(origem, usage, usuario = '') {
  try {
    const tokens = somarUso(usage);
    if (!tokens.tokensEntrada && !tokens.tokensSaida) return;
    await UsoIAAdmin.create({ origem, usuario: String(usuario || ''), ...tokens });
  } catch (err) {
    console.error('[USO IA ADM]', err.message);
  }
}

// Separa os tokens em dois baldes - pico e fora de pico - direto no banco,
// pelo horario UTC de cada registro, para cada balde usar o seu preco.
const BALDE_PICO = {
  $let: {
    vars: { dia: { $dayOfWeek: '$createdAt' }, h: { $hour: '$createdAt' } },
    in: {
      $and: [
        { $gt: ['$$dia', 1] }, { $lt: ['$$dia', 7] }, // segunda a sexta
        { $or: [
          { $and: [{ $gte: ['$$h', 1] }, { $lt: ['$$h', 4] }] },
          { $and: [{ $gte: ['$$h', 6] }, { $lt: ['$$h', 10] }] },
        ] },
      ],
    },
  },
};

function agruparPorHorario(Model, desde, filtro = {}) {
  return Model.aggregate([
    { $match: { createdAt: { $gte: desde }, ...filtro } },
    { $group: {
      _id: BALDE_PICO,
      mensagens: { $sum: 1 },
      tokensEntrada: { $sum: { $ifNull: ['$tokensEntrada', 0] } },
      tokensCache: { $sum: { $ifNull: ['$tokensCache', 0] } },
      tokensSaida: { $sum: { $ifNull: ['$tokensSaida', 0] } },
      comTokens: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$tokensEntrada', 0] }, 0] }, 1, 0] } },
    } },
  ]);
}

function somarBaldes(linhas) {
  return linhas.reduce((acc, g) => {
    acc.usd += custoEmDolar(g, g._id ? PRECOS_PICO : PRECOS_FORA_PICO);
    acc.mensagens += g.mensagens;
    acc.comTokens += g.comTokens;
    acc.tokensEntrada += g.tokensEntrada;
    acc.tokensCache += g.tokensCache;
    acc.tokensSaida += g.tokensSaida;
    return acc;
  }, { usd: 0, mensagens: 0, comTokens: 0, tokensEntrada: 0, tokensCache: 0, tokensSaida: 0 });
}

export async function resumoCustoIA(desde) {
  const [linhasBot, linhasAdm] = await Promise.all([
    agruparPorHorario(Conversa, desde, { fonte: { $nin: FONTES_SEM_IA } }),
    agruparPorHorario(UsoIAAdmin, desde).catch(() => []),
  ]);

  const bot = somarBaldes(linhasBot);
  const adm = somarBaldes(linhasAdm);

  // Conversas antigas (antes de 26/09) nao tem tokens gravados: estima pela media das que tem.
  const semTokens = Math.max(0, bot.mensagens - bot.comTokens);
  const mediaUsd = bot.comTokens ? bot.usd / bot.comTokens : 0;
  const totalUsd = bot.usd + adm.usd + semTokens * mediaUsd;

  return {
    mensagens: bot.mensagens,
    chamadasAdm: adm.mensagens,
    estimadas: semTokens,
    tokensEntrada: bot.tokensEntrada + adm.tokensEntrada,
    tokensCache: bot.tokensCache + adm.tokensCache,
    tokensSaida: bot.tokensSaida + adm.tokensSaida,
    custoUSD: Number(totalUsd.toFixed(4)),
    custoBRL: Number((totalUsd * DOLAR).toFixed(2)),
  };
}
