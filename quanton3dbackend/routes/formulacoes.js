import express from 'express';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import { criarFormulacao, listarFormulacoes } from '../controllers/formulacoesController.js';
import Formulacao from '../models/Formulacao.js';

const router = express.Router();

// Rotas do ADM: administrador ou atendente com acesso completo (middlewares/authAdmin.js).
const authAdmin = authAdminCompleto;

router.post('/', criarFormulacao); // envio do cliente continua público
router.get('/', authAdmin, listarFormulacoes); // protegido — evita vazar nome/telefone/email de clientes

// Atualizar status — autenticado
router.patch('/:id/status', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const statusValidos = ['pendente', 'em_contato', 'resolvido', 'impossivel'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }
    const formulacao = await Formulacao.findByIdAndUpdate(
      id, { status }, { new: true }
    );
    if (!formulacao) return res.status(404).json({ success: false, error: 'Formulação não encontrada' });
    res.json({ success: true, data: formulacao });
  } catch (err) {
    console.error('[PATCH FORMULACAO]', err);
    res.status(500).json({ success: false, error: 'Erro ao atualizar status' });
  }
});

export default router;
