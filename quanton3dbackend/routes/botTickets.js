import express from "express";
import BotTicket from "../models/BotTicket.js";
import uploadBotTicketImages from "../middleware/botTicketUpload.js";
import {
  diagnoseTechnicalIssue,
  getProblemCatalog,
} from "../services/diagnosticEngine.js";

const router = express.Router();

function limparTexto(valor) {
  return String(valor || "").trim();
}

router.get("/catalog", (_req, res) => {
  try {
    return res.json({
      success: true,
      totalCategories: getProblemCatalog().length,
      catalog: getProblemCatalog(),
    });
  } catch (error) {
    console.error("Erro ao carregar catálogo de problemas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao carregar catálogo de problemas.",
    });
  }
});

router.post("/", (req, res) => {
  uploadBotTicketImages.array("fotos", 6)(req, res, async (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({
        success: false,
        message: erroUpload.message || "Erro ao enviar imagens.",
      });
    }

    try {
      const problemaOriginal = limparTexto(req.body.problema || req.body.problem);

      const payload = {
        clienteId: limparTexto(req.body.clienteId),
        nome: limparTexto(req.body.nome),
        telefone: limparTexto(req.body.telefone),
        email: limparTexto(req.body.email).toLowerCase(),
        resina: limparTexto(req.body.resina),
        impressora: limparTexto(req.body.impressora),
        problema: problemaOriginal,
        descricao: limparTexto(req.body.descricao),
        parametrosInformados: limparTexto(req.body.parametrosInformados),
        feedbackCliente: "",
        status: "novo",
        observacaoAdmin: "",
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

      const diagnostico = await diagnoseTechnicalIssue({
        problem: payload.problema,
        description: payload.descricao,
        resina: payload.resina,
        impressora: payload.impressora,
        exposicaoNormal: limparTexto(req.body.exposicaoNormal),
        exposicaoBase: limparTexto(req.body.exposicaoBase),
        camadasBase: limparTexto(req.body.camadasBase),
        alturaCamada: limparTexto(req.body.alturaCamada),
        liftSpeed: limparTexto(req.body.liftSpeed),
        temperaturaAmbiente: limparTexto(req.body.temperaturaAmbiente),
        nivelamentoRecente: limparTexto(req.body.nivelamentoRecente),
        resinaCondicao: limparTexto(req.body.resinaCondicao),
        momentoFalha: limparTexto(req.body.momentoFalha),
        localFalha: limparTexto(req.body.localFalha),
        diametroSuporte: limparTexto(req.body.diametroSuporte),
        contatoSuporte: limparTexto(req.body.contatoSuporte),
        angulacaoPeca: limparTexto(req.body.angulacaoPeca),
        tempoCuraUv: limparTexto(req.body.tempoCuraUv),
        secagemAntesCura: limparTexto(req.body.secagemAntesCura),
        alcoolPureza: limparTexto(req.body.alcoolPureza),
        alcoolReuso: limparTexto(req.body.alcoolReuso),
        observacoesTecnicas: limparTexto(req.body.observacoesTecnicas),
        guidedAnswers: (() => {
          try {
            return JSON.parse(req.body.guidedAnswers || "{}");
          } catch {
            return {};
          }
        })(),
      });

      payload.problema =
        diagnostico?.detectedProblem?.label || payload.problema;
      payload.respostaBot =
        diagnostico?.finalAnswer ||
        "Não foi possível gerar diagnóstico automático.";
      payload.confiancaBot = Number(diagnostico?.confidence || 0);
      payload.precisaHumano = Boolean(
        diagnostico?.shouldEscalateToAdmin ?? true
      );

      const novoTicket = await BotTicket.create(payload);

      return res.status(201).json({
        success: true,
        message: "Ticket técnico criado com sucesso.",
        botTicket: novoTicket,
        diagnostico,
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
    const filtro = {};

    if (
      status &&
      ["novo", "em_analise", "respondido", "encaminhado", "fechado"].includes(
        status
      )
    ) {
      filtro.status = status;
    }

    const tickets = await BotTicket.find(filtro).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: tickets.length,
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
