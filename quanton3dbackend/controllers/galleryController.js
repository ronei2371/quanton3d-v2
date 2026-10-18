import mongoose from 'mongoose';
import GalleryItem from '../models/GalleryItem.js';
import { itemPublicoGaleria } from '../services/galleryPublic.js';
import { avisarEquipe } from '../services/avisoEquipe.js';
import { uploadBase64ParaR2, deletarImagemR2 } from '../services/r2Storage.js';

export async function criarGalleryItem(req, res) {
  // O visitante nao escolhe id, datas nem status (tudo entra como pendente para o ADM aprovar).
  const { _id, createdAt, updatedAt, status, imagem, ...dados } = req.body || {}; // eslint-disable-line no-unused-vars

  let imagemUrl = '';
  if (imagem) {
    try {
      imagemUrl = await uploadBase64ParaR2(imagem, 'gallery');
    } catch (err) {
      console.error('[Gallery] Falha no upload para R2:', err.message);
      return res.status(500).json({ success: false, error: 'Falha ao salvar imagem. Tente novamente.' });
    }
  }

  const item = await GalleryItem.create({
    ...dados,
    imagemUrl,
    // imagem não é mais salvo no Mongo — só a URL do R2
    status: 'pendente',
  });
  avisarEquipe('galeria', [item.resina, item.impressora].filter(Boolean).join(' · ') || 'Aguardando aprovação');

  return res.status(201).json({ success: true, data: item });
}

// Tipos de imagem que a rota publica pode servir.
const MIMES_DE_IMAGEM = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export async function listarGalleryItems(_req, res) {
  // temImagem = true se tem URL R2 OU legado base64
  const items = await GalleryItem.aggregate([
    { $match: { status: 'aprovado' } },
    { $sort: { createdAt: -1 } },
    { $limit: 200 },
    {
      $addFields: {
        temImagem: {
          $or: [
            { $ne: [{ $ifNull: ['$imagemUrl', ''] }, ''] },
            { $ne: [{ $ifNull: ['$imagem', ''] }, ''] },
          ],
        },
      },
    },
    { $project: { imagem: 0 } }, // nunca expõe base64 na listagem
  ]);

  return res.json({ success: true, data: items.map(itemPublicoGaleria) });
}

// Foto de uma peca aprovada.
export async function imagemGalleryItem(req, res) {
  const { id } = req.params;
  const naoAchou = () => res.status(404).json({ success: false, error: 'Foto nao encontrada.' });
  if (!mongoose.isValidObjectId(id)) return naoAchou();

  const item = await GalleryItem.findOne({ _id: id, status: 'aprovado' })
    .select('imagem imagemUrl')
    .lean();
  if (!item) return naoAchou();

  // Novo: redireciona para R2 CDN (cache infinito no browser)
  if (item.imagemUrl) {
    return res.redirect(301, item.imagemUrl);
  }

  // Legado: serve base64 armazenado no Mongo
  const dataUri = typeof item?.imagem === 'string' ? item.imagem : '';
  const partes = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.*)$/is.exec(dataUri);
  if (!partes) return naoAchou();

  const mime = partes[1].toLowerCase();
  if (!MIMES_DE_IMAGEM.has(mime)) return res.status(415).json({ success: false, error: 'Formato nao suportado.' });

  const buffer = Buffer.from(partes[2], 'base64');
  if (buffer.length === 0) return naoAchou();

  res.set('Content-Type', mime);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(buffer);
}

export async function listarGalleryItemsAdmin(req, res) {
  const { status = 'pendente', dataInicio, dataFim } = req.query || {};
  const filtro = {};

  if (status && status !== 'todos') {
    filtro.status = status;
  }

  if (dataInicio || dataFim) {
    filtro.createdAt = {};
    if (dataInicio) filtro.createdAt.$gte = new Date(`${dataInicio}T00:00:00.000Z`);
    if (dataFim)    filtro.createdAt.$lte = new Date(`${dataFim}T23:59:59.999Z`);
  }

  const items = await GalleryItem.find(filtro)
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return res.json({ success: true, data: items });
}

export async function aprovarGalleryItem(req, res) {
  const item = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { status: 'aprovado' },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, error: 'Item não encontrado' });
  }

  return res.json({ success: true, data: item });
}

export async function recusarGalleryItem(req, res) {
  const item = await GalleryItem.findByIdAndDelete(req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, error: 'Item não encontrado' });
  }

  // Remove imagem do R2 (se existir) após exclusão do doc
  if (item.imagemUrl) {
    deletarImagemR2(item.imagemUrl).catch((err) =>
      console.error('[Gallery] Erro ao deletar imagem R2:', err.message)
    );
  }

  return res.json({ success: true, message: 'Item recusado e excluído.' });
}
