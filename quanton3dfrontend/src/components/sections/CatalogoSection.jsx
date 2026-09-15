import { useState } from "react";
import { trackClickBuyResin } from "../../utils/analytics";
import { FlaskConical, FileText, ShoppingCart, X, Scale } from "lucide-react";
import ComparadorResinas from "../modals/ComparadorResinas";

const FISPQS = [
{ nome: "Poseidon", arquivo: "POSEIDON.pdf" },
{ nome: "70/30", arquivo: "IRON7030.pdf" },
{ nome: "Iron", arquivo: "IRON.pdf" },
{ nome: "Spin", arquivo: "SPIN.pdf" },
{ nome: "Spark", arquivo: "SPARK.pdf" },
{ nome: "PyroBlast", arquivo: "PYRO.pdf" },
{ nome: "Low Smell", arquivo: "LOWSMELL.pdf" },
];

// Cores e volumes conferidos diretamente nas variações de cada produto em quanton3d.com.br
const RESINAS = [
{ img: "/images/resinas/pyroblast.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-pyroblast/", nome: "PyroBlast", cat: "Uso Geral", desc: "Alta fluidez e baixa viscosidade para impressão acelerada. Shore D 73 com excelente acabamento — indicada para iniciantes e avançados. Ideal para peças decorativas, artísticas e protótipos funcionais.", specs: "Odor médio | Viscosidade baixa | Densidade 1,296 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin"] },
{ img: "/images/resinas/iron.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-iron/", nome: "Iron", cat: "Engenharia", desc: "A primeira resina do Brasil com altíssima resistência mecânica. Alongamento de 50% e excelente memória elástica — resistente a impactos reais em peças técnicas acima de 2mm para prototipagem funcional e uso industrial.", specs: "Odor baixo | Shore D 55 | Densidade 1,09 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin", "Black", "Clear"] },
{ img: "/images/resinas/poseidon.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-poseidon/", nome: "Poseidon", cat: "Uso Geral", desc: "Lavável em água — dispensa álcool na limpeza. Rígida com leve flexibilidade, baixo odor e detalhamento impecável. Compatível com impressoras LCD/DLP 395–405nm. Ideal para protótipos, miniaturas e peças funcionais.", specs: "Odor baixo | Shore D 64 | Densidade 1,10 g/cm³", volumes: ["1kg", "5kg"], cores: ["Clear", "Light Grey", "Skin"] },
{ img: "/images/resinas/flexform.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-flexform/", nome: "Flexform", cat: "Engenharia", desc: "A mais flexível da linha — para componentes industriais e protótipos que exigem elasticidade extrema sem perder precisão dimensional. Adapta-se a diversas formas sem comprometer a integridade estrutural.", specs: "Ultra flexibilidade | Peças industriais", volumes: ["500g", "1kg"], cores: ["Black", "Clear"] },
{ img: "/images/resinas/spin.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-spin/", nome: "Spin", cat: "Action Figures", desc: "Máxima rigidez para peças de grande formato com alto nível de detalhes. Shore D 73 com leve flexibilidade — preferida para action figures, encaixes firmes e protótipos de tamanho real sem deformação.", specs: "Odor médio | Shore D 73 | Densidade 1,39 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Black", "Light Grey", "Skin", "White", "Blue", "Dark Grey"] },
{ img: "/images/resinas/athom-dental.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-dental/", nome: "Athom Dental", cat: "Odontologia", desc: "Alta precisão para modelos de estudo, troquéis e guias cirúrgicos. Reprodução fiel de margens para fluxo digital odontológico. Dica técnica: para modelos com encaixe dimensional, prefira a Spin.", specs: "Alta precisão | Uso externo", volumes: ["500g", "1kg", "5kg"], cores: ["White Cream", "Ocre", "Light Grey", "Terracota", "Dark Grey", "Blue", "Skin", "White", "Marfim"] },
{ img: "/images/resinas/athom-alinhadores.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-alinhadores/", nome: "Athom Alinhadores", cat: "Odontologia", desc: "Estabilidade dimensional máxima com resistência à temperatura para termoformação a vácuo. Projetada para alinhadores, contenções, placas de bruxismo e protetores bucais — sem deformação no plastificador.", specs: "Resistência térmica | Baixa contração", volumes: ["500g", "1kg"], cores: ["Terracota", "Dark Grey", "White", "Ocre", "Marfim"] },
{ img: "/images/resinas/athom-washable.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-washable1/", nome: "Athom Washable", cat: "Odontologia", desc: "A única washable do fluxo odontológico — elimina o álcool, reduz custos e simplifica a limpeza. Alta rigidez com leve flexibilidade e detalhamento superficial excepcional para modelos de alta precisão.", specs: "Lavável em água | Baixo odor", volumes: ["1kg"], cores: ["Light Grey", "White Cream", "Skin", "Marfim"] },
{ img: "/images/resinas/spark.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-spark/", nome: "Spark", cat: "Action Figures", desc: "Cristalina e altamente pigmentável — ideal para personalizar cores vibrantes com acabamento transparente. Cura rápida e alta rigidez para action figures, joias e peças decorativas de visual limpo.", specs: "Translúcida rígida | Cura rápida", volumes: ["500g", "1kg", "5kg"], cores: ["Clear"] },
{ img: "/images/resinas/70-30.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-70-30/", nome: "70/30", cat: "Engenharia", desc: "Equilíbrio certificado: Shore D 67 e resistência à tração de 15,7 MPa. Combina 70% de rigidez com 30% de flexibilidade para action figures e protótipos que exigem durabilidade com detalhamento fino.", specs: "Alta resistência | Detalhamento fino", volumes: ["500g", "1kg", "5kg"], cores: ["Black", "Grey", "Skin", "Clear"] },
{ img: "/images/resinas/lowsmell.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-low-smell/", nome: "Lowsmell", cat: "Uso Geral", desc: "Odor praticamente imperceptível — desenvolvida para quem trabalha em espaços com ventilação limitada. Resina rígida com cura rápida e excelente precisão. Mesmo com odor reduzido, mantenha ventilação adequada.", specs: "Baixíssimo odor | Rígida", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin", "Clear"] },
{ img: "/images/resinas/alchemist.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-alchemist/", nome: "Alchemist", cat: "Action Figures", desc: "Cores translúcidas exclusivas da Quanton3D — verde, aqua, sunset, pink, red, violet e scarlet. Rápida polimerização, alta durabilidade e acabamento refinado. Perfeita para colecionáveis e itens decorativos únicos.", specs: "Translúcida | Cores vibrantes", volumes: ["500g"], cores: ["Green", "Aqua", "Sunset", "Pink", "Red", "Violet", "Scarlet"] },
{ img: "/images/resinas/vulcan-cast.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-vulcan-cast-jxap7/", nome: "Vulcan Cast", cat: "Fundição", desc: "Desenvolvida para fundição por cera perdida em joalheria e ourivesaria. Taxa de cinzas mínima após queima para reprodução fiel em ouro, prata e outros metais. Ideal para joias e peças de máxima fidelidade.", specs: "Fundição de precisão | Queima limpa", volumes: ["500g"], cores: ["White"] },
{ img: "/images/resinas/velvet-skin.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-velvet-skin1kg-11udz/", nome: "Velvet Skin", cat: "Uso Geral", desc: "Acabamento aveludado incorporado na própria resina — dispensa lixamento e pintura. Textura soft-touch única para produtos finais, protótipos e carcaças com aparência premium imediata.", specs: "Acabamento aveludado | Peças finais", volumes: ["1kg"], cores: ["Skin"] },
];
// Aproximação visual de cada cor de resina para os quadradinhos da legenda.
const COR_HEX = {
grey: "#9a9fa8",
"light grey": "#c7ccd3",
"dark grey": "#4a4f58",
skin: "#e8c39e",
black: "#1c1d20",
white: "#f4f4f4",
"white cream": "#f0e6d2",
clear: "transparent",
blue: "#2f6fdb",
ocre: "#cc8a3d",
terracota: "#c1603f",
marfim: "#f2ead6",
green: "#3fae5c",
aqua: "#35c9c9",
sunset: "#ff8a5c",
pink: "#ff6fa5",
red: "#d43b3b",
violet: "#8a5cf6",
scarlet: "#e0334f",
};

