import Formulacao from '../models/Formulacao.js';

function validarCamposObrigatorios({ nome, telefone, caracteristica }) {
  return Boolean(nome && telefone && caracteristica);
}

export async function criarFormulacao(req, res) {
  const { nome, telefone, email, caracteristica, cor, detalhes } = req.body || {};

  if (!validarCamposObrigatorios({ nome, telefone, caracteristica })) {
    return res.status(400).json({
      success: false,
      error: 'Nome, telefone e característica são obrigatórios',
    });
  }

  const formulacao = await Formulacao.create({
    nome,
    telefone,
    email,
    caracteristica,
    cor,
    detalhes,
  });

  return res.status(201).json({ success: true, data: formulacao });
}

export async function listarFormulacoes(_req, res) {
  const formulacoes = await Formulacao.find().sort({ createdAt: -1 }).limit(300).lean();

  return res.json({ success: true, data: formulacoes });
}
