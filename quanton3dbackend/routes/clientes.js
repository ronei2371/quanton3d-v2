import express from 'express'; import { criarCliente, listarClientes } from '../controllers/clientesController.js';
const router=express.Router(); router.post('/',criarCliente); router.get('/',listarClientes); export default router;
