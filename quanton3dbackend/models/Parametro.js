import mongoose from 'mongoose';
const Schema = new mongoose.Schema({ resina:{type:String,required:true,trim:true}, impressora:{type:String,required:true,trim:true}, alturaCamada:String, exposicaoNormal:String, exposicaoBase:String, camadasBase:String, liftDistance:String, liftSpeed:String, retractSpeed:String }, {timestamps:true});
export default mongoose.model('Parametro', Schema);
