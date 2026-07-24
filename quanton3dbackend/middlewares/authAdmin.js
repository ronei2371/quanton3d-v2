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
