import assert from 'node:assert/strict';
import test from 'node:test';
import { camposTecnicosMudaram } from '../controllers/parametrosController.js';
import { formatParameter } from '../services/ragRanking.js';

test('trocar só a foto não conta como revisão técnica', () => {
  const atual = { exposicaoNormal: '1,5s', exposicaoBase: '35s', camadasBase: '5', fotoImpressora: 'a.png' };
  assert.equal(camposTecnicosMudaram(atual, { fotoImpressora: 'b.png' }), false);
  assert.equal(camposTecnicosMudaram(atual, { exposicaoNormal: '1.5s' }), false);
  assert.equal(camposTecnicosMudaram(atual, { exposicaoNormal: '1,6s' }), true);
  assert.equal(camposTecnicosMudaram(atual, { camadasBase: '6' }), true);
});

test('bot recebe a fonte e a data de revisão', () => {
  const t = formatParameter({ resina: 'IRON', impressora: 'Saturn 4 Ultra', exposicaoNormal: '1.5', revisadoEm: '2026-09-26T15:00:00Z' });
  assert.match(t, /Fonte: tabela oficial de parametros Quanton3D/);
  assert.match(t, /Revisado em: 26\/09\/2026/);
  assert.match(formatParameter({ confianca: 'estimado', exposicaoNormal: '2' }), /estimativa inicial/);
  assert.doesNotMatch(formatParameter({ exposicaoNormal: '2' }), /Revisado em/);
});
