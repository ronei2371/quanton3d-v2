import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import * as cheerio from "cheerio";
import Parametro from "../models/Parametro.js";

dotenv.config();

const htmlPath = path.join(process.cwd(), "scripts", "parametros.html");

function limparTexto(valor = "") {
  return String(valor)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairResina(titulo = "") {
  const texto = limparTexto(titulo).toUpperCase();

  const match = texto.match(/RESINA\s+(.+?)(\s+-\s+|\s*$)/);
  if (match?.[1]) return limparTexto(match[1]);

  return limparTexto(titulo)
    .replace(/PARÂMETROS/gi, "")
    .replace(/PARAMETROS/gi, "")
    .replace(/DE IMPRESSÃO/gi, "")
    .replace(/CHITUBOX/gi, "")
    .replace(/RESINA/gi, "")
    .replace(/-/g, " ")
    .trim()
    .toUpperCase();
}

async function seed() {
  try {
    const html = fs.readFileSync(htmlPath, "utf8");
    const $ = cheerio.load(html);

    const parametros = [];
    let resinaAtual = "";

    $("tr").each((_, tr) => {
      const cells = $(tr).find("td").map((_, td) => limparTexto($(td).text())).get();

      if (!cells.length) return;

      const linhaTexto = cells.join(" ").toUpperCase();

      if (linhaTexto.includes("PARÂMETROS DE IMPRESSÃO") || linhaTexto.includes("PARAMETROS DE IMPRESSAO")) {
        resinaAtual = extrairResina(cells[0]);
        return;
      }

      if (
        !resinaAtual ||
        cells.length < 6 ||
        cells[0].toUpperCase().includes("MARCA") ||
        cells[1].toUpperCase().includes("MODELO")
      ) {
        return;
      }

      const marca = cells[0];
      const modelo = cells[1];
      const alturaCamada = cells[2];
      const camadasBase = cells[3];
      const exposicaoNormal = cells[4];
      const exposicaoBase = cells[5];
      const retardoUV = cells[6] || "";
      const retardoUVBase = cells[7] || "";
      const descansoAntesElevacao = cells[8] || "";
      const descansoAposElevacao = cells[9] || "";
      const descansoAposRetracao = cells[10] || "";
      const potenciaUV = cells[11] || "";

      if (!marca || !modelo) return;
      if (!alturaCamada && !camadasBase && !exposicaoNormal && !exposicaoBase) return;

      parametros.push({
        resina: resinaAtual,
        marca,
        impressora: modelo,
        alturaCamada,
        camadasBase,
        exposicaoNormal: exposicaoNormal ? `${exposicaoNormal}s`.replace("ss", "s") : "",
        exposicaoBase: exposicaoBase ? `${exposicaoBase}s`.replace("ss", "s") : "",
        retardoUV,
        retardoUVBase,
        descansoAntesElevacao,
        descansoAposElevacao,
        descansoAposRetracao,
        potenciaUV,
      });
    });

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Mongo conectado");

    await Parametro.deleteMany({});
    await Parametro.insertMany(parametros);

    console.log(`✅ Importação concluída: ${parametros.length} parâmetros inseridos.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao importar HTML:", err);
    process.exit(1);
  }
}

seed();