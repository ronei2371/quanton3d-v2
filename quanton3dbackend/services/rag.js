import Conversa from '../models/Conversa.js';
import Parametro from '../models/Parametro.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';
import { problemasPerfil } from '../controllers/parametrosController.js';
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

// Apelidos que o cliente digita -> nome canonico da resina.
// O nome canonico e depois resolvido para o nome gravado no MongoDB (ex.: SPIN -> SPIN+, LOW SMELL -> LOWSMELL).
const RESINAS_MAP = {
'athom alinhadores': 'ATHOM ALINHADORES',
'athom alinhador': 'ATHOM ALINHADORES',
'athom washable': 'ATHOM WASHABLE',
'athom dental': 'ATHOM DENTAL',
'athom gengiva': 'ATHOM GENGIVA',
'velvet skin': 'VELVET SKIN',
'vulcan cast': 'VULCAN CAST',
'iron 70/30': 'IRON 70/30',
'iron 7030': 'IRON 70/30',
'iron 70': 'IRON 70/30',
'low smell': 'LOW SMELL',
'lowsmell': 'LOW SMELL',
'rpg 4k': 'RPG 4K',
'alchemist': 'ALCHEMIST',
'flexform': 'FLEXFORM',
'pyroblast': 'PYROBLAST',
'poseidon': 'POSEIDON',
'gengiva': 'GENGIVA',
'70/30': 'IRON 70/30',
'7030': 'IRON 70/30',
'vulcan': 'VULCAN CAST',
'velvet': 'VELVET SKIN',
'athom': 'ATHOM',
'spark': 'SPARK',
'spin': 'SPIN',
'iron': 'IRON',
};

const RESIN_ALIASES = Object.keys(RESINAS_MAP).sort((a, b) => b.length - a.length);

// Lista base (fallback quando o catalogo do MongoDB ainda nao carregou).
// Em producao ela e somada a todos os modelos cadastrados na colecao de parametros.
const IMPRESSORAS = [
'uniformation gktwo',
'photon mono m3 premium', 'photon mono m3 plus', 'photon mono x 6k',
'photon mono m7 pro', 'photon mono m7 max', 'photon mono m7',
'photon mono m5s pro', 'photon mono m5s', 'photon mono m5', 'photon mono m3', 'photon mono 4k',
'photon mono x', 'photon mono 2', 'photon mono', 'photon m5s', 'photon m5',
'photon ultra', 'photon',
'saturn 4 ultra 16k', 'saturn 5 ultra', 'saturn 4 ultra', 'saturn 3 ultra', 'saturn 4', 'saturn 3', 'saturn 2',
'saturn s', 'saturn',
'mars 5 ultra', 'mars 5', 'mars 4 ultra', 'mars 4', 'mars 3', 'mars 2', 'mars pro', 'mars',
'jupiter se', 'jupiter 2', 'jupiter',
'sonic mega 8k', 'sonic mini 8k', 'sonic mini 4k', 'sonic mini', 'sonic',
'halot one pro', 'halot one plus', 'halot one', 'halot sky', 'halot max', 'halot mage', 'halot',
'ld 006', 'ld 002r', 'ld 002h', 'ld 002',
'uniformation', 'proxima', 'voxelab',
'anycubic', 'elegoo', 'phrozen', 'creality',
];

// So a marca: precisa perguntar o modelo.
const BRAND_NAMES = new Set([
'anycubic', 'elegoo', 'phrozen', 'creality', 'uniformation', 'voxelab',
]);
// Familia: pode existir o modelo "original" com esse nome e varias variantes.
const FAMILY_NAMES = new Set(['photon', 'mars', 'saturn', 'sonic', 'halot', 'jupiter']);

const GENERIC_RESIN_NAMES = new Set(['ATHOM']);

const LEGACY_DOCUMENTS = splitKnowledgeBase(KNOWLEDGE_BASE);

// ---------------------------------------------------------------
// Fichas dos produtos (secoes "### NOME" do knowledge.js)
// ---------------------------------------------------------------
const SHEET_ALIASES = { 'IRON 70/30': '70/30', 'SPIN+': 'SPIN', GENGIVA: 'ATHOM GENGIVA' };

function sheetKey(title) {
return compactName(String(title || '').split('(')[0]);
}

const PRODUCT_SHEETS = new Map();
{
  const start = LEGACY_DOCUMENTS.findIndex((d) => /^RESINAS/i.test(d.title));
  const end = LEGACY_DOCUMENTS.findIndex((d, i) => i > start && /^PROBLEMAS COMUNS/i.test(d.title));
  if (start >= 0) {
    for (const doc of LEGACY_DOCUMENTS.slice(start + 1, end > start ? end : undefined)) {
      PRODUCT_SHEETS.set(sheetKey(doc.title), doc);
    }
  }
}

