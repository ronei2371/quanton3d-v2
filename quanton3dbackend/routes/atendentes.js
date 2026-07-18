// routes/atendentes.js — Gerenciamento de atendentes (só superadmin)
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import authAdmin from '../middlewares/authAdmin.js';
import Atendente from '../models/Atendente.js';
import LogAcao from '../models/LogAcao.js';

const router = express.Router();

// ── LOGIN do atendente ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha)
      return res.status(400).json({ success: false, error: 'Email e senha obrigatórios.' });

    const at = await Atendente.findOne({ email: email.toLowerCase().trim() });
    if (!at) return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
    if (!at.ativo) return res.status(401).json({ success: false, error: 'Conta desativada. Contate o administrador.' });

    const ok = await at.verificarSenha(senha);
    if (!ok) return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { atendenteId: at._id, codigo: at.codigo },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '8h' }
    );

    await Atendente.findByIdAndUpdate(at._id, { ultimoAcesso: new Date() });
    await LogAcao.create({
      tipo: 'atendente', atendenteId: at._id,
      atendenteCod: at.codigo, atendenteNome: at.nome,
      acao: 'LOGIN', modulo: 'auth',
      detalhe: 'Login realizado com sucesso',
      ip: req.ip || '', userAgent: req.headers['user-agent'] || '',
    });

    res.json({
      success: true, token,
      atendente: {
        id: at._id, codigo: at.codigo, nome: at.nome,
        email: at.email, permissoes: at.permissoes,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// ── CRIAR atendente (só superadmin) ─────────────────────────────────────────
router.post('/', authAdmin, async (req, res) => {
  try {
    const { nome, email, senha, permissoes } = req.body || {};
    if (!nome || !email || !senha)
      return res.status(400).json({ success: false, error: 'Nome, email e senha obrigatórios.' });

    // Gerar código automático: AT001, AT002...
    const ultimo = await Atendente.findOne().sort({ createdAt: -1 }).select('codigo');
    let num = 1;
    if (ultimo?.codigo?.startsWith('AT')) {
      num = parseInt(ultimo.codigo.slice(2)) + 1;
    }
    const codigo = `AT${String(num).padStart(3, '0')}`;

    const at = await Atendente.create({ codigo, nome, email, senha, permissoes: permissoes || {} });
    res.status(201).json({ success: true, atendente: { id: at._id, codigo: at.codigo, nome: at.nome, email: at.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, error: 'Email já cadastrado.' });
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// ── LISTAR atendentes (só superadmin) ────────────────────────────────────────
router.get('/', authAdmin, async (req, res) => {
  try {
    const ats = await Atendente.find().select('-senha').sort({ codigo: 1 }).lean();
    res.json({ success: true, atendentes: ats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// ── ATIVAR/DESATIVAR atendente ────────────────────────────────────────────────
router.patch('/:id/status', authAdmin, async (req, res) => {
  try {
    const { ativo } = req.body;
    const at = await Atendente.findByIdAndUpdate(req.params.id, { ativo }, { new: true }).select('-senha');
    if (!at) return res.status(404).json({ success: false, error: 'Atendente não encontrado.' });
    res.json({ success: true, atendente: at });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// ── TROCAR SENHA (superadmin pode trocar de qualquer um) ─────────────────────
router.patch('/:id/senha', authAdmin, async (req, res) => {
  try {
    const { novaSenha } = req.body || {};
    if (!novaSenha || novaSenha.length < 6)
      return res.status(400).json({ success: false, error: 'Senha deve ter pelo menos 6 caracteres.' });
    const at = await Atendente.findById(req.params.id);
    if (!at) return res.status(404).json({ success: false, error: 'Atendente não encontrado.' });
    at.senha = novaSenha;
    await at.save();
    res.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// ── LOGS (só superadmin) ─────────────────────────────────────────────────────
router.get('/logs', authAdmin, async (req, res) => {
  try {
    const { atendenteId, modulo, bloqueada, limit = 100 } = req.query;
    const filtro = {};
    if (atendenteId) filtro.atendenteId = atendenteId;
    if (modulo) filtro.modulo = modulo;
    if (bloqueada !== undefined) filtro.bloqueada = bloqueada === 'true';

    const logs = await LogAcao.find(filtro)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

export default router;
