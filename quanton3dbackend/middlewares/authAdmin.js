// middlewares/authAdmin.js
// Middleware único de autenticação administrativa.
// Importar e reutilizar em todas as rotas que precisam de proteção de admin.
//
// Uso:
//   import authAdmin from '../middlewares/authAdmin.js';
//   router.get('/rota-protegida', authAdmin, async (req, res) => { ... });

import jwt from 'jsonwebtoken';

export default function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token ausente. Faça login como administrador.' });
  }

  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
  }
}
