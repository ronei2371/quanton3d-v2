const TECHNICAL_QUANTITY_PATTERN = /\b\d+(?:[.,]\d+)?(?:\s*[-–a]\s*\d+(?:[.,]\d+)?)?\s*(?:%|s(?:egundos?)?|min(?:utos?)?|mm|cm|°\s*c)(?=$|[^a-z0-9])/i;

export function containsTechnicalQuantity(value = '') {
  return TECHNICAL_QUANTITY_PATTERN.test(String(value));
}

export function hasApprovedQuantitativeSource(sources = []) {
  return ['parametros_oficiais', 'conversas_aprovadas', 'sugestoes_aprovadas']
    .some((source) => sources.includes(source));
}
