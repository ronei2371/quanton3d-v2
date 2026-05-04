import express from "express";
import {
  criarGalleryItem,
  listarGalleryItems,
  aprovarGalleryItem,
} from "../controllers/galleryController.js";
import uploadGalleryImage from "../middleware/galleryUpload.js";

const router = express.Router();

router.post("/", (req, res) => {
  uploadGalleryImage.single("imagem")(req, res, async (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({
        success: false,
        error: erroUpload.message || "Erro ao enviar imagem.",
      });
    }

    return criarGalleryItem(req, res);
  });
});

router.get("/", listarGalleryItems);
router.patch("/:id/aprovar", aprovarGalleryItem);

export default router;
