import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MONGO_URI ou MONGODB_URI não encontrado no .env");
  process.exit(1);
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function shortText(value, max = 140) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function summarizeValue(value, depth = 0) {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return {
      type: "string",
      preview: shortText(value),
    };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return {
      type: "date",
      value: value.toISOString(),
    };
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sample:
        value.length > 0 && depth < 2 ? summarizeValue(value[0], depth + 1) : null,
    };
  }

  if (typeof value === "object" && value._bsontype === "ObjectId") {
    return {
      type: "ObjectId",
      value: String(value),
    };
  }

  if (Buffer.isBuffer(value)) {
    return {
      type: "buffer",
      length: value.length,
    };
  }

  if (isPlainObject(value)) {
    if (depth >= 2) {
      return {
        type: "object",
        keys: Object.keys(value),
      };
    }

    const obj = {};
    for (const [key, val] of Object.entries(value)) {
      obj[key] = summarizeValue(val, depth + 1);
    }
    return obj;
  }

  return {
    type: typeof value,
    value: String(value),
  };
}

function collectPaths(value, prefix = "", out = new Set()) {
  if (value === null || value === undefined) return out;

  if (Array.isArray(value)) {
    out.add(prefix || "[]");
    if (value.length > 0) {
      collectPaths(value[0], prefix ? `${prefix}[]` : "[]", out);
    }
    return out;
  }

  if (typeof value === "object" && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    if (value._bsontype === "ObjectId") {
      out.add(prefix);
      return out;
    }

    for (const [key, val] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key;
      out.add(next);
      collectPaths(val, next, out);
    }
    return out;
  }

  if (prefix) out.add(prefix);
  return out;
}

function rankKnowledgeCollection(name, fieldPaths, sampleDocs) {
  const text = [
    name,
    ...fieldPaths,
    JSON.stringify(sampleDocs).toLowerCase(),
  ].join(" ").toLowerCase();

  let score = 0;

  const positives = [
    "problema",
    "solucao",
    "solução",
    "diagnostico",
    "diagnóstico",
    "falha",
    "erro",
    "sintoma",
    "resina",
    "impressora",
    "parametro",
    "parâmetro",
    "configuracao",
    "configuração",
    "guia",
    "tutorial",
    "suporte",
    "faq",
    "chat",
    "bot",
  ];

  for (const term of positives) {
    if (text.includes(term)) score += 2;
  }

  if (name.includes("ticket")) score -= 2;
  if (name.includes("contact")) score -= 2;
  if (name.includes("partner")) score -= 2;
  if (name.includes("cliente")) score -= 1;

  return score;
}

async function main() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const report = {
    database: db.databaseName,
    generatedAt: new Date().toISOString(),
    totalCollections: collections.length,
    collections: [],
    likelyKnowledgeCollections: [],
  };

  for (const item of collections) {
    const name = item.name;
    const collection = db.collection(name);
    const count = await collection.countDocuments();
    const docs = await collection.find({}).limit(2).toArray();

    const fieldPathsSet = new Set();
    for (const doc of docs) {
      collectPaths(doc, "", fieldPathsSet);
    }

    const fieldPaths = [...fieldPathsSet].sort();
    const sampleDocs = docs.map((doc) => summarizeValue(doc));
    const knowledgeScore = rankKnowledgeCollection(name, fieldPaths, sampleDocs);

    report.collections.push({
      name,
      count,
      fieldPaths,
      knowledgeScore,
      sampleDocs,
    });
  }

  report.likelyKnowledgeCollections = [...report.collections]
    .filter((item) => item.knowledgeScore > 0)
    .sort((a, b) => b.knowledgeScore - a.knowledgeScore)
    .map((item) => ({
      name: item.name,
      count: item.count,
      knowledgeScore: item.knowledgeScore,
      fieldPaths: item.fieldPaths,
    }));

  const outDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "atlas-knowledge-report.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

  console.log("✅ Relatório salvo em:");
  console.log(outFile);
  console.log("");
  console.log("=== COLEÇÕES MAIS PROMISSORAS PARA O BOT ===");
  for (const item of report.likelyKnowledgeCollections.slice(0, 10)) {
    console.log(`- ${item.name} | docs: ${item.count} | score: ${item.knowledgeScore}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❌ Erro ao inspecionar Atlas:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});