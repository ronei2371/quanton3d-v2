/**
 * Migração de imagens da galeria do MongoDB para Cloudflare R2
 * Uso: node scripts/migrarParaR2.js
 *
 * - Busca itens com `imagem` (base64) e sem `imagemUrl`
 * - Faz upload de cada um para R2
 * - Atualiza o doc com a URL e limpa o campo `imagem`
 * - Seguro de rodar mais de uma vez (idempotente)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import GalleryItem from '../models/GalleryItem.js';
import { uploadBase64ParaR2 } from '../services/r2Storage.js';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI não definida. Abortando.');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('✅  Conectado ao MongoDB');

// Itens que ainda têm base64 e não foram migrados
const pendentes = await GalleryItem.find({
  imagem: { $exists: true, $ne: '' },
  $or: [{ imagemUrl: { $exists: false } }, { imagemUrl: '' }],
}).select('_id imagem').lean();

console.log(`📦  ${pendentes.length} item(ns) para migrar`);

let ok = 0;
let erros = 0;

for (const doc of pendentes) {
  try {
    const url = await uploadBase64ParaR2(doc.imagem, 'gallery');
    await GalleryItem.updateOne(
      { _id: doc._id },
      { $set: { imagemUrl: url }, $unset: { imagem: '' } }
    );
    ok++;
    console.log(`  ✓ [${ok}/${pendentes.length}] ${doc._id} → ${url}`);
  } catch (err) {
    erros++;
    console.error(`  ✗ ${doc._id}: ${err.message}`);
  }
}

await mongoose.disconnect();
console.log(`\n🏁  Migração concluída — ${ok} OK, ${erros} erro(s)`);
