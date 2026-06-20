import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { criarGalleryItem, listarGalleryItems, aprovarGalleryItem } from '../controllers/galleryController.js';

const router = express.Router();

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
  for (const [key, value] of Object.entries(req.body)) {
    if (key.startsWith('parametros.')) {
      parametros[key.replace('parametros.', '')] = value;
      delete req.body[key];
    }
  }

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
router.patch('/:id/aprovar', aprovarGalleryItem);

export default router;
