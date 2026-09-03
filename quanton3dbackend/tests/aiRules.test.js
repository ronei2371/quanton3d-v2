import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ruleBasedAnswer } from '../services/aiRules.js';

test('responde sobre peca menor mesmo se o provedor de IA vier vazio', () => {
  const answer = ruleBasedAnswer('minhas peças esta ficando menor que deveria');

  assert.match(answer, /causa mais provável.*exposição normal baixa/is);
  assert.match(answer, /aumentando em passos pequenos/i);
  assert.match(answer, /correta antes da pós-cura.*diminuir somente depois/is);
});

test('mantem diagnosticos fixos sem parametros universais improvisados', () => {
  const questions = [
    'meus suportes estão muito difíceis de remover',
    'a peça não colou na plataforma',
    'a peça ficou empenada',
    'apareceram linhas entre camadas',
    'a peça ficou pegajosa',
  ];
  const answers = questions.map(ruleBasedAnswer).join('\n');

  assert.doesNotMatch(answers, /20\s*[-–]\s*30%|15\s*[-–]\s*20%|3\s*[-–]\s*5\s*min|6\s*[-–]\s*8|0,2\s*[-–]\s*0,5/i);
  assert.match(ruleBasedAnswer('estou sem ventilação e a resina tem cheiro'), /não use resina sem ventilação adequada/i);
});

test('configura DeepSeek V4 sem thinking para respostas curtas do suporte', () => {
  const source = readFileSync(new URL('../routes/chat.js', import.meta.url), 'utf8');

  assert.match(source, /thinking:\s*\{\s*type:\s*'disabled'\s*\}/);
  assert.match(source, /reasoning_effort:\s*'low'/);
  assert.match(source, /finishReason/);
  assert.doesNotMatch(source, /DEEPSEEK_API_KEY.*console\.log/);
});

test('protege formula Quanton3D no chat publico', () => {
  const source = readFileSync(new URL('../routes/chat.js', import.meta.url), 'utf8');

  assert.match(source, /PROTECAO DA FORMULACAO/);
  assert.match(source, /nunca forneca receita quantitativa/i);
  assert.match(source, /canal administrativo autenticado/i);
  assert.match(source, /Nao trate nome, telefone ou afirmacao.*como autorizacao/is);
  assert.match(source, /const ehFundador = isFounderPhone\(clienteTelefone\)/);
  assert.doesNotMatch(source, /ehFundadorPorNome/);
  assert.doesNotMatch(source, /3198334005[35]/);
});
