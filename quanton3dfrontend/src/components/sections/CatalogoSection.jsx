import { useState } from "react";
import { FlaskConical, FileText, ShoppingCart, X } from "lucide-react";

const FISPQS = [
  { nome: "POSEIDON", arquivo: "POSEIDON.pdf" },
  { nome: "IRON 70/30", arquivo: "IRON7030.pdf" },
  { nome: "IRON", arquivo: "IRON.pdf" },
  { nome: "SPIN", arquivo: "SPIN.pdf" },
  { nome: "SPARK", arquivo: "SPARK.pdf" },
  { nome: "PYROBLAST", arquivo: "PYRO.pdf" },
  { nome: "LOW SMELL", arquivo: "LOWSMELL.pdf" },
];

// Cores e volumes conferidos diretamente nas variações de cada produto em quanton3d.com.br
const RESINAS = [
  { img: "/images/resinas/pyroblast.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-pyroblast/", nome: "PYROBLAST", cat: "Uso Geral", desc: "Básica e econômica, indicada para iniciantes e avançados. Alta precisão, dureza Shore D 73, impressão rápida com fluidez. Ideal para peças decorativas, artísticas e protótipos funcionais.", specs: "Odor médio | Viscosidade baixa | Densidade 1,296 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin"] },
  { img: "/images/resinas/iron.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-iron/", nome: "IRON", cat: "Engenharia", desc: "A primeira resina do Brasil com altíssima resistência mecânica e baixo custo. Alongamento de 50%, excelente memória elástica e resistência a impactos reais em peças técnicas acima de 2mm.", specs: "Odor baixo | Shore D 55 | Densidade 1,09 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin", "Black", "Clear"] },
  { img: "/images/resinas/poseidon.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-poseidon/", nome: "POSEIDON", cat: "Uso Geral", desc: "Rígida com leve flexibilidade, dispensa o uso de álcool — lavável em água. Detalhamento impecável, baixo odor e ampla compatibilidade. Ideal para protótipos, miniaturas e peças funcionais.", specs: "Odor baixo | Shore D 64 | Densidade 1,10 g/cm³", volumes: ["1kg", "5kg"], cores: ["Clear", "Light Grey", "Skin"] },
  { img: "/images/resinas/flexform.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-flexform/", nome: "FLEXFORM", cat: "Engenharia", desc: "Desenvolvida para protótipos e peças que exigem alta flexibilidade e resistência. Adapta-se a diversas formas sem comprometer a integridade estrutural. Excelente precisão dimensional.", specs: "Ultra flexibilidade | Peças industriais", volumes: ["500g", "1kg"], cores: ["Black", "Clear"] },
  { img: "/images/resinas/spin.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-spin/", nome: "SPIN", cat: "Action Figures", desc: "Maior rigidez e velocidade de impressão para peças de grande formato com alto nível de detalhes. Rigidez com leve flexibilidade — ideal para protótipos funcionais e encaixes que exigem firmeza.", specs: "Odor médio | Shore D 73 | Densidade 1,39 g/cm³", volumes: ["500g", "1kg", "5kg"], cores: ["Black", "Light Grey", "Skin", "White", "Blue", "Dark Grey"] },
  { img: "/images/resinas/athom-dental.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-dental/", nome: "ATHOM DENTAL", cat: "Odontologia", desc: "Alta precisão para modelos de estudo, troquéis e protótipos dentários. Desenvolvida para fluxo digital odontológico com qualidade excepcional. Dica: para modelos com encaixe, prefira a Spin.", specs: "Alta precisão | Uso externo", volumes: ["500g", "1kg", "5kg"], cores: ["White Cream", "Ocre", "Light Grey", "Terracota", "Dark Grey", "Blue", "Skin", "White", "Marfim"] },
  { img: "/images/resinas/athom-alinhadores.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-alinhadores/", nome: "ATHOM ALINHADORES", cat: "Odontologia", desc: "Projetada para modelos que exigem resistência à temperatura em termoformação. Baixíssima variação dimensional para alinhadores, contenções, placas de bruxismo e protetores bucais.", specs: "Resistência térmica | Baixa contração", volumes: ["500g", "1kg"], cores: ["Terracota", "Dark Grey", "White", "Ocre", "Marfim"] },
  { img: "/images/resinas/athom-washable.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-athom-washable1/", nome: "ATHOM WASHABLE", cat: "Odontologia", desc: "Lavável em água, elimina o álcool do processo. Alta rigidez com leve flexibilidade, detalhamento superficial excepcional. Ideal para modelos odontológicos de alta precisão.", specs: "Lavável em água | Baixo odor", volumes: ["1kg"], cores: ["Light Grey", "White Cream", "Skin", "Marfim"] },
  { img: "/images/resinas/spark.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-spark/", nome: "SPARK", cat: "Action Figures", desc: "Acabamento cristalino e visual limpo com alta rigidez. Altamente pigmentada, permite personalização com cores vibrantes. Cura rápida que reduz tempo de produção.", specs: "Translúcida rígida | Cura rápida", volumes: ["500g", "1kg", "5kg"], cores: ["Clear"] },
  { img: "/images/resinas/70-30.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-70-30/", nome: "70/30", cat: "Engenharia", desc: "Fórmula balanceada que combina 70% de rigidez com 30% de flexibilidade. Alta resistência com elevado nível de detalhes, perfeita para peças que exigem equilíbrio mecânico.", specs: "Alta resistência | Detalhamento fino", volumes: ["500g", "1kg", "5kg"], cores: ["Black", "Grey", "Skin", "Clear"] },
  { img: "/images/resinas/lowsmell.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-low-smell/", nome: "LOWSMELL", cat: "Uso Geral", desc: "Resina rígida com odor praticamente imperceptível. Cura rápida e excelente precisão, ideal para ambientes fechados e uso profissional contínuo sem desconforto.", specs: "Baixíssimo odor | Rígida", volumes: ["500g", "1kg", "5kg"], cores: ["Grey", "Skin", "Clear"] },
  { img: "/images/resinas/alchemist.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-alchemist/", nome: "ALCHEMIST", cat: "Action Figures", desc: "Efeitos especiais em cores translúcidas e vibrantes, exclusivas da Quanton3D. Rápida polimerização, durabilidade e acabamento refinado. Perfeita para colecionáveis e itens de decoração.", specs: "Translúcida | Cores vibrantes", volumes: ["500g"], cores: ["Green", "Aqua", "Sunset", "Pink", "Red", "Violet", "Scarlet"] },
  { img: "/images/resinas/vulcan-cast.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-vulcan-cast-jxap7/", nome: "VULCAN CAST", cat: "Fundição", desc: "Desenvolvida para cera perdida e fundição de precisão. Alta taxa de cinzas mínima após queima, permitindo fundição em ouro, prata e outros metais. Ideal para joias e peças de alta fidelidade.", specs: "Fundição de precisão | Queima limpa", volumes: ["500g"], cores: ["White"] },
  { img: "/images/resinas/velvet-skin.webp", url: "https://quanton3d.com.br/produtos/resina-quanton-velvet-skin1kg-11udz/", nome: "VELVET SKIN", cat: "Uso Geral", desc: "Superfície com acabamento aveludado único. Textura especial que dispensa acabamento manual, ideal para produtos finais e protótipos com aparência premium.", specs: "Acabamento aveludado | Peças finais", volumes: ["1kg"], cores: ["Skin"] },
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
  const r = RESINAS[resinaSel];

  return (
    <section className="q-card q-panel">
      <span className="q-eyebrow">Produtos</span>
      <h2 className="q-section-title">Catálogo</h2>
      <p className="q-section-desc">Linha completa de resinas Quanton3D e documentação de segurança.</p>

      <div style={{ marginTop: "8px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", margin: "0 0 12px" }}><FlaskConical size={16} /> Nossas Resinas — 14 Linhas Exclusivas</h3>
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

            <a href={r.url} target="_blank" rel="noreferrer" className="q-btn q-btn--primary" style={{ marginTop: "18px" }}><ShoppingCart size={15} /> Ver na loja</a>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "34px" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1rem", marginBottom: "4px" }}><FileText size={16} /> Fichas de Segurança — FISPQ</h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "14px" }}>Selecione a resina para abrir a Ficha de Informações de Segurança de Produto Químico.</p>
        <div className="q-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {FISPQS.map((item) => (
            <button key={item.nome} type="button" className="q-card q-card--interactive"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 12px" }}
              onClick={() => setFispqAberta(item)}>
              <span className="q-icon-badge"><FileText size={16} /></span>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.82rem" }}>{item.nome}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>FISPQ · PDF</span>
            </button>
          ))}
        </div>
      </div>

      {fispqAberta && (
        <div className="q-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setFispqAberta(null)}>
          <section className="q-modal q-modal--wide" style={{ display: "flex", flexDirection: "column" }}>
            <div className="q-modal-head">
              <h2 style={{ fontSize: "1rem" }}>FISPQ — {fispqAberta.nome}</h2>
              <button type="button" className="q-modal-close" onClick={() => setFispqAberta(null)}><X size={13} /> Fechar</button>
            </div>
            <iframe title={"FISPQ " + fispqAberta.nome} src={"/docs/" + fispqAberta.arquivo} style={{ flex: 1, width: "100%", border: "none", borderRadius: "var(--r-md)", background: "#fff" }} />
          </section>
        </div>
      )}
    </section>
  );
}

export default CatalogoSection;
