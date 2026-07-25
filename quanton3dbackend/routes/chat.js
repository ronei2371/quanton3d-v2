import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY nao configurada');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

router.post('/', async (req, res) => {
  try {
    const { message = '', image = null, historico = [] } = req.body || {};
    const text = String(message || '').trim();

    if (!text && !image) {
      return res.status(400).json({ success: false, error: 'Mensagem obrigatoria' });
    }

    const content = [{ type: 'text', text: text || 'Analise a imagem de impressao 3D.' }];
    if (image) content.push({ type: 'image_url', image_url: { url: image } });

    const mensagensHistorico = (historico || [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6);

    const completion = await client().chat.completions.create({
      model: image
        ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o')
        : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'),
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...mensagensHistorico,
        { role: 'user', content }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || 'Nao consegui responder agora. Tente novamente.';
    res.json({ success: true, reply, source: 'openai' });

  } catch (e) {
    console.error('[CHAT ERROR]', e.message);
    res.status(500).json({ success: false, error: 'Erro interno. Tente novamente em instantes.' });
  }
});

export default router;
