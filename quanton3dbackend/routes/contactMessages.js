import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

function limparTexto(valor) {
  return String(valor || "").trim();
}

router.post("/", async (req, res) => {
  try {
    const payload = {
      clienteId: limparTexto(req.body.clienteId),
      nome: limparTexto(req.body.nome),
      telefone: limparTexto(req.body.telefone),
      email: limparTexto(req.body.email).toLowerCase(),
      assunto: limparTexto(req.body.assunto),
      mensagem: limparTexto(req.body.mensagem),
      origem: limparTexto(req.body.origem) || "site",
      status: "nova",
    };

    if (!payload.nome || !payload.assunto || !payload.mensagem) {
      return res.status(400).json({
        success: false,
        message: "Preencha nome, assunto e mensagem.",
      });
    }

    const novaMensagem = await ContactMessage.create(payload);

    return res.status(201).json({
      success: true,
      message: "Mensagem enviada com sucesso.",
      contactMessage: novaMensagem,
    });
  } catch (error) {
    console.error("Erro ao criar mensagem de contato:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao salvar mensagem.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const status = limparTexto(req.query.status);
    const filtro = {};

    if (status && ["nova", "lida", "respondida", "arquivada"].includes(status)) {
      filtro.status = status;
    }

    const mensagens = await ContactMessage.find(filtro).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: mensagens.length,
      contactMessages: mensagens,
    });
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar mensagens.",
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    const status = limparTexto(req.body.status);
    const observacaoAdmin = limparTexto(req.body.observacaoAdmin);

    if (!["nova", "lida", "respondida", "arquivada"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido.",
      });
    }

    const atualizada = await ContactMessage.findByIdAndUpdate(
      id,
      {
        status,
        observacaoAdmin,
      },
      {
        new: true,
      }
    );

    if (!atualizada) {
      return res.status(404).json({
        success: false,
        message: "Mensagem não encontrada.",
      });
    }

    return res.json({
      success: true,
      message: "Status atualizado com sucesso.",
      contactMessage: atualizada,
    });
  } catch (error) {
    console.error("Erro ao atualizar mensagem:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar mensagem.",
    });
  }
});

export default router;