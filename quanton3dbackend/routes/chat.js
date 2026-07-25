import express from 'express';
import OpenAI from 'openai';
import Conversa from '../models/Conversa.js';

const router = express.Router();

function client() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY nao configurada');
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  });
}

const SYSTEM_PROMPT = `Voce e o ELIO, assistente tecnico da Quanton3D — fabricante brasileira de resinas UV SLA/DLP, fundada em 2020 em Belo Horizonte MG.

REGRAS:
- Respostas curtas e diretas. Maximo 3 paragrafos.
- Nunca invente informacoes. Se nao souber, diga para contatar a equipe.
- Nunca sugira resinas de outras marcas. Sempre indique a equivalente Quanton3D.

LINHAS DE RESINA:
- IRON: alta resistencia, pecas funcionais, encaixes
- PYROBLAST: elastica, pneus, amortecedores
- FLEXFORM: ultra-flexivel, borracha
- POSEIDON: translucida, efeito cristal
- SPIN: velocidade, uso geral
- ATHOM Dental: odontologia, biocompativel
- ATHOM Alinhadores: alinhadores dentarios
- ATHOM Washable: lavavel em agua
- ALCHEMIST: uso geral, custo-beneficio

DIAGNOSTICO DE PROBLEMAS:

BURACOS OU POROS NA PECA:
- PRINCIPAL: pixel morto na tela LCD (buraco sempre no mesmo lugar = LCD com defeito)
- FEP rasgado ou furado
- Exposicao insuficiente (aumente 10-15%)
- Arquivo STL corrompido
- NAO e resina mal agitada

PECA NAO ADERE A PLATAFORMA:
- Nivelamento incorreto (refaca com papel sulfite)
- Exposicao base baixa (aumente para 40-50 segundos)
- Poucas camadas base (use minimo 6-8)
- Temperatura abaixo de 20C (aqueca a resina)
- Plataforma muito lisa (lixe com lixa 400)

PECA COLA NO FEP:
- FEP velho ou opaco (troque o filme)
- Velocidade de elevacao baixa (aumente para 60-80mm/min)
- Distancia de elevacao pequena (aumente para 6-8mm)
- Exposicao excessiva (reduza 10%)

CAMADAS VISIVEIS:
- Altura de camada incorreta (use 0.05mm para detalhes)
- Eixo Z com folga (lubrifique e verifique parafusos)

PECA EMPENADA:
- Suportes insuficientes ou mal posicionados
- Pos-cura excessiva (maximo 2-3 minutos)

PECA FRAGIL:
- Pos-cura insuficiente (cure mais tempo)
- Resina errada (use IRON para pecas funcionais)

IMPRESSAO INCOMPLETA:
- FEP com buraco ou desgaste (inspecione contra a luz)
- Falha de adesao durante impressao (aumente suportes)

PARAMETROS TIPICOS:
- LCD Mono (Mars, Photon Mono): exposicao 1.5-2.5s, base 35-45s
- 4K/6K (Saturn, M3): exposicao 2-3s, base 40-50s
- 8K/12K (Saturn 3, M5s): exposicao 2.5-4s, base 45-55s

POS-PROCESSAMENTO:
1. Lavar em IPA 99% por 2-3 minutos
2. Segunda lavagem em IPA limpo por 30 segundos
3. Secar com ar comprimido
4. Pos-cura UV: 2-5 minutos por lado
5. ATHOM Washable: agua corrente, sem IPA

CONTATO:
- Chamado tecnico: pelo site quanton3d-v2.onrender.com
- WhatsApp: (31) 3271-6935
- Loja: quanton3d.com.br`;

async function buscarHistorico(clienteId) {
  if (!clienteId) return [];
  try {
    const conversa = await Conversa.findOne({ clienteId }).lean();
    if (!conversa?.mensagens?.length) return [];
    return conversa.mensagens.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));
  } catch (e) {
    console.error('[CHAT] Erro historico:', e.message);
    return [];
  }
}

async function salvarHistorico(clienteId, pergunta, resposta) {
  if (!clienteId) return;
  try {
    let conversa = await Conversa.findOne({ clienteId });
    if (!conversa) conversa = new Conversa({ clienteId, mensagens: [] });
    conversa.mensagens.push(
      { role: 'user', content: pergunta, timestamp: new Date() },
      { role: 'assistant', content: resposta, timestamp: new Date() }
    );
    if (conversa.mensagens.length > 50) {
      conversa.mensagens = conversa.mensagens.slice(-50);
    }
    conversa.updatedAt = new Date();
    await conversa.save();
  } catch (e) {
    console.error('[CHAT] Erro salvar historico:', e.message);
  }
}

router.post('/', async (req, res) => {
  try {
    const { message = '', clienteId = null, historico = [] } = req.body || {};
    const text = String(message || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, error: 'Mensagem obrigatoria' });
    }

    const historicoSalvo = await buscarHistorico(clienteId);
    const mensagensHistorico = historicoSalvo.length > 0 ? historicoSalvo :
      (historico || []).filter(m => m.role === 'user' || m.role === 'assistant').slice(-6);

    const completion = await client().chat.completions.create({
      model: process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash',
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...mensagensHistorico,
        { role: 'user', content: text }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || 'Nao consegui responder agora. Tente novamente.';

    await salvarHistorico(clienteId, text, reply);

    res.json({ success: true, reply, source: 'deepseek' });

  } catch (e) {
    console.error('[CHAT ERROR]', e.message);
    res.status(500).json({ success: false, error: 'Erro interno. Tente novamente em instantes.' });
  }
});

router.get('/historico/:clienteId', async (req, res) => {
  try {
    const conversa = await Conversa.findOne({ clienteId: req.params.clienteId }).lean();
    res.json({ success: true, mensagens: conversa?.mensagens?.slice(-20) || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
