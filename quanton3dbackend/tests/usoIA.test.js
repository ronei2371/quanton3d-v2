import assert from 'node:assert/strict';
import test from 'node:test';
import { custoEmDolar, somarUso, inicioDoDiaBrasil, inicioDoMesBrasil, mensagemLimite, LIMITE_DIARIO } from '../services/usoIA.js';
import { saudacaoAnswer, validadeAnswer, handoffAnswer } from '../services/regrasSuporte.js';

test('limite padrão é 15 por dia', () => {
  assert.equal(LIMITE_DIARIO, 15);
  assert.match(mensagemLimite(), /15 perguntas por dia/);
  assert.match(mensagemLimite(), /Continuar no WhatsApp/);
});

test('dia e mês começam à meia-noite de Brasília', () => {
  assert.equal(inicioDoDiaBrasil(new Date('2026-09-26T02:30:00Z')).toISOString(), '2026-09-25T03:00:00.000Z');
  assert.equal(inicioDoDiaBrasil(new Date('2026-09-26T15:00:00Z')).toISOString(), '2026-09-26T03:00:00.000Z');
  assert.equal(inicioDoMesBrasil(new Date('2026-10-01T01:00:00Z')).toISOString(), '2026-09-01T03:00:00.000Z');
});

test('soma de tokens e custo', () => {
  const uso = somarUso({ prompt_tokens: 7000, prompt_cache_hit_tokens: 3000, completion_tokens: 400 }, { prompt_tokens: 7000, completion_tokens: 300 }, undefined);
  assert.deepEqual(uso, { tokensEntrada: 14000, tokensCache: 3000, tokensSaida: 700 });
  const usd = custoEmDolar(uso, { entrada: 0.3, cache: 0.03, saida: 1.2 });
  assert.ok(Math.abs(usd - (11000 * 0.3 + 3000 * 0.03 + 700 * 1.2) / 1e6) < 1e-12);
});

test('respostas fixas que não gastam IA', () => {
  assert.ok(saudacaoAnswer('oi'));
  assert.ok(saudacaoAnswer('Boa tarde, tudo bem?'));
  assert.ok(saudacaoAnswer('valeu pela ajuda'));
  assert.equal(saudacaoAnswer('oi, minha peça descolou da plataforma'), null);
  assert.match(validadeAnswer('Qual a validade da resina?'), /12 meses/);
  assert.equal(validadeAnswer('quanto tempo dura a impressão?'), null);
  assert.match(handoffAnswer('qual o whatsapp de vocês?'), /Continuar no WhatsApp/);
});
