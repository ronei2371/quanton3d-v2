export function ruleBasedAnswer(message = '') {
  const t = String(message).toLowerCase();

  // Só responde sobre resina específica se o cliente JÁ mencionou qual usa
  const mencionouIron = /\biron\b/.test(t);
  const mencionouFlexform = /\bflexform\b/.test(t);
  const mencionouResina = mencionouIron || mencionouFlexform ||
    /alchemist|athom|poseidon|pyroblast|vulcan|spark|spin|low smell/.test(t);

  // Suporte difícil de tirar — resposta geral sem citar resina
  if (/suporte|suportes/.test(t) && /(duro|difícil|dificil|tirar|remover|grudado|quebra)/.test(t)) {
    return 'Suporte difícil de remover geralmente vem de exposição normal alta ou ponta de suporte grossa. Tente:\n1. **Reduza a exposição normal** em 0,2s a 0,5s\n2. **Use suporte leve** (light/medium) no fatiador\n3. **Diminua o diâmetro da ponta** do suporte\n4. **Remova antes da cura UV final** — a peça ainda está um pouco maleável\n\nQual resina e impressora você está usando? Posso dar um ajuste mais preciso.';
  }

  // Pergunta sobre pneu/borracha — aí sim faz sentido citar FLEXFORM
  if (/pneu|pneus|borracha|flex|elástic/.test(t) && !mencionouResina) {
    return 'Para peças que precisam de flexibilidade (pneus, juntas, solas), a resina indicada é a **FLEXFORM**. Ela é elástica e suporta deformação sem quebrar. Qual impressora você usa?';
  }

  // Pergunta sobre resistência mecânica — aí sim faz sentido citar IRON
  if (/(resist|impacto|mecan|funcional|encaixe|ferramenta)/.test(t) && /personagem|miniatura|boneco|peça/.test(t) && !mencionouResina) {
    return 'Para peças que precisam de resistência mecânica e impacto, a resina indicada é a **IRON**. Ela é mais rígida e aguenta manuseio intenso. Qual impressora você usa?';
  }

  // Elegoo sem modelo
  if (/^elegoo\s*$/i.test(String(message).trim())) {
    return 'Qual modelo exato da Elegoo? Exemplo: Mars 3, Saturn 2, Saturn 3 Ultra. Sem o modelo não consigo indicar os parâmetros certos.';
  }

  return null;
}
