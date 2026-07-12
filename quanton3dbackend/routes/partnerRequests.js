import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import PartnerRequest from "../models/PartnerRequest.js";

const router = express.Router();

// Memória — converte pra Base64, não depende de disco (Render não persiste disco entre deploys)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 6, fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Apenas imagens são permitidas."));
  },
});

function authAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: "Token ausente" });
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Token inválido" });
  }
}

function limparTexto(valor) {
  return String(valor || "").trim();
}

// Envio do formulário "Quero ser parceiro" — público
router.post("/", (req, res) => {
  upload.array("fotos", 6)(req, res, async (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({ success: false, message: erroUpload.message || "Erro ao enviar imagens." });
    }

    try {
      const payload = {
        nome: limparTexto(req.body.nome),
        telefone: limparTexto(req.body.telefone),
        email: limparTexto(req.body.email).toLowerCase(),
        instagram: limparTexto(req.body.instagram),
        site: limparTexto(req.body.site),
        tipo: limparTexto(req.body.tipo) || "Quero ser parceiro",
        titulo: limparTexto(req.body.titulo),
        descricao: limparTexto(req.body.descricao),
        categoria: limparTexto(req.body.categoria) || "Parceiro",
        cidade: limparTexto(req.body.cidade),
        estado: limparTexto(req.body.estado),
        portfolio: limparTexto(req.body.portfolio),
        origem: limparTexto(req.body.origem) || "site",
        status: "pendente",
        // Fotos em Base64 — persistem no MongoDB, sem depender de disco
        fotos: (req.files || []).map((file) => ({
          nomeOriginal: file.originalname || "",
          nomeArquivo: file.originalname || "",
          url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          mimeType: file.mimetype || "",
          tamanho: file.size || 0,
        })),
      };

      if (!payload.nome || !payload.telefone || !payload.email || !payload.titulo || !payload.descricao) {
        return res.status(400).json({ success: false, message: "Preencha nome, telefone, e-mail, título e descrição." });
      }

      const novaSolicitacao = await PartnerRequest.create(payload);
      return res.status(201).json({ success: true, message: "Solicitação de parceria enviada com sucesso.", partnerRequest: novaSolicitacao });
    } catch (error) {
      console.error("Erro ao criar solicitação de parceiro:", error);
      return res.status(500).json({ success: false, message: "Erro interno ao salvar solicitação de parceria." });
    }
  });
});

// Listagem completa — protegida (evita vazar nome/telefone/email dos candidatos a parceiro)
router.get("/", authAdmin, async (req, res) => {
  try {
    const status = limparTexto(req.query.status);
    const limite = Math.min(300, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const filtro = {};
    if (status && ["pendente", "aprovado", "rejeitado"].includes(status)) {
      filtro.status = status;
    }

    const [total, solicitacoes] = await Promise.all([
      PartnerRequest.countDocuments(filtro),
      PartnerRequest.find(filtro).sort({ createdAt: -1 }).limit(limite).lean(),
    ]);

    return res.json({ success: true, total, partnerRequests: solicitacoes });
  } catch (error) {
    console.error("Erro ao listar solicitações de parceiros:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao listar solicitações." });
  }
});

// Lista pública de parceiros já aprovados — sem dados sensíveis, só o que aparece no site
router.get("/public/aprovados", async (req, res) => {
  try {
    const limite = Math.min(300, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const parceiros = await PartnerRequest.find({ status: "aprovado" })
      .select("nome titulo descricao categoria cidade estado instagram site portfolio fotos updatedAt")
      .sort({ updatedAt: -1 })
      .limit(limite)
      .lean();

    return res.json({ success: true, total: parceiros.length, partners: parceiros });
  } catch (error) {
    console.error("Erro ao listar parceiros aprovados:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao listar parceiros aprovados." });
  }
});

// Atualizar status — protegida, só admin aprova/rejeita
router.patch("/:id/status", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const status = limparTexto(req.body.status);
    const observacaoAdmin = limparTexto(req.body.observacaoAdmin);

    if (!["pendente", "aprovado", "rejeitado"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status inválido. Use pendente, aprovado ou rejeitado." });
    }

    const atualizada = await PartnerRequest.findByIdAndUpdate(id, { status, observacaoAdmin }, { new: true });
    if (!atualizada) return res.status(404).json({ success: false, message: "Solicitação não encontrada." });

    return res.json({ success: true, message: "Status atualizado com sucesso.", partnerRequest: atualizada });
  } catch (error) {
    console.error("Erro ao atualizar status da parceria:", error);
    return res.status(500).json({ success: false, message: "Erro interno ao atualizar status." });
  }
});

export default router;
