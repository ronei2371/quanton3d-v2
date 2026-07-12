import express from 'express';
import jwt from 'jsonwebtoken';
import { criarCliente, listarClientes, excluirCliente, excluirClientesEmLote } from '../controllers/clientesController.js';

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

router.post('/', criarCliente); // cadastro do cliente continua público
router.get('/', authAdmin, listarClientes); // protegido — evita vazar nome/telefone/email de todos os clientes
router.delete('/lote', authAdmin, excluirClientesEmLote); // precisa vir antes de /:id
router.delete('/:id', authAdmin, excluirCliente);

export default router;
