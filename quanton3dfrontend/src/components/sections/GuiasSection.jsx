import { Phone, Ruler, Wrench, Maximize2, Layers } from "lucide-react";
import { GUIDES, REFERENCIA_PARAMETROS } from "../../data/guides";
import { WHATSAPP_SUPORTE_URL } from "../../data/contact";

function GuideCard({ g, abrirGuia }) {
  const Icon = g.icon;
  return (
    <button type="button" className="q-card q-card--interactive calculator-launcher" style={{ padding: "18px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }} onClick={() => abrirGuia(g)}>
      <span className="q-icon-badge"><Icon size={17} /></span>
      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{g.title}</strong>
      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{g.desc}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
        {(g.tags || []).map((t) => <span key={t} className="q-badge" style={{ fontSize: "0.64rem" }}>{t}</span>)}
      </div>
    </button>
  );
}

const CALCULADORAS_CALIBRACAO = [
  { file: "/guias/01-guia-tolerancia-xy-quanton3d.html", icon: Ruler, titulo: "Calculadora de Tolerância X/Y", title: "Tolerância X/Y — Compensação Dimensional", desc: "Compensação para encaixes perfeitos: parede maior ou furo menor que o arquivo.", tags: ["Encaixe", "Calibração"] },
  { file: "/guias/03-guia-compensacao-tempo-quanton3d.html", icon: Wrench, titulo: "Compensação de Tempo — Chitubox/Lychee", title: "Compensação de Tempo do Fatiador", desc: "Calibre a estimativa de tempo do fatiador com o tempo real da impressora.", tags: ["Chitubox", "Lychee"] },
  { file: "/guias/04-guia-compensacao-encolhimento-quanton3d.html", icon: Maximize2, titulo: "Compensação de Encolhimento", title: "Compensação de Encolhimento (Scale)", desc: "Fator de escala (%) para corrigir a contração da resina após a pós-cura.", tags: ["Escala", "Fatiador"] },
  { file: "/guias/05-guia-tolerancia-inferior-pe-elefante-quanton3d.html", icon: Layers, titulo: "Tolerância Inferior — Pé de Elefante", title: "Pé de Elefante — Tolerância Inferior", desc: "Compensa a expansão das camadas de base causada pela sobre-exposição.", tags: ["Base", "Pé de Elefante"] },
];

const TODOS_OS_GUIAS = [...Object.values(GUIDES), REFERENCIA_PARAMETROS];

function GuiasSection({ abrirGuia }) {
  return (
    <section className="q-card q-panel calculators-section">
      <span className="q-eyebrow">Base de conhecimento</span>
      <h2 className="q-section-title">Guias Técnicos</h2>
      <p className="q-section-desc">Passo a passo para nivelamento, calibração, diagnóstico e manutenção da sua impressora.</p>

      <div className="q-grid">
        {TODOS_OS_GUIAS.map((g) => <GuideCard key={g.title} g={g} abrirGuia={abrirGuia} />)}
      </div>

      <h3 style={{ margin: "28px 0 4px", fontSize: "1rem", color: "var(--text-primary)" }}>Calculadoras de Calibração</h3>
      <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "var(--text-muted)" }}>Ferramentas para corrigir tolerância, encolhimento e tempo — use após ler os guias acima.</p>
      <div className="q-grid">
        {CALCULADORAS_CALIBRACAO.map((c) => (
          <GuideCard key={c.file} g={c} abrirGuia={abrirGuia} />
        ))}
      </div>

      <div style={{ marginTop: "22px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <a className="q-btn q-btn--whatsapp" href={WHATSAPP_SUPORTE_URL} target="_blank" rel="noreferrer"><Phone size={14} /> Suporte técnico via WhatsApp</a>
      </div>
    </section>
  );
}

export default GuiasSection;
