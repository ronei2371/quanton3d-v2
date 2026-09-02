import assert from 'node:assert/strict';
import test from 'node:test';
import { ruleBasedAnswer } from '../services/aiRules.js';

test('responde sobre peca menor mesmo se o provedor de IA vier vazio', () => {
  const answer = ruleBasedAnswer('minhas peças esta ficando menor que deveria');

  assert.match(answer, /escala\/unidade/i);
  assert.match(answer, /medida nominal.*medida real/i);
  assert.match(answer, /Qual é a medida no arquivo/i);
});
