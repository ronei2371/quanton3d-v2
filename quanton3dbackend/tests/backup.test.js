import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { linhaCabecalho, linhaDocumento, lerLinhasBackup, nomeArquivoBackup } from '../services/backup.js';

test('backup volta igual: ObjectId, data e acento', () => {
  const id = new mongoose.Types.ObjectId();
  const doc = { _id: id, nome: 'Peça ✓', criado: new Date('2026-09-29T10:00:00Z'), n: 1.5 };
  const texto = linhaCabecalho({ clientes: 1 }) + linhaDocumento('clientes', doc);
  const { cabecalho, porColecao } = lerLinhasBackup(texto);
  assert.equal(cabecalho.tipo, 'quanton3d-backup');
  const volta = porColecao.clientes[0];
  assert.ok(volta._id.equals(id));
  assert.ok(volta.criado instanceof Date);
  assert.equal(volta.criado.toISOString(), '2026-09-29T10:00:00.000Z');
  assert.equal(volta.nome, 'Peça ✓');
});

test('recusa arquivo que nao e backup da Quanton3D', () => {
  assert.throws(() => lerLinhasBackup('{"tipo":"outro"}\n'), /não é um backup/);
});

test('nome do arquivo com a data', () => {
  assert.equal(nomeArquivoBackup(new Date('2026-09-29T12:00:00Z')), 'quanton3d-backup-2026-09-29.ndjson.gz');
});
