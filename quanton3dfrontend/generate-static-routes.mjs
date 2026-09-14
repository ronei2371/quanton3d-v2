// p0-seo-1: Gera HTML estático com title/description corretos para cada rota pública.
// Rodado após "vite build" — cria dist/<rota>/index.html com meta tags da rota.
// Não precisa de Puppeteer nem SSR; funciona no ambiente de build do Render.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const BASE_URL = 'https://quanton3dia.onrender.com';

const ROUTES = [
  {
    path: '/catalogo',
    title: 'Catálogo de Resinas — Quanton3D',
    description: 'Conheça as resinas UV Quanton3D para impressão SLA/DLP: Flex, Washable, Velvet Skin, Draft e mais. Qualidade brasileira para impressão 3D de alta resolução.',
  },
  {
    path: '/parametros',
    title: 'Parâmetros de Impressão — Quanton3D',
    description: 'Tabela completa de parâmetros de impressão para resinas UV Quanton3D em impressoras SLA/DLP: tempo de exposição, potência, espessura de camada e configurações recomendadas.',
  },
  {
    path: '/calculadoras',
    title: 'Calculadoras 3D — Quanton3D',
    description: 'Calculadoras técnicas para impressão 3D com resinas UV: exposição ideal, custo por peça, consumo de resina e outros parâmetros para SLA e DLP.',
  },
  {
    path: '/guias',
    title: 'Guias Técnicos — Quanton3D',
    description: 'Guias técnicos de impressão 3D com resinas UV: calibração de impressoras, pós-cura, uso de EPIs, solução de problemas e boas práticas para SLA/DLP.',
  },
  {
    path: '/academia',
    title: 'Quanton Academy — Quanton3D',
    description: 'Aprenda impressão 3D com resinas UV na Quanton Academy: tutoriais, vídeos e conteúdo técnico para iniciantes e avançados em SLA e DLP.',
  },
  {
    path: '/atendimento',
    title: 'Atendimento — Quanton3D',
    description: 'Suporte técnico Quanton3D: tire dúvidas sobre resinas UV, impressão SLA/DLP e nossos produtos. Atendimento via WhatsApp, e-mail e chat com IA especializada.',
  },
  {
    path: '/comunidade',
    title: 'Comunidade — Quanton3D',
    description: 'Junte-se à comunidade Quanton3D: grupos no WhatsApp, redes sociais e programa de parceria para entusiastas de impressão 3D com resinas UV.',
  },
  {
    path: '/sobre',
    title: 'Sobre Nós — Quanton3D',
    description: 'Conheça a Quanton3D: fabricante brasileira de resinas UV para impressão SLA/DLP com mais de 20 anos de experiência em manufatura e formulação de polímeros.',
  },
];

function injectMeta(html, route) {
  let result = html;

  // Substitui <title>
  result = result.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Substitui ou insere <meta name="description">
  if (/<meta[^>]+name=["']description["'][^>]*>/.test(result)) {
    result = result.replace(
      /<meta[^>]+name=["']description["'][^>]*>/,
      `<meta name="description" content="${route.description}">`
    );
  } else {
    result = result.replace('</head>', `  <meta name="description" content="${route.description}">\n</head>`);
  }

  // Substitui canonical se existir
  if (/<link[^>]+rel=["']canonical["'][^>]*>/.test(result)) {
    result = result.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/,
      `<link rel="canonical" href="${BASE_URL}${route.path}">`
    );
  }

  // Substitui og:title
  result = result.replace(
    /<meta[^>]+property=["']og:title["'][^>]*>/,
    `<meta property="og:title" content="${route.title}">`
  );

  // Substitui og:description
  result = result.replace(
    /<meta[^>]+property=["']og:description["'][^>]*>/,
    `<meta property="og:description" content="${route.description}">`
  );

  // Substitui og:url
  result = result.replace(
    /<meta[^>]+property=["']og:url["'][^>]*>/,
    `<meta property="og:url" content="${BASE_URL}${route.path}">`
  );

  return result;
}

let count = 0;
for (const route of ROUTES) {
  const dir = path.join(distDir, route.path);
  fs.mkdirSync(dir, { recursive: true });
  const html = injectMeta(indexHtml, route);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✅ ${route.path}/index.html  ← "${route.title}"`);
  count++;
}

console.log(`\n🚀 p0-seo-1: ${count} rotas estáticas geradas com sucesso.\n`);
