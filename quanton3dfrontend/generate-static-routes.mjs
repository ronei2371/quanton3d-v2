// p0-seo-1: Gera HTML estatico para cada rota publica (roda depois do "vite build").
// Cada dist/<rota>/index.html recebe title, description, canonical e og:url da rota
// e tambem um texto real da pagina dentro do #root. Assim Google, WhatsApp e outros
// leitores enxergam o conteudo sem precisar executar o JavaScript. Quando o React
// carrega, ele substitui esse texto pela pagina normal (o visual nao muda).
// Tambem gera o dist/sitemap.xml com as rotas e os guias.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// Dominio oficial do site (definido pelo fundador).
const BASE_URL = 'https://lab.quanton3d.com.br';

function esc(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------
// Dados lidos dos proprios arquivos do site (ficam sempre iguais a pagina)
// ---------------------------------------------------------------
function lerArquivo(rel) {
  try { return fs.readFileSync(path.join(__dirname, rel), 'utf-8'); } catch { return ''; }
}

function campo(linha, nome) {
  const m = linha.match(new RegExp(nome + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1] : '';
}

const RESINAS = lerArquivo('src/components/sections/CatalogoSection.jsx')
  .split('\n')
  .filter((l) => /^\{\s*img:/.test(l.trim()))
  .map((l) => ({ nome: campo(l, 'nome'), cat: campo(l, 'cat'), desc: campo(l, 'desc') }))
  .filter((r) => r.nome);

const GUIAS = lerArquivo('src/data/guides.js')
  .split('\n')
  .filter((l) => /title:\s*"/.test(l) && /file:\s*"/.test(l))
  .map((l) => ({ titulo: campo(l, 'title'), arquivo: campo(l, 'file'), desc: campo(l, 'desc') }))
  .filter((g) => g.titulo && g.arquivo);

const CALCULADORAS = lerArquivo('src/components/sections/CalculadorasSection.jsx')
  .split('\n')
  .filter((l) => /titulo:\s*"/.test(l) && /id:\s*"/.test(l))
  .map((l) => ({ titulo: campo(l, 'titulo'), desc: campo(l, 'desc') }))
  .filter((c) => c.titulo);

// ---------------------------------------------------------------
// Conteudo de cada rota
// ---------------------------------------------------------------
const MENU = [
  ['/', 'Início'],
  ['/parametros/', 'Parâmetros de impressão'],
  ['/calculadoras/', 'Calculadoras'],
  ['/guias/', 'Guias técnicos'],
  ['/catalogo/', 'Catálogo de resinas'],
  ['/academia/', 'Quanton Academy'],
  ['/atendimento/', 'Atendimento'],
  ['/comunidade/', 'Comunidade'],
  ['/sobre/', 'Sobre a Quanton3D'],
];

const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join('')}</ul>`;

const listaResinas = () => lista(RESINAS.map((r) => `<strong>${esc(r.nome)}</strong>${r.cat ? ` (${esc(r.cat)})` : ''}: ${esc(r.desc)}`));

const ROUTES = [
  {
    path: '/',
    title: 'Quanton3D — Suporte Técnico e Resinas UV para Impressão 3D',
    description: 'Parâmetros de impressão, calculadoras, guias técnicos e suporte especializado para resinas UV Quanton3D em impressoras 3D LCD/DLP. Fabricação nacional em Belo Horizonte, MG.',
    h1: 'Quanton3D — suporte técnico e resinas UV para impressão 3D',
    corpo: () => `
      <p>Central de suporte e conhecimento da Quanton3D, fabricante brasileira de resinas UV para impressoras 3D LCD/DLP, em Belo Horizonte, MG. Consulte parâmetros iniciais por resina e impressora, use as calculadoras, leia os guias técnicos e fale com o suporte.</p>
      <h2>Comece pela sua necessidade</h2>
      ${lista([
        '<a href="/parametros/">Vou começar uma impressão</a>: parâmetros iniciais para a sua resina e impressora.',
        '<a href="/guias/">Minha peça apresentou falha</a>: guias de diagnóstico e correção.',
        '<a href="/calculadoras/">Preciso calcular ou ajustar</a>: exposição, custo, tempo, tolerância e encolhimento.',
        '<a href="/academia/">Quero dominar o processo</a>: conteúdo da Quanton Academy.',
      ])}`,
  },
  {
    path: '/parametros/',
    title: 'Parâmetros de Impressão — Quanton3D',
    description: 'Selecione sua impressora e sua resina Quanton3D e copie o perfil inicial recomendado: altura de camada, exposição normal, exposição da base e camadas de base.',
    h1: 'Parâmetros de impressão das resinas Quanton3D',
    corpo: () => `
      <p>Selecione a impressora e a resina Quanton3D para ver o perfil inicial recomendado: altura de camada, exposição normal, exposição da base e camadas de base. São mais de 100 modelos de impressoras LCD/DLP, entre Elegoo, Anycubic, Creality, Phrozen e outras marcas.</p>
      <p>O perfil é um ponto de partida. Pequenos ajustes podem ser necessários conforme temperatura, filme FEP e manutenção da máquina. Para calibrar, use a <a href="/calculadoras/">calculadora de exposição</a> e o <a href="/guias/guia-calibracao-resina.html">guia de calibração de resina</a>.</p>
      <h2>Resinas com parâmetros</h2>
      ${lista(RESINAS.map((r) => `<strong>${esc(r.nome)}</strong>${r.cat ? ` (${esc(r.cat)})` : ''}`))}`,
  },
  {
    path: '/calculadoras/',
    title: 'Calculadoras de Impressão 3D em Resina — Quanton3D',
    description: 'Calculadoras técnicas para impressão 3D em resina UV: exposição, custo por peça, tempo de impressão, tolerância X/Y e compensação de encolhimento.',
    h1: 'Calculadoras para impressão 3D em resina',
    corpo: () => `
      <p>Ferramentas para ajustar a impressão e calcular custos com resinas UV em impressoras LCD/DLP.</p>
      ${lista(CALCULADORAS.map((c) => `<strong>${esc(c.titulo)}</strong>: ${esc(c.desc)}`))}`,
  },
  {
    path: '/guias/',
    title: 'Guias Técnicos de Impressão 3D em Resina — Quanton3D',
    description: 'Guias técnicos de impressão 3D com resinas UV: nivelamento, calibração, suportes, diagnóstico de falhas, pós-processamento, manutenção e segurança.',
    h1: 'Guias técnicos de impressão 3D em resina',
    corpo: () => `
      <p>Passo a passo para preparar, calibrar, corrigir falhas e manter a sua impressora de resina.</p>
      ${lista(GUIAS.map((g) => `<a href="${esc(g.arquivo)}">${esc(g.titulo)}</a>: ${esc(g.desc)}`))}`,
  },
  {
    path: '/catalogo/',
    title: 'Catálogo de Resinas UV — Quanton3D',
    description: 'Resinas UV Quanton3D para impressão 3D LCD/DLP: uso geral, engenharia, odontologia, miniaturas, joalheria e laváveis em água. Fichas de Dados de Segurança (FDS).',
    h1: 'Catálogo de resinas UV Quanton3D',
    corpo: () => `
      <p>Linhas de resina UV fabricadas no Brasil para impressoras 3D LCD/DLP. As resinas odontológicas ATHOM são para uso externo (laboratório) e não são biocompatíveis.</p>
      ${listaResinas()}
      <p>As Fichas de Dados de Segurança (FDS) estão disponíveis nesta página.</p>`,
  },
  {
    path: '/academia/',
    title: 'Quanton Academy — Quanton3D',
    description: 'Aprenda impressão 3D com resinas UV na Quanton Academy: conteúdo técnico para iniciantes e profissionais de impressoras LCD/DLP.',
    h1: 'Quanton Academy',
    corpo: () => `
      <p>Conteúdo técnico para aprender impressão 3D em resina, do básico ao avançado: preparação, calibração, pós-processamento e segurança.</p>`,
  },
  {
    path: '/atendimento/',
    title: 'Atendimento e Suporte Técnico — Quanton3D',
    description: 'Suporte técnico Quanton3D para resinas UV e impressão 3D LCD/DLP: assistente IAQ3D, WhatsApp (31) 3271-6935 e mensagem para a equipe.',
    h1: 'Atendimento e suporte técnico',
    corpo: () => `
      <p>Tire dúvidas sobre resinas Quanton3D e impressão 3D em resina com o assistente técnico IAQ3D, pelo WhatsApp (31) 3271-6935 ou enviando uma mensagem para a equipe.</p>`,
  },
  {
    path: '/comunidade/',
    title: 'Comunidade — Quanton3D',
    description: 'Comunidade Quanton3D: grupos, redes sociais, galeria de peças e programa de parceria para quem imprime em 3D com resinas UV.',
    h1: 'Comunidade Quanton3D',
    corpo: () => `
      <p>Grupos, redes sociais, galeria de peças impressas e programa de parceria para quem imprime com resinas Quanton3D.</p>`,
  },
  {
    path: '/sobre/',
    title: 'Sobre a Quanton3D — Resinas UV Fabricadas no Brasil',
    description: 'Conheça a Quanton3D: fabricante brasileira de resinas UV para impressão 3D LCD/DLP, fundada em 2020 em Belo Horizonte, MG.',
    h1: 'Sobre a Quanton3D',
    corpo: () => `
      <p>A Quanton3D é uma fabricante brasileira de resinas UV fotopolimerizáveis para impressoras 3D LCD/DLP, fundada em 2020 em Belo Horizonte, MG. Além das resinas, oferece parâmetros de impressão, ferramentas e suporte técnico para quem imprime em resina.</p>`,
  },
];

// ---------------------------------------------------------------
// Montagem do HTML
// ---------------------------------------------------------------
function conteudoEstatico(route) {
  const nav = `<nav aria-label="Páginas do site">${lista(MENU.map(([href, nome]) => `<a href="${href}">${esc(nome)}</a>`))}</nav>`;
  return `<div id="root"><main class="seo-static" style="max-width:880px;margin:0 auto;padding:32px 16px;line-height:1.6;font-family:system-ui,sans-serif">
      <h1>${esc(route.h1)}</h1>
      ${route.corpo()}
      ${nav}
      <p><small>Quanton 3D LTDA · Belo Horizonte, MG · WhatsApp (31) 3271-6935</small></p>
    </main></div>`;
}

function trocarMeta(html, seletor, novaTag) {
  const re = new RegExp(`<meta[^>]+${seletor}[^>]*>`);
  return re.test(html) ? html.replace(re, novaTag) : html.replace('</head>', `  ${novaTag}\n</head>`);
}

function montarPagina(route) {
  const url = `${BASE_URL}${route.path}`;
  let html = indexHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`);
  html = trocarMeta(html, `name=["']description["']`, `<meta name="description" content="${esc(route.description)}" />`);
  html = trocarMeta(html, `property=["']og:title["']`, `<meta property="og:title" content="${esc(route.title)}" />`);
  html = trocarMeta(html, `property=["']og:description["']`, `<meta property="og:description" content="${esc(route.description)}" />`);
  html = trocarMeta(html, `property=["']og:url["']`, `<meta property="og:url" content="${url}" />`);
  if (/<link[^>]+rel=["']canonical["'][^>]*>/.test(html)) {
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/, `<link rel="canonical" href="${url}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${url}" />\n</head>`);
  }
  if (!html.includes('<div id="root"></div>')) throw new Error('div#root vazio nao encontrado no index.html');
  return html.replace('<div id="root"></div>', conteudoEstatico(route));
}

let count = 0;
for (const route of ROUTES) {
  const dir = path.join(distDir, route.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), montarPagina(route), 'utf-8');
  console.log(`  ✅ ${route.path}index.html  ← "${route.title}"`);
  count++;
}

// Sitemap com as rotas e os guias (substitui o public/sitemap.xml copiado pelo Vite).
const hoje = new Date().toISOString().slice(0, 10);
const urls = [
  ...ROUTES.map((r) => ({ loc: `${BASE_URL}${r.path}`, prioridade: r.path === '/' ? '1.0' : '0.8' })),
  ...GUIAS.map((g) => ({ loc: `${BASE_URL}${g.arquivo}`, prioridade: '0.6' })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${hoje}</lastmod>\n    <priority>${u.prioridade}</priority>\n  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8');

console.log(`\n🚀 p0-seo-1: ${count} páginas estáticas (${RESINAS.length} resinas, ${GUIAS.length} guias, ${CALCULADORAS.length} calculadoras) e sitemap com ${urls.length} endereços.\n`);
