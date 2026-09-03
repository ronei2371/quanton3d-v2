import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFounderPhones,
  isFounderPhone,
  normalizePhone,
} from '../services/founderIdentity.js';

test('normaliza telefone nacional e com codigo do Brasil', () => {
  assert.equal(normalizePhone('(31) 98888-7777'), '31988887777');
  assert.equal(normalizePhone('+55 31 98888-7777'), '31988887777');
});

test('carrega somente telefones validos da variavel segura', () => {
  const env = { FOUNDER_PHONES: '+55 31 98888-7777, 11 97777-6666; invalido' };
  assert.deepEqual(getFounderPhones(env), ['31988887777', '11977776666']);
});

test('reconhece somente correspondencia completa e nao usa sufixo parcial', () => {
  const env = { FOUNDER_PHONES: '31988887777' };
  assert.equal(isFounderPhone('+55 31 98888-7777', env), true);
  assert.equal(isFounderPhone('988887777', env), false);
  assert.equal(isFounderPhone('31988887770', env), false);
  assert.equal(isFounderPhone('9931988887777', env), false);
});

test('sem variavel segura nao autoriza telefone algum', () => {
  assert.equal(isFounderPhone('31988887777', {}), false);
});
