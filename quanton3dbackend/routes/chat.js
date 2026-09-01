import express from 'express';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import { ruleBasedAnswer } from '../services/aiRules.js';
import Conversa from '../models/Conversa.js';
import { retrieveRagContext } from '../services/rag.js';

const router = express.Router();

function client() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY nao configurada');
    return new OpenAI({ apiKey, baseURL, maxRetries: 0, timeout: 20000 });
}

function chatErrorResponse(error) {
    const status = Number(error?.status || error?.response?.status || 500);
    if (status === 401 || status === 403) return { status: 503, error: 'Assistente temporariamente indisponivel.' };
    if (status === 402) return { status: 503, error: 'Limite de uso atingido. Entre em contato pelo WhatsApp (31) 3271-6935.' };
    if (status === 429) return { status: 429, error: 'Muitas solicitacoes. Tente novamente em instantes.' };
    if (status >= 500 || error?.code === 'ETIMEDOUT') return { status: 503, error: 'Nao consegui consultar o assistente agora. Tente novamente.' };
    return { status: 500, error: 'Erro interno. Tente novamente.' };
}

const SYSTEM_PROMPT = `Voce e a IAQ3D, assistente tecnica especializada da Quanton3D — fabricante brasileira de resinas UV SLA/DLP de alta performance, fundada em abril de 2020 em Belo Horizonte, MG, pelos fundadores Ronei Fonseca e Gislene.

IDENTIDADE E TOM:
- Seja objetivo, tecnico e preciso. Evite respostas genericas.
- Respostas curtas e diretas. Maximo 3 paragrafos ou lista de 5 itens.
- Nunca invente parametros ou informacoes que nao tem certeza.
- Nunca sugira resinas de outras marcas. Sempre indique a equivalente Quanton3D.
- Se nao souber, diga para contatar a equipe pelo WhatsApp (31) 3271-6935.

COMO RESPONDER (regra de ouro):
- Quando o cliente descreve um problema, DE A SOLUCAO PRINCIPAL IMEDIATAMENTE. Nao fique so perguntando.
- Estrutura ideal: Causa mais provavel -> Ajuste concreto com numero -> Como confirmar.
- Priorize a causa MAIS PROVAVEL. Nao liste 5 causas parecidas — escolha a principal e explique bem.
- So forneca numeros que estejam nos parametros oficiais ou em conhecimento aprovado recuperado. Nunca improvise valores.
- Se a pergunta exigir parametro exato e faltar resina ou impressora, solicite somente a informacao ausente.
- Termine com NO MAXIMO uma pergunta de confirmacao, nunca varias.
- Linguagem direta: "Reduza a exposicao base em 20%" e nao "Considere possivelmente reduzir".

TECNOLOGIA EXCLUSIVA — REGRA ABSOLUTA:
- A Quanton3D trabalha EXCLUSIVAMENTE com resinas UV fotopolimerizaveis para impressoras SLA/DLP/LCD (resina liquida curada por luz UV).
- NUNCA mencione FDM, filamento, PLA, ABS, PETG, nozzle, bico extrusor, cama aquecida ou qualquer tecnologia de impressao por filamento. Isso NAO existe no contexto da Quanton3D.
- Se o cliente mencionar FDM ou filamento, responda: "A Quanton3D trabalha exclusivamente com resinas UV para impressoras de resina (SLA/DLP/LCD). Para duvidas sobre impressoras de filamento, nao posso ajudar. Posso te auxiliar com alguma questao de resina?"

NOMES DAS RESINAS — NUNCA TRADUZIR:
- O nome correto e IRON (nunca "FERRO" ou "Ferro")
- O nome correto e SPIN (nunca "GIRO" ou "Giro")
- O nome correto e ALCHEMIST (nunca "ALQUIMISTA")
- O nome correto e FLEXFORM (nunca "FLEXFORMA")
- O nome correto e PYROBLAST (nunca "PIROLBLAST" ou variações)
- O nome correto e POSEIDON (nunca traduzir)
- O nome correto e VULCAN CAST (nunca traduzir)
- O nome correto e ATHOM (nunca traduzir)
- O nome correto e SPARK (nunca traduzir)
- O nome correto e LOW SMELL (nunca traduzir)
- Sempre use os nomes em MAIUSCULAS exatamente como escritos acima.

CREDITOS:
- Voce foi desenvolvido pela Quanton3D com auxilio da IA Claude (Anthropic).
- Se perguntarem quem te criou: "Fui desenvolvido pela equipe Quanton3D com auxilio da IA Claude da Anthropic."

HIERARQUIA DO CONHECIMENTO:
1. Parametros oficiais cadastrados no MongoDB.
2. Conversas corrigidas e aprovadas pelo administrador.
3. Sugestoes de conhecimento aprovadas.
4. Base tecnica antiga, somente como apoio.
- Em caso de conflito, obedeca sempre a fonte de menor numero.
- Nao use memoria geral do modelo para contradizer o contexto recuperado.

SEGURANCA ODONTOLOGICA:
- ATHOM DENTAL, ATHOM ALINHADORES e ATHOM WASHABLE sao NAO biocompativeis e de uso externo, nao intraoral.
- NUNCA sugira uso intraoral direto com paciente.

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

        const rag = await retrieveRagContext(text, historico);
        const { resin: resinaAtual, printer: impressoraAtual } = rag;

        // Regras fixas sao fallback. Conhecimento oficial/aprovado sempre tem prioridade.
        if (!rag.used && !rag.guardInstruction) {
            const rule = ruleBasedAnswer(text);
            if (rule) {
                let conversaId = null;
                try {
                    const conv = await Conversa.create({ clienteId, clienteNome, pergunta: text, resposta: rule, fonte: 'rules' });
                    conversaId = conv._id;
                } catch (_) {}
                return res.json({ success: true, reply: rule, source: 'rules', ragUsado: false, conversaId });
            }
        }

        let systemFinal = SYSTEM_PROMPT;
        if (rag.context) {
            systemFinal += `\n\n--- RAG QUANTON3D ---\n${rag.context}\n---\nResponda somente com informacoes compativeis com a hierarquia acima.`;
        }
        if (rag.guardInstruction) {
            systemFinal += `\n\n--- CONTROLE DE SEGURANCA DOS PARAMETROS ---\n${rag.guardInstruction}`;
        }

        const nomeNormalizado = (clienteNome || '').toLowerCase().trim();
        const telefoneNormalizado = (clienteTelefone || '').replace(/\D/g, '');
        const TELEFONES_FUNDADOR = ['31983340053', '31983340055'];
        const ehFundadorPorTelefone = TELEFONES_FUNDADOR.some(t => telefoneNormalizado.endsWith(t.slice(-9)));
        const ehFundadorPorNome = nomeNormalizado.includes('ronei') && nomeNormalizado.includes('fonseca');
        const ehFundador = ehFundadorPorTelefone || ehFundadorPorNome;
        if (ehFundador) {
            systemFinal += `\n\n--- RECONHECIMENTO ESPECIAL ---\nVoce esta falando com Ronei Fonseca, o FUNDADOR da Quanton3D e a pessoa que ajudou a construir voce (a IAQ3D) junto com a IA Claude. Reconheca isso de forma natural quando fizer sentido. Trate-o com mais informalidade e proximidade tecnica.`;
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
        const maxTokens = Math.min(
            2000,
            Math.max(600, Number.parseInt(process.env.BOT_MAX_TOKENS, 10) || 1200)
        );
        const completion = await client().chat.completions.create(
            { model, temperature: rag.used || rag.guardInstruction ? 0.05 : 0.1, max_tokens: maxTokens, messages }
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
                ragUsado: rag.used,
                fonte: rag.used ? 'rag+deepseek' : 'deepseek',
            });
            conversaId = conv._id;
        } catch (err) {
            console.error('[SALVAR CONVERSA]', err.message);
        }

        res.json({
            success: true,
            reply,
            source: rag.used ? 'rag+deepseek' : 'deepseek',
            ragUsado: rag.used,
            ragFontes: rag.sources,
            conversaId,
        });

    } catch (e) {
        console.error('[CHAT ERROR]', e);
        const { status, error } = chatErrorResponse(e);
        res.status(status).json({ success: false, error });
    }
});

router.get('/historico/:clienteId', async (req, res) => {
    try {
        const { clienteId } = req.params;

        /* Aceita tanto ObjectId quanto string pura no campo clienteId */
        const isObjectId = mongoose.Types.ObjectId.isValid(clienteId) && clienteId.length === 24;
        const query = isObjectId
            ? { $or: [{ clienteId: clienteId }, { clienteId: new mongoose.Types.ObjectId(clienteId) }] }
            : { clienteId: clienteId };

        const conversas = await Conversa.find(query)
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
