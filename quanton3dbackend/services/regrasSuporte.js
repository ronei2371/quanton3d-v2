// Respostas fixas de suporte (texto aprovado, sem passar pelo modelo).
// Usadas quando a resposta depende de uma regra da Quanton3D com numero, que o filtro
// de seguranca cortaria se viesse da base tecnica (ex.: 30% de IRON na SPIN+).

function normalizar(texto = '') {
  return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const FALA_DE_MISTURA = /\b(mistur\w*|juntar|blend)\b/;
const FALA_DE_RESINA = /\b(resinas?|quanton\w*|spin\+?|iron|70\/30|alchemist|pyroblast|poseidon|flexform|spark|low ?smell|athom|vulcan|velvet|marca|sobras?)\b/;
const OUTRA_MARCA = /\b(outra marca|outras marcas|outro fabricante|marca diferente|outra resina de fora|de outra empresa|elegoo|anycubic|sunlu|phrozen|siraya|esun|3d ?cure|uvtek)\b/;

export function misturaAnswer(message = '') {
  const t = normalizar(message);
  if (!FALA_DE_MISTURA.test(t) || !FALA_DE_RESINA.test(t)) return null;
  // pergunta sobre mistura de tinta/pigmento/solvente nao entra aqui
  if (/\b(tinta|pigmento|corante|alcool|agua)\b/.test(t)) return null;
  // "misturar a resina antes de imprimir" = agitar o frasco, nao e mistura de duas resinas
  if (/\b(agita\w*|chacoalh\w*|sediment\w*|decant\w*|homogene\w*|antes de (usar|imprimir)|no frasco|no pote|na cuba)\b/.test(t)) return null;
  if (!/\b(duas|2|resinas|com|outra|outras|marca)\b/.test(t)) return null;

  if (OUTRA_MARCA.test(t)) {
    return 'Entendi que você quer saber se pode misturar resina Quanton3D com resina de outra marca.\n\n'
      + '**Não é recomendado.** Cada fabricante usa fotoiniciador, pigmento e viscosidade diferentes: a mistura vira um material imprevisível, o perfil oficial deixa de valer e podem aparecer falhas de aderência, peça mole ou quebradiça.\n\n'
      + 'Use a resina Quanton3D pura, com o perfil oficial dela. Se o objetivo é mudar alguma propriedade da peça, me conta qual (mais resistência, mais flexibilidade, menos cheiro) que eu te indico a resina Quanton3D certa.';
  }

  return 'Entendi que você quer saber se pode misturar resinas Quanton3D.\n\n'
    + '**Existe uma mistura validada pela equipe: SPIN+ com 30% de IRON**, para miniaturas mais resistentes. Só evite em peças com asas grandes ou partes muito inclinadas, porque podem entortar.\n\n'
    + 'Outras misturas entre resinas Quanton3D não são validadas: cura, resistência e acabamento ficam imprevisíveis e o perfil oficial deixa de valer. Se você precisa de outra característica intermediária, fale com a equipe pelo WhatsApp (31) 3271-6935.';
}

const FALA_DE_FORMULA = /\b(formula|conta|calcul\w*)\b/;
const FALA_DE_CUSTO = /\b(custo|custos|preco|orcamento)\b/;

export function custoFormulaAnswer(message = '') {
  const t = normalizar(message);
  if (!FALA_DE_FORMULA.test(t) || !FALA_DE_CUSTO.test(t)) return null;
  if (!/\b(formula|errad\w*|como (e|eh|faz|funciona)|conferir|confere|mostr\w*|explic\w*)\b/.test(t)) return null;

  return 'Entendi que você quer conferir a conta da Calculadora de Custos do site.\n\n'
    + 'É assim que ela calcula:\n'
    + '1. **Resina** = volume da peça (mL) × quantidade × 1,05 (margem de perda) ÷ 1000 × preço do litro.\n'
    + '2. **Energia** = potência da impressora (W) ÷ 1000 × horas de impressão × preço do kWh.\n'
    + '3. **Subtotal** = resina + energia + consumíveis + pós-processo.\n'
    + '4. **Impacto da falha** = subtotal × taxa de falha ÷ 100.\n'
    + '5. **Custo total** = subtotal + impacto da falha. **Por peça** = total ÷ quantidade.\n\n'
    + 'Os erros mais comuns: colocar o peso em gramas no campo de volume (mL), usar o preço do frasco em vez do preço do litro ou esquecer a quantidade de peças. Se quiser, me passa os valores que você usou que eu confiro com você.';
}
