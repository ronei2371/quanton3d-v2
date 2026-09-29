import express from 'express';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import { authAdminOuAtendente } from '../middlewares/authAtendente.js';
import { criarCliente, emitirChaveCliente, listarClientes, excluirCliente, excluirClientesEmLote } from '../controllers/clientesController.js';
import Cliente from '../models/Cliente.js';

const router = express.Router();

// Rotas do ADM: administrador ou atendente com acesso completo (middlewares/authAdmin.js).
const authAdmin = authAdminCompleto;

router.post('/', criarCliente); // cadastro do cliente continua público
router.post('/:id/chave', emitirChaveCliente); // cliente antigo pega a chave (codigo + telefone)
router.get('/', authAdminOuAtendente, listarClientes); // protegido — aceita superadmin e atendentes
router.delete('/lote', authAdmin, excluirClientesEmLote); // precisa vir antes de /:id
router.delete('/:id', authAdmin, excluirCliente);

// ── ATUALIZAR PERFIL DO CLIENTE (CPF/CNPJ, nome empresa) ─────────────────────
router.patch('/:id/perfil', authAdmin, async (req, res) => { // so o ADM (antes qualquer um alterava e via o cadastro)
  try {
    const { cpfCnpj, tipoPessoa, nomeEmpresa } = req.body || {};
    const update = {
      cpfCnpj: (cpfCnpj || '').replace(/\D/g, ''),
      tipoPessoa: tipoPessoa || '',
      nomeEmpresa: nomeEmpresa || ''
    };
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: false }
    );
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado.' });
    res.json({ success: true, cliente });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err.message, err.stack);
    res.status(500).json({ success: false, error: 'Erro interno: ' + err.message });
  }
});

export default router;
