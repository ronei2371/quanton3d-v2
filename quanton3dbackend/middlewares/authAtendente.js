import jwt from 'jsonwebtoken';
import Atendente from '../models/Atendente.js';
import LogAcao from '../models/LogAcao.js';

export async function authAdminOuAtendente(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente.' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.user) {
      req.usuarioTipo = 'superadmin';
      req.usuarioId = null;
      req.usuarioCod = 'SUPERADMIN';
      req.usuarioNome = 'Super Admin';
      req.permissoes = { tudo: true };
      return next();
    }

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
      await Atendente.findByIdAndUpdate(at._id, { ultimoAcesso: new Date() });
      return next();
    }

    return res.status(401).json({ success: false, error: 'Token inválido.' });
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
}

export function exigirPermissao(permissao, modulo, descAcao) {
  return async (req, res, next) => {
    if (req.usuarioTipo === 'superadmin') return next();
    const temPermissao = req.permissoes?.[permissao] === true;
    if (!temPermissao) {
      await LogAcao.create({
        tipo: 'atendente',
        atendenteId: req.usuarioId,
        atendenteCod: req.usuarioCod,
        atendenteNome: req.usuarioNome,
        acao: `TENTATIVA_BLOQUEADA: ${descAcao}`,
        modulo,
        detalhe: `Sem permissão: ${permissao}`,
        bloqueada: true,
        ip: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      }).catch(() => {});
      return res.status(403).json({ success: false, error: `Acesso negado: ${descAcao}` });
    }
    next();
  };
}

export async function registrarLog(req, acao, modulo, detalhe = '', alvo = '') {
  try {
    await LogAcao.create({
      tipo: req.usuarioTipo || 'superadmin',
      atendenteId: req.usuarioId || null,
      atendenteCod: req.usuarioCod || 'SUPERADMIN',
      atendenteNome: req.usuarioNome || 'Super Admin',
      acao, modulo, detalhe,
      alvo: String(alvo),
      bloqueada: false,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (e) {
    console.error('Erro ao registrar log:', e.message);
  }
}