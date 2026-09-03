import assert from 'node:assert/strict';
import test from 'node:test';
import {
  containsTechnicalQuantity,
  hasApprovedQuantitativeSource,
} from '../services/responseSafety.js';

test('detecta recomendacoes quantitativas tecnicas', () => {
  assert.equal(containsTechnicalQuantity('use escala de 100%'), true);
  assert.equal(containsTechnicalQuantity('aumente de 0,5s a 1s'), true);
  assert.equal(containsTechnicalQuantity('aguarde 15-30 minutos'), true);
  assert.equal(containsTechnicalQuantity('use ponta de 0,6 mm'), true);
  assert.equal(containsTechnicalQuantity('aqueça a 40°C'), true);
});

test('nao bloqueia telefone nem lista sem unidade tecnica', () => {
  assert.equal(containsTechnicalQuantity('WhatsApp (31) 3271-6935'), false);
  assert.equal(containsTechnicalQuantity('faça primeiro a lavagem e depois a secagem'), false);
});

test('libera quantidade somente para fonte Quanton3D aprovada', () => {
  assert.equal(hasApprovedQuantitativeSource(['base_externa_curada']), false);
  assert.equal(hasApprovedQuantitativeSource(['base_tecnica']), false);
  assert.equal(hasApprovedQuantitativeSource(['parametros_oficiais']), true);
  assert.equal(hasApprovedQuantitativeSource(['conversas_aprovadas']), true);
  assert.equal(hasApprovedQuantitativeSource(['sugestoes_aprovadas']), true);
});
