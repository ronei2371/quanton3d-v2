import express from 'express';
import jwt from 'jsonwebtoken';
import { criarParametro, listarParametros, listarResinas, listarImpressoras, buscarPerfil } from '../controllers/parametrosController.js';
import Parametro from '../models/Parametro.js';

const router = express.Router();

function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Token ausente' });
  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalido' });
  }
}

router.get('/', listarParametros);
router.post('/', authAdmin, criarParametro);
router.get('/resinas', listarResinas);
router.get('/impressoras', listarImpressoras);
router.get('/perfil', buscarPerfil);

/* Editar parametro */
router.patch('/:id', authAdmin, async (req, res) => {
  try {
    const parametro = await Parametro.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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
