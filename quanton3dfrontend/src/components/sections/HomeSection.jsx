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
style={{
padding: '56px 24px',
background: 'linear-gradient(135deg, #06111f 0%, #0d1e35 60%, #081525 100%)',
textAlign: 'center',
position: 'relative',
overflow: 'hidden',
}}
>
{/* blobs decorativos */}
<div aria-hidden="true" style={{ position: 'absolute', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%)', top: '-60px', left: '-60px', borderRadius: '50%', pointerEvents: 'none' }} />
<div aria-hidden="true" style={{ position: 'absolute', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(30,143,255,0.10) 0%, transparent 70%)', bottom: '-40px', right: '-40px', borderRadius: '50%', pointerEvents: 'none' }} />

{/* eyebrow */}
<span style={{ display: 'inline-block', background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '20px' }}>
Parceria Oficial
</span>

{/* logos das marcas */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
{['Tanuki Figures', 'Quanton3D', 'Sagga Studios'].map((brand, i, arr) => (
<span key={brand} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
<span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '10px 20px', color: '#fff', fontWeight: 700, fontSize: '14px', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
{brand}
</span>
{i < arr.length - 1 && (
<span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '20px', fontWeight: 300 }}>×</span>
)}
</span>
))}
</div>

{/* headline */}
<h2 style={{ color: '#fff', fontSize: 'clamp(20px, 3.5vw, 30px)', fontWeight: 800, marginBottom: '10px', lineHeight: 1.25 }}>
Imprima o Popeye.{' '}
<span style={{ color: '#f97316' }}>Ganhe recompensas.</span>
</h2>
<p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '0 auto 32px', maxWidth: '440px', lineHeight: 1.6 }}>
Parceria exclusiva com benefícios reais para quem imprime com resina Quanton3D.
</p>

{/* cards de oferta */}
<div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', margin: '0 auto 28px', maxWidth: '580px' }}>
<div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '14px', padding: '20px 22px', flex: '1 1 200px', maxWidth: '260px', textAlign: 'left' }}>
<div style={{ fontSize: '24px', marginBottom: '10px' }}>🎁</div>
<div style={{ color: '#f97316', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>STL grátis</div>
<div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Popeye STL</div>
<div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: 1.5 }}>Arquivo de impressão incluso na compra</div>
</div>
<div style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: '14px', padding: '20px 22px', flex: '1 1 200px', maxWidth: '260px', textAlign: 'left' }}>
<div style={{ fontSize: '24px', marginBottom: '10px' }}>💰</div>
<div style={{ color: '#f97316', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>5% OFF</div>
<div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Resina Pyro Blast</div>
<div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', lineHeight: 1.5 }}>Desconto aplicado no checkout</div>
</div>
</div>

{/* cupom */}
<div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(249,115,22,0.45)', borderRadius: '10px', padding: '10px 22px', marginBottom: '28px' }}>
<span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>Use o cupom:</span>
<span style={{ color: '#f97316', fontWeight: 800, fontSize: '18px', letterSpacing: '0.12em', fontFamily: 'monospace' }}>TANUKI</span>
</div>

{/* CTA */}
<div>
<a
href="https://quanton3d.com.br/produtos/resina-quanton-pyroblast/"
target="_blank"
rel="noopener noreferrer"
style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e8fff', color: '#fff', padding: '14px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', lineHeight: 1 }}
>
Comprar Pyro Blast →
</a>
</div>
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
