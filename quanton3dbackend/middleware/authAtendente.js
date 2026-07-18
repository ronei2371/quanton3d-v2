// middlewares/authAtendente.js
// Middleware que aceita TANTO superadmin QUANTO atendentes autenticados
// Coloca req.usuarioTipo, req.usuarioId, req.usuarioPermissoes no request

import jwt from 'jsonwebtoken';
import Atendente from '../models/Atendente.js';
import LogAcao from '../models/LogAcao.js';

export async function authAdminOuAtendente(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente.' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    
    // Token de superadmin (tem campo "user")
    if (decoded.user) {
      req.usuarioTipo = 'superadmin';
      req.usuarioId = null;
      req.usuarioCod = 'SUPERADMIN';
      req.usuarioNome = 'Super Admin';
      req.permissoes = { tudo: true };
      return next();
    }

    // Token de atendente (tem campo "atendenteId")
    if (decoded.atendenteId) {
      const at = await Atendente.findById(decoded.atendenteId).lean();
      if (!at || !at.ativo) {
        return res.status(401).json({ success: false, error: 'Atendente inativo ou não encontrado.' });
      }
      req.usuarioTipo = 'atendente';
      req.usuarioId = at._id;
      req.usuarioCod = at.codigo;
      req.usuarioNome = at.nome;
      req.permissoes = at.permissoes;
      // Atualizar último acesso
      await Atendente.findByIdAndUpdate(at._id, { ultimoAcesso: new Date() });
      return next();
    }

    return res.status(401).json({ success: false, error: 'Token inválido.' });
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
}

// Middleware que bloqueia atendentes de fazer ação sem permissão e registra no log
export function exigirPermissao(permissao, modulo, descAcao) {
  return async (req, res, next) => {
    // Superadmin pode tudo
    if (req.usuarioTipo === 'superadmin') return next();

    const temPermissao = req.permissoes?.[permissao] === true;

    // Registrar tentativa bloqueada no log
    if (!temPermissao) {
      await LogAcao.create({
        tipo: 'atendente',
        atendenteId: req.usuarioId,
        atendenteCod: req.usuarioCod,
        atendenteNome: req.usuarioNome,
        acao: `TENTATIVA_BLOQUEADA: ${descAcao}`,
        modulo,
        detalhe: `Atendente tentou executar ação sem permissão: ${permissao}`,
        bloqueada: true,
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: `Acesso negado. Você não tem permissão para: ${descAcao}. Ação registrada.`
      });
    }

    next();
  };
}

// Helper para registrar ações permitidas no log
export async function registrarLog(req, acao, modulo, detalhe = '', alvo = '') {
  try {
    await LogAcao.create({
      tipo: req.usuarioTipo || 'superadmin',
      atendenteId: req.usuarioId || null,
      atendenteCod: req.usuarioCod || 'SUPERADMIN',
      atendenteNome: req.usuarioNome || 'Super Admin',
      acao,
      modulo,
      detalhe,
      alvo: String(alvo),
      bloqueada: false,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (e) {
    console.error('Erro ao registrar log:', e.message);
  }
}
