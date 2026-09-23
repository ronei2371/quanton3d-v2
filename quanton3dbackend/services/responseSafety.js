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
    .filter((line, index, all) => line.trim() || (index > 0 && all[index - 1].trim()));
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function hasApprovedQuantitativeSource(sources = []) {
  return ['parametros_oficiais', 'ficha_produto', 'conversas_aprovadas', 'sugestoes_aprovadas']
    .some((source) => sources.includes(source));
}
