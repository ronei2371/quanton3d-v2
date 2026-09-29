import express from 'express';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import FeedbackParametro from '../models/FeedbackParametro.js';

const router = express.Router();

// Rotas do ADM: administrador ou atendente com acesso completo (middlewares/authAdmin.js).
const authAdmin = authAdminCompleto;

/* POST /api/feedback-parametros — qualquer usuario envia voto */
router.post('/', async (req, res) => {
  try {
    const { resina, impressora, voto, observacao } = req.body;
    if (!resina || !impressora || !voto) {
      return res.status(400).json({ success: false, error: 'Campos obrigatorios: resina, impressora, voto' });
    }
    const fb = await FeedbackParametro.create({ resina, impressora, voto, observacao: observacao || '' });
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

/* GET /api/feedback-parametros/recentes — admin: ultimos 50 feedbacks com obs */
router.get('/recentes', authAdmin, async (req, res) => {
  try {
    const lista = await FeedbackParametro.find({ observacao: { $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: lista });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
