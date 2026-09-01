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
  assert.deepEqual(result.sources.slice(0, 3), [
    'parametros_oficiais',
    'conversas_aprovadas',
    'sugestoes_aprovadas',
  ]);
  assert.ok(result.context.indexOf('PRIORIDADE 1') < result.context.indexOf('PRIORIDADE 2'));
  assert.ok(result.context.indexOf('PRIORIDADE 2') < result.context.indexOf('PRIORIDADE 3'));
  assert.match(result.context, /Exposicao normal: 2\.1s/);
  assert.doesNotMatch(result.context, /2\.1ss/);
  assert.match(result.context, /Velocidade de elevacao: 80mm\/min/);
});
