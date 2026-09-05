const fs = require('node:fs');
const path = require('node:path');

const frontendRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(frontendRoot, 'public');
const guideDataPath = path.join(frontendRoot, 'src', 'data', 'guides.js');
const guideData = fs.readFileSync(guideDataPath, 'utf8');
const registeredGuides = guideData.split('export const REFERENCIA_PARAMETROS')[0];
const requestedGuides = process.argv.slice(2);
const guidePaths = requestedGuides.length
  ? requestedGuides.map((file) => file.startsWith('/') ? file : `/guias/${file}`)
  : [...registeredGuides.matchAll(/file:\s*["']([^"']+\.html)["']/g)].map((match) => match[1]);

const failures = [];
const checked = new Set();

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function resolvePublicReference(filePath, reference) {
  if (reference.startsWith('/')) return path.join(publicRoot, reference.replace(/^\/+/, ''));
  return path.resolve(path.dirname(filePath), reference);
}

for (const publicPath of guidePaths) {
  if (checked.has(publicPath)) continue;
  checked.add(publicPath);

  const filePath = path.join(publicRoot, publicPath.replace(/^\/+/, ''));
  if (!fs.existsSync(filePath)) {
    fail(publicPath, 'arquivo não encontrado');
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  if (!/^<!doctype html>/i.test(html.trimStart())) fail(publicPath, 'DOCTYPE ausente');
  if (!/<html\b[^>]*lang=["']pt-BR["']/i.test(html)) fail(publicPath, 'lang="pt-BR" ausente');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) fail(publicPath, 'meta viewport ausente');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(publicPath, 'title vazio ou ausente');

  for (const tag of ['html', 'body', 'main', 'section', 'script']) {
    const opened = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const closed = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (opened !== closed) fail(publicPath, `quantidade incompatível de <${tag}> (${opened}/${closed})`);
  }

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) fail(publicPath, `IDs duplicados: ${duplicateIds.join(', ')}`);
  const idSet = new Set(ids);

  for (const match of html.matchAll(/href=["']#([^"']+)["']/gi)) {
    if (!idSet.has(match[1])) fail(publicPath, `âncora sem destino: #${match[1]}`);
  }
  for (const match of html.matchAll(/aria-labelledby=["']([^"']+)["']/gi)) {
    for (const id of match[1].split(/\s+/)) {
      if (id && !idSet.has(id)) fail(publicPath, `aria-labelledby sem destino: ${id}`);
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']+["']/i.test(match[0])) fail(publicPath, 'imagem sem texto alternativo');
  }

  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(reference)) continue;
    const target = resolvePublicReference(filePath, reference.split(/[?#]/, 1)[0]);
    if (!fs.existsSync(target)) fail(publicPath, `recurso local não encontrado: ${reference}`);
  }
}

if (failures.length) {
  console.error(`Falha na validação dos guias (${failures.length}):`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Guias validados: ${checked.size}. Estrutura, âncoras, acessibilidade e recursos locais estão íntegros.`);
