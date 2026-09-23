const TECHNICAL_QUANTITY_PATTERN = /\b\d+(?:[.,]\d+)?(?:\s*[-–a]\s*\d+(?:[.,]\d+)?)?\s*(?:%|s(?:egundos?)?|min(?:utos?)?|mm|cm|°\s*c)(?=$|[^a-z0-9])/i;

export function containsTechnicalQuantity(value = '') {
  return TECHNICAL_QUANTITY_PATTERN.test(String(value));
}

// Remove somente as frases com numero tecnico, preservando o diagnostico.
export function stripTechnicalQuantities(value = '') {
  const kept = String(value)
    .split('\n')
    .map((line) => line
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !containsTechnicalQuantity(sentence))
      .join(' '))
    // descarta item de lista que ficou vazio ("1." ou "-")
    .filter((line) => !/^\s*(?:\d+[.)]|[-*•])\s*(?:\*\*)?\s*$/.test(line))
    .filter((line, index, all) => line.trim() || (index > 0 && all[index - 1].trim()));
  // renumera listas numeradas depois de remover itens
  let n = 0;
  const renumbered = kept.map((line) => {
    const m = line.match(/^(\s*)\d+([.)])\s/);
    if (!m) { if (!line.trim()) n = 0; return line; }
    n += 1;
    return line.replace(/^(\s*)\d+([.)])/, `$1${n}$2`);
  });
  return renumbered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function hasApprovedQuantitativeSource(sources = []) {
  return ['parametros_oficiais', 'ficha_produto', 'conversas_aprovadas', 'sugestoes_aprovadas']
    .some((source) => sources.includes(source));
}
