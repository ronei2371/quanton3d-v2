import mongoose from 'mongoose';

// Chamadas de IA feitas pelo painel ADM (os botoes "sugerir"), que nao viram Conversa.
// Sem isso o custo estimado fica menor que a conta real da DeepSeek, porque esses
// cliques gastam token igual a uma pergunta do cliente mas nao deixavam rastro.
const UsoIAAdminSchema = new mongoose.Schema(
  {
    origem: { type: String, required: true }, // 'sugerir-melhoria' | 'sugerir-resposta-ticket'
    usuario: { type: String, default: '' },
    tokensEntrada: { type: Number, default: 0 },
    tokensCache: { type: Number, default: 0 },
    tokensSaida: { type: Number, default: 0 },
  },
  { timestamps: true },
);

UsoIAAdminSchema.index({ createdAt: -1 });

export default mongoose.model('UsoIAAdmin', UsoIAAdminSchema);
