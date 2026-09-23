import Parametro from '../models/Parametro.js';
import ImpressoraCatalogo from '../models/ImpressoraCatalogo.js';
function cleanMm(v){ if(v==null) return ''; const n=String(v).replace(/mm+/gi,'').trim(); return n?`${n}mm`:''; }
export async function criarParametro(req,res){ const p={...req.body}; if(!p.resina||!p.impressora) return res.status(400).json({success:false,error:'Resina e impressora são obrigatórias'}); p.alturaCamada=cleanMm(p.alturaCamada); const parametro=await Parametro.create(p); res.status(201).json({success:true,data:parametro}); }
// Perfil so vale se tiver exposicao normal e de base maiores que zero (o banco tem registros "0s").
function numeroParametro(v){ const m=String(v ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; }
export function perfilValido(p){ return numeroParametro(p?.exposicaoNormal) > 0 && numeroParametro(p?.exposicaoBase) > 0; }
// Site e calculadoras recebem so perfis validos; o ADM pede ?todos=1 para ver e corrigir os zerados.
export async function listarParametros(req,res){ const parametros=await Parametro.find().sort({resina:1,impressora:1}).lean(); const todos=req.query?.todos==='1'; res.json({success:true,data: todos ? parametros : parametros.filter(perfilValido)}); }
export async function listarResinas(_req,res){ const resinas=(await Parametro.distinct('resina')).filter(Boolean).sort(); res.json({success:true,data:resinas}); }
export async function listarImpressoras(_req,res){
  const nomes = (await Parametro.distinct('impressora')).filter(Boolean).sort((a,b) => a.localeCompare(b));
  res.json({ success: true, data: nomes });
}
export async function listarImpressorasComFoto(_req, res) {
    const [parametros, catalogo] = await Promise.all([
          Parametro.find({}, 'impressora fotoImpressora').lean(),
          ImpressoraCatalogo.find({}, 'nome fotoImpressora').lean(),
        ]);
    const mapa = new Map();
    for (const c of catalogo) mapa.set(c.nome.trim().toLowerCase(), { nome: c.nome, fotoImpressora: c.fotoImpressora });
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
