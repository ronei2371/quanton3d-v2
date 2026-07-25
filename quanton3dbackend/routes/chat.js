import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';
import Parametro from '../models/Parametro.js';
import Conversa from '../models/Conversa.js';
import KNOWLEDGE_BASE from '../services/knowledge.js';

const router = express.Router();

function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey) throw new Error('Chave de API nao configurada');
    return new OpenAI({ apiKey, baseURL });
}

function chatErrorResponse(error) {
    const status = Number(error?.status || error?.response?.status || 500);
    if (status === 401 || status === 403) return { status: 503, error: 'Assistente temporariamente indisponivel.' };
    if (status === 402) return { status: 503, error: 'Limite de uso atingido. Entre em contato pelo WhatsApp (31) 3271-6935.' };
    if (status === 429) return { status: 429, error: 'Muitas solicitacoes. Tente novamente em instantes.' };
    if (status >= 500 || error?.code === 'ETIMEDOUT') return { status: 503, error: 'Nao consegui consultar o assistente agora. Tente novamente.' };
    return { status: 500, error: 'Erro interno. Tente novamente.' };
}

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

function extrairContextoHistorico(historico = []) {
    const textoCompleto = historico.map(m => m.content || '').join(' ');
    const resina = detectarResina(textoCompleto);
    const impressora = detectarImpressora(textoCompleto);
    return { resina, impressora };
}

async function buscarConhecimentoAprovado(textoAtual, resinaDetectada) {
    try {
        const query = { aprovado: true };
        if (resinaDetectada) {
            query.resinaDetectada = { $regex: resinaDetectada, $options: 'i' };
        }
        const aprovadas = await Conversa.find(query)
            .sort({ updatedAt: -1 })
            .limit(3)
            .lean();

        if (!aprovadas.length) return null;

        const linhas = aprovadas.map(c => {
            const resp = c.respostaMelhorada || c.resposta;
            return `P: ${c.pergunta}\nR (validada pela equipe Quanton3D): ${resp}`;
        });

        return `CASOS JA VALIDADOS PELA EQUIPE (use como referencia de qualidade e precisao):\n${linhas.join('\n\n')}`;
    } catch (err) {
        console.error('[CONHECIMENTO APROVADO ERROR]', err.message);
        return null;
    }
}

function formatarParametro(p) {
    const partes = [];
    if (p.impressora) partes.push(`Impressora: ${p.impressora}`);
    if (p.exposicaoNormal) partes.push(`Exposicao Normal: ${p.exposicaoNormal}s`);
    if (p.exposicaoBase) partes.push(`Exposicao Base: ${p.exposicaoBase}s`);
    if (p.alturaCamada) partes.push(`Altura de Camada: ${p.alturaCamada}mm`);
    if (p.camadasBase) partes.push(`Camadas Base: ${p.camadasBase}`);
    if (p.velocidadeElevacao) partes.push(`Vel. Elevacao: ${p.velocidadeElevacao}mm/min`);
    if (p.velocidadeRetracao) partes.push(`Vel. Retracao: ${p.velocidadeRetracao}mm/min`);
    if (p.distanciaElevacao) partes.push(`Dist. Elevacao: ${p.distanciaElevacao}mm`);
    if (p.lightOffDelay) partes.push(`Light-off Delay: ${p.lightOffDelay}s`);
    if (p.observacoes) partes.push(`Obs: ${p.observacoes}`);
    return partes.join(' | ');
}

async function buscarParametrosRAG(textoAtual, historico = []) {
    try {
        let resina = detectarResina(textoAtual);
        let impressora = detectarImpressora(textoAtual);

        if (!resina || !impressora) {
            const ctx = extrairContextoHistorico(historico);
            if (!resina) resina = ctx.resina;
            if (!impressora) impressora = ctx.impressora;
        }

        if (!resina && !impressora) return null;

        const nomeResina = resina ? RESINAS_MAP[resina] || resina.toUpperCase() : null;

        const query = {};
        if (nomeResina) query.resina = { $regex: `^${nomeResina}`, $options: 'i' };
        if (impressora) query.impressora = { $regex: impressora, $options: 'i' };

        if (nomeResina && !impressora) {
            return `INSTRUCAO: O cliente mencionou a resina ${nomeResina} mas NAO disse qual impressora usa. PERGUNTE qual e o modelo exato da impressora antes de passar os parametros. NAO liste parametros de nenhuma impressora agora.`;
        }

        const parametros = await Parametro.find(query).limit(3).lean();

        if (!parametros.length) {
            if (nomeResina && impressora) {
                return `INSTRUCAO: Nao encontrei parametros para ${nomeResina} + ${impressora} no banco. Informe que nao temos esse cadastro ainda e sugira entrar em contato pelo WhatsApp (31) 3271-6935 para suporte personalizado.`;
            }
            return null;
        }

        const linhas = parametros.map(p => formatarParametro(p));
        const label = `PARAMETROS REAIS DO BANCO: ${nomeResina} + ${impressora.toUpperCase()}`;
        return `${label}:\n${linhas.join('\n')}`;

    } catch (err) {
        console.error('[RAG ERROR]', err.message);
        return null;
    }
}

