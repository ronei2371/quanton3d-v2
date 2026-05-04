import express from 'express'; import OpenAI from 'openai'; import { ruleBasedAnswer } from '../services/aiRules.js';
const router=express.Router();
function client(){ if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada'); return new OpenAI({apiKey:process.env.OPENAI_API_KEY}); }
router.post('/', async (req,res)=>{ try{ const {message='',image=null}=req.body||{}; const text=String(message||'').trim(); if(!text&&!image) return res.status(400).json({success:false,error:'Mensagem ou imagem obrigatória'}); const rule=ruleBasedAnswer(text); if(rule&&!image) return res.json({success:true,reply:rule,source:'rules'});
 const content=[{type:'text',text:text||'Analise a imagem de impressão 3D e diga o defeito provável e a correção.'}]; if(image) content.push({type:'image_url',image_url:{url:image}});
 const completion=await client().chat.completions.create({model:image?(process.env.OPENAI_VISION_MODEL||'gpt-4o'):(process.env.OPENAI_CHAT_MODEL||'gpt-4o-mini'),temperature:0.2,max_tokens:600,messages:[{role:'system',content:'Você é o técnico especialista da Quanton3D. Responda curto, prático e técnico. Não invente resina. Pneus/flexibilidade: FLEXFORM. Personagens resistentes: IRON. Se cliente disser só marca da impressora, pergunte o modelo. Se tiver imagem, analise visualmente primeiro.'},{role:'user',content}]});
 res.json({success:true,reply:completion.choices?.[0]?.message?.content||'Não consegui responder agora.',source:'openai'});
 }catch(e){console.error('[CHAT]',e); res.status(500).json({success:false,error:e.message||'Erro no chat'});} });
export default router;
