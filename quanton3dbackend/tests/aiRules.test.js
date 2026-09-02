import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ruleBasedAnswer } from '../services/aiRules.js';

test('responde sobre peca menor mesmo se o provedor de IA vier vazio', () => {
  const answer = ruleBasedAnswer('minhas peças esta ficando menor que deveria');

  assert.match(answer, /escala\/unidade/i);
  assert.match(answer, /medida nominal.*medida real/i);
  assert.match(answer, /Qual é a medida no arquivo/i);
});

test('configura DeepSeek V4 sem thinking para respostas curtas do suporte', () => {
  const source = readFileSync(new URL('../routes/chat.js', import.meta.url), 'utf8');

  assert.match(source, /thinking:\s*\{\s*type:\s*'disabled'\s*\}/);
  assert.match(source, /reasoning_effort:\s*'low'/);
  assert.match(source, /finishReason/);
  assert.doesNotMatch(source, /DEEPSEEK_API_KEY.*console\.log/);
});
