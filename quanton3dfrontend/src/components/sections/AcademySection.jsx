import { ACADEMY_CONTENTS } from "../../data/academy";

function AcademyCard({ item, abrirAcademy }) {
  const Icon = item.icon;
  return (
    <button type="button" className="q-card q-card--interactive calculator-launcher" style={{ padding: "18px", textAlign: "left", display: "flex", flexDirection: "column", gap: "8px" }} onClick={() => abrirAcademy(item)}>
      <span className="q-icon-badge"><Icon size={17} /></span>
      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{item.title}</strong>
      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{item.desc}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
        {item.tags.map((tag) => <span key={tag} className="q-badge" style={{ fontSize: "0.64rem" }}>{tag}</span>)}
      </div>
    </button>
  );
}

function AcademySection({ abrirAcademy }) {
  return (
    <section className="q-card q-panel calculators-section">
      <span className="q-eyebrow">Formação e oportunidades</span>
      <h2 className="q-section-title">Quanton Academy</h2>
      <p className="q-section-desc">Conteúdos especiais para transformar conhecimento técnico em processo, acabamento e novas oportunidades com impressão 3D.</p>
      <div className="q-grid">
        {ACADEMY_CONTENTS.map((item) => <AcademyCard key={item.file} item={item} abrirAcademy={abrirAcademy} />)}
      </div>
    </section>
  );
}

export default AcademySection;
