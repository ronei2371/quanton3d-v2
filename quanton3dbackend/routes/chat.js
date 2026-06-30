import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';

const router = express.Router();

// Configuração para usar o DeepSeek através da biblioteca da OpenAI
function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey) {
        throw new Error('Chave de API (DEEPSEEK_API_KEY) não configurada no Render');
    }

    return new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL
    });
}

router.post('/', async (req, res) => {
    try {
        const { message = '', image = null } = req.body || {};
        const text = String(message || '').trim();

        if (!text && !image) {
            return res.status(400).json({ success: false, error: 'Mensagem ou imagem obrigatória' });
        }

        // 1. Tenta resposta por regras locais primeiro (economiza créditos)
        const rule = ruleBasedAnswer(text);
        if (rule && !image) {
            return res.json({ success: true, reply: rule, source: 'rules' });
        }

        // 2. Prepara o conteúdo para a IA
        const content = [{ type: 'text', text: text || 'Analise a imagem de impressão 3D e diga o defeito provável e a correção.' }];
        
        // DeepSeek R1/V3 geralmente usa o modelo configurado no Render
        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';

        const completion = await client().chat.completions.create({
            model: model,
            temperature: 0.2,
            max_tokens: 1000,
            messages: [
                { 
                    role: 'system', 
                    content: 'Você é o técnico especialista da Quanton3D. Responda de forma curta, prática e técnica. Fale sobre as resinas IRON (resistente) e FLEXFORM (flexível) quando apropriado. Seja direto.' 
                },
                { role: 'user', content: text }
            ]
        });

        res.json({
            success: true,
            reply: completion.choices?.[0]?.message?.content || 'Não consegui processar sua dúvida agora.',
            source: 'deepseek'
        });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        res.status(500).json({ success: false, error: e.message || 'Erro interno no servidor de chat' });
    }
});

export default router;