export function getProductSheet(resin) {
if (!resin) return null;
return PRODUCT_SHEETS.get(sheetKey(SHEET_ALIASES[resin] || resin)) || null;
}

// Guia de aplicacoes: linha "Aplicacao" de cada ficha + secao de exemplos por aplicacao.
const APPLICATION_GUIDE = (() => {
  const lines = [];
  for (const doc of PRODUCT_SHEETS.values()) {
    const name = String(doc.title).split('(')[0].trim();
    const app = String(doc.content).split('\n').find((l) => /aplica[cç][aã]o/i.test(l));
    const car = String(doc.content).split('\n').find((l) => /caracter[ií]sticas/i.test(l));
    if (app) lines.push(name + ': ' + app.replace(/^[-\s]+/, '') + (car ? ' | ' + car.replace(/^[-\s]+/, '') : ''));
  }
  const examples = LEGACY_DOCUMENTS.find((d) => /^EXEMPLOS DE USO/i.test(d.title));
  return [
    'Catalogo de resinas Quanton3D (use SOMENTE estas descricoes para indicar resina; nao atribua propriedades que nao estao aqui):',
    ...lines,
    examples ? '\n' + examples.content : '',
  ].join('\n');
})();

// Catalogo curto (uma linha por resina) que vai sempre no prompt para o bot nunca inventar aplicacao.
export const RESIN_CATALOG_SHORT = ['Validade de todas as resinas Quanton3D: 12 meses a partir da data de fabricacao.', ''].concat([...PRODUCT_SHEETS.values()].map((doc) => {
  const name = String(doc.title).split('(')[0].trim();
  const app = String(doc.content).split('\n').find((l) => /aplica[cç][aã]o/i.test(l)) || '';
  return name + ': ' + app.replace(/^[-\s]+/, '').replace(/^Aplica[cç][aã]o( oficial)?:\s*/i, '');
})).concat((() => {
  const ex = LEGACY_DOCUMENTS.find((d) => /^EXEMPLOS DE USO/i.test(d.title));
  return ex ? ['', 'Indicacao por aplicacao:', ...String(ex.content).split('\n').filter((l) => l.includes(':') && !/^#|^\(/.test(l.trim()))] : [];
})()).join('\n');

// Pergunta pedindo indicacao de resina para uma aplicacao.
export function isResinRecommendation(message) {
return /qual (a )?(melhor )?resina|que resina|quais resinas|resina (ideal|indicada|certa|boa|melhor|pra |para )|indica(m|r|ria)?\b.*resina|recomenda(m|r|ria)?\b.*resina|resina.*(aguent|resist|suport)|serve para|posso usar a? ?(resina|athom|iron|alchemist|pyroblast|spin|spark|poseidon|flexform)/i.test(String(message || ''));
}

// ---------------------------------------------------------------
// Catalogo dinamico (resinas e impressoras realmente cadastradas)
// ---------------------------------------------------------------
const CATALOG_TTL_MS = 10 * 60 * 1000;
let catalogCache = { at: 0, resins: [], printers: [] };
let catalogPromise = null;

function withTimeout(promise, ms) {
return Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout catalogo')), ms)),
]);
}

