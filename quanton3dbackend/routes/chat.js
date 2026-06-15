import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';

const router = express.Router();

const SYSTEM_PROMPT = 'Você é o técnico especialista da Quanton3D. Responda curto, prático e técnico. Não invente resina. Pneus/flexibilidade: FLEXFORM. Personagens resistentes: IRON. Se cliente disser só marca da impressora, pergunte o modelo. Se tiver imagem, analise visualmente primeiro.';

function getAiConfig() {
  const useDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY);
  const apiKey = useDeepSeek ? process.env.DEEPSEEK_API_KEY : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Configure DEEPSEEK_API_KEY ou OPENAI_API_KEY');
  }

  return {
    provider: useDeepSeek ? 'deepseek' : 'openai',
    client: new OpenAI({
      apiKey,
      baseURL: useDeepSeek ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com') : process.env.OPENAI_BASE_URL,
    }),
  };
}

function getModel({ provider, image }) {
  if (provider === 'deepseek') {
    return process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';
  }

  return image ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o') : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini');
}

router.post('/', async (req, res) => {
  try {
    const { message = '', image = null } = req.body || {};
    const text = String(message || '').trim();

    if (!text && !image) {
      return res.status(400).json({ success: false, error: 'Mensagem ou imagem obrigatória' });
    }

    const rule = ruleBasedAnswer(text);
    if (rule && !image) {
      return res.json({ success: true, reply: rule, source: 'rules' });
    }

    const { provider, client } = getAiConfig();
    const model = getModel({ provider, image });
    const userContent = [{ type: 'text', text: text || 'Analise a imagem de impressão 3D e diga o defeito provável e a correção.' }];

    if (image && provider === 'openai') {
      userContent.push({ type: 'image_url', image_url: { url: image } });
    }

    if (image && provider === 'deepseek' && !text) {
      userContent[0].text = 'O cliente enviou uma imagem, mas o provedor DeepSeek configurado está sendo usado apenas em modo texto. Peça uma descrição do defeito e oriente quais informações enviar.';
    }

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 600,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    return res.json({
      success: true,
      reply: completion.choices?.[0]?.message?.content || 'Não consegui responder agora.',
      source: provider,
    });
  } catch (e) {
    console.error('[CHAT]', e);
    return res.status(500).json({ success: false, error: e.message || 'Erro no chat' });
  }
});

export default router;
