import assert from 'node:assert/strict';
import test from 'node:test';
import EXTERNAL_KNOWLEDGE, { validateExternalKnowledge } from '../services/externalKnowledge.js';
import { rankDocuments } from '../services/ragRanking.js';

test('corpus externo possui volume, metadados e fontes rastreaveis', () => {
  assert.ok(EXTERNAL_KNOWLEDGE.length >= 30);
  assert.equal(validateExternalKnowledge(EXTERNAL_KNOWLEDGE), true);

  for (const document of EXTERNAL_KNOWLEDGE) {
    assert.equal(document.source, 'base_externa_curada');
    assert.match(document.sourceUrl, /^https:\/\//);
    assert.match(document.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(document.content.length >= 120);
  }
});

const cases = [
  ['minha peça está menor que o arquivo', /Peça menor ou maior/i],
  ['só imprimiu o raft e os suportes, o modelo soltou', /apenas raft e suportes/i],
  ['a falha ocorre sempre na mesma posição XY', /Falha fixa em XY|Padrão XY|Filme desgastado/i],
  ['minha peça oca está fazendo efeito de sucção', /Câmara fechada e efeito de sucção/i],
  ['apareceu uma camada vazia no arquivo', /Camadas vazias/i],
  ['o tanque ficou com fragmentos de resina curada', /Fragmentos no tanque/i],
];

for (const [query, expectedTitle] of cases) {
  test(`recupera fonte externa para: ${query}`, () => {
    const results = rankDocuments(query, EXTERNAL_KNOWLEDGE, { threshold: 0.55, limit: 3 });
    assert.ok(results.length >= 1);
    assert.match(results[0].title, expectedTitle);
    assert.ok(results[0].sourceUrl);
  });
}

test('nao recupera corpus tecnico para assunto sem relacao', () => {
  const results = rankDocuments('qual restaurante serve pizza hoje', EXTERNAL_KNOWLEDGE, {
    threshold: 0.55,
    limit: 3,
  });
  assert.deepEqual(results, []);
});

test('corpus nao cria parametros universais de exposicao', () => {
  const combined = EXTERNAL_KNOWLEDGE.map((document) => document.content).join('\n');
  assert.doesNotMatch(combined, /use exposi[cç][aã]o (?:normal )?de \d/i);
  assert.doesNotMatch(combined, /sempre use \d/i);
});
