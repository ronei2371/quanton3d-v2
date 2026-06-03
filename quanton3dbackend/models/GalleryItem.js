import mongoose from 'mongoose';
const Schema = new mongoose.Schema({ nome:String, telefone:String, email:String, resina:String, impressora:String, imagem:String, observacao:String, parametros:{alturaCamada:String,exposicaoNormal:String,exposicaoBase:String,camadasBase:String}, status:{type:String,default:'pendente'} }, {timestamps:true});
Schema.index({ status: 1, createdAt: -1 });
export default mongoose.model('GalleryItem', Schema);
