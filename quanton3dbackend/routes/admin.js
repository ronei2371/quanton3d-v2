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

// ── MIGRAÇÃO DE FOTOS DAS IMPRESSORAS ────────────────────────────────────────
router.post('/migrar-fotos-impressoras', auth, async (_req, res) => {
  const BASE = "https://raw.githubusercontent.com/Photocura-hub/Photocura/main/";
  const PRINTER_PHOTOS = {
    // ── Elegoo ──────────────────────────────────────────────────────────────
    "mars":                BASE + "Elegoo_ELEGOO_MARS.png",
    "mars 2":              BASE + "Elegoo_ELEGOO_MARS_2.png",
    "mars 2 pro":          BASE + "Elegoo_ELEGOO_MARS_2_Pro.png",
    "mars 3":              BASE + "Elegoo_ELEGOO_MARS_3.png",
    "mars 3 pro":          BASE + "Elegoo_ELEGOO_MARS_3_PRO.png",
    "mars 3 ultra":        BASE + "Elegoo_ELEGOO_MARS_3_PRO.png",
    "mars 4":              BASE + "Elegoo_ELEGOO_MARS_4.png",
    "mars 4 dlp":          BASE + "Elegoo_ELEGOO_MARS_4_DLP.png",
    "mars 4 max":          BASE + "Elegoo_ELEGOO_MARS_4_MAX.png",
    "mars 4 ultra":        BASE + "Elegoo_ELEGOO_Mars_4_Ultra.png",
    "mars 5":              BASE + "Elegoo_ELEGOO_Mars_5.png",
    "mars 5 ultra":        BASE + "Elegoo_ELEGOO_Mars_5_Ultra.png",
    "mars c":              BASE + "Elegoo_ELEGOO_MARS_C.png",
    "mars pro":            BASE + "Elegoo_ELEGOO_MARS_Pro.png",
    "saturn":              BASE + "Elegoo_ELEGOO_SATURN.png",
    "saturn 2":            BASE + "Elegoo_ELEGOO_SATURN_2.png",
    "saturn 3":            BASE + "Elegoo_ELEGOO_SATURN_3.png",
    "saturn 3 ultra":      BASE + "Elegoo_ELEGOO_SATURN_3_Ultra.png",
    "saturn 4":            BASE + "Elegoo_ELEGOO_Saturn_4.png",
    "saturn 4 ultra":      BASE + "Elegoo_ELEGOO_Saturn_4_Ultra.png",
    "saturn 4 ultra 16k":  BASE + "Elegoo_ELEGOO_Saturn_4_Ultra_16K.png",
    "saturn 8k":           BASE + "Elegoo_ELEGOO_SATURN_8K.png",
    "saturn s":            BASE + "Elegoo_ELEGOO_SATURN_S.png",
    "jupiter":             BASE + "Elegoo_ELEGOO_JUPITER.png",
    "jupiter se":          BASE + "Elegoo_ELEGOO_JUPITER_SE.png",
    // ── AnyCubic ────────────────────────────────────────────────────────────
    "photon":              BASE + "AnyCubic_AnyCubic_Photon.png",
    "photon clássica":     BASE + "AnyCubic_AnyCubic_Photon.png",
    "photon classica":     BASE + "AnyCubic_AnyCubic_Photon.png",
    "photon d2":           BASE + "AnyCubic_AnyCubic_Photon_D2.png",
    "photon m3":           BASE + "AnyCubic_AnyCubic_Photon_M3.png",
    "photon m3 4k":        BASE + "AnyCubic_AnyCubic_Photon_M3.png",
    "photon m3 max":       BASE + "AnyCubic_AnyCubic_Photon_M3_Max.png",
    "anycubic m3 max":    BASE + "AnyCubic_AnyCubic_Photon_M3_Max.png",
    "m3 max":              BASE + "AnyCubic_AnyCubic_Photon_M3_Max.png",
    "photon m3 plus":      BASE + "AnyCubic_AnyCubic_Photon_M3_Plus.png",
    "photon m3 premium":   BASE + "AnyCubic_AnyCubic_Photon_M3_Premium.png",
    "photon mono":         BASE + "AnyCubic_AnyCubic_Photon_Mono.png",
    "photon mono 2":       BASE + "AnyCubic_AnyCubic_Photon_Mono_2.png",
    "photon mono 4":       BASE + "AnyCubic_Anycubic_Photon_Mono_4.png",
    "photon mono 4 ultra": BASE + "AnyCubic_Anycubic_Photon_Mono_4_Ultra.png",
    "photon mono 4k":      BASE + "AnyCubic_AnyCubic_Photon_Mono_4K.png",
    "photon mono m5":      BASE + "AnyCubic_AnyCubic_Photon_Mono_M5.png",
    "photon mono m5s":     BASE + "AnyCubic_AnyCubic_Photon_Mono_M5s.png",
    "photon mono m5s pro": BASE + "AnyCubic_AnyCubic_Photon_Mono_M5s_Pro.png",
    "photon mono m7":      BASE + "AnyCubic_Anycubic_Photon_Mono_M7.png",
    "photon mono m7 max":  BASE + "AnyCubic_Anycubic_Photon_Mono_M7_Max.png",
    "photon mono m7 pro":  BASE + "AnyCubic_Anycubic_Photon_Mono_M7_Pro.png",
    "photon mono se":      BASE + "AnyCubic_AnyCubic_Photon_Mono_SE.png",
    "photon mono x":       BASE + "AnyCubic_AnyCubic_Photon_Mono_X.png",
    "photon mono x 4k":    BASE + "AnyCubic_AnyCubic_Photon_Mono_X.png",
    "photon mono x 6k":    BASE + "AnyCubic_AnyCubic_Photon_Mono_X_6K.png",
    "photon mono x2":      BASE + "AnyCubic_AnyCubic_Photon_Mono_X2.png",
    "photon mono x6ks":    BASE + "AnyCubic_AnyCubic_Photon_Mono_X6Ks.png",
    "photon s":            BASE + "AnyCubic_AnyCubic_Photon_S.png",
    "photon se":           BASE + "AnyCubic_AnyCubic_Photon_Mono_SE.png",
    "photon sq":           BASE + "AnyCubic_AnyCubic_Photon_SQ.png",
    "photon ultra":        BASE + "AnyCubic_AnyCubic_Photon_Ultra.png",
    "photon x":            BASE + "AnyCubic_AnyCubic_Photon_X.png",
    "photon zero":         BASE + "AnyCubic_AnyCubic_Photon_Zero.png",
    // ── Creality ────────────────────────────────────────────────────────────
    "ld-002h":             BASE + "CREALITY_CREALITY_LD-002H.png",
    "ld-002r":             BASE + "CREALITY_CREALITY_LD-002R.png",
    "ld-006":              BASE + "CREALITY_CREALITY_LD-006.png",
    "halot lite":          BASE + "CREALITY_HALOT-LITE.png",
    "halot mage":          BASE + "CREALITY_HALOT-MAGE.png",
    "halot mage pro":      BASE + "CREALITY_HALOT-MAGE_PRO.png",
    "halot mage s":        BASE + "CREALITY_HALOT-MAGE_S.png",
    "halot one":           BASE + "CREALITY_HALOT-ONE.png",
    "halote one":          BASE + "CREALITY_HALOT-ONE.png",
    "halot one plus":      BASE + "CREALITY_HALOT-ONE_PLUS.png",
    "halot one pro":       BASE + "CREALITY_HALOT-ONE_PRO.png",
    "halot play":          BASE + "CREALITY_HALOT-PLAY.png",
    "halot r6":            BASE + "CREALITY_HALOT-R6.png",
    "halot ray":           BASE + "CREALITY_HALOT-RAY.png",
    "halot x1":            BASE + "CREALITY_HALOT-X1.png",
    "halot sky":           BASE + "CREALITY_HALOT-ONE.png",
    // ── Epax ────────────────────────────────────────────────────────────────
    "epax x1":             BASE + "Epax_EPAX_X1.png",
    "epax x1 4k":          BASE + "Epax_EPAX_X1-4K.png",
    "epax x1 4ks":         BASE + "Epax_EPAX_X1-4KS.png",
    "epax x1k":            BASE + "Epax_EPAX_X1K.png",
    "epax x10 4k":         BASE + "Epax_EPAX_X10_4K.png",
    "epax x10 5k":         BASE + "Epax_EPAX_X10_5K.png",
    "epax x10 8k":         BASE + "Epax_EPAX_X10_8K.png",
    "epax x10 14kw":       BASE + "Epax_EPAX_X10_14KW.png",
    "epax x10 2k color":   BASE + "Epax_EPAX_X10_2K_Color.png",
    "epax x133 4k":        BASE + "Epax_EPAX_X133_4K.png",
    "epax x133 6k":        BASE + "Epax_EPAX_X133_6K.png",
    "epax x133 7k":        BASE + "Epax_EPAX_X133_7K.png",
    "epax x156 4k color":  BASE + "Epax_EPAX_X156_4K_Color.png",
    "epax x160 8k":        BASE + "Epax_EPAX_X160_8K.png",
    "epax dx1 pro":        BASE + "Epax_EPAX_DX1_PRO.png",
    "epax dx10 pro 5k":    BASE + "Epax_EPAX_DX10_PRO_5K.png",
    "epax dx10 pro 8k":    BASE + "Epax_EPAX_DX10_PRO_8K_8KW.png",
    "epax e6":             BASE + "Epax_EPAX_E6.png",
    "epax e10 4k":         BASE + "Epax_EPAX_E10_4K.png",
    "epax e10 5k":         BASE + "Epax_EPAX_E10_5K.png",
    "epax e10 8k":         BASE + "Epax_EPAX_E10_8K.png",
    "epax e10 14k":        BASE + "Epax_EPAX_E10_14K.png",
    "epax e10 14kw":       BASE + "Epax_EPAX_E10_14KW.png",
    // ── Phrozen ─────────────────────────────────────────────────────────────
    "phrozen shuffle":          BASE + "Phrozen_Phrozen_Shuffle.png",
    "phrozen shuffle 4k":       BASE + "Phrozen_Phrozen_Shuffle_4K.png",
    "phrozen shuffle lite":     BASE + "Phrozen_Phrozen_Shuffle_Lite.png",
    "phrozen shuffle xl":       BASE + "Phrozen_Phrozen_Shuffle_XL.png",
    "phrozen shuffle xl lite":  BASE + "Phrozen_Phrozen_Shuffle_XL_Lite.png",
    "sonic 4k":                 BASE + "Phrozen_Phrozen_Sonic_4K.png",
    "sonic mini":               BASE + "Phrozen_Phrozen_Sonic_Mini.png",
    "sonic mini 4k":            BASE + "Phrozen_Phrozen_Sonic_Mini_4K.png",
    "sonic mini 8k":            BASE + "Phrozen_Phrozen_Sonic_Mini_8K.png",
    "sonic mini 8k s":          BASE + "Phrozen_Phrozen_Sonic_Mini_8K_S.png",
    "sonic mega 8k":            BASE + "Phrozen_Phrozen_Sonic_Mega_8K.png",
    "sonic mega 8k s":          BASE + "Phrozen_Phrozen_Sonic_Mega_8K_S.png",
    "sonic mega 8k v2":         BASE + "Phrozen_Phrozen_Sonic_Mega_8K_V2.png",
    "sonic mighty 4k":          BASE + "Phrozen_Phrozen_Sonic_Mighty_4K.png",
    "sonic mighty 8k":          BASE + "Phrozen_Phrozen_Sonic_Mighty_8K.png",
    "sonic mighty 12k":         BASE + "Phrozen_Phrozen_Sonic_Mighty_12K.png",
    "sonic mighty revo":        BASE + "Phrozen_Phrozen_Sonic_Mighty_Revo.png",
    "sonic mighty revo 16k":    BASE + "Phrozen_Phrozen_Sonic_Mighty_Revo_16K.png",
    "sonic xl 4k":              BASE + "Phrozen_Phrozen_Sonic_XL_4K.png",
    "phrozen sonic":            BASE + "Phrozen_Phrozen_Sonic.png",
    "phrozen transform":        BASE + "Phrozen_Phrozen_Transform.png",
    // ── UniFormation ────────────────────────────────────────────────────────
    "gktwo":               BASE + "Uniformation_UniFormation_GKtwo.png",
    "gk3":                 BASE + "Uniformation_UniFormation_GK3.png",
    "gk3 pro":             BASE + "Uniformation_UniFormation_GK3_Pro.png",
    "gk3 ultra":           BASE + "Uniformation_UniFormation_GK3_Ultra.png",
    // ── ApexMaker ───────────────────────────────────────────────────────────
    "apexmaker x1":        BASE + "ApexMaker_ApexMaker_X1.png",
    "apexmaker x1 mini":   BASE + "ApexMaker_ApexMaker_X1_mini.png",
    // ── Flashforge ──────────────────────────────────────────────────────────
    "explorer max":        BASE + "Flashforge_Flashforge_Explorer_Max.png",
    "foto 6.0":            BASE + "Flashforge_Flashforge_Foto_6.0.png",
    "foto 8.9":            BASE + "Flashforge_Flashforge_Foto_8.9.png",
    // ── HIFUN ───────────────────────────────────────────────────────────────
    "hf-l1-9k":            BASE + "HIFUN_HIFUN_HF-L1-9K.png",
    "hf-l3-14k":           BASE + "HIFUN_HIFUN_HF-L3-14K.png",
    "hf-l3-14k pro":       BASE + "HIFUN_HIFUN_HF-L3-14K_PRO.png",
    "hf-l5-7k":            BASE + "HIFUN_HIFUN_HF-L5-7K.png",
    "hf-l6-8k":            BASE + "HIFUN_HIFUN_HF-L6-8K.png",
    // ── LYNcase ─────────────────────────────────────────────────────────────
    "ly-01":               BASE + "LYNcase_LYNcase_LY-01.png",
    "lyn cast ly-01":      BASE + "LYNcase_LYNcase_LY-01.png",
    // ── Longer 3D ───────────────────────────────────────────────────────────
    "orange10":            BASE + "Longer3D_Longer3D_Orange10.png",
    "orange30":            BASE + "Longer3D_Longer3D_Orange30.png",
    "orange4k":            BASE + "Longer3D_Longer3D_Orange4K.png",
    // ── Magforms ────────────────────────────────────────────────────────────
    "magforms p13":        BASE + "Magforms_Magforms_P13.png",
    // ── Newbie Box ──────────────────────────────────────────────────────────
    "kylin two":           BASE + "NewbieBox_NewbieBox_Kylin_Two.png",
    "phoenix one":         BASE + "NewbieBox_NewbieBox_Phoenix_One.png",
    // ── Nova3D ──────────────────────────────────────────────────────────────
    "whale2":              BASE + "Nova3D_Nova3D_Whale2.png",
    "whale2 pro":          BASE + "Nova3D_Nova3D_Whale2_Pro.png",
    "whale3 pro":          BASE + "Nova3D_Nova3D_Whale3_Pro.png",
    "whale3 se":           BASE + "Nova3D_Nova3D_Whale3_SE.png",
    "whale3 super-14k":    BASE + "Nova3D_Nova3D_Whale3_Super-14k.png",
    "whale3 ultra-14k":    BASE + "Nova3D_Nova3D_Whale3_Ultra-14k.png",
    "whale4":              BASE + "Nova3D_Nova3D_Whale4.png",
    "bene6":               BASE + "Nova3D_Nova3D_Bene6.png",
    // ── Peopoly ─────────────────────────────────────────────────────────────
    "phenom":              BASE + "Peopoly_Peopoly_Phenom.png",
    "phenom l":            BASE + "Peopoly_Peopoly_Phenom_L.png",
    "phenom noir":         BASE + "Peopoly_Peopoly_Phenom_Noir.png",
    "phenom prime":        BASE + "Peopoly_Peopoly_Phenom_Prime.png",
    "phenom xxl":          BASE + "Peopoly_Peopoly_Phenom_XXL.png",
    // ── PIOCREAT ────────────────────────────────────────────────────────────
    "piocreat c01":        BASE + "PIOCREAT_PIOCREAT_C01.png",
    "piocreat c02":        BASE + "PIOCREAT_PIOCREAT_C02.png",
    "piocreat halot-x1":   BASE + "PIOCREAT_PIOCREAT_HALOT-X1.png",
    // ── PioNext ─────────────────────────────────────────────────────────────
    "pionext c01":         BASE + "PioNext_PioNext_C01.png",
    "pionext d158":        BASE + "PioNext_PioNext_D158.png",
    "pionext d160":        BASE + "PioNext_PioNext_D160.png",
    "pionext dj89 plus":   BASE + "PioNext_PioNext_DJ89_PLUS.png",
    // ── QIDI ────────────────────────────────────────────────────────────────
    "qidi 6.08 mono":      BASE + "QIDI_QIDI_6.08_mono.png",
    "qidi s-box":          BASE + "QIDI_QIDI_S-box.png",
    "qidi shadow 5.5s":    BASE + "QIDI_QIDI_Shadow_5.5s.png",
    "qidi shadow 6.0 pro": BASE + "QIDI_QIDI_Shadow_6.0_Pro.png",
    "qidi i-box mono":     BASE + "QIDI_QIDI_i-box_mono.png",
    // ── SparkMaker ──────────────────────────────────────────────────────────
    "sparkmaker fhd":      BASE + "SparkMaker_SparkMaker_FHD.png",
    "sparkmaker original": BASE + "SparkMaker_SparkMaker_Original.png",
    // ── Voxelab ─────────────────────────────────────────────────────────────
    "ceres 8.9":           BASE + "Voxelab_Voxelab_Ceres_8.9.png",
    "polaris 5.5":         BASE + "Voxelab_Voxelab_Polaris_5.5.png",
    "proxima 6":           BASE + "Voxelab_Voxelab_Proxima_6.png",
    // ── WanHao ──────────────────────────────────────────────────────────────
    "cgr mini mono":       BASE + "WanHao_WanHao_CGR_MINI_MONO.png",
    "cgr mono":            BASE + "WanHao_WanHao_CGR_MONO.png",
    "wanhao d7":           BASE + "WanHao_WanHao_D7.png",
    "wanhao d8":           BASE + "WanHao_WanHao_D8.png",
    // ── Zortrax ─────────────────────────────────────────────────────────────
    "inkspire":            BASE + "Zortrax_Zortrax_Inkspire.png",
  };

  function buscarFoto(nomeImpressora) {
    if (!nomeImpressora) return null;
    const n = nomeImpressora.toLowerCase().trim();
    if (PRINTER_PHOTOS[n]) return PRINTER_PHOTOS[n];
    const porTamanho = Object.entries(PRINTER_PHOTOS).sort((a, b) => b[0].length - a[0].length);
    for (const [k, v] of porTamanho) { if (n.includes(k)) return v; }
    for (const [k, v] of porTamanho) { if (k.includes(n)) return v; }
    return null;
  }

  try {
    const todos = await Parametro.find({ fotoImpressora: { $in: [null, '', undefined] } });
    let atualizados = 0;
    const semMatch = [];
    for (const p of todos) {
      const foto = buscarFoto(p.impressora);
      if (foto) {
        await Parametro.updateOne({ _id: p._id }, { $set: { fotoImpressora: foto } });
        atualizados++;
      } else {
        semMatch.push(p.impressora);
      }
    }
    return res.json({ success: true, atualizados, semMatch, total: todos.length });
  } catch (err) {
    console.error('Erro em /admin/migrar-fotos-impressoras:', err);
    return res.status(500).json({ success: false, error: 'Erro ao migrar fotos.' });
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
