import express from 'express';
import jwt from 'jsonwebtoken';
import { criarFormulacao, listarFormulacoes } from '../controllers/formulacoesController.js';
import Formulacao from '../models/Formulacao.js';

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

router.post('/', criarFormulacao);
router.get('/', listarFormulacoes);

// Atualizar status — autenticado
router.patch('/:id/status', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const statusValidos = ['pendente', 'em_contato', 'resolvido', 'impossivel'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }
    const formulacao = await Formulacao.findByIdAndUpdate(
      id, { status }, { new: true }
    );
    if (!formulacao) return res.status(404).json({ success: false, error: 'Formulação não encontrada' });
    res.json({ success: true, data: formulacao });
  } catch (err) {
    console.error('[PATCH FORMULACAO]', err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar status' });
  }
});

export default router;
