import Conversa from '../models/Conversa.js';
import Parametro from '../models/Parametro.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';
import EXTERNAL_KNOWLEDGE from './externalKnowledge.js';
import KNOWLEDGE_BASE from './knowledge.js';
import {
  buildPriorityContext,
  formatParameter,
  getRagMinRelevance,
  normalizeText,
  rankDocuments,
  splitKnowledgeBase,
  tokenize,
} from './ragRanking.js';

const RESINAS_MAP = {
  'athom alinhadores': 'ATHOM ALINHADORES',
  'athom alinhador': 'ATHOM ALINHADORES',
  'athom washable': 'ATHOM WASHABLE',
  'athom dental': 'ATHOM DENTAL',
  'velvet skin': 'VELVET SKIN',
  'vulcan cast': 'VULCAN CAST',
  'iron 70/30': 'IRON 70/30',
  'iron 70': 'IRON 70/30',
  'low smell': 'LOW SMELL',
  'lowsmell': 'LOW SMELL',
  'alchemist': 'ALCHEMIST',
  'flexform': 'FLEXFORM',
  'pyroblast': 'PYROBLAST',
  'poseidon': 'POSEIDON',
  '70/30': 'IRON 70/30',
  '7030': 'IRON 70/30',
  'vulcan': 'VULCAN CAST',
  'velvet': 'VELVET SKIN',
  'athom': 'ATHOM',
  'spark': 'SPARK',
  'spin': 'SPIN',
  'iron': 'IRON',
};

const IMPRESSORAS = [
  'uniformation gktwo',
  'photon mono m3 premium', 'photon mono m3 plus', 'photon mono x 6k',
  'photon mono m5s', 'photon mono m5', 'photon mono m3', 'photon mono 4k',
  'photon mono x', 'photon mono 2', 'photon mono', 'photon m5s', 'photon m5',
  'photon ultra', 'photon',
  'saturn 4 ultra', 'saturn 3 ultra', 'saturn 4', 'saturn 3', 'saturn 2',
  'saturn s', 'saturn',
  'mars 4 ultra', 'mars 4', 'mars 3', 'mars 2', 'mars pro', 'mars',
  'sonic mega 8k', 'sonic mini 8k', 'sonic mini 4k', 'sonic mini', 'sonic',
  'halot one pro', 'halot one plus', 'halot one', 'halot sky', 'halot max', 'halot',
  'ld-006', 'ld-002r', 'ld-002h', 'ld-002',
  'uniformation', 'proxima', 'voxelab',
  'anycubic', 'elegoo', 'phrozen', 'creality',
].sort((a, b) => b.length - a.length);

const GENERIC_PRINTER_NAMES = new Set([
  'anycubic', 'elegoo', 'phrozen', 'creality', 'uniformation', 'voxelab',
  'photon', 'mars', 'saturn', 'sonic', 'halot',
]);

const GENERIC_RESIN_NAMES = new Set(['ATHOM']);

const LEGACY_DOCUMENTS = splitKnowledgeBase(KNOWLEDGE_BASE);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function queryWithHistory(message, history = []) {
  if (tokenize(message).length >= 2) return message;
  const recentUserMessages = Array.isArray(history)
    ? history
      .filter((item) => item?.role === 'user' && item?.content)
      .slice(-1)
      .map((item) => item.content)
    : [];
  return [...recentUserMessages, message].filter(Boolean).join(' ');
}

export function detectResin(text = '') {
  const normalized = normalizeText(text);
  const match = Object.keys(RESINAS_MAP)
    .sort((a, b) => b.length - a.length)
    .find((alias) => normalized.includes(normalizeText(alias)));
  return match ? RESINAS_MAP[match] : '';
}

export function detectPrinter(text = '') {
  const normalized = normalizeText(text);
  return IMPRESSORAS.find((printer) => normalized.includes(normalizeText(printer))) || '';
}

export function extractEntities(message, history = []) {
  const currentResin = detectResin(message);
  const currentPrinter = detectPrinter(message);
  const historyText = Array.isArray(history) ? history.map((item) => item?.content || '').join(' ') : '';
  return {
    resin: currentResin || detectResin(historyText),
    printer: currentPrinter || detectPrinter(historyText),
  };
}

