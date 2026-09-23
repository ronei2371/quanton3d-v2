import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPrinter, detectResin, extractEntities, resolveResinDbNames, printerKey } from '../services/rag.js';

test('distingue IRON de IRON 70/30', () => {
  assert.equal(detectResin('Uso a Iron cinza'), 'IRON');
  assert.equal(detectResin('Uso a Iron 70/30 cinza'), 'IRON 70/30');
});

test('prefere o modelo completo da impressora', () => {
  assert.equal(detectPrinter('Photon Mono M3 Premium'), 'photon mono m3 premium');
  assert.equal(detectPrinter('Elegoo Saturn 4 Ultra 16K'), 'saturn 4 ultra 16k');
});

test('recupera resina e impressora do historico recente', () => {
  const entities = extractEntities('E qual exposição base?', [
    { role: 'user', content: 'Estou usando a IRON na Mars 4 Ultra.' },
  ]);

  assert.deepEqual(entities, { resin: 'IRON', printer: 'mars 4 ultra' });
});

test('resolve nomes de resina para o cadastro do banco', () => {
  const db = ['SPIN+', 'LOWSMELL', 'IRON', 'IRON 70/30', 'VELVET', 'RPG 4K'];
  assert.deepEqual(resolveResinDbNames(detectResin('parametros da spin+'), db), ['SPIN+']);
  assert.deepEqual(resolveResinDbNames(detectResin('uso a Low Smell'), db), ['LOWSMELL']);
  assert.deepEqual(resolveResinDbNames(detectResin('uso a IRON'), db), ['IRON']);
  assert.deepEqual(resolveResinDbNames(detectResin('iron 70/30'), db), ['IRON 70/30']);
  assert.deepEqual(resolveResinDbNames(detectResin('velvet skin'), db), ['VELVET']);
  assert.deepEqual(resolveResinDbNames(detectResin('resina RPG 4K'), db), ['RPG 4K']);
});

test('reconhece modelos novos do catalogo e nomes com hifen', () => {
  const catalogo = ['mars 5 ultra', 'photon mono m7 pro', 'halot one', 'jupiter se', 'sonic mighty revo 16k'];
  assert.equal(detectPrinter('IRON na Mars 5 Ultra', catalogo), 'mars 5 ultra');
  assert.equal(detectPrinter('minha anycubic m7 pro', catalogo), 'photon mono m7 pro');
  assert.equal(detectPrinter('Halot-One', catalogo), 'halot one');
  assert.equal(detectPrinter('tenho uma Sonic Mighty Revo 16K', catalogo), 'sonic mighty revo 16k');
  assert.equal(printerKey('Photon Mono M3'), printerKey('Photon M3'));
});

test('nao confunde palavra comum com resina', () => {
  assert.equal(detectResin('o spinner da maquina'), '');
  assert.equal(detectResin('miniaturas de RPG'), '');
});

test('usa a resina que o cliente disse e nao a que o bot citou de passagem', () => {
  const entities = extractEntities('e na Mars 5?', [
    { role: 'user', content: 'uso a SPARK' },
    { role: 'assistant', content: 'Para miniaturas compare ALCHEMIST e PYROBLAST.' },
    { role: 'user', content: 'e na Mars 5?' },
  ]);
  assert.equal(entities.resin, 'SPARK');
});
