import assert from 'node:assert/strict';
import test from 'node:test';
import { gabaritoAnswer, posicaoDoGabarito } from '../services/gabaritoQuanton.js';

test('pino no 5: retirar 0,3 s', () => {
  const r = gabaritoAnswer('Meu pino encaixou no 5. O que mudo?');
  assert.match(r, /retirar 0,3 s/);
  assert.match(r, /5 → 4 → 3/);
});

test('posições 1, 2, 4 e 3', () => {
  assert.match(gabaritoAnswer('o pino entrou no 1 do gabarito'), /adicionar 0,3 s/);
  assert.match(gabaritoAnswer('no gabarito o pino ficou na posição 2'), /adicionar 0,2 s/);
  assert.match(gabaritoAnswer('pino encaixou no número 4'), /retirar 0,2 s/);
  assert.match(gabaritoAnswer('o pino encaixou no 3'), /não altere/);
});

test('fora do gabarito não dispara', () => {
  assert.equal(gabaritoAnswer('minha peça tem encaixe apertado no 5 furo'), null);
  assert.equal(gabaritoAnswer('como uso o gabarito?'), null);
  assert.equal(posicaoDoGabarito('uso 5 camadas de base'), null);
});

test('posição inexistente pede confirmação', () => {
  assert.match(gabaritoAnswer('o pino encaixou no 7'), /de 1 a 5/);
});
