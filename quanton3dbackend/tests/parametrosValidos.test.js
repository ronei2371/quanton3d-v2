import assert from 'node:assert/strict';
import test from 'node:test';
import Parametro from '../models/Parametro.js';
import { listarParametros, perfilValido } from '../controllers/parametrosController.js';

const LISTA = [
  { resina: 'SPIN+', impressora: 'SATURN 3 ULTRA', exposicaoNormal: '0s', exposicaoBase: '0s' },
  { resina: 'SPIN+', impressora: 'SATURN 3 ULTRA', exposicaoNormal: '1,3s', exposicaoBase: '22s' },
  { resina: 'FLEXFORM', impressora: 'Mars 3 Ultra', exposicaoNormal: '0s', exposicaoBase: '0s' },
];

function mockFind(t) {
  const original = Parametro.find;
  t.after(() => { Parametro.find = original; });
  Parametro.find = () => ({ sort() { return this; }, async lean() { return LISTA; } });
}

function resposta() {
  const r = { body: null, json(b) { this.body = b; return this; } };
  return r;
}

test('perfil precisa de exposicao normal e base maiores que zero', () => {
  assert.equal(perfilValido({ exposicaoNormal: '1,3s', exposicaoBase: '22s' }), true);
  assert.equal(perfilValido({ exposicaoNormal: '0s', exposicaoBase: '0s' }), false);
  assert.equal(perfilValido({ exposicaoNormal: '1.8', exposicaoBase: '' }), false);
});

test('site recebe so perfis validos', async (t) => {
  mockFind(t);
  const res = resposta();
  await listarParametros({ query: {} }, res);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].exposicaoNormal, '1,3s');
});

test('ADM com ?todos=1 recebe tudo, inclusive zerados', async (t) => {
  mockFind(t);
  const res = resposta();
  await listarParametros({ query: { todos: '1' } }, res);
  assert.equal(res.body.data.length, 3);
});

test('resina ainda nao disponivel (RPG 4K) nao aparece no site', async (t) => {
  const original = Parametro.find;
  t.after(() => { Parametro.find = original; });
  const lista = [
    { resina: 'RPG 4K', impressora: 'Saturn 3', exposicaoNormal: '2s', exposicaoBase: '25s' },
    { resina: 'IRON', impressora: 'Saturn 3', exposicaoNormal: '2s', exposicaoBase: '25s' },
  ];
  Parametro.find = () => ({ sort() { return this; }, async lean() { return lista; } });
  const site = resposta();
  await listarParametros({ query: {} }, site);
  assert.deepEqual(site.body.data.map((p) => p.resina), ['IRON']);
  const adm = resposta();
  await listarParametros({ query: { todos: '1' } }, adm);
  assert.equal(adm.body.data.length, 2);
});
