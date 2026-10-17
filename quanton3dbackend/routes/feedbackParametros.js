import express from 'express';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import FeedbackParametro from '../models/FeedbackParametro.js';

const router = express.Router();
const authAdmin = authAdminCompleto;

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas em ms

function ipDoPedido(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    ''
  );
}

/* POST /api/feedback-parametros — qualquer usuario envia voto (com cooldown 24h por IP) */
router.post('/', async (req, res) => {
  try {
    const { resina, impressora, voto, observacao, origem } = req.body;
    if (!resina || !impressora || !voto) {
      return res.status(400).json({ success: false, error: 'Campos obrigatorios: resina, impressora, voto' });
    }

    const ip = ipDoPedido(req);
    const janela24h = new Date(Date.now() - COOLDOWN_MS);

    // Verifica feedback recente do mesmo IP para o mesmo perfil (cooldown 24h)
    const recente = ip
      ? await FeedbackParametro.findOne({
          ip,
          resina: resina.trim(),
          impressora: impressora.trim(),
          createdAt: { $gte: janela24h },
        }).sort({ createdAt: -1 })
      : null;

    if (recente) {
      // Ja existe feedback nas ultimas 24h: atualiza em vez de duplicar
      const votoMudou = recente.voto !== voto;
      recente.voto = voto;
      if (observacao) recente.observacao = String(observacao).slice(0, 500);
      if (votoMudou) {
        recente.alteracoes = (recente.alteracoes || 0) + 1;
        recente.ultimaAlteracao = new Date();
      }
      await recente.save();
      return res.json({ success: true, data: recente, atualizado: true, votoMudou });
    }

    // Novo feedback (fora do cooldown)
    const fb = await FeedbackParametro.create({
      resina: resina.trim(),
      impressora: impressora.trim(),
      voto,
      observacao: observacao || '',
      ip,
      origem: origem || 'site',
    });
    res.status(201).json({ success: true, data: fb });
  } catch (e) {
    console.error('[FEEDBACK PARAMETRO POST]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* GET /api/feedback-parametros/resumo — admin: votos agrupados por perfil */
router.get('/resumo', authAdmin, async (req, res) => {
  try {
    const resumo = await FeedbackParametro.aggregate([
      {
        $group: {
          _id: { resina: '$resina', impressora: '$impressora', voto: '$voto' },
          total: { $sum: 1 },
          alteracoesTotal: { $sum: '$alteracoes' },
        },
      },
      { $sort: { '_id.resina': 1, '_id.impressora': 1 } },
    ]);
    res.json({ success: true, data: resumo });
  } catch (e) {
    console.error('[FEEDBACK PARAMETRO RESUMO]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* GET /api/feedback-parametros/recentes — admin: ultimos 50 feedbacks com obs ou alteracoes */
router.get('/recentes', authAdmin, async (req, res) => {
  try {
    const lista = await FeedbackParametro.find({
      $or: [{ observacao: { $ne: '' } }, { alteracoes: { $gt: 0 } }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: lista });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
