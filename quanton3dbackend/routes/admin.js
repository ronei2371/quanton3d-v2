import express from 'express';
import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';
import Formulacao from '../models/Formulacao.js';
import Parametro from '../models/Parametro.js';
import GalleryItem from '../models/GalleryItem.js';

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
  const token = jwt.sign({ user }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1d' });
  res.json({ success: true, token });
});

router.get('/metrics', auth, async (_req, res) => {
  try {
    const [
      totalClientes, totalFormulacoes, totalParametros, totalGallery,
      clientes, formulacoes, parametros, gallery,
    ] = await Promise.all([
      Cliente.countDocuments(),
      Formulacao.countDocuments(),
      Parametro.countDocuments(),
      GalleryItem.countDocuments(),
      Cliente.find().sort({ createdAt: -1 }).limit(500).lean(),
      Formulacao.find().sort({ createdAt: -1 }).limit(500).lean(),
      Parametro.find().sort({ resina: 1 }).limit(500).lean(),
      GalleryItem.find().sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    res.json({
      success: true,
      totals: { clientes: totalClientes, formulacoes: totalFormulacoes, parametros: totalParametros, gallery: totalGallery },
      clientes,
      formulacoes,
      parametros,
      gallery,
    });
  } catch (err) {
    console.error('Erro em /admin/metrics:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao carregar métricas.' });
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
    const PERMITIDAS = ['clientes', 'visitas', 'conversas', 'bottickets', 'contactmessages', 'formulacoes', 'logacoes', 'partnerrequests'];
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

    const MAPA = { clientes: Cliente, visitas: Visita, conversas: Conversa, bottickets: BotTicket, contactmessages: ContactMessage, formulacoes: Formulacao, logacoes: LogAcao, partnerrequests: PartnerRequest };

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
