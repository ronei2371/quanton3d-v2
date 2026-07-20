import mongoose from 'mongoose';
const Schema = new mongoose.Schema({
  nome:            { type:String, required:true, trim:true },
  telefone:        { type:String, trim:true },
  email:           { type:String, trim:true, lowercase:true },
  origem:          { type:String, trim:true, default:'outros' },
  observacao:      String,
  cpfCnpj:        { type:String, trim:true, default:'' },
  tipoPessoa:     { type:String, enum:['pf','pj',''], default:'' },
  nomeEmpresa:    { type:String, trim:true, default:'' },
  codigoAtendente: { type:String, trim:true, default:'' },
  nomeAtendente:   { type:String, trim:true, default:'' },
}, { timestamps:true });
Schema.index({ createdAt: -1 });
Schema.index({ cpfCnpj: 1 });
export default mongoose.model('Cliente', Schema);
