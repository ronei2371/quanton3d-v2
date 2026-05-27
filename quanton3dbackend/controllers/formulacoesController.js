import Formulacao from '../models/Formulacao.js';
 codex/fix-integration-errors-and-improve-performance-yl64px

export async function criarFormulacao(req, res) {
  const { nome, telefone, email, caracteristica, cor, detalhes } = req.body || {};

  if (!nome || !telefone || !caracteristica) {
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
