import mongoose from 'mongoose';
import GalleryItem from '../models/GalleryItem.js';
import { itemPublicoGaleria } from '../services/galleryPublic.js';
import { avisarEquipe } from '../services/avisoEquipe.js';

export async function criarGalleryItem(req, res) {
  // O visitante nao escolhe id, datas nem status (tudo entra como pendente para o ADM aprovar).
  const { _id, createdAt, updatedAt, status, ...dados } = req.body || {}; // eslint-disable-line no-unused-vars
  const item = await GalleryItem.create({
    ...dados,
    status: 'pendente',
  });
  avisarEquipe('galeria', [item.resina, item.impressora].filter(Boolean).join(' · ') || 'Aguardando aprovação'); // celular da equipe (se configurado)

  return res.status(201).json({ success: true, data: item });
}

// Tipos de imagem que a rota publica pode servir. Serve para nao devolver, por
// exemplo, text/html gravado num data: URI, que o navegador executaria.
const MIMES_DE_IMAGEM = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export async function listarGalleryItems(_req, res) {
  // Sem o base64: a listagem nao carrega a foto do banco, so marca quem tem uma.
  // Cada foto vai pelo endereco proprio (imagemUrl), em GET /gallery/:id/imagem.
  const items = await GalleryItem.aggregate([
    { $match: { status: 'aprovado' } },
    { $sort: { createdAt: -1 } },
    { $limit: 200 },
    { $addFields: { temImagem: { $ne: [{ $ifNull: ['$imagem', ''] }, ''] } } },
    { $project: { imagem: 0 } },
  ]);

  // Nunca expor telefone/e-mail de quem enviou; credito so com autorizacao
  return res.json({ success: true, data: items.map(itemPublicoGaleria) });
}

// Foto de uma peca aprovada. Fica fora do JSON da listagem para o navegador
// poder baixar em paralelo, so o que aparece na tela, e guardar em cache.
export async function imagemGalleryItem(req, res) {
  const { id } = req.params;
  const naoAchou = () => res.status(404).json({ success: false, error: 'Foto nao encontrada.' });
  if (!mongoose.isValidObjectId(id)) return naoAchou();

  // Só item aprovado: pendente e recusado continuam invisiveis para o publico.
  const item = await GalleryItem.findOne({ _id: id, status: 'aprovado' }).select('imagem').lean();
  const dataUri = typeof item?.imagem === 'string' ? item.imagem : '';
  const partes = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.*)$/is.exec(dataUri);
  if (!partes) return naoAchou();

  const mime = partes[1].toLowerCase();
  if (!MIMES_DE_IMAGEM.has(mime)) return res.status(415).json({ success: false, error: 'Formato nao suportado.' });

  const buffer = Buffer.from(partes[2], 'base64');
  if (buffer.length === 0) return naoAchou();

  res.set('Content-Type', mime);
  res.set('X-Content-Type-Options', 'nosniff');
  // O endereco carrega a versao (?v=), entao o conteudo daquele endereco nunca muda.
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

    if (dataInicio) {
      filtro.createdAt.$gte = new Date(`${dataInicio}T00:00:00.000Z`);
    }

    if (dataFim) {
      filtro.createdAt.$lte = new Date(`${dataFim}T23:59:59.999Z`);
    }
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

  return res.json({ success: true, message: 'Item recusado e excluído.' });
}
