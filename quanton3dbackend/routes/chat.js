import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';
import Parametro from '../models/Parametro.js';

const router = express.Router();

function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey) throw new Error('Chave de API não configurada');
    return new OpenAI({ apiKey, baseURL });
}

function chatErrorResponse(error) {
    const status = Number(error?.status || error?.response?.status || 500);
    if (status === 401 || status === 403) return { status: 503, error: 'Assistente temporariamente indisponível.' };
    if (status === 402) return { status: 503, error: 'Limite de uso atingido. Entre em contato pelo WhatsApp (31) 3271-6935.' };
    if (status === 429) return { status: 429, error: 'Muitas solicitações. Tente novamente em instantes.' };
    if (status >= 500 || error?.code === 'ETIMEDOUT') return { status: 503, error: 'Não consegui consultar o assistente agora. Tente novamente.' };
    return { status: 500, error: 'Erro interno. Tente novamente.' };
}

// Resinas conhecidas para detectar na mensagem
const RESINAS_CONHECIDAS = [
    'alchemist', 'iron', 'flexform', '70/30', '7030', 'athom dental', 'athom alinhadores',
    'athom washable', 'poseidon', 'pyroblast', 'vulcan cast', 'vulcan', 'spin', 'spark',
    'low smell', 'lowsmell', 'velvet skin', 'velvet'
];

// Impressoras conhecidas para detectar na mensagem
const IMPRESSORAS_CONHECIDAS = [
    'mars', 'saturn', 'photon', 'anycubic', 'elegoo', 'phrozen', 'sonic', 'creality',
    'halot', 'bambu', 'chitubox', 'lychee', 'm5', 'm4', 'm3', 'pro', 'ultra', 'max'
];

function detectarResina(texto) {
    const t = texto.toLowerCase();
    return RESINAS_CONHECIDAS.find(r => t.includes(r)) || null;
}

function detectarImpressora(texto) {
    const t = texto.toLowerCase();
    return IMPRESSORAS_CONHECIDAS.find(i => t.includes(i)) || null;
}

async function buscarParametrosRAG(texto) {
    try {
        const resina = detectarResina(texto);
        const impressora = detectarImpressora(texto);

        if (!resina && !impressora) return null;

        // Monta query flexível
        const query = {};
        if (resina) query.resina = { $regex: resina, $options: 'i' };
        if (impressora) query.impressora = { $regex: impressora, $options: 'i' };

        const parametros = await Parametro.find(query).limit(5).lean();

        if (!parametros.length) return null;

        // Formata os parâmetros encontrados
        const linhas = parametros.map(p => {
            const campos = [
                `Resina: ${p.resina}`,
                `Impressora: ${p.impressora}`,
                p.alturaCamada ? `Altura de camada: ${p.alturaCamada}` : null,
                p.exposicaoNormal ? `Exposição normal: ${p.exposicaoNormal}s` : null,
                p.exposicaoBase ? `Exposição base: ${p.exposicaoBase}s` : null,
                p.camadasBase ? `Camadas base: ${p.camadasBase}` : null,
                p.liftDistance ? `Distância de elevação: ${p.liftDistance}` : null,
                p.liftSpeed ? `Velocidade de elevação: ${p.liftSpeed}` : null,
                p.retractSpeed ? `Velocidade de retração: ${p.retractSpeed}` : null,
            ].filter(Boolean);
            return campos.join(' | ');
        });

        return `PARÂMETROS REAIS DO BANCO DE DADOS QUANTON3D:\n${linhas.join('\n')}`;
    } catch (err) {
        console.error('[RAG ERROR]', err.message);
        return null;
    }
}

