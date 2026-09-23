const TECHNICAL_QUANTITY_PATTERN = /\b\d+(?:[.,]\d+)?(?:\s*[-–a]\s*\d+(?:[.,]\d+)?)?\s*(?:%|s(?:egundos?)?|min(?:utos?)?|mm|cm|°\s*c)(?=$|[^a-z0-9])/i;

export function containsTechnicalQuantity(value = '') {
  return TECHNICAL_QUANTITY_PATTERN.test(String(value));
}

// Quebra em frases sem cortar abreviacao ("max."), negrito aberto ou numero de lista.
function splitSentences(line) {
  const out = [];
  for (const part of String(line).split(/(?<=[.!?])\s+/)) {
    const prev = out[out.length - 1];
    const juntar = prev !== undefined && (
      /(?:^|[\s*(])(?:m[aá]x|m[ií]n|aprox|approx|ex|obs|p\.?\s?ex)\.$/i.test(prev)
      || ((prev.match(/\*\*/g) || []).length % 2 === 1)
      || /^\s*\d+[.)]$/.test(prev)
    );
    if (juntar) out[out.length - 1] = prev + ' ' + part;
    else out.push(part);
  }
  return out;
}

// Remove somente as frases com numero tecnico, preservando o diagnostico.
export function stripTechnicalQuantities(value = '') {
  const kept = String(value)
    .split('\n')
    .map((line) => splitSentences(line)
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
