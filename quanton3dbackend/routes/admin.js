import express from 'express';
import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';
import Formulacao from '../models/Formulacao.js';
import Parametro from '../models/Parametro.js';
import GalleryItem from '../models/GalleryItem.js';
import Conversa from '../models/Conversa.js';
import BotTicket from '../models/BotTicket.js';
import Visita from '../models/Visita.js';
import ContactMessage from '../models/ContactMessage.js';
import SugestaoConhecimento from '../models/SugestaoConhecimento.js';

const router = express.Router();

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente' });
  try { jwt.verify(token, process.env.ADMIN_JWT_SECRET); next(); }
  catch { return res.status(401).json({ success: false, error: 'Token inválido' }); }
}

router.post('/login', (req, res) => {
  const { user, password } = req.body || {};
  if (user !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  const token = jwt.sign({ user, role: "superadmin" }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token });
});

router.get('/metrics', auth, async (_req, res) => {
  try {
    const agora = new Date();
    const inicioDia = new Date(agora); inicioDia.setHours(0,0,0,0);
    const inicio7d = new Date(agora); inicio7d.setDate(agora.getDate() - 7);
    const inicio30d = new Date(agora); inicio30d.setDate(agora.getDate() - 30);

    const [
      totalClientes, totalFormulacoes, totalParametros, totalGallery,
      clientes, formulacoes, parametros, gallery,
      // Bot metrics
      totalConversas, conversasHoje, conversas7d,
      conversasPorFonte, feedbackPositivo, feedbackNegativo,
      feedbackNaoRevisado, conversasAprovadas,
      resinasMaisPergutnadas, impressorasMaisPerguntadas,
      // Chamados
      totalChamados, chamadosNovo, chamadosAbertos,
      chamadosResolvidos, ticketsFeedbackPositivo, ticketsFeedbackNegativo,
      ticketsPrecisaHumano,
    ] = await Promise.all([
      Cliente.countDocuments(),
      Formulacao.countDocuments(),
      Parametro.countDocuments(),
      GalleryItem.countDocuments(),
      Cliente.find().sort({ createdAt: -1 }).limit(500).lean(),
      Formulacao.find().sort({ createdAt: -1 }).limit(500).lean(),
      Parametro.find().sort({ resina: 1 }).limit(500).lean(),
      GalleryItem.find().sort({ createdAt: -1 }).limit(500).lean(),
      // Bot metrics queries
      Conversa.countDocuments(),
      Conversa.countDocuments({ createdAt: { $gte: inicioDia } }),
      Conversa.countDocuments({ createdAt: { $gte: inicio7d } }),
      Conversa.aggregate([
        { $group: { _id: '$fonte', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Conversa.countDocuments({ feedback: 'satisfatoria' }),
      Conversa.countDocuments({ feedback: 'nao_satisfatoria' }),
      Conversa.countDocuments({ feedback: 'nao_satisfatoria', revisadoFeedback: false }),
      Conversa.countDocuments({ aprovado: true }),
      Conversa.aggregate([
        { $match: { resinaDetectada: { $ne: '' } } },
        { $group: { _id: '$resinaDetectada', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Conversa.aggregate([
        { $match: { impressoraDetectada: { $ne: '' } } },
        { $group: { _id: '$impressoraDetectada', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      // Chamados queries
      BotTicket.countDocuments(),
      BotTicket.countDocuments({ status: 'novo' }),
      BotTicket.countDocuments({ status: { $in: ['novo', 'em_analise'] } }),
      BotTicket.countDocuments({ status: { $in: ['respondido', 'fechado'] } }),
      BotTicket.countDocuments({ feedbackCliente: 'ajudou' }),
      BotTicket.countDocuments({ feedbackCliente: 'nao_ajudou' }),
      BotTicket.countDocuments({ precisaHumano: true }),
    ]);

    // Bloco 2: crescimento de clientes por dia (últimos 30 dias) e por origem
    const clientesPor30d = await Cliente.aggregate([
      { $match: { createdAt: { $gte: inicio30d } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    const clientesPorOrigem = await Cliente.aggregate([
      { $group: { _id: { $ifNull: ['$origem', 'outros'] }, total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);
    const clientesHoje = await Cliente.countDocuments({ createdAt: { $gte: inicioDia } });
    const clientes7d = await Cliente.countDocuments({ createdAt: { $gte: inicio7d } });
    const clientes30d = await Cliente.countDocuments({ createdAt: { $gte: inicio30d } });

    // Bloco 3: métricas de visitas
    const [
      visitasHoje, visitasUnicas7d, visitasUnicas30d,
      visitasPorPagina, visitasPorHora, visitasPorDia30d,
      // Bloco 4: contato e conhecimento
      msgNaoLidas, sugestoesPendentes, conversasPendentesAprovacao,
    ] = await Promise.all([
      Visita.distinct('sessionId', { createdAt: { $gte: inicioDia } }).then(r => r.length),
      Visita.distinct('sessionId', { createdAt: { $gte: inicio7d } }).then(r => r.length),
      Visita.distinct('sessionId', { createdAt: { $gte: inicio30d } }).then(r => r.length),
      Visita.aggregate([
        { $match: { createdAt: { $gte: inicio30d } } },
        { $group: { _id: '$pagina', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Visita.aggregate([
        { $match: { createdAt: { $gte: inicio7d } } },
        { $group: { _id: { $hour: '$createdAt' }, total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
      Visita.aggregate([
        { $match: { createdAt: { $gte: inicio30d } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          visitantes: { $addToSet: '$sessionId' },
        }},
        { $project: { _id: 1, total: { $size: '$visitantes' } } },
        { $sort: { _id: 1 } },
      ]),
      ContactMessage.countDocuments({ lida: { $ne: true } }).catch(() => 0),
      SugestaoConhecimento.countDocuments({ status: 'pendente' }),
      Conversa.countDocuments({ aprovado: false }),
    ]);

    res.json({
      success: true,
      totals: { clientes: totalClientes, formulacoes: totalFormulacoes, parametros: totalParametros, gallery: totalGallery },
      clientes,
      formulacoes,
      parametros,
      gallery,
      botMetrics: {
        totalConversas,
        conversasHoje,
        conversas7d,
        conversas30d: await Conversa.countDocuments({ createdAt: { $gte: inicio30d } }),
        porFonte: conversasPorFonte,
        feedbackPositivo,
        feedbackNegativo,
        feedbackNaoRevisado,
        conversasAprovadas,
        resinasMaisPerguntadas: resinasMaisPergutnadas,
        impressorasMaisPerguntadas,
      },
      ticketMetrics: {
        total: totalChamados,
        novo: chamadosNovo,
        abertos: chamadosAbertos,
        resolvidos: chamadosResolvidos,
        feedbackPositivo: ticketsFeedbackPositivo,
        feedbackNegativo: ticketsFeedbackNegativo,
        precisaHumano: ticketsPrecisaHumano,
      },
      clienteMetrics: {
        hoje: clientesHoje,
        ultimos7d: clientes7d,
        ultimos30d: clientes30d,
        por30d: clientesPor30d,
        porOrigem: clientesPorOrigem,
      },
      visitaMetrics: {
        hoje: visitasHoje,
        ultimos7d: visitasUnicas7d,
        ultimos30d: visitasUnicas30d,
        porPagina: visitasPorPagina,
        porHora: visitasPorHora,
        porDia30d: visitasPorDia30d,
      },
      atencaoMetrics: {
        msgNaoLidas,
        sugestoesPendentes,
        conversasPendentesAprovacao,
      },
    });
  } catch (err) {
    console.error('Erro em /admin/metrics:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao carregar métricas.' });
  }
});

// ── SUGERIR MELHORIA COM IA (DeepSeek) ────────────────────────────────────────
router.post('/sugerir-melhoria', auth, async (req, res) => {
  try {
    const { pergunta, respostaOriginal, configuracaoCliente, resinaDetectada, impressoraDetectada } = req.body || {};
    if (!pergunta || !respostaOriginal)
      return res.status(400).json({ success: false, error: 'pergunta e respostaOriginal são obrigatórios.' });

    const contextoParts = [];
    if (resinaDetectada) contextoParts.push(`Resina: ${resinaDetectada}`);
    if (impressoraDetectada) contextoParts.push(`Impressora: ${impressoraDetectada}`);
    if (configuracaoCliente) contextoParts.push(`Configuração do cliente: ${configuracaoCliente}`);
    const contexto = contextoParts.length ? `\n${contextoParts.join('\n')}` : '';

    const promptIA = `Você é um especialista em impressão 3D de resina UV da Quanton3D.
Um cliente fez uma pergunta e a resposta do bot NÃO ajudou (feedback negativo). Melhore a resposta.

PERGUNTA DO CLIENTE:
${pergunta}
${contexto}

RESPOSTA ORIGINAL (não ajudou):
${respostaOriginal}

Escreva uma resposta melhorada em português do Brasil. Seja técnico, direto e use passos numerados quando aplicável. Não explique o que você está fazendo, apenas escreva a resposta melhorada.`;

    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model   = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash';

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: promptIA }],
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('DeepSeek error:', errText);
      return res.status(500).json({ success: false, error: 'Erro na API DeepSeek.' });
    }

    const data = await resp.json();
    const sugestao = data.choices?.[0]?.message?.content?.trim() || '';
    res.json({ success: true, sugestao });
  } catch (err) {
    console.error('Erro em /admin/sugerir-melhoria:', err);
    res.status(500).json({ success: false, error: 'Erro ao gerar sugestão com IA.' });
  }
});

// ── SUGERIR RESPOSTA PARA CHAMADO COM IA (DeepSeek) ──────────────────────────
router.post('/sugerir-resposta-ticket', auth, async (req, res) => {
  try {
    const { nome, problema, descricao, resina, impressora, parametrosInformados } = req.body || {};
    if (!problema) return res.status(400).json({ success: false, error: 'problema é obrigatório.' });

    const partes = [];
    if (resina) partes.push(`Resina: ${resina}`);
    if (impressora) partes.push(`Impressora: ${impressora}`);
    if (parametrosInformados) partes.push(`Parâmetros informados: ${parametrosInformados}`);
    if (descricao) partes.push(`Descrição do cliente: ${descricao}`);
    const contexto = partes.join('\n');

    const promptIA = `Você é um especialista em impressão 3D de resina UV da Quanton3D.
Um cliente abriu um chamado técnico com o seguinte problema. Escreva uma resposta técnica clara e útil para enviar ao cliente.

CLIENTE: ${nome || 'Cliente'}
PROBLEMA: ${problema}
${contexto}

Escreva a resposta em português do Brasil. Seja técnico, empático e direto. Use passos numerados quando aplicável.
Inclua o que o cliente deve verificar primeiro, a causa mais provável e a solução recomendada.
Não escreva "olá" genérico — use o nome do cliente se disponível. Não exceda 5 parágrafos.`;

    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    const model   = process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash';

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: promptIA }],
        max_tokens: 700,
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('DeepSeek error (ticket):', errText);
      return res.status(500).json({ success: false, error: 'Erro na API DeepSeek.' });
    }

    const data = await resp.json();
    const sugestao = data.choices?.[0]?.message?.content?.trim() || '';
    res.json({ success: true, sugestao });
  } catch (err) {
    console.error('Erro em /admin/sugerir-resposta-ticket:', err);
    res.status(500).json({ success: false, error: 'Erro ao gerar resposta com IA.' });
  }
});

router.get('/relatorio-semanal', auth, async (_req, res) => {
  try {
    const agora = new Date();
    const inicio7d = new Date(agora);
    inicio7d.setDate(agora.getDate() - 7);
    inicio7d.setHours(0, 0, 0, 0);

    const [novosClientes, totalConversas, feedbacksNegativos, conversasAprovadas, novosTickets, conversas7d] = await Promise.all([
      Cliente.countDocuments({ createdAt: { $gte: inicio7d } }),
      Conversa.countDocuments({ createdAt: { $gte: inicio7d } }),
      Conversa.countDocuments({ createdAt: { $gte: inicio7d }, feedback: 'nao_satisfatoria' }),
      Conversa.countDocuments({ createdAt: { $gte: inicio7d }, aprovado: true }),
      BotTicket.countDocuments({ createdAt: { $gte: inicio7d } }),
      Conversa.find({ createdAt: { $gte: inicio7d } })
        .select('pergunta resinaDetectada')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

    // Top perguntas (agrupa por texto similar - primeiras 80 chars)
    const pergFreq = {};
    for (const c of conversas7d) {
      const chave = (c.pergunta || '').slice(0, 80).toLowerCase().trim();
      if (chave) pergFreq[chave] = (pergFreq[chave] || 0) + 1;
    }
    const topPerguntas = Object.entries(pergFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pergunta, total]) => ({ pergunta, total }));

    // Top resinas
    const resinaFreq = {};
    for (const c of conversas7d) {
      if (c.resinaDetectada) {
        resinaFreq[c.resinaDetectada] = (resinaFreq[c.resinaDetectada] || 0) + 1;
      }
    }
    const topResinas = Object.entries(resinaFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([resina, total]) => ({ resina, total }));

    return res.json({
      success: true,
      periodo: { inicio: inicio7d.toISOString(), fim: agora.toISOString() },
      novosClientes,
      totalConversas,
      feedbacksNegativos,
      conversasAprovadas,
      novosTickets,
      topPerguntas,
      topResinas,
    });
  } catch (err) {
    console.error('Erro em /admin/relatorio-semanal:', err);
    return res.status(500).json({ success: false, error: 'Erro ao gerar relatório.' });
  }
});

export default router;

// ── LIMPEZA DE DADOS DE TESTE ─────────────────────────────────────────────────
router.delete('/limpar-testes', auth, async (req, res) => {
  try {
    const { colecoes } = req.body || {};
    if (!Array.isArray(colecoes) || colecoes.length === 0)
      return res.status(400).json({ success: false, error: 'Nenhuma coleção selecionada.' });

    // Lista branca — só essas podem ser limpas, nunca parametros/atendentes
    const PERMITIDAS = ['clientes', 'visitas', 'conversas', 'bottickets', 'contactmessages', 'formulacoes', 'logacoes', 'partnerrequests', 'galleryitems', 'atendentes'];
    const invalidas = colecoes.filter(c => !PERMITIDAS.includes(c));
    if (invalidas.length > 0)
      return res.status(400).json({ success: false, error: `Coleções não permitidas: ${invalidas.join(', ')}` });

    // Importar modelos dinamicamente
    const { default: Cliente }        = await import('../models/Cliente.js');
    const { default: Visita }         = await import('../models/Visita.js');
    const { default: Conversa }       = await import('../models/Conversa.js');
    const { default: BotTicket }      = await import('../models/BotTicket.js');
    const { default: ContactMessage } = await import('../models/ContactMessage.js');
    const { default: Formulacao }     = await import('../models/Formulacao.js');
    const { default: LogAcao }        = await import('../models/LogAcao.js');
    const { default: PartnerRequest } = await import('../models/PartnerRequest.js');
    const { default: GalleryItem }    = await import('../models/GalleryItem.js');
    const { default: Atendente }      = await import('../models/Atendente.js');

    const MAPA = { clientes: Cliente, visitas: Visita, conversas: Conversa, bottickets: BotTicket, contactmessages: ContactMessage, formulacoes: Formulacao, logacoes: LogAcao, partnerrequests: PartnerRequest, galleryitems: GalleryItem, atendentes: Atendente };

    const resultados = {};
    for (const nome of colecoes) {
      const Model = MAPA[nome];
      if (Model) {
        const r = await Model.deleteMany({});
        resultados[nome] = r.deletedCount;
      }
    }

    res.json({ success: true, resultados, mensagem: 'Dados limpos com sucesso!' });
  } catch (err) {
    console.error('Erro ao limpar dados:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao limpar dados.' });
  }
});
