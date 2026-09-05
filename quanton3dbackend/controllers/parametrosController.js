import Parametro from '../models/Parametro.js';
import ImpressoraCatalogo from '../models/ImpressoraCatalogo.js';

function cleanMm(v){ if(v==null) return ''; const n=String(v).replace(/mm+/gi,'').trim(); return n?`${n}mm`:''; }

export async function criarParametro(req,res){ const p={...req.body}; if(!p.resina||!p.impressora) return res.status(400).json({success:false,error:'Resina e impressora são obrigatórias'}); p.alturaCamada=cleanMm(p.alturaCamada); const parametro=await Parametro.create(p); res.status(201).json({success:true,data:parametro}); }

export async function listarParametros(_req,res){ const parametros=await Parametro.find().sort({resina:1,impressora:1}); res.json({success:true,data:parametros}); }

export async function listarResinas(_req,res){ const resinas=(await Parametro.distinct('resina')).filter(Boolean).sort(); res.json({success:true,data:resinas}); }

export async function listarImpressoras(_req,res){
  // Merge: impressoras com parâmetros + catálogo Photocura (sem parâmetros)
  const [comParametros, catalogo] = await Promise.all([
    Parametro.distinct('impressora'),
    ImpressoraCatalogo.find({}, 'nome fotoImpressora').lean(),
  ]);
  const set = new Set(comParametros.filter(Boolean).map(n => n.trim().toLowerCase()));
  const extras = catalogo
    .filter(c => !set.has(c.nome.trim().toLowerCase()))
    .map(c => c.nome);
  const todas = [...comParametros.filter(Boolean), ...extras];
  const unicas = [...new Set(todas.map(n => n.trim()))].sort();
  res.json({ success: true, data: unicas });
}

export async function listarImpressorasComFoto(_req, res) {
  // Retorna {nome, fotoImpressora} — usado pelo frontend para montar dropdown com foto
  const [parametros, catalogo] = await Promise.all([
    Parametro.find({}, 'impressora fotoImpressora').lean(),
    ImpressoraCatalogo.find({}, 'nome fotoImpressora').lean(),
  ]);
  const mapa = new Map();
  // Primeiro catálogo (base)
  for (const c of catalogo) mapa.set(c.nome.trim().toLowerCase(), { nome: c.nome, fotoImpressora: c.fotoImpressora });
  // Depois parâmetros sobrescreve (prioridade)
  for (const p of parametros) {
    if (!p.impressora) continue;
    const key = p.impressora.trim().toLowerCase();
    const existing = mapa.get(key);
    mapa.set(key, { nome: p.impressora, fotoImpressora: p.fotoImpressora || (existing?.fotoImpressora ?? '') });
  }
  const lista = [...mapa.values()].sort((a,b) => a.nome.localeCompare(b.nome));
  res.json({ success: true, data: lista });
}

export async function buscarPerfil(req,res){ const {resina,impressora}=req.query||{}; const perfil=await Parametro.findOne({resina:new RegExp(`^${resina}$`,'i'),impressora:new RegExp(`^${impressora}$`,'i')}); res.json({success:true,data:perfil}); }
