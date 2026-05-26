import Parametro from '../models/Parametro.js';
function cleanMm(v){ if(v==null) return ''; const n=String(v).replace(/mm+/gi,'').trim(); return n?`${n}mm`:''; }
export async function criarParametro(req,res){ const p={...req.body}; if(!p.resina||!p.impressora) return res.status(400).json({success:false,error:'Resina e impressora são obrigatórias'}); p.alturaCamada=cleanMm(p.alturaCamada); const parametro=await Parametro.create(p); res.status(201).json({success:true,data:parametro}); }
export async function listarParametros(_req,res){ const parametros=await Parametro.find().sort({resina:1,impressora:1}); res.json({success:true,data:parametros}); }
export async function listarResinas(_req,res){ const resinas=(await Parametro.distinct('resina')).filter(Boolean).sort(); res.json({success:true,data:resinas}); }
export async function listarImpressoras(_req,res){ const impressoras=(await Parametro.distinct('impressora')).filter(Boolean).sort(); res.json({success:true,data:impressoras}); }
export async function buscarPerfil(req,res){ const {resina,impressora}=req.query||{}; const perfil=await Parametro.findOne({resina:new RegExp(`^${resina}$`,'i'),impressora:new RegExp(`^${impressora}$`,'i')}); res.json({success:true,data:perfil}); }
