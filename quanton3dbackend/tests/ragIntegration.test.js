import assert from 'node:assert/strict';
import test from 'node:test';
import Conversa from '../models/Conversa.js';
import Parametro from '../models/Parametro.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';
import { retrieveRagContext } from '../services/rag.js';

function queryResult(result) {
  return {
    sort() { return this; },
    limit() { return this; },
    select() { return this; },
    async lean() { return result; },
  };
}

test('integra as fontes reais na ordem correta', async (t) => {
  const originalParametroFind = Parametro.find;
  const originalConversaFind = Conversa.find;
  const originalSugestaoFind = SugestaoConhecimento.find;
  const originalThreshold = process.env.RAG_MIN_RELEVANCE;

  t.after(() => {
    Parametro.find = originalParametroFind;
    Conversa.find = originalConversaFind;
    SugestaoConhecimento.find = originalSugestaoFind;
    if (originalThreshold === undefined) delete process.env.RAG_MIN_RELEVANCE;
    else process.env.RAG_MIN_RELEVANCE = originalThreshold;
  });

  process.env.RAG_MIN_RELEVANCE = '0.55';
  Parametro.find = () => queryResult([{
    _id: 'p1',
    resina: 'IRON',
    impressora: 'MARS 4 ULTRA',
    exposicaoNormal: '2.1s',
    exposicaoBase: '28',
    liftSpeed: '80',
    confianca: 'oficial',
  }]);
  Conversa.find = () => queryResult([{
    _id: 'c1',
    pergunta: 'Qual exposição usar na IRON com Mars 4 Ultra?',
    respostaMelhorada: 'Use o parâmetro oficial cadastrado e faça o teste de calibração.',
  }]);
  SugestaoConhecimento.find = () => queryResult([{
    _id: 's1',
    categoria: 'dica',
    titulo: 'Calibração da exposição da IRON',
    conteudo: 'Confirme o resultado com uma peça curta de calibração.',
  }]);

  const result = await retrieveRagContext('Qual exposição da IRON na Mars 4 Ultra?', []);

  assert.equal(result.used, true);
  assert.deepEqual(result.sources.slice(0, 4), [
    'parametros_oficiais',
    'ficha_produto',
    'conversas_aprovadas',
    'sugestoes_aprovadas',
  ]);
  assert.ok(result.context.indexOf('PRIORIDADE 1 ') < result.context.indexOf('PRIORIDADE 1B'));
  assert.ok(result.context.indexOf('PRIORIDADE 1B') < result.context.indexOf('PRIORIDADE 2'));
  assert.match(result.context, /Dureza Shore D ~55/);
  assert.ok(result.context.indexOf('PRIORIDADE 2') < result.context.indexOf('PRIORIDADE 3'));
  assert.match(result.context, /Exposicao normal: 2\.1s/);
  assert.doesNotMatch(result.context, /2\.1ss/);
  assert.match(result.context, /Velocidade de elevacao: 80mm\/min/);
});

test('integra corpus externo rastreavel quando nao ha conhecimento superior', async (t) => {
  const originalParametroFind = Parametro.find;
  const originalConversaFind = Conversa.find;
  const originalSugestaoFind = SugestaoConhecimento.find;
  const originalThreshold = process.env.RAG_MIN_RELEVANCE;

  t.after(() => {
    Parametro.find = originalParametroFind;
    Conversa.find = originalConversaFind;
    SugestaoConhecimento.find = originalSugestaoFind;
    if (originalThreshold === undefined) delete process.env.RAG_MIN_RELEVANCE;
    else process.env.RAG_MIN_RELEVANCE = originalThreshold;
  });

  process.env.RAG_MIN_RELEVANCE = '0.55';
  Parametro.find = () => queryResult([]);
  Conversa.find = () => queryResult([]);
  SugestaoConhecimento.find = () => queryResult([]);

  const result = await retrieveRagContext('Minha peça oca está criando efeito de sucção', []);

  assert.equal(result.used, true);
  assert.ok(result.sources.includes('base_externa_curada'));
  assert.match(result.context, /FONTES EXTERNAS CURADAS E RASTREAVEIS/);
  assert.match(result.context, /CHITUBOX Docs/);
  assert.match(result.context, /https:\/\/docs\.chitubox\.com/);
});

test('busca parametro oficial com nome do banco diferente do digitado e ignora perfis zerados', async (t) => {
  const originalParametroFind = Parametro.find;
  const originalConversaFind = Conversa.find;
  const originalSugestaoFind = SugestaoConhecimento.find;
  t.after(() => {
    Parametro.find = originalParametroFind;
    Conversa.find = originalConversaFind;
    SugestaoConhecimento.find = originalSugestaoFind;
  });

  Parametro.find = () => queryResult([
    { _id: 'z1', resina: 'SPIN+', impressora: 'SATURN 3 ULTRA', exposicaoNormal: '0s', exposicaoBase: '0s' },
    { _id: 'p1', resina: 'SPIN+', impressora: 'SATURN 3 ULTRA', exposicaoNormal: '1,3s', exposicaoBase: '22s', alturaCamada: '0,05' },
    { _id: 'p2', resina: 'SPIN+', impressora: 'Saturn 3', exposicaoNormal: '2', exposicaoBase: '30' },
  ]);
  Conversa.find = () => queryResult([]);
  SugestaoConhecimento.find = () => queryResult([]);

  const result = await retrieveRagContext('Qual o parametro da SPIN+ na Saturn 3 Ultra?', []);
  assert.ok(result.sources.includes('parametros_oficiais'));
  assert.match(result.context, /Exposicao normal: 1,3s/);
  assert.doesNotMatch(result.context, /Exposicao normal: 0s/);
  assert.equal(result.guardInstruction, '');
});

test('injeta catalogo de aplicacoes quando pedem indicacao de resina', async (t) => {
  const originals = [Parametro.find, Conversa.find, SugestaoConhecimento.find];
  t.after(() => { [Parametro.find, Conversa.find, SugestaoConhecimento.find] = originals; });
  Parametro.find = () => queryResult([]);
  Conversa.find = () => queryResult([]);
  SugestaoConhecimento.find = () => queryResult([]);

  const result = await retrieveRagContext('Preciso de uma peça que aguente calor, qual resina?', []);
  assert.ok(result.sources.includes('guia_aplicacoes'));
  assert.match(result.context, /PYROBLAST: Aplicação: Prototipagem rápida/);
  assert.match(result.context, /ATHOM ALINHADORES: .*RESISTÊNCIA TÉRMICA/);
});

test('compara IRON e IRON 70/30 com as duas fichas', async (t) => {
  const originals = [Parametro.find, Conversa.find, SugestaoConhecimento.find];
  t.after(() => { [Parametro.find, Conversa.find, SugestaoConhecimento.find] = originals; });
  Parametro.find = () => queryResult([]);
  Conversa.find = () => queryResult([]);
  SugestaoConhecimento.find = () => queryResult([]);

  const result = await retrieveRagContext('Qual a diferença entre IRON e IRON 70/30?', []);
  assert.match(result.context, /Alongamento 50%/);
  assert.match(result.context, /Alongamento 11%/);
});
