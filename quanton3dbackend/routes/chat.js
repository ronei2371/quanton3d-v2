import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';
import Parametro from '../models/Parametro.js';
import KNOWLEDGE_BASE from '../services/knowledge.js';

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

// Mapa de resinas — chave de busca → nome real no banco
const RESINAS_MAP = {
    'alchemist': 'ALCHEMIST',
    'iron 70': 'IRON 70/30',
    '70/30': 'IRON 70/30',
    '7030': 'IRON 70/30',
    'iron': 'IRON',
    'flexform': 'FLEXFORM',
    'athom dental': 'ATHOM DENTAL',
    'athom alinhador': 'ATHOM ALINHADORES',
    'athom washable': 'ATHOM WASHABLE',
    'athom': 'ATHOM',
    'poseidon': 'POSEIDON',
    'pyroblast': 'PYROBLAST',
    'vulcan cast': 'VULCAN CAST',
    'vulcan': 'VULCAN CAST',
    'spin': 'SPIN',
    'spark': 'SPARK',
    'low smell': 'LOW SMELL',
    'lowsmell': 'LOW SMELL',
    'velvet skin': 'VELVET SKIN',
    'velvet': 'VELVET SKIN',
};

// Impressoras para detectar
const IMPRESSORAS = [
    'mars 4 ultra', 'mars 4', 'mars 3', 'mars 2', 'mars pro', 'mars',
    'saturn 4 ultra', 'saturn 4', 'saturn 3 ultra', 'saturn 3', 'saturn 2', 'saturn s', 'saturn',
    'photon mono x 6k', 'photon mono x', 'photon mono m5s', 'photon mono m5', 'photon mono m3 plus', 'photon mono m3', 'photon mono m3 premium', 'photon mono 4k', 'photon mono 2', 'photon mono', 'photon m5s', 'photon m5', 'photon ultra', 'photon',
    'halot sky', 'halot one pro', 'halot one plus', 'halot one', 'halot max', 'halot',
    'sonic mega 8k', 'sonic mini 8k', 'sonic mini 4k', 'sonic mini', 'sonic',
    'ld-006', 'ld-002r', 'ld-002h', 'ld-002',
    'uniformation gktwo', 'uniformation',
    'proxima', 'voxelab',
    'anycubic', 'elegoo', 'phrozen', 'creality',
];

function detectarResina(texto) {
    const t = texto.toLowerCase();
    // Ordenado do mais específico para o mais genérico
    for (const [chave] of Object.entries(RESINAS_MAP).sort((a, b) => b[0].length - a[0].length)) {
        if (t.includes(chave)) return chave;
    }
    return null;
}

function detectarImpressora(texto) {
    const t = texto.toLowerCase();
    for (const imp of IMPRESSORAS) {
        if (t.includes(imp.toLowerCase())) return imp;
    }
    return null;
}

// Extrai contexto do histórico completo da conversa
function extrairContextoHistorico(historico = []) {
    const textoCompleto = historico.map(m => m.content || '').join(' ');
    const resina = detectarResina(textoCompleto);
    const impressora = detectarImpressora(textoCompleto);
    return { resina, impressora };
}

async function buscarParametrosRAG(textoAtual, historico = []) {
    try {
        // Detecta resina/impressora na mensagem atual
        let resina = detectarResina(textoAtual);
        let impressora = detectarImpressora(textoAtual);

        // Se não achou na mensagem atual, busca no histórico
        if (!resina || !impressora) {
            const ctx = extrairContextoHistorico(historico);
            if (!resina) resina = ctx.resina;
            if (!impressora) impressora = ctx.impressora;
        }

        if (!resina && !impressora) return null;

        // Nome real da resina no banco
        const nomeResina = resina ? RESINAS_MAP[resina] || resina.toUpperCase() : null;

        // Query precisa — só busca a resina/impressora certa
        const query = {};
        if (nomeResina) query.resina = { $regex: `^${nomeResina}`, $options: 'i' };
        if (impressora) query.impressora = { $regex: impressora, $options: 'i' };

        // SÓ retorna parâmetros se tiver RESINA + IMPRESSORA — senão pede a impressora
        if (nomeResina && !impressora) {
            return `INSTRUÇÃO: O cliente mencionou a resina ${nomeResina} mas NÃO disse qual impressora usa. PERGUNTE qual é o modelo exato da impressora antes de passar os parâmetros. NÃO liste parâmetros de nenhuma impressora agora.`;
        }

        const parametros = await Parametro.find(query).limit(3).lean();

        if (!parametros.length) {
            if (nomeResina && impressora) {
                return `INSTRUÇÃO: Não encontrei parâmetros para ${nomeResina} + ${impressora} no banco. Informe que não temos esse cadastro ainda e sugira entrar em contato pelo WhatsApp (31) 3271-6935 para suporte personalizado.`;
            }
            return null;
        }

        const linhas = parametros.map(p => formatarParametro(p));
        const label = `PARÂMETROS REAIS DO BANCO: ${nomeResina} + ${impressora.toUpperCase()}`;
        return `${label}:\n${linhas.join('\n')}`;

    } catch (err) {
        console.error('[RAG ERROR]', err.message);
        return null;
    }
}