function CorSwatch({ nome }) {
const hex = COR_HEX[nome.toLowerCase()] || "#8a8f98";
const transparente = hex === "transparent";
return (
<span title={nome} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.86rem", color: "var(--text-secondary)" }}>
<span aria-hidden="true" style={{
width: "17px", height: "17px", borderRadius: "5px", flexShrink: 0,
background: transparente ? "repeating-conic-gradient(#2a2f3a 0% 25%, #171a21 0% 50%) 0 0/8px 8px" : hex,
border: transparente || hex === "#f4f4f4" || hex === "#f0e6d2" || hex === "#f2ead6" ? "1px solid var(--border-strong)" : "1px solid rgba(0,0,0,0.25)",
}} />
{nome}
</span>
);
}

function CatalogoSection() {
const [fispqAberta, setFispqAberta] = useState(null);
const [resinaSel, setResinaSel] = useState(0);
const [mostrarComparador, setMostrarComparador] = useState(false);
const r = RESINAS[resinaSel];

return (
<section className="q-card q-panel">
<span className="q-eyebrow">Produtos</span>
<h2 className="q-section-title">Catálogo</h2>
<p className="q-section-desc">Linha completa de resinas Quanton3D e documentação de segurança.</p>

<div style={{ marginTop: "8px" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
<h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", margin: 0 }}><FlaskConical size={16} /> Nossas Resinas — 14 Linhas Exclusivas</h3>
<button
type="button"
className="q-btn q-btn--ghost q-btn--sm"
onClick={() => setMostrarComparador(true)}
style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}
>
<Scale size={14} /> Comparar Resinas
</button>
</div>
<div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
{RESINAS.map((res, i) => (
<button key={res.nome} type="button" onClick={() => setResinaSel(i)}
className="q-badge"
style={{ cursor: "pointer", border: "1px solid", borderColor: i === resinaSel ? "var(--primary)" : "var(--border-soft)", background: i === resinaSel ? "rgba(47,123,255,0.14)" : "rgba(255,255,255,0.03)", color: i === resinaSel ? "var(--primary)" : "var(--text-muted)" }}>
{res.nome}
</button>
))}
</div>

<div className="q-card" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "26px", padding: "26px" }}>
<div style={{ borderRadius: "var(--r-md)", overflow: "hidden", background: "rgba(0,0,0,0.25)", minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
<img src={r.img} alt={r.nome} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</div>
<div style={{ maxWidth: "620px" }}>
<span className="q-badge q-badge--accent" style={{ fontSize: "0.78rem" }}>{r.cat}</span>
<h4 style={{ fontSize: "1.35rem", margin: "10px 0" }}>{r.nome}</h4>
<p style={{ fontSize: "1rem", lineHeight: 1.55 }}>{r.desc}</p>
<p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "10px" }}>{r.specs}</p>

<div style={{ marginTop: "18px" }}>
<span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Volumes disponíveis</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
{r.volumes.map((v) => <span key={v} className="q-badge" style={{ fontSize: "0.82rem" }}>{v}</span>)}
</div>
</div>

<div style={{ marginTop: "16px" }}>
<span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Cores disponíveis</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px 18px" }}>
{r.cores.map((c) => <CorSwatch key={c} nome={c} />)}
</div>
</div>

{r.cat === "Odontologia" && (
<p style={{ fontSize: "0.78rem", color: "#92400e", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(217,119,6,0.35)", borderRadius: "6px", padding: "7px 10px", marginBottom: "10px" }}>
⚠️ Uso externo — não biocompatível para contato intra-oral
</p>
)}
<a href={r.url} target="_blank" rel="noreferrer" className="q-btn q-btn--primary" style={{ marginTop: "18px" }} onClick={() => trackClickBuyResin({ resin_name: r.nome, resin_id: r.nome.toLowerCase().replace(/\s+/g, '-') })}><ShoppingCart size={15} /> Ver na loja</a>
</div>
</div>
</div>

<div style={{ marginTop: "34px" }}>
<h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", marginBottom: "4px" }}><FileText size={16} /> Fichas de Dados de Segurança — FDS</h3>
<p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "14px" }}>Selecione a resina para abrir a Ficha de Dados de Segurança (FDS).</p>
<div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
{FISPQS.map((item) => (
<button key={item.nome} type="button" className="q-card q-card--interactive"
style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 12px" }}
onClick={() => setFispqAberta(item)}>
<span className="q-icon-badge"><FileText size={16} /></span>
<strong style={{ color: "var(--text-primary)", fontSize: "0.82rem" }}>{item.nome}</strong>
<span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>FDS · PDF</span>
</button>
))}
</div>
</div>

{fispqAberta && (
<div className="q-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setFispqAberta(null)}>
<section className="q-modal q-modal--wide" style={{ display: "flex", flexDirection: "column" }}>
<div className="q-modal-head">
<h2 style={{ fontSize: "1rem" }}>FDS — {fispqAberta.nome}</h2>
<button type="button" className="q-modal-close" onClick={() => setFispqAberta(null)}><X size={13} /> Fechar</button>
</div>
<iframe title={"FDS " + fispqAberta.nome} src={"/docs/" + fispqAberta.arquivo} style={{ flex: 1, width: "100%", border: "none", borderRadius: "var(--r-md)", background: "#fff" }} />
</section>
</div>
)}

{mostrarComparador && (
<ComparadorResinas onClose={() => setMostrarComparador(false)} />
)}
</section>
);
}

export default CatalogoSection;
