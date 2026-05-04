import Formulacao from "../models/Formulacao.js";

function limparTexto(valor) {
  return String(valor || "").trim();
}

export async function criarFormulacao(req, res) {
  const body = req.body || {};
  const nome = limparTexto(body.nome);
  const telefone = limparTexto(body.telefone);
  const caracteristica = limparTexto(body.caracteristica || body.aplicacao);

  if (!nome || !telefone || !caracteristica) {
    return res.status(400).json({
      success: false,
      error: "Nome, telefone e característica são obrigatórios",
    });
  }

  const formulacao = await Formulacao.create({
    nome,
    telefone,
    email: limparTexto(body.email).toLowerCase(),
    caracteristica,
    cor: limparTexto(body.cor),
    aplicacao: limparTexto(body.aplicacao),
    dureza: limparTexto(body.dureza),
    flexibilidade: limparTexto(body.flexibilidade),
    resistencia: limparTexto(body.resistencia),
    detalhes: limparTexto(body.detalhes || body.observacoes),
  });

  res.status(201).json({ success: true, formulacao });
}

export async function listarFormulacoes(_req, res) {
  const formulacoes = await Formulacao.find().sort({ createdAt: -1 }).limit(300);
  res.json({ success: true, formulacoes });
}
