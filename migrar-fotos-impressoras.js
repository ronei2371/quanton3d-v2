/**
 * Script de migração — preenche fotoImpressora nos parâmetros já cadastrados
 * Uso: node migrar-fotos-impressoras.js
 * Requer: MONGODB_URI no .env (ou variável de ambiente já exportada)
 */

import "dotenv/config";
import mongoose from "mongoose";

const PRINTER_PHOTOS = {
  "elegoo mars 4 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Mars_4_Ultra.png",
  "elegoo saturn 3 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_SATURN_3_Ultra.png",
  "elegoo saturn 3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_SATURN_3.png",
  "elegoo mars 3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_MARS_3.png",
  "elegoo mars 5 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Mars_5_Ultra.png",
  "elegoo saturn 4 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Saturn_4_Ultra.png",
  "elegoo jupiter": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Jupiter.png",
  "anycubic photon mono m5s pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_Mono_M5s_Pro.png",
  "anycubic photon mono m5s": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_Mono_M5s.png",
  "anycubic photon m3 max": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_M3_Max.png",
  "anycubic photon m3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_M3.png",
  "anycubic photon mono m7": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_Anycubic_Photon_Mono_M7.png",
  "anycubic photon mono x 6k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_Mono_X_6K.png",
  "photon m3 max": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_M3_Max.png",
  "photon m3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_M3.png",
  "photon mono m5s pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_Mono_M5s_Pro.png",
  "photon mono m5s": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_AnyCubic_Photon_Mono_M5s.png",
  "photon mono m7": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/AnyCubic_Anycubic_Photon_Mono_M7.png",
  "phrozen sonic mini 4k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mini_4K.png",
  "phrozen sonic mini 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mini_8K.png",
  "phrozen sonic mega 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mega_8K.png",
  "phrozen sonic mighty 4k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mighty_4K.png",
  "phrozen sonic mighty 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mighty_8K.png",
  "sonic mini 4k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mini_4K.png",
  "sonic mini 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mini_8K.png",
  "sonic mega 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mega_8K.png",
  "sonic mighty 4k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mighty_4K.png",
  "sonic mighty 8k": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Phrozen_Phrozen_Sonic_Mighty_8K.png",
  "uniformation gktwo": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Uniformation_UniFormation_GKtwo.png",
  "gktwo": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Uniformation_UniFormation_GKtwo.png",
  "creality halot one pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/CREALITY_HALOT-ONE_PRO.png",
  "creality halot mage pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/CREALITY_HALOT-MAGE_PRO.png",
  "halot one pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/CREALITY_HALOT-ONE_PRO.png",
  "halot mage pro": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/CREALITY_HALOT-MAGE_PRO.png",
  "mars 4 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Mars_4_Ultra.png",
  "mars 5 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Mars_5_Ultra.png",
  "saturn 3 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_SATURN_3_Ultra.png",
  "saturn 4 ultra": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_Saturn_4_Ultra.png",
  "saturn 3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_SATURN_3.png",
  "mars 3": "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/Elegoo_ELEGOO_MARS_3.png",
};

function buscarFoto(nomeImpressora) {
  if (!nomeImpressora) return null;
  const n = nomeImpressora.toLowerCase().trim();

  // 1. Exato
  if (PRINTER_PHOTOS[n]) return PRINTER_PHOTOS[n];

  // 2. O nome do banco contém a chave do mapa (mais longa primeiro para evitar match curto)
  const porTamanho = Object.entries(PRINTER_PHOTOS).sort((a, b) => b[0].length - a[0].length);
  for (const [k, v] of porTamanho) {
    if (n.includes(k)) return v;
  }

  // 3. A chave do mapa contém o nome do banco
  for (const [k, v] of porTamanho) {
    if (k.includes(n)) return v;
  }

  return null;
}

const Schema = new mongoose.Schema({ impressora: String, fotoImpressora: String }, { strict: false });
const Parametro = mongoose.model("Parametro", Schema);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("❌ MONGODB_URI não encontrado no .env"); process.exit(1); }

  await mongoose.connect(uri);
  console.log("✅ Conectado ao MongoDB\n");

  const todos = await Parametro.find({});
  console.log(`📋 Total de parâmetros: ${todos.length}\n`);

  let atualizados = 0;
  let semFoto = 0;

  for (const p of todos) {
    if (p.fotoImpressora) {
      console.log(`⏭️  Já tem foto: ${p.impressora}`);
      continue;
    }
    const foto = buscarFoto(p.impressora);
    if (foto) {
      await Parametro.updateOne({ _id: p._id }, { $set: { fotoImpressora: foto } });
      console.log(`✅ Atualizado: ${p.impressora}`);
      atualizados++;
    } else {
      console.log(`⚠️  Sem foto encontrada: ${p.impressora}`);
      semFoto++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   Atualizados: ${atualizados}`);
  console.log(`   Sem match:   ${semFoto}`);
  console.log(`   Com foto já: ${todos.length - atualizados - semFoto}`);

  await mongoose.disconnect();
  console.log("\n✅ Concluído!");
}

main().catch(err => { console.error(err); process.exit(1); });