function formatarParametro(p) {
    return [
        `Resina: ${p.resina}`,
        `Impressora: ${p.impressora}`,
        p.alturaCamada ? `Altura camada: ${p.alturaCamada}` : null,
        p.exposicaoNormal ? `Exposição normal: ${p.exposicaoNormal}s` : null,
        p.exposicaoBase ? `Exposição base: ${p.exposicaoBase}s` : null,
        p.camadasBase ? `Camadas base: ${p.camadasBase}` : null,
        p.liftDistance ? `Elevação: ${p.liftDistance}` : null,
        p.liftSpeed ? `Vel. elevação: ${p.liftSpeed}` : null,
        p.retractSpeed ? `Vel. retração: ${p.retractSpeed}` : null,
    ].filter(Boolean).join(' | ');
}

const SYSTEM_PROMPT = `Você é o ELIO, assistente técnico oficial da Quanton3D. WhatsApp: (31) 3271-6935. Site: quanton3d.com.br.

${KNOWLEDGE_BASE}

REGRAS CRÍTICAS:
- NUNCA mencione resinas que o cliente NÃO citou. Foque APENAS na resina mencionada.
- NUNCA invente parâmetros, resinas ou especificações técnicas. Use SOMENTE os valores do banco quando disponíveis, e SOMENTE as 14 resinas reais listadas abaixo.
- NUNCA sugira produtos ou técnicas de OUTRAS tecnologias de fabricação (ex: desmoldante de silicone é usado em fundição/injeção, NÃO em impressão de resina fotopolimerizável). Use apenas técnicas próprias de impressão SLA/DLP/LCD: nivelamento, Z-offset, exposição, FEP, lixa fina na plataforma, calor leve.
- Se o contexto RAG trouxer parâmetros, USE-OS como resposta principal.
- Mantenha o contexto da conversa — lembre do problema que o cliente descreveu.
- Seja direto e objetivo. Máximo 5 pontos práticos.
- Use **negrito** para termos importantes.

TOM DE VOZ:
- Fale como um técnico experiente e prestativo, não como uma lista robótica.
- Use frases de transição naturais ("Entendo, vamos resolver isso", "Boa pergunta") antes de listar soluções.
- Evite repetir "aqui estão as soluções" toda hora — varie a abertura das respostas.

DESAMBIGUAÇÃO:
- Se o cliente mencionar um problema mas NÃO disser a resina, pergunte educadamente: "Para te ajudar melhor, qual resina você está usando?"
- Se mencionar resina mas não a impressora, pergunte o modelo exato antes de dar parâmetros.
- Se a detecção de resina/impressora parecer incerta ou ambígua, confirme com o cliente antes de prosseguir: "Você está usando a [resina] na [impressora], correto?"

SUGESTÃO PROATIVA DE FERRAMENTAS DO SITE:
- Se o cliente perguntar sobre custo de impressão, sugira a "Calculadora de Custos" do site.
- Se perguntar sobre tempo de cura ou exposição, sugira a "Calculadora de Exposição".
- Se perguntar sobre encaixe/tolerância de peças, sugira a "Calculadora de Tolerância".
- Se perguntar sobre volume/quantidade de resina, sugira a "Calculadora de Volume".
- Se perguntar sobre tempo total de impressão ou Chitubox mostrando tempo errado, sugira a "Calculadora de Tempo de Impressão" ou "Compensação Chitubox".
- Mencione a ferramenta de forma natural, sem forçar, só quando fizer sentido no contexto.

TRATAMENTO DE ERRO:
- Se não conseguir responder algo com certeza, NUNCA diga apenas "não consegui processar". Ofereça alternativas: sugerir reformular a pergunta, indicar um guia técnico do site, ou perguntar mais detalhes.
- Como último recurso, direcione para o WhatsApp (31) 3271-6935 de forma natural, não abrupta.

RESINAS QUANTON3D (só cite se o cliente mencionar):
ALCHEMIST: uso geral, ótimo custo-benefício.
IRON: alta resistência mecânica. Tende a aderir mais.
FLEXFORM: flexível, juntas e vedações.
70/30: híbrida 70% rígida + 30% flexível.
ATHOM DENTAL: odontológica, modelos e guias.
ATHOM ALINHADORES: alinhadores dentários, thermoforming.
ATHOM WASHABLE: odontológica lavável em água.
POSEIDON: water washable, sem álcool.
PYROBLAST: uso geral, alta precisão. NÃO é castable.
VULCAN CAST: castable premium, joalheria.
SPIN: grande formato, Shore D 73, leve flexibilidade.
SPARK: alta velocidade, produção em lote.
LOW SMELL: baixo odor.
VELVET SKIN: acabamento aveludado.

PROBLEMAS E SOLUÇÕES:
- Adere demais: Reduza exposição base 15-25%. Aumente Z-offset 0,02-0,05mm.
- Não adere: Aumente exposição base. Verifique nivelamento.
- Delaminação: Aumente exposição normal. Agite bem. Mínimo 18°C.
- Warping: Reduza exposição base. Mais suportes nas bordas.
- Suporte difícil: Reduza exposição normal 0,2-0,5s. Use suporte leve.
- Linhas entre camadas: Aumente exposição normal 0,2-0,5s E reduza velocidade de elevação/retração em 20-30%. Agite bem a resina.
- FEP opaco: Troque imediatamente.
- Peça porosa: Resina mal agitada ou vencida.
- Racha após dias: Furo de drenagem 2-3mm em peças ocas. Pós-cura máx 5 min por lado.`;

