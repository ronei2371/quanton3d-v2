// Copia de seguranca do banco (MongoDB Atlas gratuito nao faz backup automatico).
// Formato: arquivo .ndjson.gz, uma linha por documento: {"c":"colecao","d":{...}}.
// A primeira linha e o cabecalho {"tipo":"quanton3d-backup",...}. Os documentos usam
// Extended JSON (EJSON), que guarda ObjectId e datas do jeito certo para restaurar.
// Restaurar: node scripts/restaurar-backup.mjs arquivo.ndjson.gz (ver o script).

import { createGzip } from 'node:zlib';
import mongoose from 'mongoose';

const { EJSON } = mongoose.mongo.BSON;

export const VERSAO_BACKUP = 1;

export function linhaCabecalho(colecoes, agora = new Date()) {
  return JSON.stringify({ tipo: 'quanton3d-backup', versao: VERSAO_BACKUP, geradoEm: agora.toISOString(), colecoes }) + '\n';
}

export function linhaDocumento(colecao, doc) {
  return JSON.stringify({ c: colecao, d: EJSON.serialize(doc, { relaxed: false }) }) + '\n';
}

export function nomeArquivoBackup(agora = new Date()) {
  return `quanton3d-backup-${agora.toISOString().slice(0, 10)}.ndjson.gz`;
}

// Escreve o backup compactado em "destino" (a resposta HTTP). Documento por documento,
// sem carregar o banco inteiro na memoria.
export async function escreverBackup(destino, db = mongoose.connection.db) {
  const lista = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();

  const contagem = {};
  for (const nome of lista) contagem[nome] = await db.collection(nome).estimatedDocumentCount();

  const gzip = createGzip({ level: 6 });
  gzip.pipe(destino);
  const escrever = (texto) => (gzip.write(texto) ? Promise.resolve() : new Promise((ok) => gzip.once('drain', ok)));

  await escrever(linhaCabecalho(contagem));
  let total = 0;
  for (const nome of lista) {
    const cursor = db.collection(nome).find({}, { batchSize: 200 });
    for await (const doc of cursor) {
      await escrever(linhaDocumento(nome, doc));
      total += 1;
    }
  }
  await new Promise((ok) => gzip.end(ok));
  return { colecoes: lista.length, documentos: total };
}

// Le as linhas de um backup (ja descompactado) e agrupa os documentos por colecao.
export function lerLinhasBackup(texto) {
  const linhas = String(texto).split('\n').filter(Boolean);
  if (!linhas.length) throw new Error('Arquivo de backup vazio.');
  const cabecalho = JSON.parse(linhas[0]);
  if (cabecalho.tipo !== 'quanton3d-backup') throw new Error('Este arquivo não é um backup da Quanton3D.');
  const porColecao = {};
  for (const linha of linhas.slice(1)) {
    const { c, d } = JSON.parse(linha);
    (porColecao[c] ||= []).push(EJSON.deserialize(d, { relaxed: false }));
  }
  return { cabecalho, porColecao };
}
