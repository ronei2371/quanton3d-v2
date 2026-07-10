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

// Feedback do CLIENTE (rota pública, sem autenticação) — usada quando a resposta do bot não ajudou
router.patch('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback = '', foto = '', configuracaoCliente = '' } = req.body || {};

    if (!['satisfatoria', 'nao_satisfatoria'].includes(feedback)) {
      return res.status(400).json({ success: false, error: 'Feedback inválido' });
    }

    // Limita tamanho da foto em Base64 (~5MB) por segurança
    if (foto && foto.length > 7_000_000) {
      return res.status(400).json({ success: false, error: 'Imagem muito grande' });
    }

    const update = { feedback };
    if (feedback === 'nao_satisfatoria') {
      if (foto) update.fotoProblema = foto;
      if (configuracaoCliente) update.configuracaoCliente = configuracaoCliente;
      update.revisadoFeedback = false;
    }

    const conversa = await Conversa.findByIdAndUpdate(id, update, { new: true });
    if (!conversa) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });

    res.json({ success: true, message: 'Obrigado pelo retorno!' });
  } catch (err) {
    console.error('[FEEDBACK CONVERSA]', err);
    res.status(500).json({ success: false, error: 'Erro ao registrar feedback' });
  }
});

// Marcar feedback negativo como revisado pelo admin
router.patch('/:id/revisar-feedback', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const conversa = await Conversa.findByIdAndUpdate(id, { revisadoFeedback: true }, { new: true });
    if (!conversa) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    res.json({ success: true, data: conversa });
  } catch (err) {
    console.error('[REVISAR FEEDBACK]', err);
    res.status(500).json({ success: false, error: 'Erro ao marcar como revisado' });
  }
});

// Listar conversas — autenticado, mais recentes primeiro
router.get('/', authAdmin, async (req, res) => {
  try {
    const limite = Math.min(300, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const filtro = {};
    if (req.query.aprovado === 'true') filtro.aprovado = true;
    if (req.query.aprovado === 'false') filtro.aprovado = false;
    if (req.query.resina) filtro.resinaDetectada = { $regex: req.query.resina, $options: 'i' };
    if (req.query.feedback) filtro.feedback = req.query.feedback;

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

// Salvar melhoria SEM aprovar — fica como rascunho, ainda não é usado pelo RAG
router.patch('/:id/salvar-melhoria', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { respostaMelhorada = '' } = req.body || {};

    const conversa = await Conversa.findByIdAndUpdate(
      id,
      { respostaMelhorada: respostaMelhorada.trim() },
      { new: true }
    );

    if (!conversa) return res.status(404).json({ success: false, error: 'Conversa não encontrada' });
    res.json({ success: true, data: conversa });
  } catch (err) {
    console.error('[SALVAR MELHORIA]', err);
    res.status(500).json({ success: false, error: 'Erro ao salvar melhoria' });
  }
});

// Aprovar — libera oficialmente para o RAG usar como conhecimento validado
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
