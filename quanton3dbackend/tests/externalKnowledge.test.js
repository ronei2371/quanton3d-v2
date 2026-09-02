import assert from 'node:assert/strict';
import test from 'node:test';
import EXTERNAL_KNOWLEDGE, { validateExternalKnowledge } from '../services/externalKnowledge.js';
import { rankDocuments } from '../services/ragRanking.js';

test('corpus externo possui volume, metadados e fontes rastreaveis', () => {
  assert.ok(EXTERNAL_KNOWLEDGE.length >= 70);
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
  ['resina com muito pigmento não cura em profundidade', /Pigmentos e cargas alteram/i],
  ['peça ficou pegajosa depois da cura', /inibição por oxigênio/i],
  ['minha cabine UV é mais forte, uso o mesmo tempo de pós-cura?', /Equipamento e intensidade/i],
  ['orientação muda a resistência da peça', /Orientação de impressão/i],
  ['deixei muito tempo no IPA', /Método e tempo de lavagem/i],
  ['o pigmento e a mica estão decantando no fundo', /Sedimentação muda/i],
  ['posso jogar resina líquida no ralo?', /não devem ir ao ralo/i],
  ['a peça está quebradiça', /Peça quebradiça/i],
  ['a resina serve para uso intraoral?', /Biocompatibilidade depende/i],
  ['minha resina está grossa mas afina quando mexo', /Pseudoplasticidade/i],
  ['a sílica pirogênica deixou a resina turva e não cura direito', /Sílica pirogênica pode aumentar névoa/i],
  ['coloquei mais dispersante e apareceram grumos', /Aglomerado não é corrigido/i],
  ['a mica dourada está toda no fundo do tanque', /Mica sedimentada cria gradiente/i],
  ['o brilho da mica muda de um lado da peça para outro', /Orientação das plaquetas/i],
  ['a resina está cheia de bolhas e poros', /Bolhas no tanque/i],
  ['posso usar vácuo e aquecer para tirar a espuma?', /Desaeração deve preservar/i],
  ['como liberar um lote novo da resina?', /Controle de lote/i],
  ['a carga mineral aumentou muito a viscosidade', /Maior carga sólida/i],
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
