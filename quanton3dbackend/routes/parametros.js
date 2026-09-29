import express from 'express';
import { authAdminCompleto } from '../middlewares/authAdmin.js';
import { criarParametro, listarParametros, listarResinas, listarImpressoras, listarImpressorasComFoto, buscarPerfil, camposTecnicosMudaram } from '../controllers/parametrosController.js';
import Parametro from '../models/Parametro.js';

const router = express.Router();

// Rotas do ADM: administrador ou atendente com acesso completo (middlewares/authAdmin.js).
const authAdmin = authAdminCompleto;

router.get('/', listarParametros);
router.post('/', authAdmin, criarParametro);
router.get('/resinas', listarResinas);
router.get('/impressoras', listarImpressoras);
router.get('/impressoras-com-foto', listarImpressorasComFoto);
router.get('/perfil', buscarPerfil);

/* Editar parametro */
router.patch('/:id', authAdmin, async (req, res) => {
  try {
    const atual = await Parametro.findById(req.params.id).lean();
    if (!atual) return res.status(404).json({ success: false, error: 'Nao encontrado' });
    const dados = { ...req.body };
    delete dados._id; delete dados.createdAt; delete dados.updatedAt; delete dados.revisadoEm;
    // Mudou exposicao/camadas/altura: registra a data da revisao tecnica (mostrada no site e no bot)
    if (camposTecnicosMudaram(atual, dados)) dados.revisadoEm = new Date();
    const parametro = await Parametro.findByIdAndUpdate(
      req.params.id,
      { $set: dados },
      { new: true, runValidators: false }
    );
    if (!parametro) return res.status(404).json({ success: false, error: 'Nao encontrado' });
    res.json({ success: true, parametro });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* Excluir parametro */
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Parametro.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Parametro nao encontrado' });
    res.json({ success: true, message: 'Parametro excluido com sucesso' });
  } catch (err) {
    console.error('[DELETE PARAMETRO]', err);
    res.status(500).json({ success: false, error: 'Erro ao excluir parametro' });
  }
});

export default router;
