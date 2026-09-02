export function ruleBasedAnswer(message) {
  if (!message) return null;
  const t = String(message).toLowerCase();

  const mencionouResina = /\biron\b|\bflexform\b|alchemist|athom|poseidon|pyroblast|vulcan|spark|\bspin\b|low smell|70.30|velvet/.test(t);

  if (/(peca|peças|peça|impressao|modelo).*(menor|pequena|encolh|contra[cç][aã]o)|(?:menor|encolh).*(peca|peças|peça|impressao|modelo)/i.test(t)) {
    return 'A causa mais provável de a peça sair menor nas dimensões externas é **exposição normal baixa**: a borda não polimeriza até o contorno nominal e perde medida. Primeiro calibre a exposição aumentando em passos pequenos e repetindo o mesmo corpo de prova; não use escala ou compensação XY para esconder exposição descalibrada. Se a medida estiver correta antes da pós-cura e diminuir somente depois, aí investigue contração, dose UV e temperatura da pós-cura.\n\nQual exposição normal, altura de camada, resina e impressora você está usando?';
  }

  if (/suporte|suportes/.test(t) && /(duro|dificil|tirar|remover|grudado|quebra)/.test(t)) {
    return 'Suporte difícil de remover:\n1. **Reduza exposição normal** em 0,2s a 0,5s\n2. **Use suporte leve** (light/medium) no fatiador\n3. **Diminua o diâmetro da ponta** do suporte\n4. **Remova antes da cura UV final**\n\nQual resina e impressora você está usando?';
  }

  if (/pneu|pneus|borracha/.test(t) && !mencionouResina) {
    return 'Para peças flexíveis (pneus, juntas, solas), a resina indicada é a **FLEXFORM**. Qual impressora você usa?';
  }

  if (/(resist|impacto|mecan|funcional)/.test(t) && /personagem|miniatura|boneco/.test(t) && !mencionouResina) {
    return 'Para resistência mecânica e impacto, a resina indicada é a **IRON**. Qual impressora você usa?';
  }

  if (/^elegoo\s*$/i.test(String(message).trim())) {
    return 'Qual modelo exato da Elegoo? Exemplo: Mars 3, Saturn 2, Saturn 3 Ultra.';
  }

  return null;
}
