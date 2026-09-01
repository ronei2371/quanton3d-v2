import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPrinter, detectResin, extractEntities } from '../services/rag.js';

test('distingue IRON de IRON 70/30', () => {
  assert.equal(detectResin('Uso a Iron cinza'), 'IRON');
  assert.equal(detectResin('Uso a Iron 70/30 cinza'), 'IRON 70/30');
});

test('prefere o modelo completo da impressora', () => {
  assert.equal(detectPrinter('Photon Mono M3 Premium'), 'photon mono m3 premium');
  assert.equal(detectPrinter('Elegoo Saturn 4 Ultra 16K'), 'saturn 4 ultra');
});

test('recupera resina e impressora do historico recente', () => {
  const entities = extractEntities('E qual exposição base?', [
    { role: 'user', content: 'Estou usando a IRON na Mars 4 Ultra.' },
  ]);

  assert.deepEqual(entities, { resin: 'IRON', printer: 'mars 4 ultra' });
});
