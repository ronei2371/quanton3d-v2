import GalleryItem from '../models/GalleryItem.js';

export async function criarGalleryItem(req, res) {
  const item = await GalleryItem.create({
    ...(req.body || {}),
    status: 'pendente',
  });

  return res.status(201).json({ success: true, data: item });
}

export async function listarGalleryItems(_req, res) {
  const items = await GalleryItem.find({ status: 'aprovado' })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return res.json({ success: true, data: items });
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
