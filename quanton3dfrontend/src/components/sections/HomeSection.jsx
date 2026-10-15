import { useState } from "react";
import CarrosselComunidade from "./CarrosselComunidade";
import {
ArrowRight,
BookOpen,
Calculator,
CheckCircle2,
Settings2,
Wrench,
} from "lucide-react";

const CAMINHOS = [
{
id: "configurar",
icon: Settings2,
label: "Vou começar uma impressão",
title: "Encontre uma base confiável para configurar sua máquina.",
desc: "Cruze a resina Quanton3D com o modelo da sua impressora e consulte os parâmetros iniciais recomendados.",
action: "Consultar parâmetros",
page: "parametros",
imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-configurar.png",
},
{
id: "corrigir",
icon: Wrench,
label: "Minha peça apresentou falha",
title: "Transforme o sintoma em um próximo passo claro.",
desc: "Faça o diagnóstico rápido (uma ou duas perguntas) ou abra um chamado com as informações que ajudam nossa equipe a entender o caso.",
action: "Resolver uma falha",
page: "atendimento",
imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-corrigir.png",
},
{
id: "calcular",
icon: Calculator,
label: "Preciso calcular ou ajustar",
title: "Tome decisões com números, não com tentativa e erro.",
desc: "Calcule custo, exposição, tolerância, tempo e compensações para trabalhar com mais previsibilidade.",
action: "Abrir calculadoras",
page: "calculadoras",
imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-calcular.png",
},
{
id: "aprender",
icon: BookOpen,
label: "Quero dominar o processo",
title: "Aprenda cada etapa no seu ritmo.",
desc: "Acesse guias objetivos sobre nivelamento, fatiamento, calibração, suportes, manutenção e otimização.",
action: "Explorar os guias",
page: "guias",
imagem: "/images/sessao_o_que_voce_quer_resolver_agora/caminho-aprender.png",
},
];

