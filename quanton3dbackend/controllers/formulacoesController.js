import Formulacao from '../models/Formulacao.js';
 codex/fix-integration-errors-and-improve-performance-p1pxq4

function validarCamposObrigatorios({ nome, telefone, caracteristica }) {
  return Boolean(nome && telefone && caracteristica);
}

 codex/fix-integration-errors-and-improve-performance-yl64px
 main

export async function criarFormulacao(req, res) {
  const { nome, telefone, email, caracteristica, cor, detalhes } = req.body || {};

 codex/fix-integration-errors-and-improve-performance-p1pxq4
  if (!validarCamposObrigatorios({ nome, telefone, caracteristica })) {

  if (!nome || !telefone || !caracteristica) {
 main
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
 codex/fix-integration-errors-and-improve-performance-p1pxq4
  const formulacoes = await Formulacao.find().sort({ createdAt: -1 }).limit(300).lean();

  return res.json({ success: true, data: formulacoes });
}

  const formulacoes = await Formulacao.find()
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return res.json({ success: true, data: formulacoes });
}

 codex/fix-integration-errors-and-improve-performance-iokt1f
export async function criarFormulacao(req,res){ const {nome,telefone,email,caracteristica,cor,detalhes}=req.body||{}; if(!nome||!telefone||!caracteristica) return res.status(400).json({success:false,error:'Nome, telefone e característica são obrigatórios'}); const formulacao=await Formulacao.create({nome,telefone,email,caracteristica,cor,detalhes}); res.status(201).json({success:true,data:formulacao}); }
export async function listarFormulacoes(_req,res){ const formulacoes=await Formulacao.find().sort({createdAt:-1}).limit(300).lean(); res.json({success:true,data:formulacoes}); }

export async function criarFormulacao(req,res){ const {nome,telefone,email,caracteristica,cor,detalhes}=req.body||{}; if(!nome||!telefone||!caracteristica) return res.status(400).json({success:false,error:'Nome, telefone e característica são obrigatórios'}); const formulacao=await Formulacao.create({nome,telefone,email,caracteristica,cor,detalhes}); res.status(201).json({success:true,formulacao}); }
export async function listarFormulacoes(_req,res){ const formulacoes=await Formulacao.find().sort({createdAt:-1}).limit(300).lean(); res.json({success:true,formulacoes}); }
 main
 main
 main
