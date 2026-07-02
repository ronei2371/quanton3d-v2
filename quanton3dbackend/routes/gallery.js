import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {
  aprovarGalleryItem,
  criarGalleryItem,
  listarGalleryItems,
  listarGalleryItemsAdmin,
  recusarGalleryItem,
} from '../controllers/galleryController.js';

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

// Salva em memória (não em disco) — converte para Base64 depois
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // máx 5MB
});

function normalizarPayload(req, _res, next) {
  if (!req.body) req.body = {};

  const parametros = {};
  Object.entries(req.body).forEach(([chave, valor]) => {
    if (!chave.startsWith('parametros.')) return;
    const nomeCampo = chave.replace('parametros.', '');
    parametros[nomeCampo] = valor;
    delete req.body[chave];
  });

  if (Object.keys(parametros).length > 0) {
    req.body.parametros = parametros;
  }

  // Converte imagem para Base64 e salva direto no banco
  if (req.file && req.file.buffer) {
    const mime = req.file.mimetype || 'image/jpeg';
    const base64 = req.file.buffer.toString('base64');
    req.body.imagem = `data:${mime};base64,${base64}`;
  }

  next();
}

router.post('/', upload.single('fotos'), normalizarPayload, criarGalleryItem);
router.get('/', listarGalleryItems);
router.get('/admin', authAdmin, listarGalleryItemsAdmin);
router.patch('/:id/aprovar', authAdmin, aprovarGalleryItem);
router.patch('/:id/recusar', authAdmin, recusarGalleryItem);

export default router;
