import Parametro from '../models/Parametro.js';
import ImpressoraCatalogo from '../models/ImpressoraCatalogo.js';
function cleanMm(v){ if(v==null) return ''; const n=String(v).replace(/mm+/gi,'').trim(); return n?`${n}mm`:''; }
// Campos que mudam o resultado da impressao: alterar qualquer um conta como revisao tecnica.
export const CAMPOS_TECNICOS=['alturaCamada','exposicaoNormal','exposicaoBase','camadasBase','liftDistance','liftSpeed','retractSpeed','lightOffDelay'];
function valorComparavel(v){ return String(v ?? '').replace(',', '.').replace(/\s+/g,'').toLowerCase(); }
export function camposTecnicosMudaram(atual={},novo={}){ return CAMPOS_TECNICOS.some(c=>Object.prototype.hasOwnProperty.call(novo,c) && valorComparavel(novo[c])!==valorComparavel(atual?.[c])); }
export async function criarParametro(req,res){ const p={...req.body}; delete p._id; delete p.createdAt; delete p.updatedAt; p.revisadoEm=new Date(); if(!p.resina||!p.impressora) return res.status(400).json({success:false,error:'Resina e impressora são obrigatórias'}); p.alturaCamada=cleanMm(p.alturaCamada); const parametro=await Parametro.create(p); res.status(201).json({success:true,data:parametro}); }
// Perfil so vale se tiver exposicao normal e de base maiores que zero (o banco tem registros "0s").
function numeroParametro(v){ const m=String(v ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; }
export function perfilValido(p){ return numeroParametro(p?.exposicaoNormal) > 0 && numeroParametro(p?.exposicaoBase) > 0; }
// Site e calculadoras recebem so perfis validos; o ADM pede ?todos=1 para ver e corrigir os zerados e os com campo trocado.
// Resinas que ainda nao estao a venda: continuam no banco (ADM ve com ?todos=1), mas nao aparecem no site.
export const RESINAS_INDISPONIVEIS = new Set(['RPG 4K']);
// Perfil com campo claramente trocado na digitacao (ex.: "camadas de base: 1,50s", altura "0.05s",
// exposicao normal 0,05 s). Fica escondido do site e o bot nao passa esses valores ate o ADM corrigir.
// Mesma regra em quanton3dfrontend/src/components/admin/AdminInternals.jsx (problemasParametro).
export function problemasPerfil(p){
  const problemas=[];
  const camadasTxt=String(p?.camadasBase ?? '').trim();
  const camadas=numeroParametro(camadasTxt);
  if(camadasTxt && (/[±]|seg/i.test(camadasTxt) || /\d[.,]\d/.test(camadasTxt) || !Number.isInteger(camadas) || camadas<1 || camadas>20)) problemas.push('camadas de base');
  const alturaTxt=String(p?.alturaCamada ?? '').trim();
  const altura=numeroParametro(alturaTxt);
  // Altura 0,00 mm = nao informada (varios perfis bons estao assim): nao esconde, so avisa no ADM.
  if(alturaTxt && (/\d\s*s\b/i.test(alturaTxt) || (altura>0 && altura<0.01) || altura>0.3)) problemas.push('altura de camada');
  const normal=numeroParametro(p?.exposicaoNormal); const base=numeroParametro(p?.exposicaoBase);
  if(normal>0 && normal<0.5) problemas.push('exposição normal');
  if(normal>0 && base>0 && normal>=base) problemas.push('exposição normal maior que a de base');
  return problemas;
}
export function perfilConfiavel(p){ return perfilValido(p) && problemasPerfil(p).length===0; }
export function visivelNoSite(p){ return perfilConfiavel(p) && !RESINAS_INDISPONIVEIS.has(String(p?.resina || '').trim().toUpperCase()); }
export async function listarParametros(req,res){ const parametros=await Parametro.find().sort({resina:1,impressora:1}).lean(); const todos=req.query?.todos==='1'; res.json({success:true,data: todos ? parametros : parametros.filter(visivelNoSite)}); }
export async function listarResinas(_req,res){ const resinas=(await Parametro.distinct('resina')).filter((r) => r && !RESINAS_INDISPONIVEIS.has(String(r).trim().toUpperCase())).sort(); res.json({success:true,data:resinas}); }
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
function escaparRegex(v){ return String(v ?? '').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
export async function buscarPerfil(req,res){ const {resina,impressora}=req.query||{}; const perfil=await Parametro.findOne({resina:new RegExp(`^${escaparRegex(resina)}$`,'i'),impressora:new RegExp(`^${escaparRegex(impressora)}$`,'i')}).lean(); res.json({success:true,data: perfil && visivelNoSite(perfil) ? perfil : null}); }
