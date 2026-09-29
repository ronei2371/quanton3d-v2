import jwt from 'jsonwebtoken';

// Middleware exclusivo para superadmin
// Token deve conter campo "user" (gerado no login /api/admin/login)
export default function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token)
    return res.status(401).json({ success: false, error: 'Token ausente. Faca login como administrador.' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    // Garante que e token de superadmin, nao de atendente
    if (!decoded.user || decoded.role !== 'superadmin')
      return res.status(403).json({ success: false, error: 'Acesso restrito ao administrador.' });

    req.usuarioTipo = 'superadmin';
    req.usuarioNome = 'Super Admin';
    req.permissoes = { tudo: true };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalido ou expirado.' });
  }
}

// Painel administrativo completo: o administrador OU um atendente ativo com a permissao
// "Acesso ao ADM completo" (conferida no banco a cada pedido, entao tirar a permissao vale na hora).
// Antes, varias rotas so conferiam se o token era valido: qualquer atendente passava.
export async function authAdminCompleto(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente. Faça login.' });
  let decoded;
  try { decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET); }
  catch { return res.status(401).json({ success: false, error: 'Token invalido ou expirado.' }); }

  if (decoded.role === 'superadmin' && decoded.user) {
    req.usuarioTipo = 'superadmin';
    req.usuarioNome = 'Super Admin';
    req.permissoes = { tudo: true };
    return next();
  }
  if (decoded.role === 'atendente' && decoded.atendenteId) {
    try {
      const { default: Atendente } = await import('../models/Atendente.js');
      const at = await Atendente.findById(decoded.atendenteId).select('ativo permissoes nome codigo').lean();
      if (at && at.ativo && at.permissoes?.acessoAdmCompleto === true) {
        req.usuarioTipo = 'atendente';
        req.usuarioId = at._id;
        req.usuarioCod = at.codigo;
        req.usuarioNome = at.nome;
        req.permissoes = at.permissoes;
        return next();
      }
    } catch { /* cai no 403 abaixo */ }
  }
  return res.status(403).json({ success: false, error: 'Acesso restrito ao administrador.' });
}
