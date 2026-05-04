import express from 'express'; import { criarFormulacao,listarFormulacoes } from '../controllers/formulacoesController.js';
const router=express.Router(); router.post('/',criarFormulacao); router.get('/',listarFormulacoes); export default router;
