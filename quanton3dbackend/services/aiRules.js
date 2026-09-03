export function ruleBasedAnswer(message) {
  if (!message) return null;
  const t = String(message).toLowerCase();

  const mencionouResina = /\biron\b|\bflexform\b|alchemist|athom|poseidon|pyroblast|vulcan|spark|\bspin\b|low smell|70.30|velvet/.test(t);

  // Peça saindo menor / encolhendo
  if (/(peca|peças|peça|impressao|modelo).*(menor|pequena|encolh|contra[cç][aã]o)|(?:menor|encolh).*(peca|peças|peça|impressao|modelo)/i.test(t)) {
    return 'A causa mais provável de a peça sair menor nas dimensões externas é **exposição normal baixa**: a borda não polimeriza até o contorno nominal e perde medida. Primeiro calibre a exposição aumentando em passos pequenos e repetindo o mesmo corpo de prova; não use escala ou compensação XY para esconder exposição descalibrada. Se a medida estiver correta antes da pós-cura e diminuir somente depois, aí investigue contração, dose UV e temperatura da pós-cura.\n\nQual exposição normal, altura de camada, resina e impressora você está usando?';
  }

  // Suporte difícil de remover
  if (/suporte|suportes/.test(t) && /(duro|dificil|tirar|remover|grudado|quebra)/.test(t)) {
    return 'Suporte difícil de remover:\n1. **Reduza exposição normal** em 0,2s a 0,5s\n2. **Use suporte leve** (light/medium) no fatiador\n3. **Diminua o diâmetro da ponta** do suporte\n4. **Remova antes da cura UV final**\n\nQual resina e impressora você está usando?';
  }

  // Peça pegajosa após pós-cura
  if (/(peca|peça|impressao|superficie).*(pegaj|viscosa|gruda|grudenta)|(pegaj|grudenta|viscosa).*(peca|peça|impressao|superficie)/i.test(t)) {
    return 'Peça pegajosa após pós-cura:\n1. **Lave novamente** em álcool isopropílico por 3-5 min — a causa mais comum é resina líquida ainda na superfície\n2. **Seque bem** antes de entrar na câmara UV — peça úmida cura mal\n3. **Câmara UV**: gire a peça e cure por mais 5 min em cada lado\n4. Se persistir: o álcool pode estar saturado, troque por álcool limpo\n\nQual resina você está usando?';
  }

  // Peça não adere / cai no tanque
  if (/(peca|peça|impressao).*(nao adere|nao cola|nao gruda|nao fixa|caiu|soltou|cai no tanque|soltando|descolou)/i.test(t) || /caiu no tanque|soltou da plataforma|nao colou na plataforma/i.test(t)) {
    return 'Peça não aderindo à plataforma:\n1. **Refaça o nivelamento** — causa mais comum\n2. **Aumente exposição base** em 20-30% (ex: de 30s para 36-40s)\n3. **Limpe a plataforma** com álcool isopropílico\n4. **Temperatura abaixo de 18°C** — aqueça o ambiente ou pré-aqueça a resina (máx 40°C)\n5. **Aumente camadas base** para 6-8\n\nQual resina, impressora e exposição base você está usando?';
  }

  // Warping / empenamento
  if (/(peca|peça|impressao|base).*(empen|torceu|torto|entortou|nao ficou reto|curvou|curva|deformou)|(empen|warping|torceu|deformou).*(peca|peça|impressao)/i.test(t)) {
    return 'Peça empenando (warping):\n1. **Reduza exposição base** em 15-20% — super-exposição na base causa curvamento\n2. **Adicione suportes nas bordas** da peça\n3. **Incline a peça** 15-30° no fatiador — evita grandes áreas planas\n4. **Reduza o raft** se usar\n5. Peças grandes e planas pioram o efeito — sempre usar suportes\n\nQual resina e impressora você está usando?';
  }

  // Linhas visíveis entre camadas
  if (/(linha|linhas|marca|marcas).*(camada|layer)|(camada|layer).*(linha|linhas|marca|marcas)|layer lines|linhas horizontais/i.test(t)) {
    return 'Linhas visíveis entre camadas:\n1. **Aumente exposição normal** em 0,2-0,5s\n2. **Reduza velocidade de elevação** (lift speed) em 20-30%\n3. **Agite bem a resina** antes de usar — sedimentação causa variação de cura\n4. **Limpe a tela LCD** com pano de microfibra seco\n\nAjustar exposição E velocidade juntos resolve a maioria dos casos. Qual impressora e resina?';
  }

  // Peças flexíveis (pneus, juntas, borracha)
  if (/pneu|pneus|borracha|junta|vedacao|sola|flexivel/.test(t) && !mencionouResina) {
    return 'Para peças flexíveis (pneus, juntas, solas, vedações), a resina indicada é a **FLEXFORM**. Qual impressora você usa?';
  }

  // Peças funcionais com resistência
  if (/(resist|impacto|mecan|funcional)/.test(t) && /personagem|miniatura|boneco/.test(t) && !mencionouResina) {
    return 'Para resistência mecânica e impacto, a resina indicada é a **IRON**. Qual impressora você usa?';
  }

  // Joalheria / fundição
  if (/(joalheria|joia|jóia|fundição|fundicao|cera perdida|castable|ourivesaria)/.test(t) && !mencionouResina) {
    return 'Para joalheria e fundição por cera perdida, a resina indicada é a **VULCAN CAST**. Ela queima completamente sem resíduo de cinzas. Qual impressora você usa?';
  }

  // Miniatura / RPG / detalhes finos
  if (/(miniatura|miniaturas|rpg|dungeons|fantasia|detalhe fino|detalhes finos)/.test(t) && !mencionouResina) {
    return 'Para miniaturas e detalhes finos, as resinas indicadas são **ALCHEMIST** (versátil, ótima para iniciantes) ou **PYROBLAST** (alta precisão, prototipagem rápida). Qual impressora você usa?';
  }

  // Odontologia / dental
  if (/(dentista|odontolog|dental|odontal|alinhador|model.*odonto|odonto.*model|troquel)/.test(t) && !mencionouResina) {
    return 'Para aplicações odontológicas, a Quanton3D tem:\n- **ATHOM DENTAL**: modelos de estudo e troquéis\n- **ATHOM ALINHADORES**: termoformagem de alinhadores, placas\n- **ATHOM WASHABLE**: lavável em água, sem álcool\n\n⚠️ Todas são de uso **externo** (laboratório), não intraoral. Qual impressora você usa?';
  }

  // Cheiro forte / sem ventilação
  if (/(cheiro|odor|fede|fedendo|cheiro forte|mal cheiro|sem ventilacao|ventilacao ruim)/.test(t) && !mencionouResina) {
    return 'Para ambientes sem ventilação adequada, as resinas com menor odor são:\n- **LOW SMELL**: baixíssimo odor, ótima para uso doméstico\n- **POSEIDON**: lavável em água, baixo odor\n\nQual impressora você usa?';
  }

  // Impressora genérica sem modelo
  if (/^elegoo\s*$/i.test(String(message).trim())) {
    return 'Qual modelo exato da Elegoo? Exemplo: Mars 3, Saturn 2, Saturn 3 Ultra.';
  }
  if (/^anycubic\s*$/i.test(String(message).trim())) {
    return 'Qual modelo exato da Anycubic? Exemplo: Photon Mono M3, Photon Mono X 6K.';
  }
  if (/^phrozen\s*$/i.test(String(message).trim())) {
    return 'Qual modelo exato da Phrozen? Exemplo: Sonic Mini 8K, Sonic Mega 8K.';
  }

  return null;
}
