import express from "express";
import {
  atualizarRegistro,
  criarRegistro,
  excluirRegistro,
  listarRegistros,
} from "../controllers/diarioController.js";

const router = express.Router();

router.get("/", listarRegistros);
router.post("/", criarRegistro);
router.put("/:id", atualizarRegistro);
router.delete("/:id", excluirRegistro);

export default router;
