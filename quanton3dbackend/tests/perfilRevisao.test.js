import assert from 'node:assert/strict';
import test from 'node:test';
import { problemasPerfil, perfilConfiavel, visivelNoSite } from '../controllers/parametrosController.js';

test('camadas de base digitadas em segundos ficam em revisão', () => {
  const p = { resina: 'ATHOM DENTAL', impressora: 'SATURN 4 ULTRA', alturaCamada: '0,05mm', exposicaoNormal: '5s', exposicaoBase: '35s', camadasBase: '1,50s' };
  assert.deepEqual(problemasPerfil(p), ['camadas de base']);
  assert.equal(visivelNoSite(p), false);
});

test('tolerância e "seg" no campo de camadas', () => {
  assert.ok(problemasPerfil({ exposicaoNormal: '8s', exposicaoBase: '80s', camadasBase: '4,8 seg (±0,5 s)', alturaCamada: '0.05mm' }).includes('camadas de base'));
  assert.ok(problemasPerfil({ exposicaoNormal: '8s', exposicaoBase: '80s', camadasBase: '0s', alturaCamada: '0.05mm' }).includes('camadas de base'));
  assert.ok(problemasPerfil({ exposicaoNormal: '1.6', exposicaoBase: '35', camadasBase: '65', alturaCamada: '0.05mm' }).includes('camadas de base'));
});

test('altura em segundos e exposição normal absurda', () => {
  assert.ok(problemasPerfil({ exposicaoNormal: '8s', exposicaoBase: '80s', camadasBase: '5', alturaCamada: '0.05s' }).includes('altura de camada'));
  assert.ok(problemasPerfil({ exposicaoNormal: '0.05s', exposicaoBase: '70s', camadasBase: '5', alturaCamada: '0.05mm' }).includes('exposição normal'));
  assert.ok(problemasPerfil({ exposicaoNormal: '40s', exposicaoBase: '35s', camadasBase: '5', alturaCamada: '0.05mm' }).includes('exposição normal maior que a de base'));
});

test('perfis normais continuam no site (inclusive "10s" de camadas e altura não informada)', () => {
  assert.equal(perfilConfiavel({ exposicaoNormal: '1,3s', exposicaoBase: '22s', camadasBase: '5', alturaCamada: '0.05mm' }), true);
  assert.equal(perfilConfiavel({ exposicaoNormal: '6s', exposicaoBase: '60s', camadasBase: '10s', alturaCamada: '0.05mm' }), true);
  assert.equal(perfilConfiavel({ exposicaoNormal: '1,35s', exposicaoBase: '18s', camadasBase: '6', alturaCamada: '0.00mm' }), true);
  assert.equal(perfilConfiavel({ exposicaoNormal: '7.7', exposicaoBase: '50', camadasBase: '8', alturaCamada: '0.05mm' }), true);
});
