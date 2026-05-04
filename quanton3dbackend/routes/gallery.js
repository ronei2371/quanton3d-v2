import express from 'express'; import { criarGalleryItem,listarGalleryItems,aprovarGalleryItem } from '../controllers/galleryController.js';
const router=express.Router(); router.post('/',criarGalleryItem); router.get('/',listarGalleryItems); router.patch('/:id/aprovar',aprovarGalleryItem); export default router;
