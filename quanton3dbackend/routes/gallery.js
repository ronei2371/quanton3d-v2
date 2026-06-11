import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
codex/revise-code-to-identify-errors-9rfnjr
import {
  aprovarGalleryItem,
  criarGalleryItem,
  listarGalleryItems,
  listarGalleryItemsAdmin,
  recusarGalleryItem,
} from '../controllers/galleryController.js';

import { criarGalleryItem, listarGalleryItems, aprovarGalleryItem } from '../controllers/galleryController.js';
 main

const router = express.Router();

function authAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token ausente' });
  }

  try {
    jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
}

const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

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

  if (Array.isArray(req.files) && req.files.length > 0) {
    req.body.imagem = `/uploads/gallery/${req.files[0].filename}`;
  }

  next();
}

router.post('/', upload.array('fotos', 5), normalizarPayload, criarGalleryItem);
router.get('/', listarGalleryItems);
 codex/revise-code-to-identify-errors-9rfnjr
router.get('/admin', authAdmin, listarGalleryItemsAdmin);
router.patch('/:id/aprovar', authAdmin, aprovarGalleryItem);
router.patch('/:id/recusar', authAdmin, recusarGalleryItem);

router.patch('/:id/aprovar', authAdmin, aprovarGalleryItem);
main

export default router;
