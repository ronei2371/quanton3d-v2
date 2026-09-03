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
    return 'Suporte difícil de remover costuma indicar **contato grande ou profundo demais**, exposição normal acima do necessário ou remoção somente após a pós-cura final. Primeiro confira o perfil oficial e o diâmetro/profundidade da ponta; altere um fator por vez e valide em uma peça de teste. Quando o fluxo da resina permitir, remova os suportes após lavar e secar, antes da pós-cura final.\n\nQual resina, impressora e exposição normal você está usando?';
  }

  // Peça pegajosa após lavagem ou pós-cura
  if (/(peca|peça|impressao|superficie).*(pegaj|viscosa|gruda|grudenta)|(pegaj|grudenta|viscosa).*(peca|peça|impressao|superficie)/i.test(t)) {
    return 'Superfície pegajosa geralmente aponta para **lavagem insuficiente, solvente saturado, secagem incompleta ou pós-cura inadequada**. Faça uma nova lavagem com o agente indicado para a resina, seque totalmente e aplique somente o ciclo de pós-cura validado; aumentar UV sem controle pode mascarar o problema. Se continuar pegajosa, compare com solvente limpo e confirme se a cabine entrega o espectro correto.\n\nQual resina e processo de lavagem você usou?';
  }

  // Peça não adere / cai no tanque
  if (/(peca|peça|impressao).*(nao adere|nao cola|nao gruda|nao fixa|caiu|soltou|cai no tanque|soltando|descolou)/i.test(t) || /caiu no tanque|soltou da plataforma|nao colou na plataforma/i.test(t)) {
    return 'Peça soltando da plataforma: comece por **refazer o nivelamento e limpar a plataforma**. Depois confirme temperatura da resina, condição do filme, área da primeira camada e se exposição e quantidade de camadas de base coincidem com o perfil oficial. Não aumente a exposição de base às cegas: sucção, elevação agressiva ou suporte insuficiente podem produzir o mesmo sintoma.\n\nQual resina, impressora e exposição de base você está usando?';
  }

  // Warping / empenamento
  if (/(peca|peça|impressao|base).*(empen|torceu|torto|entortou|nao ficou reto|curvou|curva|deformou)|(empen|warping|torceu|deformou).*(peca|peça|impressao)/i.test(t)) {
    return 'Empenamento costuma vir de **grande seção por camada, orientação desfavorável, suportes insuficientes ou cura desigual**. Incline a peça para reduzir áreas simultâneas, distribua apoios nas bordas e verifique sucção em cavidades. Compare a geometria ao sair da impressora e após a pós-cura: isso separa falha de impressão de deformação criada no acabamento.\n\nEla já sai empenada da impressora ou deforma somente depois da pós-cura?';
  }

  // Linhas visíveis entre camadas
  if (/(linha|linhas|marca|marcas).*(camada|layer)|(camada|layer).*(linha|linhas|marca|marcas)|layer lines|linhas horizontais/i.test(t)) {
    return 'Para linhas entre camadas, veja primeiro se a marca aparece **sempre na mesma altura**. Se sim, investigue arquivo, eixo Z, pausa ou falha localizada; se varia entre impressões, confira temperatura, homogeneização, suportes, sucção e movimento de elevação. Não altere exposição e velocidade ao mesmo tempo, porque isso impede identificar a causa.\n\nA linha se repete na mesma altura em todas as peças?';
  }

  // Peças flexíveis (pneus, juntas, borracha)
  if (/pneu|pneus|borracha|junta|vedacao|sola|flexivel/.test(t) && !mencionouResina) {
    return 'Para peças flexíveis como pneus, juntas, solas e vedações, a resina indicada é a **FLEXFORM**. Confirme dureza e deformação exigidas pela aplicação antes de escolher o perfil. Qual impressora você usa?';
  }

  // Peças funcionais com resistência
  if (/(resist|impacto|mecan|funcional)/.test(t) && /personagem|miniatura|boneco/.test(t) && !mencionouResina) {
    return 'Para resistência mecânica e impacto, a resina indicada é a **IRON**. Qual impressora você usa?';
  }

  // Joalheria / fundição
  if (/(joalheria|joia|jóia|fundição|fundicao|cera perdida|castable|ourivesaria)/.test(t) && !mencionouResina) {
    return 'Para joalheria e fundição por cera perdida, a opção Quanton3D é a **VULCAN CAST**. O resultado depende do ciclo de queima, revestimento, espessura e cura da peça; siga o procedimento validado do produto em vez de assumir um ciclo universal. Qual impressora você usa?';
  }

  // Miniatura / RPG / detalhes finos
  if (/(miniatura|miniaturas|rpg|dungeons|fantasia|detalhe fino|detalhes finos)/.test(t) && !mencionouResina) {
    return 'Para miniaturas e detalhes finos, compare **ALCHEMIST** para uso versátil e **PYROBLAST** para alta definição. A escolha final depende de resistência, acabamento e velocidade desejados. Qual impressora você usa?';
  }

  // Odontologia / dental
  if (/(dentista|odontolog|dental|odontal|alinhador|model.*odonto|odonto.*model|troquel)/.test(t) && !mencionouResina) {
    return 'Para laboratório odontológico, a Quanton3D oferece **ATHOM DENTAL**, **ATHOM ALINHADORES** e **ATHOM WASHABLE**, conforme a aplicação. Esses materiais são para uso externo/laboratorial e **não devem ser usados diretamente na boca do paciente**. Qual aplicação e impressora você usa?';
  }

  // Cheiro forte / ventilação
  if (/(cheiro|odor|fede|fedendo|cheiro forte|mal cheiro|sem ventilacao|ventilacao ruim)/.test(t) && !mencionouResina) {
    return 'Odor baixo não significa ausência de vapores ou risco. **Não use resina sem ventilação adequada**; melhore renovação/exaustão do ar e siga a FISPQ/SDS. Para menor percepção de odor, existem **LOW SMELL** e **POSEIDON**, mas isso não substitui ventilação, luvas e controle de exposição.\n\nO ambiente possui renovação de ar ou exaustão para fora?';
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
