import mongoose from "mongoose";
import DiarioRegistro from "../models/DiarioRegistro.js";

function limparTexto(valor) {
  return String(valor || "").trim();
}

function normalizarProblemas(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.map(limparTexto).filter(Boolean);
}

function filtroPorId(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { id }] };
  }

  return { id };
}

function paraCliente(doc) {
  const obj = doc.toObject();
  return {
    ...obj,
    id: obj.id || String(obj._id),
  };
}

function montarRegistro(body = {}) {
  return {
    id: limparTexto(body.id),
    resina: limparTexto(body.resina),
    impressora: limparTexto(body.impressora),
    exposicao: limparTexto(body.exposicao),
    bottom: limparTexto(body.bottom),
    liftSpeed: limparTexto(body.liftSpeed),
    camada: limparTexto(body.camada),
    status: limparTexto(body.status),
    problemas: normalizarProblemas(body.problemas),
    observacoes: limparTexto(body.observacoes),
    tempoMin: limparTexto(body.tempoMin),
    fotoUrl: limparTexto(body.fotoUrl),
    data: body.data ? new Date(body.data) : new Date(),
  };
}

export async function listarRegistros(_req, res) {
  const registros = await DiarioRegistro.find()
    .sort({ data: -1, createdAt: -1 })
    .limit(300);

  res.json({
    success: true,
    registros: registros.map(paraCliente),
  });
}

export async function criarRegistro(req, res) {
  const registro = montarRegistro(req.body);

  if (!registro.resina || !registro.status) {
    return res.status(400).json({
      success: false,
      error: "Resina e status são obrigatórios",
    });
  }

  if (!registro.id) {
    registro.id = Date.now().toString();
  }

  const salvo = await DiarioRegistro.create(registro);
  res.status(201).json({ success: true, registro: paraCliente(salvo) });
}

export async function atualizarRegistro(req, res) {
  const registro = montarRegistro(req.body);

  if (!registro.resina || !registro.status) {
    return res.status(400).json({
      success: false,
      error: "Resina e status são obrigatórios",
    });
  }

  if (!registro.id) {
    registro.id = req.params.id;
  }

  const atualizado = await DiarioRegistro.findOneAndUpdate(
    filtroPorId(req.params.id),
    registro,
    { new: true }
  );

  if (!atualizado) {
    return res.status(404).json({
      success: false,
      error: "Registro não encontrado",
    });
  }

  res.json({ success: true, registro: paraCliente(atualizado) });
}

export async function excluirRegistro(req, res) {
  const excluido = await DiarioRegistro.findOneAndDelete(
    filtroPorId(req.params.id)
  );

  if (!excluido) {
    return res.status(404).json({
      success: false,
      error: "Registro não encontrado",
    });
  }

  res.json({ success: true });
}