async function retrieveOfficialParameters(resin, printer) {
  if (!resin && !printer) return { context: '', guardInstruction: '', found: false };

  if (GENERIC_RESIN_NAMES.has(resin)) {
    return {
      context: '',
      guardInstruction: 'O cliente informou apenas a familia ATHOM. Pergunte qual produto exato ele usa: ATHOM DENTAL, ATHOM ALINHADORES ou ATHOM WASHABLE. Nao forneca parametros antes dessa confirmacao.',
      found: false,
    };
  }

  if (resin && (!printer || GENERIC_PRINTER_NAMES.has(printer))) {
    return {
      context: '',
      guardInstruction: `O cliente mencionou a resina ${resin}, mas nao informou o modelo exato da impressora. Pergunte apenas qual e o modelo exato antes de fornecer parametros. Nao invente nem liste parametros de outras impressoras.`,
      found: false,
    };
  }

  if (!resin && printer) {
    return {
      context: '',
      guardInstruction: `O cliente informou a impressora ${printer.toUpperCase()}, mas nao informou a resina Quanton3D. Pergunte qual resina ele usa antes de fornecer parametros.`,
      found: false,
    };
  }

  const query = {
    resina: { $regex: `^${escapeRegex(resin)}$`, $options: 'i' },
    impressora: { $regex: `^${escapeRegex(printer)}(?:\\s|$)`, $options: 'i' },
  };

  const parameters = await Parametro.find(query).limit(5).lean();
  if (!parameters.length) {
    return {
      context: '',
      guardInstruction: `Nao ha parametro oficial cadastrado para ${resin} + ${printer.toUpperCase()}. Informe isso claramente e indique o WhatsApp (31) 3271-6935. Nao improvise valores.`,
      found: false,
    };
  }

  return {
    context: parameters.map(formatParameter).filter(Boolean).join('\n'),
    guardInstruction: '',
    found: true,
  };
}

async function retrieveApprovedConversations(query, options) {
  const conversations = await Conversa.find({ aprovado: true })
    .sort({ updatedAt: -1 })
    .limit(200)
    .select('pergunta resposta respostaMelhorada resinaDetectada impressoraDetectada updatedAt')
    .lean();

  const documents = conversations
    .map((conversation) => ({
      id: String(conversation._id),
      title: conversation.pergunta,
      content: conversation.respostaMelhorada || conversation.resposta,
      source: 'conversa_aprovada',
    }))
    .filter((document) => document.title && document.content);

  return rankDocuments(query, documents, options);
}

async function retrieveApprovedSuggestions(query, options) {
  const suggestions = await SugestaoConhecimento.find({ status: 'aprovado' })
    .sort({ updatedAt: -1 })
    .limit(200)
    .select('categoria titulo conteudo updatedAt')
    .lean();

  const documents = suggestions.map((suggestion) => ({
    id: String(suggestion._id),
    title: `[${suggestion.categoria}] ${suggestion.titulo}`,
    content: suggestion.conteudo,
    source: 'sugestao_aprovada',
  }));

  return rankDocuments(query, documents, options);
}

export async function retrieveRagContext(message, history = []) {
  const query = queryWithHistory(message, history);
  const { resin, printer } = extractEntities(message, history);
  const threshold = getRagMinRelevance();
  const limit = Math.min(5, Math.max(1, Number.parseInt(process.env.RAG_MAX_RESULTS, 10) || 3));
  const rankingOptions = { threshold, limit, entity: resin };

  const [official, approvedConversations, approvedSuggestions] = await Promise.all([
    retrieveOfficialParameters(resin, printer).catch((error) => {
      console.error('[RAG-WARN] Falha ao consultar parametros oficiais:', error.message);
      return { context: '', guardInstruction: '', found: false };
    }),
    retrieveApprovedConversations(query, rankingOptions).catch((error) => {
      console.error('[RAG-WARN] Falha ao consultar conversas aprovadas:', error.message);
      return [];
    }),
    retrieveApprovedSuggestions(query, rankingOptions).catch((error) => {
      console.error('[RAG-WARN] Falha ao consultar sugestoes aprovadas:', error.message);
      return [];
    }),
  ]);
  const externalDocuments = rankDocuments(query, EXTERNAL_KNOWLEDGE, rankingOptions);
  const legacyDocuments = rankDocuments(query, LEGACY_DOCUMENTS, rankingOptions);

  const context = buildPriorityContext({
    parameterContext: official.context,
    approvedConversations,
    approvedSuggestions,
    externalDocuments,
    legacyDocuments,
  });

  const sources = [
    ...(official.found ? ['parametros_oficiais'] : []),
    ...(approvedConversations.length ? ['conversas_aprovadas'] : []),
    ...(approvedSuggestions.length ? ['sugestoes_aprovadas'] : []),
    ...(externalDocuments.length ? ['base_externa_curada'] : []),
    ...(legacyDocuments.length ? ['base_tecnica'] : []),
  ];

  console.log('[RAG-INFO]', JSON.stringify({
    threshold,
    resin: resin || null,
    printer: printer || null,
    sources,
    results: {
      conversations: approvedConversations.length,
      suggestions: approvedSuggestions.length,
      external: externalDocuments.length,
      legacy: legacyDocuments.length,
      officialParameters: official.found ? 1 : 0,
    },
  }));

  return {
    context,
    guardInstruction: official.guardInstruction,
    used: sources.length > 0,
    sources,
    resin,
    printer,
    threshold,
  };
}
