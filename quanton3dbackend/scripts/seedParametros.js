import mongoose from "mongoose";
import dotenv from "dotenv";
import Parametro from "../models/Parametro.js";

dotenv.config();

const parametros = [
  { resina: "Iron", impressora: "MARS 2 PRO", alturaCamada: "0.05mm", exposicaoNormal: "1.55s", exposicaoBase: "25s", camadasBase: "5" },
  { resina: "Iron", impressora: "MARS 3 ULTRA", alturaCamada: "0.05mm", exposicaoNormal: "1.7s", exposicaoBase: "33s", camadasBase: "5" },
  { resina: "LowSmell", impressora: "MARS 2 PRO", alturaCamada: "0.05mm", exposicaoNormal: "5s", exposicaoBase: "30s", camadasBase: "5" },
  { resina: "LowSmell", impressora: "LD-006", alturaCamada: "0.05mm", exposicaoNormal: "10s", exposicaoBase: "45s", camadasBase: "5" },
  { resina: "Flexform", impressora: "MARS 2 PRO", alturaCamada: "0.05mm", exposicaoNormal: "3.5s", exposicaoBase: "35s", camadasBase: "5" }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Mongo conectado");

    await Parametro.deleteMany({});
    await Parametro.insertMany(parametros);

    console.log("Parâmetros inseridos com sucesso:", parametros.length);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao popular parâmetros:", err);
    process.exit(1);
  }
}

seed();