function HomeSection({ onNavegar }) {
const [caminhoAtivo, setCaminhoAtivo] = useState(CAMINHOS[0]);
const CaminhoIcon = caminhoAtivo.icon;

return (
<div className="home-experience">
<div className="home-fluid-bg" aria-hidden="true">
<span className="home-fluid-blob home-fluid-blob--safira" />
<span className="home-fluid-blob home-fluid-blob--celeste" />
<span className="home-fluid-blob home-fluid-blob--ametista" />
<span className="home-fluid-blob home-fluid-blob--marine" />
<span className="home-fluid-noise" />
</div>

<section className="home-hero" aria-labelledby="home-title">
<div className="home-hero-copy">
<span className="home-kicker">Central de suporte e conhecimento</span>
<h1 id="home-title">Mais controle.<br /><span>Menos tentativa e erro.</span></h1>
<p className="home-hero-lead">
A Quanton3D oferece um repositório completo para que você possa obter os melhores resultados em suas impressões. Acesse a opção abaixo que melhor se adeque às suas necessidades.
</p>

<div className="home-trust-row" aria-label="Recursos disponíveis">
<span><CheckCircle2 size={15} /> Parâmetros de partida</span>
<span><CheckCircle2 size={15} /> Ferramentas práticas</span>
<span><CheckCircle2 size={15} /> Suporte especializado</span>
</div>
</div>

<div className="home-hero-visual">
<video
className="home-hero-video"
src="/images/videos/video_banner_home_v2.mp4"
autoPlay
muted
loop
playsInline
preload="auto"
onCanPlay={(event) => { event.currentTarget.play().catch(() => {}); }}
aria-hidden="true"
/>
</div>
</section>

<section className="home-pathfinder-section" aria-labelledby="pathfinder-title">
<div className="home-section-heading home-pathfinder-intro">
<span className="q-eyebrow">Comece pela sua necessidade</span>
<h2 id="pathfinder-title">O que você quer resolver agora?</h2>
<p>Escolha um caminho e encontre o recurso mais útil para o momento da sua impressão.</p>
</div>

<div className="home-pathfinder q-card">
<div className="home-pathfinder-options" role="tablist" aria-label="Escolha sua necessidade">
{CAMINHOS.map((caminho) => {
const Icon = caminho.icon;
const ativo = caminhoAtivo.id === caminho.id;
return (
<button
key={caminho.id}
type="button"
role="tab"
aria-selected={ativo}
className={`home-path-option${ativo ? " is-active" : ""}`}
onClick={() => setCaminhoAtivo(caminho)}
>
<Icon size={17} />
<span>{caminho.label}</span>
</button>
);
})}
</div>

<div className={`home-pathfinder-visual is-${caminhoAtivo.id}`} aria-live="polite">
<img className="home-pathfinder-visual-img" src={caminhoAtivo.imagem} alt={caminhoAtivo.label} />
<div className="home-pathfinder-visual-frame">
<span className="home-pathfinder-visual-icon"><CaminhoIcon size={30} /></span>
<strong>{caminhoAtivo.label}</strong>
</div>
</div>

<div className="home-pathfinder-result" role="tabpanel" aria-live="polite">
<span className="home-path-number">0{CAMINHOS.findIndex((item) => item.id === caminhoAtivo.id) + 1}</span>
<h3>{caminhoAtivo.title}</h3>
<p>{caminhoAtivo.desc}</p>
<button type="button" className="q-btn q-btn--primary home-pathfinder-action" onClick={() => onNavegar(caminhoAtivo.page)}>
{caminhoAtivo.action} <ArrowRight size={16} />
</button>
</div>
</div>
</section>

<CarrosselComunidade onNavegar={onNavegar} />

{/* ── PARCERIA: Tanuki Figures × Quanton3D × Sagga Studios ── */}
<section
aria-label="Parceria Tanuki Figures, Quanton3D e Sagga Studios"
style={{ position: 'relative', overflow: 'hidden', background: '#04111f' }}
>
{/* Linha topo */}
<div style={{ height: '3px', background: 'linear-gradient(90deg, #f97316 0%, #fb923c 25%, #1e8fff 75%, #60a5fa 100%)' }} />

{/* Bloco principal: imagem esquerda + conteúdo direita */}
<div style={{
display: 'flex',
alignItems: 'stretch',
flexWrap: 'wrap',
minHeight: '420px',
}}>

{/* Lado esquerdo: foto Popeye */}
<div style={{
flex: '0 0 430px',
maxWidth: '100%',
position: 'relative',
overflow: 'hidden',
minHeight: '280px',
}}>
<img
src="/images/parceria/popeye-comparacao.jpg"
alt="Popeye impresso com resina Quanton3D: figura pintada por Tanuki Figures (esq.) e impressão em resina crua Quanton3D (dir.)"
style={{
width: '100%',
height: '100%',
objectFit: 'cover',
objectPosition: 'center top',
display: 'block',
}}
/>
{/* Fade direita — funde com fundo */}
<div aria-hidden="true" style={{
position: 'absolute', inset: 0,
background: 'linear-gradient(90deg, transparent 45%, #04111f 100%)',
pointerEvents: 'none',
}} />
{/* Fade baixo */}
<div aria-hidden="true" style={{
position: 'absolute', inset: 0,
background: 'linear-gradient(180deg, transparent 60%, #04111f 100%)',
pointerEvents: 'none',
}} />
{/* Badge no canto */}
<div style={{
position: 'absolute', top: '16px', left: '16px',
background: 'rgba(4,17,31,0.82)', backdropFilter: 'blur(6px)',
border: '1px solid rgba(249,115,22,0.35)',
borderRadius: '8px', padding: '6px 12px',
display: 'flex', alignItems: 'center', gap: '6px',
}}>
<span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
<span style={{ color: '#f97316', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
Parceria Oficial
</span>
</div>
</div>

{/* Lado direito: conteúdo */}
<div style={{
flex: '1 1 300px',
display: 'flex',
flexDirection: 'column',
justifyContent: 'center',
padding: '52px 48px 52px 28px',
position: 'relative',
zIndex: 2,
}}>

{/* Marcas */}
<div style={{
display: 'flex', alignItems: 'center', gap: '7px',
marginBottom: '24px', flexWrap: 'wrap',
}}>
{['Tanuki Figures', 'Quanton3D', 'Sagga Studios'].map((brand, i, arr) => (
<span key={brand} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
<span style={{
background: i === 1 ? 'rgba(249,115,22,0.13)' : 'rgba(255,255,255,0.05)',
border: `1px solid ${i === 1 ? 'rgba(249,115,22,0.38)' : 'rgba(255,255,255,0.1)'}`,
borderRadius: '8px', padding: '6px 14px',
color: i === 1 ? '#f97316' : 'rgba(255,255,255,0.7)',
fontWeight: 700, fontSize: '12px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
}}>
{brand}
</span>
{i < arr.length - 1 && (
<span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '16px' }}>×</span>
)}
</span>
))}
</div>

{/* Headline */}
<h2 style={{
color: '#fff',
fontSize: 'clamp(24px, 3vw, 36px)',
fontWeight: 900, lineHeight: 1.12,
marginBottom: '10px', letterSpacing: '-0.025em',
}}>
Imprima o Popeye.<br />
<span style={{ color: '#f97316' }}>Ganhe recompensas.</span>
</h2>
<p style={{
color: 'rgba(255,255,255,0.48)', fontSize: '14px',
maxWidth: '370px', lineHeight: 1.7, marginBottom: '28px',
}}>
Parceria exclusiva com benefícios reais para quem imprime com resina Quanton3D Pyro Blast.
</p>

{/* Offer cards */}
<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
<div style={{
flex: '1 1 150px', maxWidth: '200px',
background: 'rgba(255,255,255,0.04)',
border: '1px solid rgba(255,255,255,0.08)',
borderTop: '2px solid rgba(96,165,250,0.65)',
borderRadius: '12px', padding: '16px 18px',
}}>
<div style={{ fontSize: '20px', marginBottom: '8px' }}>🎁</div>
<div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>STL Grátis</div>
<div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>Popeye STL</div>
<div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', lineHeight: 1.5 }}>Arquivo incluso na compra</div>
</div>
<div style={{
flex: '1 1 150px', maxWidth: '200px',
background: 'rgba(249,115,22,0.07)',
border: '1px solid rgba(249,115,22,0.2)',
borderTop: '2px solid rgba(249,115,22,0.75)',
borderRadius: '12px', padding: '16px 18px',
}}>
<div style={{ fontSize: '20px', marginBottom: '8px' }}>💰</div>
<div style={{ color: '#f97316', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>5% OFF</div>
<div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>Resina Pyro Blast</div>
<div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', lineHeight: 1.5 }}>Desconto no checkout</div>
</div>
</div>

{/* Cupom */}
<div style={{
display: 'inline-flex', alignItems: 'center', gap: '10px',
background: 'rgba(0,0,0,0.3)',
border: '1.5px dashed rgba(249,115,22,0.5)',
borderRadius: '10px', padding: '10px 22px', marginBottom: '24px',
width: 'fit-content',
}}>
<span style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px' }}>Cupom:</span>
<span style={{
color: '#f97316', fontWeight: 900, fontSize: '21px',
letterSpacing: '0.14em', fontFamily: 'monospace',
textShadow: '0 0 18px rgba(249,115,22,0.5)',
}}>TANUKI</span>
<span style={{
background: 'rgba(249,115,22,0.15)',
border: '1px solid rgba(249,115,22,0.3)',
color: '#f97316', borderRadius: '6px',
padding: '2px 8px', fontSize: '11px', fontWeight: 700,
}}>5% OFF</span>
</div>

{/* CTA */}
<div>
<a
href="https://quanton3d.com.br/produtos/resina-quanton-pyroblast/"
target="_blank"
rel="noopener noreferrer"
style={{
display: 'inline-flex', alignItems: 'center', gap: '8px',
background: 'linear-gradient(135deg, #1e8fff 0%, #2563eb 100%)',
boxShadow: '0 4px 22px rgba(30,143,255,0.32)',
color: '#fff', padding: '13px 26px', borderRadius: '10px',
fontWeight: 700, fontSize: '15px', textDecoration: 'none',
}}
>
Comprar Pyro Blast →
</a>
</div>

</div>
</div>

{/* Banner inferior: foto das garrafas */}
<div style={{ position: 'relative', overflow: 'hidden', maxHeight: '200px' }}>
<img
src="/images/parceria/tanuki-banner.jpg"
alt="Tanuki Figures × Quanton3D - Buy PyroBlast and Earn Tanuki Rewards - 5% OFF com cupom TANUKI"
style={{ width: '100%', display: 'block', objectFit: 'cover', objectPosition: 'center 30%', maxHeight: '200px' }}
/>
<div aria-hidden="true" style={{
position: 'absolute', inset: 0,
background: 'linear-gradient(180deg, #04111f 0%, transparent 22%, transparent 75%, #04111f 100%)',
pointerEvents: 'none',
}} />
</div>

{/* Linha base */}
<div style={{ height: '3px', background: 'linear-gradient(90deg, #1e8fff 0%, #60a5fa 20%, #f97316 80%, #fb923c 100%)' }} />
</section>
{/* ── fim da seção parceria ── */}

<section className="home-product-banner" aria-labelledby="product-banner-title">
<img src="/images/linha-resinas-quanton3d.png" alt="Linha de resinas Quanton3D" />
<div className="home-product-banner-overlay">
<span className="q-eyebrow">Do material ao resultado</span>
<h2 id="product-banner-title">A resina certa muda o que é possível imprimir.</h2>
<p>Nem toda resina foi feita para o mesmo desafio. Antes de ajustar a impressora, entenda o que você espera da peça — cada formulação Quanton3D foi pensada para um resultado diferente.</p>
<div className="home-product-attributes" aria-label="Características das resinas">
<span>Detalhe</span>
<span>Resistência</span>
<span>Flexibilidade</span>
<span>Acabamento</span>
</div>
<button type="button" className="q-btn q-btn--primary" onClick={() => onNavegar("catalogo")}>
Conhecer as resinas <ArrowRight size={16} />
</button>
</div>
</section>
</div>
);
}

export default HomeSection;
