import express from 'express';
import { ipDoPedido } from '../middlewares/limiteTaxa.js';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import Visita from '../models/Visita.js';
import EventoSite from '../models/EventoSite.js';

const router = express.Router();

// Rotas do ADM: administrador ou atendente com acesso completo (middlewares/authAdmin.js).
const authAdmin = authAdminCompleto;

// Registrar visita — rota pública, chamada uma vez por sessão pelo frontend
router.post('/', async (req, res) => {
  try {
    const { sessionId = '', pagina = '/', origem = '' } = req.body || {};
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId obrigatório' });

    // Evita duplicar registro da mesma sessão no mesmo dia
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const jaRegistrou = await Visita.findOne({ sessionId, createdAt: { $gte: inicioHoje } });
    if (jaRegistrou) {
      return res.json({ success: true, message: 'Sessão já registrada hoje' });
    }

    await Visita.create({ sessionId, pagina, origem });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[REGISTRAR VISITA]', err);
    res.status(500).json({ success: false, error: 'Erro ao registrar visita' });
  }
});

// Evento do site (publico): resultado do Diagnostico rapido, para o relatorio da semana no ADM.
// Aceita so ids curtos conhecidos no formato; limite simples por IP para nao encher o banco.
const eventosPorIp = new Map();
router.post('/evento', async (req, res) => {
  try {
    const { tipo = '', sintoma = '', resultado = '' } = req.body || {};
    const idValido = (v) => /^[a-z_]{1,40}$/.test(String(v));
    if (tipo !== 'diagnostico' || !idValido(sintoma) || !idValido(resultado)) {
      return res.status(400).json({ success: false, error: 'Evento inválido' });
    }
    const ip = ipDoPedido(req); // IP real (middlewares/limiteTaxa.js)
    const hora = new Date().toISOString().slice(0, 13);
    const reg = eventosPorIp.get(ip);
    if (reg && reg.hora === hora && reg.total >= 60) return res.json({ success: true });
    eventosPorIp.set(ip, reg && reg.hora === hora ? { hora, total: reg.total + 1 } : { hora, total: 1 });
    if (eventosPorIp.size > 20000) eventosPorIp.clear();

    await EventoSite.create({ tipo, sintoma, resultado });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[EVENTO SITE]', err.message);
    res.status(500).json({ success: false });
  }
});

// Relatório de visitas por período — autenticado
router.get('/relatorio', authAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query || {};
    const filtro = {};
    if (startDate || endDate) {
      filtro.createdAt = {};
      if (startDate) filtro.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) filtro.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const visitas = await Visita.find(filtro).sort({ createdAt: 1 }).lean();

    // Agrupa por dia (YYYY-MM-DD)
    const porDia = {};
    const sessoesUnicasTotal = new Set();
    visitas.forEach(v => {
      const dia = v.createdAt.toISOString().slice(0, 10);
      if (!porDia[dia]) porDia[dia] = new Set();
      porDia[dia].add(v.sessionId);
      sessoesUnicasTotal.add(v.sessionId);
    });

    const relatorioPorDia = Object.entries(porDia)
      .map(([dia, sessoes]) => ({ dia, visitantes: sessoes.size }))
      .sort((a, b) => a.dia.localeCompare(b.dia));

    res.json({
      success: true,
      totalVisitas: visitas.length,
      visitantesUnicos: sessoesUnicasTotal.size,
      porDia: relatorioPorDia,
    });
  } catch (err) {
    console.error('[RELATORIO VISITAS]', err);
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório' });
  }
});

export default router;