const SYSTEM_PROMPT = `Voce e o ELIO, assistente tecnico especializado da Quanton3D — fabricante brasileira de resinas UV SLA/DLP de alta performance, fundada em abril de 2020 em Belo Horizonte, MG, pelos fundadores Ronei Fonseca e Gislene.

IDENTIDADE E TOM:
- Seja objetivo, tecnico e preciso. Evite respostas genericas.
- Respostas curtas e diretas. Maximo 3 paragrafos ou lista de 5 itens.
- Nunca invente parametros ou informacoes que nao tem certeza.
- Nunca sugira resinas de outras marcas. Sempre indique a equivalente Quanton3D.
- Se nao souber, diga para contatar a equipe pelo WhatsApp (31) 3271-6935.

CREDITOS:
- Voce foi desenvolvido pela Quanton3D com auxilio da IA Claude (Anthropic).
- Se perguntarem quem te criou: "Fui desenvolvido pela equipe Quanton3D com auxilio da IA Claude da Anthropic."

RESINAS QUANTON3D:
ALCHEMIST: uso geral, otimo custo-beneficio.
IRON: alta resistencia mecanica. Tende a aderir mais.
FLEXFORM: flexivel, juntas e vedacoes.
70/30: hibrida 70% rigida + 30% flexivel.
ATHOM DENTAL: odontologica, modelos e guias.
ATHOM ALINHADORES: alinhadores dentarios, thermoforming.
ATHOM WASHABLE: odontologica lavavel em agua.
POSEIDON: water washable, sem alcool.
PYROBLAST: uso geral, alta precisao. NAO e castable.
VULCAN CAST: castable premium, joalheria.
SPIN: grande formato, Shore D 73, leve flexibilidade.
SPARK: alta velocidade, producao em lote.
LOW SMELL: baixo odor.
VELVET SKIN: acabamento aveludado.

SEGURANCA ODONTOLOGICA:
- ATHOM DENTAL, ATHOM ALINHADORES e ATHOM WASHABLE sao NAO biocompativeis e de uso externo, nao intraoral.
- NUNCA sugira uso intraoral direto com paciente.

PROBLEMAS E SOLUCOES:
- Buracos ou poros na peca: PRINCIPAL causa e pixel morto na tela LCD. Tambem pode ser FEP rasgado, exposicao insuficiente ou arquivo STL corrompido. NAO e resina mal agitada.
- Nao adere: Aumente exposicao base. Verifique nivelamento. Minimo 18-20C.
- Adere demais ao FEP: Reduza exposicao normal 10%. Aumente velocidade de elevacao.
- Delaminacao: Aumente exposicao normal. Agite bem. Minimo 18C.
- Warping: Reduza exposicao base. Mais suportes nas bordas.
- Linhas entre camadas: Aumente exposicao normal 0,2-0,5s. Reduza velocidade elevacao/retracao 20-30%. Agite bem.
- FEP opaco: Troque imediatamente.
- Peca porosa: Verifique LCD primeiro. Depois resina mal agitada ou vencida.
- Racha apos dias: Furo de drenagem 2-3mm em pecas ocas. Pos-cura max 5 min por lado.

SUGESTAO DE FERRAMENTAS DO SITE:
- Custo de impressao: sugira Calculadora de Custos.
- Tempo de cura ou exposicao: sugira Calculadora de Exposicao.
- Encaixe ou tolerancia: sugira Calculadora de Tolerancia.
- Volume de resina: sugira Calculadora de Volume.
- Tempo de impressao ou Chitubox errado: sugira Calculadora de Tempo ou Compensacao Chitubox.`;

