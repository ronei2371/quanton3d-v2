import mongoose from 'mongoose';
const Schema = new mongoose.Schema({ nome:{type:String,required:true,trim:true}, telefone:{type:String,required:true,trim:true}, email:{type:String,trim:true,lowercase:true}, caracteristica:{type:String,required:true,trim:true}, cor:String, detalhes:String, status:{type:String,default:'pendente'} }, {timestamps:true});
export default mongoose.model('Formulacao', Schema);
