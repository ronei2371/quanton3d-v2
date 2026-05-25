import express from "express";
import PartnerRequest from "../models/PartnerRequest.js";
import uploadPartnerImages from "../middleware/partnerUpload.js";

const router = express.Router();

function limparTexto(valor) {
  return String(valor || "").trim();
}

router.post("/", (req, res) => {
  uploadPartnerImages.array("fotos", 6)(req, res, async (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({
        success: false,
        message: erroUpload.message || "Erro ao enviar imagens.",
      });
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
        fotos: (req.files || []).map((file) => ({
          nomeOriginal: file.originalname || "",
          nomeArquivo: file.filename || "",
          url: `/uploads/partners/${file.filename}`,
          mimeType: file.mimetype || "",
          tamanho: file.size || 0,
        })),
      };

      if (
        !payload.nome ||
        !payload.telefone ||
        !payload.email ||
        !payload.titulo ||
        !payload.descricao
      ) {
        return res.status(400).json({
          success: false,
          message: "Preencha nome, telefone, e-mail, título e descrição.",
        });
      }

      const novaSolicitacao = await PartnerRequest.create(payload);

      return res.status(201).json({
        success: true,
        message: "Solicitação de parceria enviada com sucesso.",
        partnerRequest: novaSolicitacao,
      });
    } catch (error) {
      console.error("Erro ao criar solicitação de parceiro:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno ao salvar solicitação de parceria.",
      });
    }
  });
});

router.get("/", async (req, res) => {
  try {
    const status = limparTexto(req.query.status);
    const filtro = {};

    if (status && ["pendente", "aprovado", "rejeitado"].includes(status)) {
      filtro.status = status;
    }

    const solicitacoes = await PartnerRequest.find(filtro).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: solicitacoes.length,
      partnerRequests: solicitacoes,
    });
  } catch (error) {
    console.error("Erro ao listar solicitações de parceiros:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar solicitações.",
    });
  }
});

router.get("/public/aprovados", async (req, res) => {
  try {
    const parceiros = await PartnerRequest.find({
      status: "aprovado",
    }).sort({
      updatedAt: -1,
    });

    return res.json({
      success: true,
      total: parceiros.length,
      partners: parceiros,
    });
  } catch (error) {
    console.error("Erro ao listar parceiros aprovados:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar parceiros aprovados.",
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const status = limparTexto(req.body.status);
    const observacaoAdmin = limparTexto(req.body.observacaoAdmin);

    if (!["pendente", "aprovado", "rejeitado"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status inválido. Use pendente, aprovado ou rejeitado.",
      });
    }

    const atualizada = await PartnerRequest.findByIdAndUpdate(
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
        message: "Solicitação não encontrada.",
      });
    }

    return res.json({
      success: true,
      message: "Status atualizado com sucesso.",
      partnerRequest: atualizada,
    });
  } catch (error) {
    console.error("Erro ao atualizar status da parceria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar status.",
    });
  }
});

export default router;