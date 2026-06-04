import express from "express";
import BotTicket from "../models/BotTicket.js";
import uploadBotTicketImages from "../middleware/botTicketUpload.js";

const router = express.Router();

function limparTexto(valor) {
  return String(valor || "").trim();
}

function gerarRespostaInicial({ problema, resina, impressora, descricao }) {
  const partes = [];

  if (problema) {
    partes.push(`Problema informado: ${problema}.`);
  }

  if (resina) {
    partes.push(`Resina: ${resina}.`);
  }

  if (impressora) {
    partes.push(`Impressora: ${impressora}.`);
  }

  if (descricao) {
    partes.push(`Descrição recebida: ${descricao}.`);
  }

  partes.push(
    "Seu caso foi registrado para análise técnica da Quanton3D. Se necessário, ele será encaminhado para atendimento humano."
  );

  return partes.join(" ");
}

router.post("/", (req, res) => {
  uploadBotTicketImages.array("fotos", 6)(req, res, async (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({
        success: false,
        message: erroUpload.message || "Erro ao enviar imagens.",
      });
    }

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
        fotos: (req.files || []).map((file) => ({
          nomeOriginal: file.originalname || "",
          nomeArquivo: file.filename || "",
          url: `/uploads/bot-tickets/${file.filename}`,
          mimeType: file.mimetype || "",
          tamanho: file.size || 0,
        })),
      };

      if (!payload.nome || !payload.problema || !payload.descricao) {
        return res.status(400).json({
          success: false,
          message: "Preencha nome, problema e descrição.",
        });
      }

      payload.respostaBot = gerarRespostaInicial(payload);
      payload.confiancaBot = 35;
      payload.precisaHumano = true;

      const novoTicket = await BotTicket.create(payload);

      return res.status(201).json({
        success: true,
        message: "Ticket técnico criado com sucesso.",
        botTicket: novoTicket,
      });
    } catch (error) {
      console.error("Erro ao criar bot ticket:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno ao salvar ticket técnico.",
      });
    }
  });
});

router.get("/", async (req, res) => {
  try {
    const status = limparTexto(req.query.status);
    const limite = Math.min(
      300,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 100)
    );
    const filtro = {};

    if (
      status &&
      ["novo", "em_analise", "respondido", "encaminhado", "fechado"].includes(
        status
      )
    ) {
      filtro.status = status;
    }

    const [total, tickets] = await Promise.all([
      BotTicket.countDocuments(filtro),
      BotTicket.find(filtro).sort({ createdAt: -1 }).limit(limite).lean(),
    ]);

    return res.json({
      success: true,
      total,
      botTickets: tickets,
    });
  } catch (error) {
    console.error("Erro ao listar bot tickets:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar tickets.",
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    const status = limparTexto(req.body.status);
    const observacaoAdmin = limparTexto(req.body.observacaoAdmin);
    const respostaBot = limparTexto(req.body.respostaBot);
    const feedbackCliente = limparTexto(req.body.feedbackCliente);

    if (
      status &&
      !["novo", "em_analise", "respondido", "encaminhado", "fechado"].includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Status inválido.",
      });
    }

    if (
      feedbackCliente &&
      !["ajudou", "nao_ajudou"].includes(feedbackCliente)
    ) {
      return res.status(400).json({
        success: false,
        message: "Feedback inválido.",
      });
    }

    const atualizacao = {};

    if (status) atualizacao.status = status;
    if (observacaoAdmin) atualizacao.observacaoAdmin = observacaoAdmin;
    if (respostaBot) atualizacao.respostaBot = respostaBot;
    if (feedbackCliente !== "") atualizacao.feedbackCliente = feedbackCliente;

    const ticketAtualizado = await BotTicket.findByIdAndUpdate(id, atualizacao, {
      new: true,
    });

    if (!ticketAtualizado) {
      return res.status(404).json({
        success: false,
        message: "Ticket não encontrado.",
      });
    }

    return res.json({
      success: true,
      message: "Ticket atualizado com sucesso.",
      botTicket: ticketAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar bot ticket:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar ticket.",
    });
  }
});

export default router;
