import assert from 'node:assert/strict';
import test from 'node:test';
import { misturaAnswer, custoFormulaAnswer } from '../services/regrasSuporte.js';

test('mistura entre resinas Quanton cita a mistura validada', () => {
  const r = misturaAnswer('Posso misturar duas resinas Quanton?');
  assert.match(r, /SPIN\+ com 30% de IRON/);
  assert.match(misturaAnswer('posso misturar spin com iron?'), /validada/);
});

test('mistura com outra marca não é recomendada', () => {
  assert.match(misturaAnswer('Posso misturar Quanton com resina de outra marca?'), /Não é recomendado/);
});

test('mistura fora do assunto não dispara', () => {
  assert.equal(misturaAnswer('posso misturar tinta na resina?'), null);
  assert.equal(misturaAnswer('como lavar a peça?'), null);
  assert.equal(misturaAnswer('preciso misturar a resina antes de imprimir?'), null);
  assert.equal(misturaAnswer('tenho que misturar a resina no frasco?'), null);
});

test('fórmula do custo', () => {
  assert.match(custoFormulaAnswer('Meu cálculo de custo parece errado; mostre a fórmula.'), /1,05/);
  assert.equal(custoFormulaAnswer('qual o custo da resina iron?'), null);
});