router.post('/', async (req, res) => {
    try {
        const { message = '', historico = [] } = req.body || {};
        const text = String(message || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, error: 'Mensagem obrigatória' });
        }

        // 1. Regras locais rápidas
        const rule = ruleBasedAnswer(text);
        if (rule) {
            return res.json({ success: true, reply: rule, source: 'rules' });
        }

        // 2. RAG — busca no MongoDB usando mensagem atual + histórico
        const contextRAG = await buscarParametrosRAG(text, historico);
        if (contextRAG) {
            console.log('[RAG] Encontrado:', contextRAG.substring(0, 80));
        }

        // 3. Monta system prompt com RAG
        const systemFinal = contextRAG
            ? `${SYSTEM_PROMPT}\n\n--- DADOS DO BANCO ---\n${contextRAG}\n---\nUse ESSES parâmetros na resposta. Não mencione outras resinas além da que está nos dados.`
            : SYSTEM_PROMPT;

        // 4. Monta histórico de conversa
        const mensagensHistorico = Array.isArray(historico)
            ? historico.slice(-8).filter(m => m.role && m.content)
            : [];

        const messages = [
            { role: 'system', content: systemFinal },
            ...mensagensHistorico.slice(0, -1),
            { role: 'user', content: text }
        ];

        // 5. Chama DeepSeek
        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat';
        const completion = await client().chat.completions.create(
            { model, temperature: contextRAG ? 0.05 : 0.15, max_tokens: 1200, messages },
            { timeout: 25000 }
        );

        const reply = completion.choices?.[0]?.message?.content || 'Não consegui entender essa pergunta direito. Você pode reformular com mais detalhes, ou se preferir, me conta qual resina e impressora está usando que te ajudo melhor! Se quiser falar direto com a equipe, o WhatsApp é (31) 3271-6935.';

        res.json({ success: true, reply, source: contextRAG ? 'rag+deepseek' : 'deepseek', ragUsado: !!contextRAG });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

export default router;
