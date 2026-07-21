import express from 'express';
import OpenAI from 'openai';
import { ruleBasedAnswer } from '../services/aiRules.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';
import Conversa from '../models/Conversa.js';

const router = express.Router();

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Buscar sugestões aprovadas relevantes ─────────────────────────────────────
async function buscarSugestoesAprovadas(pergunta) {
  try {
    const sugestoes = await SugestaoConhecimento.find({ status: 'aprovado' }).limit(50).lean();
    if (!sugestoes.length) return '';

    const palavras = pergunta.toLowerCase().split(/\s+/).filter(p => p.length > 3);
    const relevantes = sugestoes.filter(s => {
      const texto = `${s.titulo} ${s.conteudo}`.toLowerCase();
      return palavras.some(p => texto.includes(p));
    }).slice(0, 5);

    const lista = relevantes.length > 0 ? relevantes : sugestoes.slice(0, 3);
    if (!lista.length) return '';

    return '\n\n--- CONHECIMENTO APROVADO PELA EQUIPE QUANTON3D ---\n' +
      lista.map(s => `[${s.categoria.toUpperCase()}] ${s.titulo}: ${s.conteudo}`).join('\n') +
      '\n--- USE ESTE CONHECIMENTO COM PRIORIDADE ---';
  } catch (e) {
    console.error('[CHAT] Erro ao buscar sugestões:', e.message);
    return '';
  }
}

// ── Buscar histórico do cliente ───────────────────────────────────────────────
async function buscarHistorico(clienteId) {
  if (!clienteId) return [];
  try {
    const conversa = await Conversa.findOne({ clienteId }).sort({ updatedAt: -1 }).lean();
    if (!conversa?.mensagens?.length) return [];
    return conversa.mensagens.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));
  } catch (e) {
    console.error('[CHAT] Erro ao buscar histórico:', e.message);
    return [];
  }
}

// ── Salvar histórico ──────────────────────────────────────────────────────────
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
    console.error('[CHAT] Erro ao salvar histórico:', e.message);
  }
}

// ── ROTA PRINCIPAL ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message = '', image = null, clienteId = null, historico = [] } = req.body || {};
    const text = String(message || '').trim();

    if (!text && !image) return res.status(400).json({ success: false, error: 'Mensagem ou imagem obrigatória' });

    // 1. Regras fixas
    const rule = ruleBasedAnswer(text);
    if (rule && !image) return res.json({ success: true, reply: rule, source: 'rules' });

    // 2. Sugestões aprovadas
    const conhecimentoExtra = await buscarSugestoesAprovadas(text);

    // 3. Histórico — banco tem prioridade sobre front
    const historicoSalvo = await buscarHistorico(clienteId);
    const mensagensHistorico = historicoSalvo.length > 0 ? historicoSalvo :
      (historico || []).filter(m => m.role === 'user' || m.role === 'assistant').slice(-10);

    // 4. Conteúdo
    const content = [{ type: 'text', text: text || 'Analise a imagem de impressão 3D.' }];
    if (image) content.push({ type: 'image_url', image_url: { url: image } });

    // 5. System prompt
    const systemPrompt = `Você é o ELIO, assistente técnico especialista da Quanton3D.
Responda de forma prática, técnica e objetiva.
Não invente resinas que não existem. Use apenas resinas Quanton3D.
Se o cliente mencionar outra marca de resina, oriente a usar as resinas Quanton3D equivalentes e explique por quê.
Pneus/flexibilidade → FLEXFORM. Personagens resistentes → IRON. Odontologia → linha ATHOM.
Se cliente disser só a marca da impressora sem o modelo, pergunte o modelo exato.
Se tiver imagem, analise visualmente primeiro antes de qualquer diagnóstico.
Quando relevante, mencione que pode abrir um chamado técnico pelo site.${conhecimentoExtra}`;

    // 6. Chamar OpenAI com histórico
    const completion = await client().chat.completions.create({
      model: image ? (process.env.OPENAI_VISION_MODEL || 'gpt-4o') : (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'),
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        ...mensagensHistorico,
        { role: 'user', content }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || 'Não consegui responder agora.';

    // 7. Salvar histórico
    await salvarHistorico(clienteId, text || '[imagem]', reply);

    res.json({ success: true, reply, source: 'openai' });

  } catch (e) {
    console.error('[CHAT]', e);
    res.status(500).json({ success: false, error: e.message || 'Erro no chat' });
  }
});

// ── Buscar histórico de uma conversa ─────────────────────────────────────────
router.get('/historico/:clienteId', async (req, res) => {
  try {
    const conversa = await Conversa.findOne({ clienteId: req.params.clienteId }).lean();
    res.json({ success: true, mensagens: conversa?.mensagens?.slice(-20) || [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;

