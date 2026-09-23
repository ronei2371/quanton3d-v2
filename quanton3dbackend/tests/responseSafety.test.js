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
  assert.equal(hasApprovedQuantitativeSource(['ficha_produto']), true);
  assert.equal(hasApprovedQuantitativeSource(['conversas_aprovadas']), true);
  assert.equal(hasApprovedQuantitativeSource(['sugestoes_aprovadas']), true);
});

test('remove so as frases com numero tecnico e preserva o diagnostico', async () => {
  const { stripTechnicalQuantities } = await import('../services/responseSafety.js');
  const texto = 'A causa provavel e bolha presa. Aqueca a resina a 30°C antes. Misture devagar e deixe repousar.\n\nQual resina voce usa?';
  const limpo = stripTechnicalQuantities(texto);
  assert.equal(containsTechnicalQuantity(limpo), false);
  assert.match(limpo, /bolha presa/);
  assert.match(limpo, /Misture devagar/);
  assert.match(limpo, /Qual resina/);
});

test('nao deixa item de lista vazio e renumera', async () => {
  const { stripTechnicalQuantities } = await import('../services/responseSafety.js');
  const texto = 'Verifique nesta ordem:\n\n1. Use escala de 100% no fatiador.\n2. Se ha compensacao XY ativa.\n3. Se a peca encolhe so depois da pos-cura.';
  const limpo = stripTechnicalQuantities(texto);
  assert.doesNotMatch(limpo, /^\s*\d+\.\s*$/m);
  assert.match(limpo, /^1\. Se ha compensacao/m);
  assert.match(limpo, /^2\. Se a peca encolhe/m);
});

test('nao deixa pedaco solto de abreviacao ou negrito', async () => {
  const { stripTechnicalQuantities } = await import('../services/responseSafety.js');
  const texto = 'Ajuste concreto:\n1. Reduza o pos-cura para **max. 5 min por lado**.\n2. Agite bem a resina antes de usar.\n3. Mantenha a peca longe de luz solar direta.';
  const limpo = stripTechnicalQuantities(texto);
  assert.doesNotMatch(limpo, /max\./);
  assert.doesNotMatch(limpo, /\*\*/);
  assert.match(limpo, /^1\. Agite bem/m);
  assert.match(limpo, /^2\. Mantenha/m);
});
