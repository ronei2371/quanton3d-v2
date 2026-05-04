import GalleryItem from "../models/GalleryItem.js";

function limparTexto(valor) {
  return String(valor || "").trim();
}

export async function criarGalleryItem(req, res) {
  const body = req.body || {};
  const item = await GalleryItem.create({
    nome: limparTexto(body.nome),
    telefone: limparTexto(body.telefone),
    email: limparTexto(body.email).toLowerCase(),
    resina: limparTexto(body.resina),
    impressora: limparTexto(body.impressora),
    imagem: req.file ? `/uploads/gallery/${req.file.filename}` : limparTexto(body.imagem),
    observacao: limparTexto(body.observacao),
    parametros: {
      alturaCamada: limparTexto(body.alturaCamada),
      exposicaoNormal: limparTexto(body.exposicaoNormal),
      exposicaoBase: limparTexto(body.exposicaoBase),
      camadasBase: limparTexto(body.camadasBase),
    },
  });

  res.status(201).json({ success: true, item });
}

export async function listarGalleryItems(_req, res) {
  const items = await GalleryItem.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, items });
}

export async function aprovarGalleryItem(req, res) {
  const item = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { status: "aprovado" },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, error: "Item não encontrado" });
  }

  res.json({ success: true, item });
}
