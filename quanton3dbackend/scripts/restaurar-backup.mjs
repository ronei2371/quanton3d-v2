// Restaura uma copia de seguranca baixada no ADM (aba "Cópia de segurança").
// Use so em emergencia (banco apagado ou corrompido), de preferencia com ajuda tecnica.
//
//   MONGODB_URI="mongodb+srv://..." node scripts/restaurar-backup.mjs quanton3d-backup-AAAA-MM-DD.ndjson.gz
//
// Por seguranca, so grava em colecoes VAZIAS. Para trocar o conteudo de colecoes que ja
// tem dados, acrescente --substituir (apaga o que existe nelas e grava o do backup).
// Para restaurar so algumas: --colecoes=parametros,sugestaoconhecimentos

import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import mongoose from 'mongoose';
import { lerLinhasBackup } from '../services/backup.js';

const args = process.argv.slice(2);
const arquivo = args.find((a) => !a.startsWith('--'));
const substituir = args.includes('--substituir');
const soColecoes = (args.find((a) => a.startsWith('--colecoes=')) || '').split('=')[1]?.split(',').filter(Boolean) || null;

if (!arquivo) { console.error('Informe o arquivo de backup.'); process.exit(1); }
if (!process.env.MONGODB_URI) { console.error('Defina MONGODB_URI (endereço do banco de destino).'); process.exit(1); }

const bruto = readFileSync(arquivo);
const texto = arquivo.endsWith('.gz') ? gunzipSync(bruto).toString('utf8') : bruto.toString('utf8');
const { cabecalho, porColecao } = lerLinhasBackup(texto);
console.log(`Backup de ${cabecalho.geradoEm} com ${Object.keys(porColecao).length} coleções.`);

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
let erro = false;
for (const [nome, docs] of Object.entries(porColecao)) {
  if (soColecoes && !soColecoes.includes(nome)) continue;
  const col = db.collection(nome);
  const existentes = await col.countDocuments();
  if (existentes > 0 && !substituir) {
    console.log(`PULEI  ${nome}: já tem ${existentes} documentos (use --substituir para trocar).`);
    continue;
  }
  if (existentes > 0) await col.deleteMany({});
  for (let i = 0; i < docs.length; i += 500) await col.insertMany(docs.slice(i, i + 500), { ordered: false });
  const agora = await col.countDocuments();
  const ok = agora === docs.length;
  if (!ok) erro = true;
  console.log(`${ok ? 'OK    ' : 'CONFIRA'} ${nome}: ${agora} de ${docs.length} documentos.`);
}
await mongoose.disconnect();
process.exit(erro ? 1 : 0);
