import express from 'express';
import jwt from 'jsonwebtoken';
import Conversa from '../models/Conversa.js';

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

// Listar conversas — autenticado, mais recentes primeiro
router.get('/', authAdmin, async (req, res) => {
  try {
    const limite = Math.min(300, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const filtro = {};
    if (req.query.aprovado === 'true') filtro.aprovado = true;
    if (req.query.aprovado === 'false') filtro.aprovado = false;
    if (req.query.resina) filtro.resinaDetectada = { $regex: req.query.resina, $options: 'i' };

    const conversas = await Conversa.find(filtro)
      .sort({ createdAt: -1 })
      .limit(limite)
      .lean();

    res.json({ success: true, data: conversas, total: conversas.length });
  } catch (err) {
    console.error('[LISTAR CONVERSAS]', err);
    res.status(500).json({ success: false, error: 'Erro ao listar conversas' });
  }
});

// Salvar resposta melhorada e aprovar — vira conhecimento para o RAG
router.patch('/:id/aprovar', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { respostaMelhorada = '', revisadoPor = '' } = req.body || {};

    const conversa = await Conversa.findByIdAndUpdate(
      id,
      {
        aprovado: true,
        respostaMelhorada: respostaMelhorada.trim(),
        revisadoPor: revisadoPor || 'Admin',
      },
      { new: true }
    );

    if (!conversa) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    res.json({ success: true, data: conversa });
  } catch (err) {
    console.error('[APROVAR CONVERSA]', err);
    res.status(500).json({ success: false, error: 'Erro ao aprovar conversa' });
  }
});

// Desaprovar / remover do conhecimento
router.patch('/:id/desaprovar', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const conversa = await Conversa.findByIdAndUpdate(id, { aprovado: false }, { new: true });
    if (!conversa) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    res.json({ success: true, data: conversa });
  } catch (err) {
    console.error('[DESAPROVAR CONVERSA]', err);
    res.status(500).json({ success: false, error: 'Erro ao desaprovar conversa' });
  }
});

// Excluir conversa
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Conversa.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    res.json({ success: true, message: 'Conversa excluída' });
  } catch (err) {
    console.error('[DELETE CONVERSA]', err);
    res.status(500).json({ success: false, error: 'Erro ao excluir conversa' });
  }
});

export default router;