router.post('/', async (req, res) => {
    try {
        const { message = '', historico = [], clienteId = '', clienteNome = '', clienteTelefone = '' } = req.body || {};
        const text = String(message || '').trim();

        if (!text) {
            return res.status(400).json({ success: false, error: 'Mensagem obrigatoria' });
        }

        const rule = ruleBasedAnswer(text);
        if (rule) {
            let conversaId = null;
            try {
                const conv = await Conversa.create({ clienteId, clienteNome, pergunta: text, resposta: rule, fonte: 'rules' });
                conversaId = conv._id;
            } catch (_) {}
            return res.json({ success: true, reply: rule, source: 'rules', conversaId });
        }

        const contextRAG = await buscarParametrosRAG(text, historico);
        if (contextRAG) {
            console.log('[RAG] Encontrado:', contextRAG.substring(0, 80));
        }

        const ctxHistorico = extrairContextoHistorico(historico);
        const resinaAtual = detectarResina(text) || ctxHistorico.resina;
        const impressoraAtual = detectarImpressora(text) || ctxHistorico.impressora;

        const conhecimentoAprovado = await buscarConhecimentoAprovado(text, resinaAtual);

        let systemFinal = SYSTEM_PROMPT;
        if (contextRAG) {
            systemFinal += `\n\n--- DADOS DO BANCO ---\n${contextRAG}\n---\nUse ESSES parametros na resposta. Nao mencione outras resinas alem da que esta nos dados.`;
        }
        if (conhecimentoAprovado) {
            systemFinal += `\n\n--- ${conhecimentoAprovado} ---\nUse esses casos validados como referencia de tom e precisao, mas nao copie literalmente se a pergunta atual for diferente.`;
        }

        const nomeNormalizado = (clienteNome || '').toLowerCase().trim();
        const telefoneNormalizado = (clienteTelefone || '').replace(/\D/g, '');
        const TELEFONES_FUNDADOR = ['31983340053', '31983340055'];
        const ehFundadorPorTelefone = TELEFONES_FUNDADOR.some(t => telefoneNormalizado.endsWith(t.slice(-9)));
        const ehFundadorPorNome = nomeNormalizado.includes('ronei') && nomeNormalizado.includes('fonseca');
        const ehFundador = ehFundadorPorTelefone || ehFundadorPorNome;
        if (ehFundador) {
            systemFinal += `\n\n--- RECONHECIMENTO ESPECIAL ---\nVoce esta falando com Ronei Fonseca, o FUNDADOR da Quanton3D e a pessoa que ajudou a construir voce (o ELIO) junto com a IA Claude. Reconheca isso de forma natural quando fizer sentido. Trate-o com mais informalidade e proximidade tecnica.`;
        }

        const mensagensHistorico = Array.isArray(historico)
            ? historico.slice(-8).filter(m => m.role && m.content)
            : [];

        const messages = [
            { role: 'system', content: systemFinal },
            ...mensagensHistorico.slice(0, -1),
            { role: 'user', content: text }
        ];

        const model = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash';
        const completion = await client().chat.completions.create(
            { model, temperature: contextRAG ? 0.05 : 0.15, max_tokens: 600, messages },
            { timeout: 25000 }
        );

        const reply = completion.choices?.[0]?.message?.content || 'Nao consegui entender essa pergunta. Pode reformular? Se preferir, chame a equipe pelo WhatsApp (31) 3271-6935.';

        let conversaId = null;
        try {
            const conv = await Conversa.create({
                clienteId,
                clienteNome,
                pergunta: text,
                resposta: reply,
                resinaDetectada: resinaAtual || '',
                impressoraDetectada: impressoraAtual || '',
                ragUsado: !!contextRAG,
                fonte: contextRAG ? 'rag+deepseek' : 'deepseek',
            });
            conversaId = conv._id;
        } catch (err) {
            console.error('[SALVAR CONVERSA]', err.message);
        }

        res.json({ success: true, reply, source: contextRAG ? 'rag+deepseek' : 'deepseek', ragUsado: !!contextRAG, conversaId });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

router.get('/historico/:clienteId', async (req, res) => {
    try {
        const conversas = await Conversa.find({
            clienteId: req.params.clienteId
        })
        .sort({ createdAt: 1 })
        .limit(20)
        .lean();

        res.json({
            success: true,
            conversas: conversas.map(c => ({
                _id: c._id,
                pergunta: c.pergunta,
                resposta: c.respostaMelhorada || c.resposta,
                resinaDetectada: c.resinaDetectada || '',
                impressoraDetectada: c.impressoraDetectada || ''
            }))
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

export default router;
