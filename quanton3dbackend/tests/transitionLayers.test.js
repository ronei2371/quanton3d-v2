import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairNumerosTransicao, temposTransicao, transitionLayerAnswer } from '../services/transitionLayers.js';

test('le camadas de base e tempos mesmo sem "s" (pergunta real do fundador)', () => {
  const r = extrairNumerosTransicao('tenho 5 camadas base com exposição de base 35 e camada 1,8 quantas camadas de transição?');
  assert.equal(r.camadasBase, 5);
  assert.equal(r.exposicaoBase, 35);
  assert.equal(r.exposicaoNormal, 1.8);
});

test('ignora altura de camada e contagem escrita depois da palavra base', () => {
  const r = extrairNumerosTransicao('camadas de base 4, exposição base 30 s, normal 2 s, altura 0,05mm, transição?');
  assert.equal(r.camadasBase, 4);
  assert.equal(r.exposicaoBase, 30);
  assert.equal(r.exposicaoNormal, 2);
});

test('conta linear: passo = (base - normal) / (n + 1)', () => {
  const { passo, tempos } = temposTransicao(35, 1.8, 5);
  assert.ok(Math.abs(passo - 5.5333) < 0.001);
  assert.deepEqual(tempos.map((t) => Math.round(t * 10) / 10), [29.5, 23.9, 18.4, 12.9, 7.3]);
});

test('resposta usa a regra do fundador (mesmo numero das camadas de base)', () => {
  const resposta = transitionLayerAnswer('tenho 5 camadas base com exposição de base 35 e camada 1,8 quantas camadas de transição?');
  assert.match(resposta, /mesmo número das camadas de base/);
  assert.match(resposta, /5 camadas de transição/);
  assert.match(resposta, /29,5 → 23,9 → 18,4 → 12,9 → 7,3 s/);
  assert.match(resposta, /perfil oficial/);
});

test('sem numeros explica a conta e pede os tempos; outras duvidas nao sao capturadas', () => {
  assert.match(transitionLayerAnswer('quantas camadas de transição devo usar?'), /Se você me disser os tempos/);
  assert.equal(transitionLayerAnswer('qual a melhor orientação para miniatura?'), null);
});
