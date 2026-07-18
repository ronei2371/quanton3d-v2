import express from "express";
import multer from "multer";
import authAdmin from "../middlewares/authAdmin.js";
import { authAdminOuAtendente } from "../middlewares/authAtendente.js";
import BotTicket from "../models/BotTicket.js";

const router = express.Router();

// Salva em memória — converte para Base64, não depende de disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
});

function limparTexto(valor) {
  return String(valor || "").trim();
}

router.post("/", upload.array("fotos", 4), async (req, res) => {
  try {
    const payload = {
      clienteId: limparTexto(req.body.clienteId),
      nome: limparTexto(req.body.nome),
      telefone: limparTexto(req.body.telefone),
      email: limparTexto(req.body.email).toLowerCase(),
      resina: limparTexto(req.body.resina),
      impressora: limparTexto(req.body.impressora),
      problema: limparTexto(req.body.problema),
      descricao: limparTexto(req.body.descricao),
      parametrosInformados: limparTexto(req.body.parametrosInformados),
      feedbackCliente: "",
      status: "novo",
      // Converte fotos para Base64 — persiste no MongoDB sem depender de disco
      fotos: (req.files || []).map((file) => ({
        nomeOriginal: file.originalname || "",
        nomeArquivo: file.originalname || "",
        url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        mimeType: file.mimetype || "",
        tamanho: file.size || 0,
      })),
    };

    if (!payload.nome || !payload.problema) {
      return res.status(400).json({
        success: false,
        message: "Preencha nome e problema.",
      });
    }

    payload.respostaBot = `Chamado registrado. Resina: ${payload.resina || "não informada"}, Impressora: ${payload.impressora || "não informada"}, Problema: ${payload.problema}. Nossa equipe técnica analisará e entrará em contato pelo WhatsApp.`;
    payload.confiancaBot = 35;
    payload.precisaHumano = true;

    const novoTicket = await BotTicket.create(payload);

    return res.status(201).json({
      success: true,
      message: "Chamado técnico criado com sucesso.",
      botTicket: novoTicket,
    });
  } catch (error) {
    console.error("Erro ao criar chamado:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao salvar chamado.",
    });
  }
});

router.get("/", authAdminOuAtendente, async (req, res) => { // protegido — aceita superadmin e atendentes
  try {
    const limite = Math.min(300, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const filtro = {};
    const status = limparTexto(req.query.status);
    if (status && ["novo","em_analise","respondido","encaminhado","fechado"].includes(status)) {
      filtro.status = status;
    }

    const [total, tickets] = await Promise.all([
      BotTicket.countDocuments(filtro),
      BotTicket.find(filtro).sort({ createdAt: -1 }).limit(limite).lean(),
    ]);

    return res.json({ success: true, total, botTickets: tickets });
  } catch (error) {
    console.error("Erro ao listar chamados:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

router.patch("/:id/status", authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const status = limparTexto(req.body.status);
    const observacaoAdmin = limparTexto(req.body.observacaoAdmin);
    const respostaBot = limparTexto(req.body.respostaBot);
    const feedbackCliente = limparTexto(req.body.feedbackCliente);

    if (status && !["novo","em_analise","respondido","encaminhado","fechado"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status inválido." });
    }

    const atualizacao = {};
    if (status) atualizacao.status = status;
    if (observacaoAdmin) atualizacao.observacaoAdmin = observacaoAdmin;
    if (respostaBot) atualizacao.respostaBot = respostaBot;
    if (feedbackCliente) atualizacao.feedbackCliente = feedbackCliente;

    const ticket = await BotTicket.findByIdAndUpdate(id, atualizacao, { new: true });
    if (!ticket) return res.status(404).json({ success: false, message: "Chamado não encontrado." });

    return res.json({ success: true, botTicket: ticket });
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

export default router;
