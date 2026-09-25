import express from "express";
import authAdmin from "../middlewares/authAdmin.js";
import { authAdminOuAtendente } from "../middlewares/authAtendente.js";
import SugestaoConhecimento from "../models/SugestaoConhecimento.js";
import { dadosNovaSugestao, dadosAtualizacaoSugestao } from "../services/sugestaoConhecimento.js";

const router = express.Router();

// Atendente cria sugestão (fica pendente). Admin pode criar já aprovada (aprovarDireto).
router.post("/", authAdminOuAtendente, async (req, res) => {
  try {
    const { erro, dados } = dadosNovaSugestao(req.body, { tipo: req.usuarioTipo, cod: req.usuarioCod, nome: req.usuarioNome });
    if (erro) return res.status(400).json({ success: false, message: erro });
    const sugestao = await SugestaoConhecimento.create(dados);
    return res.status(201).json({ success: true, sugestao });
  } catch (error) {
    console.error("Erro ao criar sugestão:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

// Listar sugestões (atendente vê as próprias, admin vê todas)
router.get("/", authAdminOuAtendente, async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status && ["pendente", "aprovado", "rejeitado"].includes(req.query.status)) {
      filtro.status = req.query.status;
    }
    // Se for atendente (não admin), filtra só as dele
    if (req.usuarioTipo === "atendente") {
      filtro.codigoAtendente = req.usuarioCod;
    }
    const sugestoes = await SugestaoConhecimento.find(filtro).sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, sugestoes });
  } catch (error) {
    console.error("Erro ao listar sugestões:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

// Admin aprova/rejeita (e pode editar título/conteúdo/categoria junto)
router.patch("/:id/status", authAdmin, async (req, res) => {
  try {
    const { erro, dados } = dadosAtualizacaoSugestao(req.body);
    if (erro) return res.status(400).json({ success: false, message: erro });
    const sugestao = await SugestaoConhecimento.findByIdAndUpdate(req.params.id, dados, { new: true, runValidators: true });
    if (!sugestao) return res.status(404).json({ success: false, message: "Sugestão não encontrada." });
    return res.json({ success: true, sugestao });
  } catch (error) {
    console.error("Erro ao atualizar sugestão:", error);
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

// Admin deleta
router.delete("/:id", authAdmin, async (req, res) => {
  try {
    await SugestaoConhecimento.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro interno." });
  }
});

export default router;
