import express from 'express';
import jwt from 'jsonwebtoken';
import { authAdminOuAtendente } from '../middlewares/authAtendente.js';
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
router.get('/', authAdminOuAtendente, listarClientes); // protegido — aceita superadmin e atendentes
router.delete('/lote', authAdmin, excluirClientesEmLote); // precisa vir antes de /:id
router.delete('/:id', authAdmin, excluirCliente);

// ── ATUALIZAR PERFIL DO CLIENTE (CPF/CNPJ, nome empresa) ─────────────────────
router.patch('/:id/perfil', async (req, res) => {
  try {
    const { cpfCnpj, tipoPessoa, nomeEmpresa } = req.body || {};
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { cpfCnpj: cpfCnpj || '', tipoPessoa: tipoPessoa || '', nomeEmpresa: nomeEmpresa || '' },
      { new: true }
    );
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    res.json({ success: true, cliente });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

export default router;
