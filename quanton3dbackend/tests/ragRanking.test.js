import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import KNOWLEDGE_BASE from '../services/knowledge.js';
import {
  buildPriorityContext,
  formatParameter,
  getRagMinRelevance,
  rankDocuments,
  splitKnowledgeBase,
  tokenize,
} from '../services/ragRanking.js';

test('normaliza acentos e sinonimos tecnicos', () => {
  const tokens = tokenize('A peça não cola na mesa e está rachando');
  assert.ok(tokens.includes('peca'));
  assert.ok(tokens.includes('aderir'));
  assert.ok(tokens.includes('plataforma'));
  assert.ok(tokens.includes('trinca'));
});

test('relaciona peca menor com contracao e dimensao', () => {
  const queryTokens = tokenize('Minhas peças estão ficando menores do que deveriam');
  const knowledgeTokens = tokenize('Contração dimensional: a peça encolheu e a medida ficou abaixo do modelo');

  assert.ok(queryTokens.includes('menor'));
  assert.ok(knowledgeTokens.includes('menor'));
  assert.ok(knowledgeTokens.includes('dimensao'));

  const documents = splitKnowledgeBase(KNOWLEDGE_BASE);
  const results = rankDocuments('Minhas peças estão ficando menores do que deveriam', documents, {
    threshold: 0.55,
    limit: 3,
  });

  assert.ok(results.length >= 1);
  assert.match(results[0].title, /Peça menor que o modelo/i);
});

test('usa RAG_MIN_RELEVANCE e protege valores fora da faixa', () => {
  assert.equal(getRagMinRelevance({ RAG_MIN_RELEVANCE: '0.7' }), 0.7);
  assert.equal(getRagMinRelevance({ RAG_MIN_RELEVANCE: '2' }), 0.95);
  assert.equal(getRagMinRelevance({ RAG_MIN_RELEVANCE: '0' }), 0.15);
  assert.equal(getRagMinRelevance({}), 0.55);
});

test('recupera somente trechos tecnicos realmente relevantes', () => {
  const documents = splitKnowledgeBase(KNOWLEDGE_BASE);
  const results = rankDocuments('O FEP está opaco', documents, { threshold: 0.7, limit: 3 });

  assert.equal(results.length, 1);
  assert.match(results[0].title, /FEP opaco/i);
  assert.ok(results[0].relevance >= 0.7);
});

test('nao usa conhecimento sem relacao com a pergunta', () => {
  const documents = splitKnowledgeBase(KNOWLEDGE_BASE);
  const results = rankDocuments('Qual o melhor restaurante de Belo Horizonte?', documents, {
    threshold: 0.7,
    limit: 3,
  });

  assert.deepEqual(results, []);
});

test('monta o contexto na hierarquia definida pela Quanton3D', () => {
  const context = buildPriorityContext({
    parameterContext: 'Parametro oficial',
    approvedConversations: [{ title: 'Conversa', content: 'Resposta validada', relevance: 0.9 }],
    approvedSuggestions: [{ title: 'Sugestao', content: 'Melhoria aprovada', relevance: 0.8 }],
    legacyDocuments: [{ title: 'Antigo', content: 'Apoio tecnico', relevance: 0.75 }],
  });

  const parameterPosition = context.indexOf('PRIORIDADE 1');
  const conversationPosition = context.indexOf('PRIORIDADE 2');
  const suggestionPosition = context.indexOf('PRIORIDADE 3');
  const legacyPosition = context.indexOf('PRIORIDADE 4');

  assert.ok(parameterPosition < conversationPosition);
  assert.ok(conversationPosition < suggestionPosition);
  assert.ok(suggestionPosition < legacyPosition);
  assert.match(context, /Nunca substitua parametro oficial/i);
});

test('formata todos os campos oficiais sem duplicar unidades', () => {
  const formatted = formatParameter({
    resina: 'IRON',
    impressora: 'MARS 4 ULTRA',
    exposicaoNormal: '2.1s',
    exposicaoBase: '28',
    alturaCamada: '0.05mm',
    liftDistance: '6',
    liftSpeed: '80',
    retractSpeed: '150mm/min',
    confianca: 'oficial',
  });

  assert.match(formatted, /2\.1s/);
  assert.doesNotMatch(formatted, /2\.1ss/);
  assert.match(formatted, /28s/);
  assert.match(formatted, /6mm/);
  assert.match(formatted, /80mm\/min/);
  assert.match(formatted, /150mm\/min/);
});

test('o servico consulta todas as fontes aprovadas', () => {
  const serviceSource = readFileSync(new URL('../services/rag.js', import.meta.url), 'utf8');
  assert.match(serviceSource, /Parametro\.find/);
  assert.match(serviceSource, /Conversa\.find\(\{ aprovado: true \}\)/);
  assert.match(serviceSource, /SugestaoConhecimento\.find\(\{ status: 'aprovado' \}\)/);
  assert.match(serviceSource, /splitKnowledgeBase\(KNOWLEDGE_BASE\)/);
});
