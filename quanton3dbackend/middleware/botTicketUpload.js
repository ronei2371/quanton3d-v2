import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads", "bot-tickets");
fs.mkdirSync(uploadDir, { recursive: true });

function limparNomeArquivo(nome = "") {
  return String(nome)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const nomeLimpo = limparNomeArquivo(file.originalname || "imagem");
    cb(null, `${timestamp}-${nomeLimpo}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Apenas imagens são permitidas."));
};

const uploadBotTicketImages = multer({
  storage,
  fileFilter,
  limits: {
    files: 6,
    fileSize: 8 * 1024 * 1024,
  },
});

export default uploadBotTicketImages;