export function compactName(value) {
return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

export async function loadCatalog() {
if (Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache;
if (!catalogPromise) {
  catalogPromise = (async () => {
    try {
      const rows = await withTimeout(Parametro.find({}).select('resina impressora').lean(), 4000);
      const list = Array.isArray(rows) ? rows : [];
      catalogCache = {
        at: Date.now(),
        resins: [...new Set(list.map((r) => String(r.resina || '').trim()).filter(Boolean))],
        printers: [...new Set(list.map((r) => normalizeText(r.impressora)).filter(Boolean))],
      };
    } catch (error) {
      console.error('[RAG-WARN] Falha ao carregar catalogo de parametros:', error.message);
      // tenta de novo em 1 minuto, mantendo o que ja tinha
      catalogCache = Object.assign({}, catalogCache, { at: Date.now() - CATALOG_TTL_MS + 60 * 1000 });
    } finally {
      catalogPromise = null;
    }
    return catalogCache;
  })();
}
return catalogPromise;
}

// Resolve o nome canonico da resina para o(s) nome(s) gravado(s) no banco.
export function resolveResinDbNames(resin, dbResins = catalogCache.resins) {
if (!resin) return [];
const target = compactName(resin);
const exact = dbResins.filter((name) => compactName(name) === target);
if (exact.length) return exact;
// VELVET SKIN -> VELVET (nome curto no banco)
return dbResins.filter((name) => {
  const c = compactName(name);
  return c.length >= 4 && (target.startsWith(c) || c.startsWith(target));
});
}

// Detecta se a pergunta e sobre parametros especificos (exposicao, config).
// Perguntas de diagnostico (defeito, problema, encolhimento) NAO devem acionar o guard.
function isParameterRequest(message) {
  return /param[ae]tro|exposi[cç][aã]o|tempo de exposi|camada base|camadas base|base layer|velocidade|lift speed|bottom layer|configurar|configura[cç][aã]o|perfil|quanto tempo|qual o tempo|como configur|ajuste(s)? d[ao]|valores/i.test(String(message));
}

function escapeRegex(value) {
return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// "Photon Mono M3" e "Photon M3" sao o mesmo modelo no cadastro.
export function printerKey(value) {
return normalizeText(value).replace(/^photon mono (m\d)/, 'photon $1');
}

function hasWord(normalizedText, term) {
return (' ' + normalizedText + ' ').includes(' ' + term + ' ');
}

function queryWithHistory(message, history = []) {
if (tokenize(message).length >= 2) return message;
const recentUserMessages = Array.isArray(history)
  ? history
    .filter((item) => item && item.role === 'user' && item.content)
    .slice(-1)
    .map((item) => item.content)
  : [];
return [...recentUserMessages, message].filter(Boolean).join(' ');
}

export function detectAllResins(text) {
const normalized = normalizeText(text || '');
const found = [];
let remaining = ' ' + normalized + ' ';
for (const alias of RESIN_ALIASES) {
  const term = ' ' + normalizeText(alias) + ' ';
  if (remaining.includes(term)) {
    const canonical = RESINAS_MAP[alias];
    if (!found.includes(canonical)) found.push(canonical);
    remaining = remaining.split(term).join(' ');
  }
}
return found;
}

export function detectResin(text) {
const normalized = normalizeText(text || '');
const match = RESIN_ALIASES.find((alias) => hasWord(normalized, normalizeText(alias)));
return match ? RESINAS_MAP[match] : '';
}

function printerCandidates(catalogPrinters = catalogCache.printers) {
const map = new Map();
for (const name of IMPRESSORAS) map.set(normalizeText(name), normalizeText(name));
for (const name of catalogPrinters) {
  const norm = normalizeText(name);
  if (!norm) continue;
  map.set(norm, norm);
  // "Anycubic M7 Pro" -> "photon mono m7 pro"
  const short = norm.match(/^photon (?:mono )?(m\d.*)$/);
  if (short && !map.has(short[1])) map.set(short[1], norm);
  // "Halot One" / "Halote One" ja cobertos pela normalizacao do hifen
}
// Marca sozinha ("anycubic") so vale se nenhum modelo for encontrado.
return [...map.entries()].sort((a, b) => {
  const brandA = BRAND_NAMES.has(a[0]) ? 1 : 0;
  const brandB = BRAND_NAMES.has(b[0]) ? 1 : 0;
  return brandA - brandB || b[0].length - a[0].length;
});
}

export function detectPrinter(text, catalogPrinters) {
const normalized = normalizeText(text || '');
if (!normalized) return '';
const hit = printerCandidates(catalogPrinters).find(([alias]) => hasWord(normalized, alias));
return hit ? hit[1] : '';
}

export function extractEntities(message, history) {
if (!history) history = [];
const list = Array.isArray(history) ? history.filter((item) => item && item.content) : [];
// Somente o que o CLIENTE escreveu, do mais recente para o mais antigo.
const userTexts = list.filter((item) => item.role !== 'assistant').map((item) => item.content).reverse();

let resin = detectResin(message);
if (!resin) {
  for (const t of userTexts) { resin = detectResin(t); if (resin) break; }
}
if (!resin) {
  // Se a ultima resposta do bot indicou UMA unica resina, o cliente provavelmente esta falando dela.
  const lastBot = [...list].reverse().find((item) => item.role === 'assistant');
  const botResins = lastBot ? detectAllResins(lastBot.content) : [];
  if (botResins.length === 1) resin = botResins[0];
}

let printer = detectPrinter(message);
if (!printer) {
  for (const t of userTexts) { printer = detectPrinter(t); if (printer) break; }
}
return { resin: resin, printer: printer };
}

function numericValue(value) {
const n = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
return Number.isFinite(n) ? n : 0;
}

// Descarta perfis vazios/zerados que existem no banco (ex.: "0s").
function isUsableParameter(p) {
return numericValue(p.exposicaoNormal) > 0 && numericValue(p.exposicaoBase) > 0;
}

function uniqueProfiles(list) {
const seen = new Set();
return list.filter((p) => {
  const key = [p.exposicaoNormal, p.exposicaoBase, p.alturaCamada, p.camadasBase].map((v) => String(v ?? '').replace(',', '.').trim().toLowerCase()).join('|');
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
}

function displayNames(list) {
const byNorm = new Map();
for (const p of list) {
  const norm = normalizeText(p.impressora);
  if (!byNorm.has(norm)) byNorm.set(norm, String(p.impressora).trim());
}
return [...byNorm.values()].sort((a, b) => a.localeCompare(b));
}

async function findResinParameters(resin) {
const dbNames = resolveResinDbNames(resin);
const query = dbNames.length
  ? { resina: { $in: dbNames } }
  : { resina: { $regex: '^' + escapeRegex(resin) + '$', $options: 'i' } };
const rows = await Parametro.find(query).limit(500).lean();
return (Array.isArray(rows) ? rows : []).filter(isUsableParameter);
}

// message e passada para restringir o guard apenas a perguntas de parametros.
// Perguntas de diagnostico (encolhimento, defeito, sintoma) passam sem guard.
async function retrieveOfficialParameters(resin, printer, message) {
if (!message) message = '';
if (!resin && !printer) return { context: '', guardInstruction: '', found: false };
const wantsParameters = isParameterRequest(message);

if (GENERIC_RESIN_NAMES.has(resin)) {
  return {
    context: '',
    guardInstruction: wantsParameters
      ? 'O cliente informou apenas a familia ATHOM. Pergunte qual produto exato ele usa: ATHOM DENTAL, ATHOM ALINHADORES ou ATHOM WASHABLE. Nao forneca parametros antes dessa confirmacao.'
      : '',
    found: false,
  };
}

if (resin && (!printer || BRAND_NAMES.has(printer))) {
  // Para diagnosticos nao bloqueie — o bot pode ajudar sem saber a impressora exata.
  if (!wantsParameters) return { context: '', guardInstruction: '', found: false };
  return {
    context: '',
    guardInstruction: 'O cliente mencionou a resina ' + resin + ', mas nao informou o modelo exato da impressora. Pergunte apenas qual e o modelo exato antes de fornecer parametros. Nao invente nem liste parametros de outras impressoras.',
    found: false,
  };
}

if (!resin && printer) {
  if (!wantsParameters) return { context: '', guardInstruction: '', found: false };
  return {
    context: '',
    guardInstruction: 'O cliente informou a impressora ' + printer.toUpperCase() + ', mas nao informou a resina Quanton3D. Pergunte qual resina ele usa antes de fornecer parametros.',
    found: false,
  };
}

const allRows = await findResinParameters(resin);
// Perfis com campo trocado na digitacao (ex.: camadas de base "1,50s") ficam fora ate o ADM corrigir.
const all = allRows.filter((p) => problemasPerfil(p).length === 0);
const key = printerKey(printer);
const exact = all.filter((p) => printerKey(p.impressora) === key);
const variants = displayNames(all.filter((p) => printerKey(p.impressora).startsWith(key + ' ')));
const emRevisao = allRows.some((p) => printerKey(p.impressora) === key && problemasPerfil(p).length > 0);

if (!exact.length && emRevisao) {
  return {
    context: '',
    guardInstruction: wantsParameters
      ? 'O perfil oficial de ' + resin + ' + ' + printer.toUpperCase() + ' esta em revisao pela equipe (cadastro com valor inconsistente). Nao passe nenhum valor de exposicao, base ou camadas. Diga isso com naturalidade e indique o WhatsApp de suporte (31) 3271-6935 para receber o perfil conferido.'
      : '',
    found: false,
  };
}

if (!exact.length) {
  if (variants.length) {
    return {
      context: '',
      guardInstruction: 'Para ' + resin + ' existem perfis oficiais para estes modelos: ' + variants.slice(0, 12).join(', ') + '. Pergunte qual deles e o modelo exato do cliente antes de passar valores. Nao improvise valores.',
      found: false,
    };
  }
  return {
    context: '',
    guardInstruction: wantsParameters
      ? 'Nao ha parametro oficial cadastrado para ' + resin + ' + ' + printer.toUpperCase() + '. Informe isso claramente e indique o WhatsApp (31) 3271-6935. Nao improvise valores.'
      : '',
    found: false,
  };
}

const profiles = uniqueProfiles(exact).slice(0, 2);
const lines = profiles.map(formatParameter).filter(Boolean);
if (profiles.length > 1) {
  lines.push('Observacao: ha mais de um perfil cadastrado para esta combinacao. Apresente o primeiro como perfil principal e cite o segundo como alternativa.');
}
if (variants.length && FAMILY_NAMES.has(printer)) {
  lines.push('ATENCAO: o cliente escreveu apenas "' + printer.toUpperCase() + '". Os valores acima sao do modelo original com esse nome. Tambem existem perfis para: ' + variants.slice(0, 12).join(', ') + '. Apresente os valores deixando claro que sao do modelo original e pergunte se a impressora dele e uma dessas variantes.');
} else if (variants.length) {
  lines.push('Variantes do mesmo modelo com perfil proprio: ' + variants.slice(0, 8).join(', ') + '. Se o cliente tiver uma dessas variantes, os valores sao outros.');
}
return {
  context: lines.join('\n'),
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
  title: '[' + suggestion.categoria + '] ' + suggestion.titulo,
  content: suggestion.conteudo,
  source: 'sugestao_aprovada',
}));

return rankDocuments(query, documents, options);
}

export async function retrieveRagContext(message, history) {
if (!history) history = [];
await loadCatalog();
const query = queryWithHistory(message, history);
const entities = extractEntities(message, history);
const resin = entities.resin;
const printer = entities.printer;
const threshold = getRagMinRelevance();
const limit = Math.min(5, Math.max(1, Number.parseInt(process.env.RAG_MAX_RESULTS, 10) || 3));
const rankingOptions = { threshold: threshold, limit: limit, entity: resin };

// Passa message para que retrieveOfficialParameters distinga parametros de diagnostico
const results = await Promise.all([
  retrieveOfficialParameters(resin, printer, message).catch((error) => {
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
const official = results[0];
const approvedConversations = results[1];
const approvedSuggestions = results[2];

// Fichas dos produtos citados (na mensagem ou na conversa).
const resinsInMessage = detectAllResins(message);
const sheetResins = resinsInMessage.length ? resinsInMessage : (resin ? [resin] : []);
const sheets = [];
for (const r of sheetResins) {
  const sheet = getProductSheet(r);
  if (sheet && !sheets.includes(sheet)) sheets.push(sheet);
  if (sheets.length >= 3) break;
}
const wantsRecommendation = isResinRecommendation(message);
const productContext = [
  ...sheets.map((doc) => doc.content),
  wantsRecommendation ? APPLICATION_GUIDE : '',
].filter(Boolean).join('\n\n');

const technicalRankingOptions = Object.assign({}, rankingOptions, { requireTechnicalAnchor: true });
const externalDocuments = rankDocuments(query, EXTERNAL_KNOWLEDGE, technicalRankingOptions);
const legacyDocuments = rankDocuments(query, LEGACY_DOCUMENTS, technicalRankingOptions)
  .filter((doc) => !sheets.includes(LEGACY_DOCUMENTS.find((d) => d.id === doc.id)));

const context = buildPriorityContext({
  parameterContext: official.context,
  productContext: productContext,
  approvedConversations: approvedConversations,
  approvedSuggestions: approvedSuggestions,
  externalDocuments: externalDocuments,
  legacyDocuments: legacyDocuments,
});

const sources = [
  ...(official.found ? ['parametros_oficiais'] : []),
  ...(sheets.length ? ['ficha_produto'] : []),
  ...(wantsRecommendation ? ['guia_aplicacoes'] : []),
  ...(approvedConversations.length ? ['conversas_aprovadas'] : []),
  ...(approvedSuggestions.length ? ['sugestoes_aprovadas'] : []),
  ...(externalDocuments.length ? ['base_externa_curada'] : []),
  ...(legacyDocuments.length ? ['base_tecnica'] : []),
];

console.log('[RAG-INFO]', JSON.stringify({
  threshold: threshold,
  resin: resin || null,
  printer: printer || null,
  catalogo: { resinas: catalogCache.resins.length, impressoras: catalogCache.printers.length },
  sources: sources,
  results: {
    conversations: approvedConversations.length,
    suggestions: approvedSuggestions.length,
    external: externalDocuments.length,
    legacy: legacyDocuments.length,
    officialParameters: official.found ? 1 : 0,
  },
}));

return {
  context: context,
  guardInstruction: official.guardInstruction,
  used: sources.length > 0,
  sources: sources,
  resin: resin,
  printer: printer,
  threshold: threshold,
};
}
