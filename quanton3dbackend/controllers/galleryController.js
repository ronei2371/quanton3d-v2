import GalleryItem from '../models/GalleryItem.js';
 codex/fix-integration-errors-and-improve-performance-aj52u1

 codex/fix-integration-errors-and-improve-performance-0pi7zz
 main

export async function criarGalleryItem(req, res) {
  const item = await GalleryItem.create(req.body || {});
  return res.status(201).json({ success: true, data: item });
}

export async function listarGalleryItems(_req, res) {
 codex/fix-integration-errors-and-improve-performance-aj52u1
  const items = await GalleryItem.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();


  const items = await GalleryItem.find().sort({ createdAt: -1 }).limit(200).lean();
 main
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
 codex/fix-integration-errors-and-improve-performance-aj52u1


codex/fix-integration-errors-and-improve-performance-ct530b
export async function criarGalleryItem(req,res){ const item=await GalleryItem.create(req.body||{}); res.status(201).json({success:true,data:item}); }
export async function listarGalleryItems(_req,res){ const items=await GalleryItem.find().sort({createdAt:-1}).limit(200).lean(); res.json({success:true,data:items}); }
export async function aprovarGalleryItem(req,res){ const item=await GalleryItem.findByIdAndUpdate(req.params.id,{status:'aprovado'},{new:true}); if(!item) return res.status(404).json({success:false,error:'Item não encontrado'}); res.json({success:true,data:item}); }

export async function criarGalleryItem(req,res){ const item=await GalleryItem.create(req.body||{}); res.status(201).json({success:true,item}); }
export async function listarGalleryItems(_req,res){ const items=await GalleryItem.find().sort({createdAt:-1}).limit(200).lean(); res.json({success:true,items}); }
export async function aprovarGalleryItem(req,res){ const item=await GalleryItem.findByIdAndUpdate(req.params.id,{status:'aprovado'},{new:true}); if(!item) return res.status(404).json({success:false,error:'Item não encontrado'}); res.json({success:true,item}); }
 main
 main
 main