const SYSTEM_PROMPT = `Você é o ELIO, assistente técnico oficial da Quanton3D, empresa brasileira especializada em resinas UV fotopolimerizáveis para impressão 3D SLA/DLP/LCD, com sede em Belo Horizonte - MG. WhatsApp: (31) 3271-6935. Site: quanton3d.com.br.

IDENTIDADE:
- Responda sempre em português brasileiro, de forma direta, técnica e amigável.
- NUNCA invente parâmetros. Use SEMPRE os valores do banco de dados quando disponíveis.
- Quando o contexto RAG trouxer parâmetros reais, USE-OS como resposta principal.
- Não cite outras marcas de resina como solução. Foque nas resinas Quanton3D.
- Para perguntas sem contexto de resina/impressora: dê solução geral e pergunte qual resina e impressora o cliente usa.

LINHA COMPLETA DE RESINAS QUANTON3D:
1. ALCHEMIST — uso geral, ótimo custo-benefício, alta precisão.
2. IRON — alta resistência mecânica e impacto. Peças funcionais. Tende a aderir mais.
3. FLEXFORM — flexível e elástica. Juntas, vedações, peças que dobram.
4. 70/30 — híbrida 70% rígida + 30% flexível. Action figures, engenharia.
5. ATHOM DENTAL — odontológica para modelos e guias cirúrgicos.
6. ATHOM ALINHADORES — alinhadores dentários transparentes, thermoforming.
7. ATHOM WASHABLE — odontológica lavável em água.
8. POSEIDON — water washable. Sem álcool isopropílico.
9. PYROBLAST — uso geral, alta precisão. NÃO é castable.
10. VULCAN CAST — castable premium para joalheria. Queima limpa.
11. SPIN — grande formato, alta precisão, leve flexibilidade. Shore D 73.
12. SPARK — alta velocidade. Produção em lote.
13. LOW SMELL — baixo odor. Sem ventilação adequada.
14. VELVET SKIN — acabamento aveludado. Bustos e action figures premium.

PROBLEMAS COMUNS:
- Peça adere demais: Reduza exposição base 15-25%. Aumente Z-offset 0,02-0,05mm.
- Peça não adere: Aumente exposição base. Verifique nivelamento.
- Delaminação: Aumente exposição normal. Agite a resina. Temperatura mínima 18°C.
- Warping: Reduza exposição base. Mais suportes nas bordas.
- Suporte difícil: Reduza exposição normal 0,2-0,5s. Use suporte leve.
- FEP opaco: Troque o FEP imediatamente.
- Peça porosa: Resina mal agitada ou vencida.
- Resina vazando após dias: Furo de drenagem 2-3mm em peças ocas. Pós-cura insuficiente.

REGRAS DE RESPOSTA:
- Quando houver parâmetros RAG no contexto: USE-OS como resposta principal com destaque.
- Máximo 5 pontos práticos. Use **negrito** para termos importantes.
- Dê valores concretos (ex: "reduza 0,3s", "aumente Z-offset 0,05mm").
- Para dúvidas de compra/entrega: WhatsApp (31) 3271-6935 ou quanton3d.com.br`;

router.post('/', async (req, res) => {
    try {
        const { message = '' } = req.body || {};
        const text = String(message || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, error: 'Mensagem obrigatória' });
        }

        // 1. Regras locais rápidas
        const rule = ruleBasedAnswer(text);
        if (rule) {
            return res.json({ success: true, reply: rule, source: 'rules' });
        }

        // 2. RAG — buscar parâmetros reais no MongoDB
        const contextRAG = await buscarParametrosRAG(text);
        if (contextRAG) {
            console.log('[RAG] Parâmetros encontrados para:', text.substring(0, 60));
        }

        // 3. Monta prompt com contexto RAG se disponível
        const systemComContexto = contextRAG
            ? `${SYSTEM_PROMPT}\n\n--- PARÂMETROS REAIS DO BANCO ---\n${contextRAG}\n---\nIMPORTANTE: Use ESSES parâmetros como resposta principal. São valores REAIS testados. Não liste todas as impressoras — responda sobre a que o cliente mencionou ou pergunte o modelo exato.`
            : SYSTEM_PROMPT;

        // 4. Monta histórico de conversa (mantém contexto)
        const { historico = [] } = req.body || {};
        const mensagensHistorico = Array.isArray(historico)
            ? historico.slice(-8).filter(m => m.role && m.content)
            : [];

        // Monta messages: system + histórico + mensagem atual
        const messages = [
            { role: 'system', content: systemComContexto },
            ...mensagensHistorico.slice(0, -1), // histórico sem a última (que é a msg atual)
            { role: 'user', content: text }
        ];

        // 5. Chama DeepSeek com histórico completo
        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';
        const completion = await client().chat.completions.create(
            {
                model,
                temperature: contextRAG ? 0.05 : 0.15,
                max_tokens: 1200,
                messages
            },
            { timeout: 25000 }
        );

        const reply = completion.choices?.[0]?.message?.content || 'Não consegui processar sua dúvida agora.';

        res.json({
            success: true,
            reply,
            source: contextRAG ? 'rag+deepseek' : 'deepseek',
            ragUsado: !!contextRAG
        });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

export default router;
