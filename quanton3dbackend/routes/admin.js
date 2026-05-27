import express from 'express'; import jwt from 'jsonwebtoken'; import Cliente from '../models/Cliente.js'; import Formulacao from '../models/Formulacao.js'; import Parametro from '../models/Parametro.js'; import GalleryItem from '../models/GalleryItem.js';
const router=express.Router();
function auth(req,res,next){ const h=req.headers.authorization||''; const token=h.startsWith('Bearer ')?h.slice(7):null; if(!token) return res.status(401).json({success:false,error:'Token ausente'}); try{jwt.verify(token,process.env.ADMIN_JWT_SECRET); next();}catch{return res.status(401).json({success:false,error:'Token inválido'});} }
router.post('/login',(req,res)=>{ const {user,password}=req.body||{}; if(user!==process.env.ADMIN_USER||password!==process.env.ADMIN_PASSWORD) return res.status(401).json({success:false,error:'Credenciais inválidas'}); const token=jwt.sign({user},process.env.ADMIN_JWT_SECRET,{expiresIn:'1d'}); res.json({success:true,token}); });
router.get('/metrics',auth,async(_req,res)=>{
  const [totalClientes,totalFormulacoes,totalParametros,totalGallery,clientes,formulacoes,parametros,gallery]=await Promise.all([
    Cliente.countDocuments(),
    Formulacao.countDocuments(),
    Parametro.countDocuments(),
    GalleryItem.countDocuments(),
    Cliente.find().sort({createdAt:-1}).limit(100).lean(),
    Formulacao.find().sort({createdAt:-1}).limit(100).lean(),
    Parametro.find().sort({resina:1}).limit(200).lean(),
    GalleryItem.find().sort({createdAt:-1}).limit(100).lean(),
  ]);

  res.json({
    success:true,
    totals:{clientes:totalClientes,formulacoes:totalFormulacoes,parametros:totalParametros,gallery:totalGallery},
    clientes,
    formulacoes,
    parametros,
    gallery,
  });
});
export default router;
