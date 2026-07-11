import express from 'express';
import jwt from 'jsonwebtoken';
import Visita from '../models/Visita.js';

const router = express.Router();

function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente' });
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
}

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
